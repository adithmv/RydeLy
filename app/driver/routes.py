from flask import request, jsonify, session
from app.driver import driver_bp
from app.middleware.auth_guard import driver_required, commuter_required
from app.security import body, text, key
from firebase_admin import db
from app.services.firebase_service import (
    register_driver,
    get_all_stands,
    create_report,
    update_driver_availability,
    get_driver_by_phone,
    get_driver_profile,
    get_driver_earnings,
)
import time


@driver_bp.route("/register", methods=["POST"])
@commuter_required
def register():
    data = body()
    auth_provider = session.get("authProvider", "phone")
    uid = session["uid"]

    # Check for existing driver application
    if auth_provider == "email":
        email = data.get("email", "").lower().strip()
        if not email:
            return jsonify(error="Email is required for email-authenticated users"), 400
        # Check if driver with this email already exists
        drivers_ref = db.reference("/drivers")
        all_drivers = drivers_ref.get() or {}
        for d in all_drivers.values():
            if d.get("email", "").lower() == email:
                return jsonify(error="A driver application with this email already exists"), 409
    else:
        # Phone auth - check by phone
        if get_driver_by_phone(session["phone"]):
            return jsonify(error="You already have a driver application"), 409

    # Check for duplicate vehicle number (autoNumber) across ALL drivers
    auto_number = data.get("autoNumber", "").strip().upper()
    if auto_number:
        drivers_ref = db.reference("/drivers")
        all_drivers = drivers_ref.get() or {}
        for d in all_drivers.values():
            if d.get("autoNumber", "").strip().upper() == auto_number:
                return jsonify(error="A driver is already registered with this vehicle number"), 409

    cleaned = {field: text(data.get(field), field, 2, 120) for field in ("name", "standId", "town", "autoNumber")}
    cleaned["phone"] = session["phone"] if auth_provider == "phone" else data.get("phone", "")
    if auth_provider == "email":
        cleaned["email"] = data.get("email", "").strip().lower()
        cleaned["emailVerified"] = data.get("emailVerified", False)
    driver = register_driver(cleaned)
    db.reference(f"/drivers/{driver['id']}").update({"uid": uid})
    db.reference(f"/users/{uid}").update({"driverId": driver["id"], "role": "driver"})
    session.update(driverId=driver["id"], role="driver")
    return jsonify(success=True, driverId=driver["id"]), 201


@driver_bp.route("/stands", methods=["GET"])
def get_stands():
    stands = get_all_stands()
    return jsonify(stands), 200


@driver_bp.route("/report", methods=["POST"])
@driver_required
def report_commuter():
    data = request.get_json()
    if not data or "commuterPhone" not in data or "reason" not in data:
        return jsonify({"error": "commuterPhone and reason are required"}), 400
    if not data["reason"].strip():
        return jsonify({"error": "Reason cannot be empty"}), 400

    report = create_report(
        reported_by=session["uid"],
        reported_type="commuter",
        target_id=data["commuterPhone"],
        reason=data["reason"].strip()
    )
    return jsonify({
        "message": "Report submitted successfully.",
        "reportId": report["id"]
    }), 201


@driver_bp.route("/availability", methods=["PATCH"])
@driver_required
def toggle_availability():
    return jsonify(error="Use the live driver portal to share location and go online"), 409


@driver_bp.route("/profile", methods=["GET"])
@driver_required
def get_profile():
    driver_id = session.get("driverId")
    if not driver_id:
        return jsonify({"error": "Driver ID not found in session"}), 400

    profile = get_driver_profile(driver_id)
    if not profile:
        return jsonify({"error": "Profile not found"}), 404

    return jsonify(profile), 200


@driver_bp.route("/earnings", methods=["GET"])
@driver_required
def get_earnings():
    driver_id = session.get("driverId")
    if not driver_id:
        return jsonify({"error": "Driver ID not found in session"}), 400

    earnings = get_driver_earnings(driver_id)
    return jsonify(earnings), 200


# ============================================================
# SHIFT MANAGEMENT ENDPOINTS
# ============================================================

MAX_EXTENSIONS_PER_SHIFT = 3
SHIFT_EXTEND_GRACE_MINUTES = 0  # No grace period after expiry per policy

def _get_active_shift(driver_id):
    """Get the current active shift for a driver, or None."""
    shift_ref = db.reference(f"/driverShifts/{driver_id}")
    shift = shift_ref.get()
    if not shift or shift.get("status") != "active":
        return None
    return shift

def _is_shift_active(shift):
    """Check if a shift is still active (not expired)."""
    if not shift:
        return False
    shift_ends_at = shift.get("shiftEndsAt", 0)
    return time.time() < shift_ends_at

def _expire_shift_if_needed(driver_id, shift):
    """If shift has expired, mark it as expired and set driver unavailable."""
    if shift and shift.get("status") == "active" and not _is_shift_active(shift):
        # Mark shift as expired
        db.reference(f"/driverShifts/{driver_id}").update({"status": "expired"})
        # Set driver unavailable
        db.reference(f"/drivers/{driver_id}").update({"isAvailable": False, "shiftEndsAt": None})
        return True
    return False


@driver_bp.route("/shift/start", methods=["POST"])
@driver_required
def start_shift():
    """Start a new shift with the given duration in minutes."""
    data = body()
    driver_id = session.get("driverId")
    if not driver_id:
        return jsonify({"error": "Driver ID not found in session"}), 400

    duration_minutes = data.get("durationMinutes")
    if not isinstance(duration_minutes, int) or duration_minutes < 30 or duration_minutes > 1440:
        return jsonify({"error": "Duration must be between 30 and 1440 minutes"}), 400

    # Check for existing active shift
    existing_shift = _get_active_shift(driver_id)
    if existing_shift and _is_shift_active(existing_shift):
        return jsonify({"error": "You already have an active shift"}), 409

    # Check if driver has an active ride (shouldn't start shift if already in one, but just in case)
    state = db.reference("/rideOperations").get() or {}
    rides = state.get("rides", {})
    has_active_ride = any(
        r.get("driverId") == driver_id and r.get("status") in ("requested", "accepted", "arriving", "in_progress")
        for r in rides.values()
    )
    # Note: We ALLOW starting a shift even with an active ride - driver might be coming back online after a ride

    now_ts = int(time.time())
    shift_ends_at = now_ts + (duration_minutes * 60)

    shift_data = {
        "startedAt": now_ts,
        "scheduledDurationMinutes": duration_minutes,
        "shiftEndsAt": shift_ends_at,
        "extensions": [],
        "status": "active"
    }

    # Save shift record
    db.reference(f"/driverShifts/{driver_id}").set(shift_data)

    # Update driver record with shiftEndsAt and set available
    db.reference(f"/drivers/{driver_id}").update({
        "isAvailable": True,
        "shiftEndsAt": shift_ends_at
    })

    return jsonify({
        "success": True,
        "shift": {
            "startedAt": now_ts,
            "durationMinutes": duration_minutes,
            "shiftEndsAt": shift_ends_at,
            "extensions": [],
            "status": "active"
        }
    }), 201


@driver_bp.route("/shift/extend", methods=["POST"])
@driver_required
def extend_shift():
    """Extend the current active shift by additional minutes."""
    data = body()
    driver_id = session.get("driverId")
    if not driver_id:
        return jsonify({"error": "Driver ID not found in session"}), 400

    additional_minutes = data.get("additionalMinutes")
    if not isinstance(additional_minutes, int) or additional_minutes not in (120, 180, 240):
        return jsonify({"error": "Extension must be 120, 180, or 240 minutes"}), 400

    shift_ref = db.reference(f"/driverShifts/{driver_id}")
    shift = shift_ref.get()

    if not shift or shift.get("status") != "active":
        return jsonify({"error": "No active shift to extend"}), 409

    # Check if shift is still active (not expired)
    if not _is_shift_active(shift):
        # Shift has expired - auto-expire it
        _expire_shift_if_needed(driver_id, shift)
        return jsonify({"error": "Shift has expired. Start a new shift."}), 409

    # Check extension limit
    extensions = shift.get("extensions", [])
    if len(extensions) >= MAX_EXTENSIONS_PER_SHIFT:
        return jsonify({"error": f"Maximum {MAX_EXTENSIONS_PER_SHIFT} extensions per shift reached"}), 409

    # Add extension
    now_ts = int(time.time())
    new_shift_ends_at = shift["shiftEndsAt"] + (additional_minutes * 60)
    
    new_extension = {
        "addedMinutes": additional_minutes,
        "addedAt": now_ts
    }
    extensions.append(new_extension)

    # Update shift record
    shift_ref.update({
        "shiftEndsAt": new_shift_ends_at,
        "extensions": extensions
    })

    # Update driver record
    db.reference(f"/drivers/{driver_id}").update({"shiftEndsAt": new_shift_ends_at})

    return jsonify({
        "success": True,
        "shiftEndsAt": new_shift_ends_at,
        "extensions": extensions,
        "extensionsUsed": len(extensions),
        "extensionsRemaining": MAX_EXTENSIONS_PER_SHIFT - len(extensions)
    })


@driver_bp.route("/shift/stop", methods=["POST"])
@driver_required
def stop_shift():
    """Manually end the current shift early."""
    driver_id = session.get("driverId")
    if not driver_id:
        return jsonify({"error": "Driver ID not found in session"}), 400

    # Check if driver has an active ride
    state = db.reference("/rideOperations").get() or {}
    rides = state.get("rides", {})
    has_active_ride = any(
        r.get("driverId") == driver_id and r.get("status") in ("accepted", "arriving", "in_progress")
        for r in rides.values()
    )
    if has_active_ride:
        return jsonify({"error": "Cannot end shift while a ride is in progress. Finish the ride first."}), 409

    shift_ref = db.reference(f"/driverShifts/{driver_id}")
    shift = shift_ref.get()

    if not shift or shift.get("status") != "active":
        return jsonify({"error": "No active shift to stop"}), 409

    # Mark shift as ended
    shift_ref.update({"status": "ended"})

    # Update driver record - set unavailable and clear shiftEndsAt
    db.reference(f"/drivers/{driver_id}").update({
        "isAvailable": False,
        "shiftEndsAt": None
    })

    return jsonify({"success": True, "message": "Shift ended"})


@driver_bp.route("/shift/status", methods=["GET"])
@driver_required
def shift_status():
    """Get the current shift status for the driver."""
    driver_id = session.get("driverId")
    if not driver_id:
        return jsonify({"error": "Driver ID not found in session"}), 400

    shift = _get_active_shift(driver_id)
    
    if not shift:
        return jsonify({"hasActiveShift": False, "shift": None})

    is_active = _is_shift_active(shift)
    
    # If expired but still marked active, auto-expire
    if not is_active:
        _expire_shift_if_needed(driver_id, shift)
        return jsonify({"hasActiveShift": False, "shift": None})

    time_remaining = max(0, int(shift["shiftEndsAt"] - time.time()))
    show_extend_prompt = time_remaining <= 15 * 60  # Last 15 minutes

    return jsonify({
        "hasActiveShift": True,
        "shift": {
            "startedAt": shift["startedAt"],
            "scheduledDurationMinutes": shift["scheduledDurationMinutes"],
            "shiftEndsAt": shift["shiftEndsAt"],
            "extensions": shift.get("extensions", []),
            "status": shift["status"],
            "timeRemainingSeconds": time_remaining,
            "showExtendPrompt": show_extend_prompt,
            "extensionsUsed": len(shift.get("extensions", [])),
            "extensionsRemaining": max(0, MAX_EXTENSIONS_PER_SHIFT - len(shift.get("extensions", [])))
        }
    })