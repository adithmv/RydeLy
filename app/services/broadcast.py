"""Driver broadcast and matching logic for ride requests (Phase 5)."""
import math
import time
import uuid
from flask import current_app
from firebase_admin import db, messaging
from werkzeug.exceptions import BadRequest, Conflict, NotFound
from app.security import point
from app.services.routing import distance_km


# ============================================================
# Configuration constants
# ============================================================

def _get_broadcast_radius_km():
    return current_app.config.get("BROADCAST_RADIUS_KM", 5.0)

def _get_expansion_radius_km():
    return current_app.config.get("BROADCAST_EXPANSION_RADIUS_KM", 8.0)

def _get_response_window_seconds():
    return current_app.config.get("BROADCAST_RESPONSE_WINDOW_SECONDS", 25)

def _get_max_expansions():
    return current_app.config.get("BROADCAST_MAX_EXPANSIONS", 1)

def _get_expansion_delay_seconds():
    return current_app.config.get("BROADCAST_EXPANSION_DELAY_SECONDS", 45)

def _get_timeout_seconds():
    return current_app.config.get("BROADCAST_TIMEOUT_SECONDS", 90)


# ============================================================
# Core matching logic
# ============================================================

def _get_driver_location(driver_id):
    """Get driver's current GPS location from presence."""
    presence = db.reference(f"/rideOperations/presence/{driver_id}").get()
    if not presence or not presence.get("online"):
        return None
    loc = presence.get("lat"), presence.get("lng")
    if loc[0] is None or loc[1] is None:
        return None
    # Check freshness using existing fresh() standard
    updated_at = presence.get("updatedAt", 0)
    accuracy = presence.get("accuracy", 99999)
    if time.time() - updated_at > 45 or accuracy > 100:
        return None
    return {"lat": loc[0], "lng": loc[1]}


def _haversine_distance_km(lat1, lng1, lat2, lng2):
    """Straight-line distance in km."""
    lat1, lat2 = math.radians(lat1), math.radians(lat2)
    dlat, dlng = lat2 - lat1, math.radians(lng2 - lng1)
    h = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlng/2)**2
    return 6371 * 2 * math.asin(min(1, math.sqrt(h)))


def _find_nearby_drivers(pickup_lat, pickup_lng, radius_km, exclude_driver_ids=None):
    """Find all available drivers within radius of pickup point."""
    exclude_driver_ids = set(exclude_driver_ids or [])
    
    presence_ref = db.reference("/rideOperations/presence")
    all_presence = presence_ref.get() or {}
    drivers_ref = db.reference("/drivers")
    all_drivers = drivers_ref.get() or {}
    
    nearby = []
    for driver_id, presence in all_presence.items():
        if driver_id in exclude_driver_ids:
            continue
        if not presence.get("online"):
            continue
        
        # Check GPS freshness
        updated_at = presence.get("updatedAt", 0)
        accuracy = presence.get("accuracy", 99999)
        if time.time() - updated_at > 45 or accuracy > 100:
            continue
        
        driver_lat = presence.get("lat")
        driver_lng = presence.get("lng")
        if driver_lat is None or driver_lng is None:
            continue
        
        # Check distance
        dist = _haversine_distance_km(pickup_lat, pickup_lng, driver_lat, driver_lng)
        if dist <= radius_km:
            driver = all_drivers.get(driver_id, {})
            if driver.get("isVerified") and not driver.get("isBanned") and driver.get("isAvailable"):
                fcm_token = driver.get("fcmToken")
                if fcm_token:
                    nearby.append({
                        "driverId": driver_id,
                        "distanceKm": round(dist, 2),
                        "fcmToken": fcm_token,
                        "driverName": driver.get("name", "Driver"),
                    })
    
    return nearby


def _send_fcm_notification(fcm_token, ride_id, pickup, destination, fare, response_window, notification_type="ride_request"):
    """Send FCM push notification to driver."""
    try:
        if notification_type == "ride_request":
            message = messaging.Message(
                token=fcm_token,
                data={
                    "rideId": ride_id,
                    "type": "ride_request",
                    "pickup": pickup.get("label", ""),
                    "destination": destination.get("label", ""),
                    "fare": str(fare),
                    "responseWindow": str(response_window),
                    "timestamp": str(int(time.time())),
                },
                android=messaging.AndroidConfig(
                    priority="high",
                    notification=messaging.AndroidNotification(
                        title="New Ride Request",
                        body=f"₹{fare} - {pickup.get('label', 'Pickup')} to {destination.get('label', 'Destination')}",
                        click_action="FLUTTER_NOTIFICATION_CLICK",
                    ),
                ),
                apns=messaging.APNSConfig(
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(
                            alert=messaging.ApsAlert(
                                title="New Ride Request",
                                body=f"₹{fare} - {pickup.get('label', 'Pickup')} to {destination.get('label', 'Destination')}",
                            ),
                            sound="default",
                            badge=1,
                        ),
                    ),
                ),
            )
        else:  # ride_taken
            message = messaging.Message(
                token=fcm_token,
                data={
                    "rideId": ride_id,
                    "type": "ride_taken",
                    "timestamp": str(int(time.time())),
                },
                android=messaging.AndroidConfig(
                    priority="high",
                    notification=messaging.AndroidNotification(
                        title="Ride No Longer Available",
                        body="Another driver accepted this ride",
                    ),
                ),
            )
        
        response = messaging.send(message)
        return True, response
    except Exception as e:
        current_app.logger.warning(f"FCM send failed: {e}")
        return False, str(e)


def _broadcast_ride_request(ride_id, pickup, destination, fare, radius_km, exclude_driver_ids=None):
    """Broadcast ride request to nearby drivers."""
    nearby = _find_nearby_drivers(
        pickup["lat"], pickup["lng"], 
        radius_km, 
        exclude_driver_ids
    )
    
    if not nearby:
        return {"notified": 0, "driverIds": [], "notificationTimes": {}}
    
    response_window = _get_response_window_seconds()
    notified_ids = []
    notification_times = {}
    current_time = int(time.time())
    
    for driver in nearby:
        success, _ = _send_fcm_notification(
            driver["fcmToken"],
            ride_id,
            pickup,
            destination,
            fare,
            response_window
        )
        if success:
            notified_ids.append(driver["driverId"])
            notification_times[driver["driverId"]] = current_time
    
    return {"notified": len(notified_ids), "driverIds": notified_ids, "notificationTimes": notification_times}


def broadcast_ride_request(ride_id, current_radius_idx=0):
    """
    Broadcast a ride request to nearby drivers, with optional radius expansion.
    
    Args:
        ride_id: The ride ID to broadcast
        current_radius_idx: 0 for initial radius, 1 for expanded radius
    
    Returns:
        dict with broadcast results
    """
    radii = [_get_broadcast_radius_km(), _get_expansion_radius_km()]
    if current_radius_idx >= len(radii):
        return {"notified": 0, "driverIds": [], "expanded": False, "noMoreExpansions": True}
    
    ride_ref = db.reference(f"/rideOperations/rides/{ride_id}")
    ride = ride_ref.get()
    if not ride:
        raise NotFound("Ride not found")
    
    # Defensive: use .get() to avoid KeyError if ride record is incomplete
    status = ride.get("status")
    if status != "requested":
        current_app.logger.warning(f"broadcast_ride_request called on ride {ride_id} with status={status}, aborting")
        raise Conflict("Ride is no longer in requested state")
    
    # Get already notified driver IDs from ride record
    ride_data = ride_ref.get()
    already_notified = set(ride_data.get("notifiedDriverIds", []))
    
    radius = radii[current_radius_idx]
    pickup = ride["pickup"]
    destination = ride["destination"]
    fare = ride.get("minimumFare", ride.get("fare", 0))
    
    result = _broadcast_ride_request(
        ride_id, pickup, destination, fare, radius, already_notified
    )
    
    # Update ride with newly notified driver IDs and notification times
    new_notified = set(result["driverIds"])
    all_notified = list(already_notified | new_notified)
    
    # Get existing notification times and merge with new ones
    existing_times = ride_data.get("notificationTimes", {})
    new_times = result.get("notificationTimes", {})
    all_times = {**existing_times, **new_times}
    
    ride_ref.update({
        "notifiedDriverIds": all_notified,
        "notificationTimes": all_times
    })
    
    return {
        "notified": result["notified"],
        "driverIds": result["driverIds"],
        "radiusKm": radius,
        "expanded": current_radius_idx > 0,
        "noMoreExpansions": current_radius_idx >= len(radii) - 1,
    }


def check_and_process_broadcast_timers(ride_id):
    """
    Check if broadcast expansion or timeout should occur based on elapsed time.
    This should be called when the rider polls for ride status.
    
    Returns:
        dict with action taken: {"action": "none|expanded|timed_out", "result": ...}
    """
    ride_ref = db.reference(f"/rideOperations/rides/{ride_id}")
    ride = ride_ref.get()
    if not ride:
        return {"action": "none", "error": "Ride not found"}
    
    if ride["status"] != "requested":
        return {"action": "none", "reason": "Ride no longer in requested state"}
    
    broadcast_started = ride.get("broadcastStartedAt")
    if not broadcast_started:
        # Initialize broadcast tracking if not present
        ride_ref.update({
            "broadcastStartedAt": int(time.time()),
            "broadcastStatus": "searching",
            "notifiedDriverIds": ride.get("notifiedDriverIds", [])
        })
        return {"action": "none", "reason": "Initialized broadcast tracking"}
    
    elapsed = time.time() - broadcast_started
    expansion_delay = _get_expansion_delay_seconds()
    timeout_seconds = _get_timeout_seconds()
    current_status = ride.get("broadcastStatus", "searching")
    
    # Check for timeout (90 seconds)
    if elapsed >= timeout_seconds:
        ride_ref.update({"status": "unmatched", "broadcastStatus": "unmatched"})
        return {"action": "timed_out", "elapsed": round(elapsed, 1)}
    
    # Check for expansion (45 seconds) - only if not already expanded
    if elapsed >= expansion_delay and current_status == "searching":
        # Trigger expansion broadcast
        try:
            result = broadcast_ride_request(ride_id, current_radius_idx=1)
            ride_ref.update({"broadcastStatus": "expanded"})
            return {"action": "expanded", "result": result, "elapsed": round(elapsed, 1)}
        except Exception as e:
            current_app.logger.warning(f"Broadcast expansion failed for ride {ride_id}: {e}")
            return {"action": "none", "error": str(e)}
    
    return {"action": "none", "elapsed": round(elapsed, 1), "status": current_status}


def handle_driver_accept(ride_id, driver_id):
    """
    Handle driver acceptance via the existing atomic transaction.
    Also handles notification to other drivers that ride is taken.
    """
    # The actual acceptance is handled by the existing /rides/<id>/accept endpoint
    # This function handles the notification to other drivers
    
    ride_ref = db.reference(f"/rideOperations/rides/{ride_id}")
    ride = ride_ref.get()
    if not ride:
        return {"success": False, "error": "Ride not found"}
    
    # Get all notified driver IDs except the one who accepted
    notified_ids = set(ride.get("notifiedDriverIds", []))
    other_driver_ids = [d for d in notified_ids if d != driver_id]
    
    if not other_driver_ids:
        return {"notified": 0}
    
    # Send "ride taken" notification to other drivers
    drivers_ref = db.reference("/drivers")
    all_drivers = drivers_ref.get() or {}
    
    notified = 0
    for other_id in other_driver_ids:
        driver = all_drivers.get(other_id, {})
        fcm_token = driver.get("fcmToken")
        if not fcm_token:
            continue
        try:
            message = messaging.Message(
                token=fcm_token,
                data={
                    "rideId": ride_id,
                    "type": "ride_taken",
                    "timestamp": str(int(time.time())),
                },
                android=messaging.AndroidConfig(
                    priority="high",
                    notification=messaging.AndroidNotification(
                        title="Ride No Longer Available",
                        body="Another driver accepted this ride",
                    ),
                ),
            )
            messaging.send(message)
            notified += 1
        except Exception:
            pass
    
    return {"notified": notified}


def handle_driver_decline(ride_id, driver_id):
    """Handle driver decline - update ride record."""
    ride_ref = db.reference(f"/rideOperations/rides/{ride_id}")
    ride = ride_ref.get()
    if not ride:
        return {"success": False, "error": "Ride not found"}
    
    if ride["status"] != "requested":
        return {"success": False, "error": "Ride not in requested state"}
    
    # Add to declinedBy
    declined_by = ride.get("declinedBy", {})
    declined_by[driver_id] = int(time.time())
    ride_ref.update({"declinedBy": declined_by})
    
    return {"success": True}


def get_broadcast_status(ride_id):
    """Get current broadcast status for a ride."""
    ride_ref = db.reference(f"/rideOperations/rides/{ride_id}")
    ride = ride_ref.get()
    if not ride:
        raise NotFound("Ride not found")
    
    broadcast_started = ride.get("broadcastStartedAt")
    if not broadcast_started:
        return {
            "status": "not_started",
            "elapsed": 0,
            "notifiedCount": 0,
        }
    
    elapsed = time.time() - broadcast_started
    expansion_delay = _get_expansion_delay_seconds()
    timeout_seconds = _get_timeout_seconds()
    
    return {
        "status": ride.get("broadcastStatus", "searching"),
        "elapsed": round(elapsed, 1),
        "notifiedCount": len(ride.get("notifiedDriverIds", [])),
        "expansionIn": max(0, round(expansion_delay - elapsed, 1)),
        "timeoutIn": max(0, round(timeout_seconds - elapsed, 1)),
    }