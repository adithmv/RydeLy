"""Durable ride dispatch and tracking. All state transitions are atomic RTDB transactions."""
import copy
import hashlib
import hmac
import math
import secrets
import time
import uuid
from collections import Counter
from flask import request, jsonify, g, current_app
from firebase_admin import db
from werkzeug.exceptions import BadRequest, Conflict, Forbidden, NotFound
from app.rides import rides_bp
from app.extensions import limiter
from app.middleware.auth_guard import commuter_required, rider_required, driver_required, admin_required
from app.security import body, key, point, text
from app.services.routing import route, geocode, distance_km

ACTIVE = {"requested", "accepted", "arriving", "in_progress"}
FRESH_SECONDS = 45


def now():
    return int(time.time())


def store():
    return db.reference("/rideOperations")


def data_store():
    return store().get() or {}


def pin_hash(pin):
    return hmac.new(current_app.secret_key.encode(), pin.encode(), hashlib.sha256).hexdigest()


def require_participant(ride):
    if g.user["role"] == "admin":
        return
    if ride["riderId"] == g.user["uid"]:
        return
    if g.user["role"] == "driver" and ride.get("driverId") == g.user.get("driverId"):
        return
    raise Forbidden("This ride belongs to another account")


def present(ride):
    result = copy.deepcopy(ride)
    result.pop("locationHistory", None)
    result.pop("declinedBy", None)
    result.pop("pinHash", None)
    result.pop("pinAttempts", None)
    if g.user["uid"] != ride["riderId"] or ride["status"] not in ("requested", "accepted", "arriving"):
        result.pop("startPin", None)
    if g.user["role"] == "admin":
        result.pop("locations", None)
    result.pop("requestKey", None)
    return result


def fresh(location):
    return bool(location and now()-location.get("updatedAt",0) <= FRESH_SECONDS and location.get("accuracy",9999) <= 100)


def driver_eligible(state, ride):
    driver_id = g.user["driverId"]
    presence = state.get("presence",{}).get(driver_id, {})
    return (presence.get("online") and fresh(presence) and
            distance_km(presence, ride["pickup"]) <= current_app.config["DRIVER_RADIUS_KM"])


@rides_bp.get("/places")
@commuter_required
@limiter.limit("30 per minute")
def places():
    return jsonify(geocode(request.args.get("q")))


@rides_bp.post("/quote")
@rider_required
@limiter.limit("15 per minute")
def quote():
    data = body()
    pickup, destination = data.get("pickup"), data.get("destination")
    point(pickup); point(destination)
    pickup = {**point(pickup),"label":text(pickup.get("label"), "Pickup", 2, 200)}
    destination = {**point(destination),"label":text(destination.get("label"), "Destination", 2, 200)}
    result = route(pickup, destination, data.get("service", "auto"))
    quote_id = uuid.uuid4().hex
    result.update(id=quote_id, riderId=g.user["uid"],pickup=pickup,destination=destination,expiresAt=now()+300)
    db.reference(f"/rideOperations/quotes/{quote_id}").set(result)
    return jsonify(result)


@rides_bp.post("")
@rider_required
@limiter.limit("10 per minute")
def create_ride():
    data = body()
    quote_id, request_key = key(data.get("quoteId")), key(data.get("requestKey"))
    uid = g.user["uid"]
    ride_id, pin, timestamp = uuid.uuid4().hex, f"{secrets.randbelow(10000):04d}", now()
    digest = pin_hash(pin)
    def create(state):
        state = state or {}
        rides = state.setdefault("rides", {})
        # Idempotency and single-active-ride invariant are checked in the same transaction.
        if any(r["riderId"] == uid and (r.get("requestKey") == request_key or r["status"] in ACTIVE) for r in rides.values()):
            return state
        quoted = state.get("quotes", {}).get(quote_id)
        if not quoted or quoted["riderId"] != uid or quoted["expiresAt"] < timestamp:
            raise Conflict("The fare quote expired. Please check prices again.")
        if quoted.get("used"):
            raise Conflict("This quote has already been used")
        rides[ride_id] = {**copy.deepcopy(quoted),"id":ride_id,"riderId":uid,"riderName":g.user.get("name") or "Rider",
                          "status":"requested","createdAt":timestamp,"updatedAt":timestamp,"requestKey":request_key,
                          "startPin":pin,"pinHash":digest,"pinAttempts":0,"paymentMethod":"cash",
                          "events":{uuid.uuid4().hex:{"status":"requested","at":timestamp,"actor":uid}}}
        quoted["used"] = True
        return state
    state = store().transaction(create)
    own = [r for r in state["rides"].values() if r["riderId"] == uid and (r.get("requestKey") == request_key or r["status"] in ACTIVE)]
    return jsonify(present(sorted(own,key=lambda r:r["createdAt"],reverse=True)[0])), 201


@rides_bp.get("")
@commuter_required
def list_rides():
    user = g.user
    rides = list(data_store().get("rides",{}).values())
    rides = [r for r in rides if r["riderId"] == user["uid"] or (user["role"] == "driver" and r.get("driverId") == user["driverId"])]
    return jsonify([present(r) for r in sorted(rides,key=lambda r:r["createdAt"],reverse=True)[:100]])


@rides_bp.get("/<ride_id>")
@commuter_required
def get_ride(ride_id):
    ride = db.reference(f"/rideOperations/rides/{key(ride_id)}").get()
    if not ride:
        raise NotFound("Ride not found")
    require_participant(ride)
    return jsonify(present(ride))


@rides_bp.get("/offers")
@driver_required
def offers():
    state = data_store()
    if any(r.get("driverId") == g.user["driverId"] and r["status"] in ACTIVE for r in state.get("rides",{}).values()):
        return jsonify([])
    # No PIN, rider identity, phone, or live rider position is exposed before acceptance.
    return jsonify([{k:r[k] for k in ("id","pickup","destination","fare","distanceKm","durationSeconds","service","createdAt")}
                    for r in state.get("rides",{}).values() if r["status"] == "requested" and now()-r["createdAt"] < 600
                    and not r.get("declinedBy",{}).get(g.user["driverId"]) and driver_eligible(state,r)][:20])


@rides_bp.get("/presence")
@driver_required
def get_presence():
    p = db.reference(f"/rideOperations/presence/{g.user['driverId']}").get() or {}
    return jsonify(online=bool(p.get("online") and fresh(p)))


@rides_bp.post("/presence")
@driver_required
@limiter.limit("30 per minute")
def presence():
    data = body()
    if not isinstance(data.get("online"),bool):
        raise BadRequest("Online must be true or false")
    location = validate_location(data) if data["online"] else None
    driver_id = g.user["driverId"]
    def update(state):
        state = state or {}
        if not data["online"] and any(r.get("driverId") == driver_id and r["status"] in ACTIVE for r in state.get("rides",{}).values()):
            raise Conflict("Finish your active ride before going offline")
        state.setdefault("presence",{})[driver_id] = {**(location or {}),"online":data["online"],"updatedAt":now()}
        return state
    store().transaction(update)
    return jsonify(success=True)


def validate_location(data):
    location = point(data)
    accuracy = data.get("accuracy")
    if isinstance(accuracy,bool) or not isinstance(accuracy,(int,float)) or not 0 <= accuracy <= 100:
        raise BadRequest("Location accuracy must be within 100 metres. Please retry outdoors.")
    captured = data.get("capturedAt")
    if isinstance(captured,bool) or not isinstance(captured,(int,float)) or not math.isfinite(captured) or abs(time.time()-captured) > 60:
        raise BadRequest("Location is stale. Enable location and retry.")
    return {**location,"accuracy":accuracy,"capturedAt":captured,"updatedAt":now()}


@rides_bp.post("/<ride_id>/location")
@commuter_required
@limiter.limit("30 per minute")
def location(ride_id):
    ride_id = key(ride_id)
    pos, timestamp = validate_location(body()), now()
    user = g.user
    def update(state):
        state = state or {}
        ride = state.get("rides",{}).get(ride_id)
        if not ride:
            raise NotFound("Ride not found")
        require_participant(ride)
        if user["role"] == "admin" or ride["status"] not in ACTIVE:
            raise Forbidden("Location sharing is available only to active ride participants")
        role = "rider" if ride["riderId"] == user["uid"] else "driver"
        previous = ride.get("locations",{}).get(role)
        if previous and pos["capturedAt"] <= previous["capturedAt"]:
            return state
        ride.setdefault("locations",{})[role] = pos
        # Timestamped positions are retained with the ride, not publicly queryable.
        ride.setdefault("locationHistory",{}).setdefault(role,{})[str(timestamp)] = pos
        if role == "driver":
            state.setdefault("presence",{})[user["driverId"]] = {**pos,"online":True}
        return state
    store().transaction(update)
    return jsonify(success=True)


@rides_bp.post("/<ride_id>/accept")
@driver_required
def accept(ride_id):
    ride_id, driver_id, timestamp = key(ride_id), g.user["driverId"], now()
    driver = db.reference(f"/drivers/{driver_id}").get()
    def update(state):
        state = state or {}
        ride = state.get("rides",{}).get(ride_id)
        if not ride:
            raise NotFound("Ride not found")
        if ride.get("driverId") == driver_id and ride["status"] == "accepted":
            return state
        if ride["status"] != "requested" or timestamp-ride["createdAt"] >= 600 or not driver_eligible(state,ride):
            raise Conflict("This offer is no longer available or your location is stale")
        if any(r.get("driverId") == driver_id and r["status"] in ACTIVE for r in state["rides"].values()):
            raise Conflict("You already have an active ride")
        ride.update(driverId=driver_id,driverName=driver.get("name","Driver"),autoNumber=driver.get("autoNumber",""),status="accepted",acceptedAt=timestamp,updatedAt=timestamp)
        ride.setdefault("events",{})[uuid.uuid4().hex] = {"status":"accepted","at":timestamp,"actor":g.user["uid"]}
        return state
    return jsonify(present(store().transaction(update)["rides"][ride_id]))


@rides_bp.post("/<ride_id>/decline")
@driver_required
def decline(ride_id):
    ride_id = key(ride_id)
    def update(state):
        state = state or {}
        ride = state.get("rides",{}).get(ride_id)
        if not ride or ride["status"] != "requested" or not driver_eligible(state,ride):
            raise Conflict("Offer unavailable")
        ride.setdefault("declinedBy",{})[g.user["driverId"]] = now()
        return state
    store().transaction(update)
    return jsonify(success=True)


@rides_bp.post("/<ride_id>/status")
@commuter_required
@limiter.limit("20 per minute")
def status(ride_id):
    ride_id, data, user, timestamp = key(ride_id), body(), g.user, now()
    desired = data.get("status")
    if desired not in ("arriving","in_progress","completed","cancelled"):
        raise BadRequest("Invalid ride status")
    def update(state):
        state = state or {}
        ride = state.get("rides",{}).get(ride_id)
        if not ride:
            raise NotFound("Ride not found")
        require_participant(ride)
        is_driver = user["role"] == "driver" and ride.get("driverId") == user["driverId"]
        if desired == "cancelled":
            if ride["status"] not in ("requested","accepted","arriving") or user["role"] == "admin":
                raise Conflict("This ride cannot be cancelled now")
        else:
            if not is_driver:
                raise Forbidden("Only the assigned driver may advance a trip")
            next_status = {"accepted":"arriving","arriving":"in_progress","in_progress":"completed"}
            if next_status.get(ride["status"]) != desired:
                raise Conflict("The ride status has changed. Refresh and try again.")
            pos = ride.get("locations",{}).get("driver")
            target = ride["destination"] if desired == "completed" else ride["pickup"]
            if not fresh(pos) or distance_km(pos,target) > .3:
                raise Conflict("A fresh driver location within 300 metres of the stop is required")
            if desired == "in_progress":
                if ride.get("pinAttempts",0) >= 5:
                    raise Forbidden("Too many incorrect trip PINs. Cancel and rebook.")
                pin = data.get("pin", "")
                if not isinstance(pin,str) or not hmac.compare_digest(pin_hash(pin),ride["pinHash"]):
                    ride["pinAttempts"] = ride.get("pinAttempts",0)+1
                    return state
        ride.update(status=desired,updatedAt=timestamp)
        ride.setdefault("events",{})[uuid.uuid4().hex] = {"status":desired,"at":timestamp,"actor":user["uid"]}
        if desired == "in_progress":
            ride["startedAt"] = timestamp
            ride.pop("startPin",None)
        if desired == "completed":
            ride.update(completedAt=timestamp,finalFare=ride["fare"])
        if desired == "cancelled":
            ride.update(cancelledAt=timestamp,cancelReason=text(data.get("reason","Plans changed"),"Reason",1,200))
        return state
    result = store().transaction(update)["rides"][ride_id]
    if result["status"] != desired:
        raise Forbidden("Incorrect trip PIN")
    return jsonify(present(result))


@rides_bp.post("/<ride_id>/rating")
@rider_required
def rating(ride_id):
    ride_id, rating = key(ride_id), body().get("rating")
    if isinstance(rating,bool) or not isinstance(rating,int) or not 1 <= rating <= 5:
        raise BadRequest("Rating must be between 1 and 5")
    def update(state):
        state = state or {}
        ride = state.get("rides",{}).get(ride_id)
        if not ride or ride["riderId"] != g.user["uid"]:
            raise Forbidden("Access denied")
        if ride["status"] != "completed":
            raise Conflict("Only completed rides can be rated")
        ride["rating"] = rating
        return state
    store().transaction(update)
    return jsonify(success=True)


@rides_bp.get("/analytics")
@admin_required
def analytics():
    rides = list(data_store().get("rides",{}).values())
    finished = [r for r in rides if r["status"] == "completed"]
    waits = [(r["acceptedAt"]-r["createdAt"])/60 for r in rides if r.get("acceptedAt")]
    durations = [(r["completedAt"]-r["startedAt"])/60 for r in finished if r.get("startedAt")]
    ratings = [r["rating"] for r in finished if r.get("rating")]
    daily = Counter(time.strftime("%Y-%m-%d",time.gmtime(r["createdAt"])) for r in rides)
    return jsonify(totalRides=len(rides),completedRides=len(finished),activeRides=sum(r["status"] in ACTIVE for r in rides),
                   cancellationRate=round(100*sum(r["status"]=="cancelled" for r in rides)/max(1,len(rides)),1),
                   completedFareTotal=round(sum(r.get("finalFare",r["fare"]) for r in finished),2),
                   distanceKm=round(sum(r["distanceKm"] for r in finished),1),
                   averageWaitMinutes=round(sum(waits)/len(waits),1) if waits else None,
                   averageTripMinutes=round(sum(durations)/len(durations),1) if durations else None,
                   averageRating=round(sum(ratings)/len(ratings),1) if ratings else None,
                   byStatus=dict(Counter(r["status"] for r in rides)),byService=dict(Counter(r["service"] for r in rides)),
                   daily=[{"date":d,"rides":c} for d,c in sorted(daily.items())[-30:]],
                   rides=[{k:v for k,v in present(r).items() if k not in ("locationHistory","locations","geometry","startPin")} for r in sorted(rides,key=lambda r:r["createdAt"],reverse=True)[:200]])
