import time
from concurrent.futures import ThreadPoolExecutor
from firebase_admin import auth
from types import SimpleNamespace
from conftest import post, position, book, PICKUP, DESTINATION


def test_no_authentication_bypasses(system):
    app, database, client = system
    c=app.test_client()
    csrf=c.get("/auth/csrf").json["csrfToken"]
    headers={"X-CSRF-Token":csrf}
    assert c.post("/auth/mock-login",json={"role":"admin"},headers=headers).status_code==404
    assert c.post("/auth/verify-token",json={"idToken":"test-token-9999999999"},headers=headers).status_code==401
    assert c.get("/rides").status_code==401
    assert c.get("/admin/drivers").status_code==401


def test_csrf_and_origin_required(system):
    _, _, create=system
    c=create("rider")
    assert c.post("/rides",json={}).status_code==403
    assert c.post("/rides",json={},headers={"X-CSRF-Token":"wrong"}).status_code==403
    assert c.post("/rides",json={},headers={"X-CSRF-Token":"test-csrf","Origin":"https://evil.example"}).status_code==403
    assert c.get("/rides").headers["Cache-Control"]=="no-store"
    assert c.get("/rides").headers["X-Content-Type-Options"]=="nosniff"


def test_session_revocation_and_ban(system,monkeypatch):
    _,database,create=system
    c=create("rider")
    assert c.get("/auth/me").status_code==200
    database.reference("/users/rider").update({"isBanned":True})
    assert c.get("/auth/me").status_code==401
    c=create("rider")
    monkeypatch.setattr(auth,"get_user",lambda uid:SimpleNamespace(disabled=False,tokens_valid_after_timestamp=(time.time()+60)*1000))
    assert c.get("/auth/me").status_code==401


def test_admin_roles_checked_from_database_on_every_request(system):
    _,db,create=system
    rider=create("rider");admin=create("owner","admin")
    assert rider.get("/rides/analytics").status_code==403
    assert admin.get("/rides/analytics").status_code==200
    db.reference("/admins/owner").set(False)
    assert admin.get("/rides/analytics").status_code==403


def test_server_quotes_cannot_be_tampered_with(system):
    _,db,create=system
    rider=create("rider")
    ride=book(rider)
    assert ride["distanceKm"]==4.5
    assert ride["fare"]==89
    assert db.reference(f"/rideOperations/rides/{ride['id']}").get()["fare"]==89
    other=create("other")
    quote=post(other,"/rides/quote",{"pickup":PICKUP,"destination":DESTINATION,"service":"comfort"}).json
    assert quote["fare"]==111.25
    assert post(rider,"/rides",{"quoteId":quote["id"],"requestKey":"new"}).json["id"]==ride["id"]
    attacker=create("attacker")
    assert post(attacker,"/rides",{"quoteId":quote["id"],"requestKey":"stolen"}).status_code==409


def test_expired_quotes_rejected(system):
    _,db,create=system
    rider=create("rider")
    quoted=post(rider,"/rides/quote",{"pickup":PICKUP,"destination":DESTINATION}).json
    db.reference(f"/rideOperations/quotes/{quoted['id']}").update({"expiresAt":0})
    assert post(rider,"/rides",{"quoteId":quoted["id"],"requestKey":"expired"}).status_code==409


def test_duplicate_booking_is_idempotent(system):
    _,_,create=system
    rider=create("rider")
    ride=book(rider)
    duplicate=post(rider,"/rides",{"quoteId":"anything","requestKey":"request-one"})
    assert duplicate.json["id"]==ride["id"]
    assert len(rider.get("/rides").json)==1


def test_unrelated_users_cannot_track_or_mutate_ride(system):
    _,_,create=system
    rider=create("rider");other=create("other");ride=book(rider);rid=ride["id"]
    assert other.get(f"/rides/{rid}").status_code==403
    assert other.get("/rides").json==[]
    assert post(other,f"/rides/{rid}/location",position()).status_code==403
    assert post(other,f"/rides/{rid}/status",{"status":"cancelled"}).status_code==403
    assert post(other,f"/rides/{rid}/rating",{"rating":5}).status_code==403


def test_offers_need_fresh_nearby_location_and_hide_private_data(system):
    _,db,create=system
    rider=create("rider");driver=create("driver","driver");ride=book(rider)
    assert driver.get("/rides/offers").json==[]
    assert post(driver,"/rides/presence",{"online":True,**position()}).status_code==200
    offered=driver.get("/rides/offers").json[0]
    assert offered["id"]==ride["id"]
    for field in ("riderId","riderName","locations","startPin","pinHash"):
        assert field not in offered
    db.reference("/rideOperations/presence/driver-driver").update({"updatedAt":0})
    assert driver.get("/rides/offers").json==[]
    assert post(driver,f"/rides/{ride['id']}/accept").status_code==409


def test_two_drivers_cannot_accept_same_ride(system):
    _,db,create=system
    rider=create("rider");one=create("one","driver");two=create("two","driver");ride=book(rider)
    for driver in (one,two):post(driver,"/rides/presence",{"online":True,**position()})
    with ThreadPoolExecutor(max_workers=2) as pool:
        results=list(pool.map(lambda c:post(c,f"/rides/{ride['id']}/accept").status_code,[one,two]))
    assert sorted(results)==[200,409]
    assert db.reference(f"/rideOperations/rides/{ride['id']}").get()["driverId"] in ("one-driver","two-driver")


def test_driver_cannot_accept_two_active_rides(system):
    _,_,create=system
    driver=create("driver","driver");a=book(create("a"));b=book(create("b"))
    post(driver,"/rides/presence",{"online":True,**position()})
    assert post(driver,f"/rides/{a['id']}/accept").status_code==200
    assert post(driver,f"/rides/{b['id']}/accept").status_code==409
    assert post(driver,"/rides/presence",{"online":False}).status_code==409


def test_full_persisted_lifecycle_and_analytics(system):
    _,db,create=system
    rider=create("rider");driver=create("driver","driver");admin=create("owner","admin")
    ride=book(rider);rid=ride["id"]
    post(driver,"/rides/presence",{"online":True,**position()})
    accepted=post(driver,f"/rides/{rid}/accept")
    assert accepted.status_code==200
    assert "startPin" not in accepted.json
    assert "pinHash" not in rider.get(f"/rides/{rid}").json
    
    # Get the PIN from rider's perspective after driver accepts
    rider_ride = rider.get(f"/rides/{rid}").json
    assert "startPin" in rider_ride
    assert len(rider_ride["startPin"]) == 6
    start_pin = rider_ride["startPin"]
    
    assert post(rider,f"/rides/{rid}/status",{"status":"completed"}).status_code==403
    assert post(driver,f"/rides/{rid}/status",{"status":"completed"}).status_code==409
    assert post(driver,f"/rides/{rid}/status",{"status":"arriving"}).status_code==409
    assert post(driver,f"/rides/{rid}/location",position()).status_code==200
    assert post(rider,f"/rides/{rid}/location",position()).status_code==200
    assert post(driver,f"/rides/{rid}/status",{"status":"arriving"}).status_code==200
    assert post(driver,f"/rides/{rid}/status",{"status":"in_progress","pin":"wrong"}).status_code==403
    assert post(driver,f"/rides/{rid}/status",{"status":"in_progress","pin":start_pin}).status_code==200
    assert post(rider,f"/rides/{rid}/status",{"status":"cancelled"}).status_code==409
    assert post(driver,f"/rides/{rid}/location",position(DESTINATION)).status_code==200
    assert post(driver,f"/rides/{rid}/status",{"status":"completed"}).status_code==200
    assert post(rider,f"/rides/{rid}/rating",{"rating":5}).status_code==200
    assert post(driver,f"/rides/{rid}/location",position()).status_code==403
    saved=db.reference(f"/rideOperations/rides/{rid}").get()
    assert saved["rating"]==5 and saved["finalFare"]==89
    assert len(saved["events"])==5
    assert saved["locationHistory"]["driver"]
    assert "locationHistory" not in rider.get(f"/rides/{rid}").json
    stats=admin.get("/rides/analytics").json
    assert stats["completedRides"]==1 and stats["completedFareTotal"]==89
    assert stats["averageRating"]==5 and stats["distanceKm"]==4.5


def test_pin_attempt_limit(system):
    _,_,create=system
    rider=create("rider");driver=create("driver","driver");ride=book(rider);rid=ride["id"]
    post(driver,"/rides/presence",{"online":True,**position()});post(driver,f"/rides/{rid}/accept")
    
    # Get PIN from rider after acceptance
    rider_ride = rider.get(f"/rides/{rid}").json
    start_pin = rider_ride["startPin"]
    assert len(start_pin) == 6
    
    post(driver,f"/rides/{rid}/location",position());post(driver,f"/rides/{rid}/status",{"status":"arriving"})
    for _ in range(5):assert post(driver,f"/rides/{rid}/status",{"status":"in_progress","pin":"wrong"}).status_code==403
    assert post(driver,f"/rides/{rid}/status",{"status":"in_progress","pin":start_pin}).status_code==403


def test_stale_or_invalid_gps_rejected(system):
    _,_,create=system
    driver=create("driver","driver")
    for bad in ({**position(),"lat":999},{**position(),"accuracy":500},{**position(),"capturedAt":0},{**position(),"lng":True}):
        assert post(driver,"/rides/presence",{"online":True,**bad}).status_code==400


def test_routing_failure_does_not_create_fake_fare(system,monkeypatch):
    _,db,create=system
    from app.services import routing
    from werkzeug.exceptions import ServiceUnavailable
    def failed(*args,**kwargs):raise ServiceUnavailable("Routing unavailable")
    monkeypatch.setattr(routing,"provider",failed)
    response=post(create("rider"),"/rides/quote",{"pickup":PICKUP,"destination":DESTINATION})
    assert response.status_code==503
    assert not db.reference("/rideOperations/quotes").get()


def test_registration_requires_authenticated_phone(system):
    app,db,create=system
    anon=app.test_client();csrf=anon.get("/auth/csrf").json["csrfToken"]
    assert anon.post("/driver/register",json={},headers={"X-CSRF-Token":csrf}).status_code==401
    rider=create("rider")
    response=post(rider,"/driver/register",{"name":"New Driver","phone":"attacker-supplied","standId":"ksd-mini","town":"Kasaragod","autoNumber":"KL13A1234"})
    assert response.status_code==201
    saved=db.reference(f"/drivers/{response.json['driverId']}").get()
    assert saved["phone"]=="+910000000000" and saved["uid"]=="rider"
    assert not saved["isVerified"]


def test_logout_revokes_server_session(system):
    _,db,create=system
    c=create("rider")
    assert post(c,"/auth/logout").status_code==200
    assert db.reference("/sessions/rider-session").get() is None
    assert c.get("/auth/me").status_code==401


def test_verified_login_ignores_browser_role_and_rotates_session(system, monkeypatch):
    import time
    import app.auth.routes as routes
    app, database, _ = system
    monkeypatch.setattr(routes, "verify_firebase_token", lambda token: {"uid":"new-user", "phone_number":"+919999999999", "auth_time":time.time()})
    client = app.test_client()
    csrf = client.get("/auth/csrf").json["csrfToken"]
    response = client.post("/auth/verify-token", json={"idToken":"verified-token-placeholder", "role":"admin"}, headers={"X-CSRF-Token":csrf})
    assert response.status_code == 200
    assert response.json["csrfToken"] != csrf
    assert client.get("/auth/me").json["role"] == "commuter"
    assert client.get("/rides/analytics").status_code == 403
    assert database.reference("/sessions").get()
    assert "HttpOnly" in response.headers["Set-Cookie"]


def test_admin_does_not_receive_participant_live_coordinates(system):
    _, _, create = system
    rider = create("rider")
    admin = create("admin", "admin")
    ride = book(rider)
    
    # Driver accepts the ride first (required for rider location sharing)
    driver = create("driver", "driver")
    post(driver, "/rides/presence", {"online": True, **position()})
    post(driver, f"/rides/{ride['id']}/accept")
    
    # Now rider can send location (ride status is "accepted")
    assert post(rider, f"/rides/{ride['id']}/location", position()).status_code == 200
    detail = admin.get(f"/rides/{ride['id']}")
    assert detail.status_code == 200
    assert "locations" not in detail.json
    assert "startPin" not in detail.json
    assert "locations" not in admin.get("/rides/analytics").json["rides"][0]


def test_non_finite_gps_timestamp_is_rejected(system):
    _, _, create = system
    driver = create("driver", "driver")
    assert post(driver, "/rides/presence", {"online":True, **position(), "capturedAt":float("nan")}).status_code == 400
