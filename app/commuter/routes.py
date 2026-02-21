from flask import request, jsonify, session
from app.commuter import commuter_bp
from app.middleware.auth_guard import commuter_required
from app.services.firebase_service import get_drivers_by_stand, get_driver, get_all_stands
from app.services.call_service import log_call, get_user_call_logs
from app.extensions import limiter


@commuter_bp.route("/drivers", methods=["GET"])
@commuter_required
def list_drivers():
    stand_id = request.args.get("standId")
    town = request.args.get("town")

    if not stand_id or not town:
        return jsonify({"error": "standId and town are required"}), 400

    drivers = get_drivers_by_stand(stand_id, town)

    # Obfuscate phone numbers in response
    for driver in drivers:
        driver.pop("phone", None)

    return jsonify(drivers), 200


@commuter_bp.route("/call/initiate", methods=["POST"])
@commuter_required
@limiter.limit("5 per hour")
def initiate_call():
    data = request.get_json()

    if not data or "driverId" not in data:
        return jsonify({"error": "driverId is required"}), 400

    driver_id = data["driverId"]
    driver = get_driver(driver_id)

    if not driver:
        return jsonify({"error": "Driver not found"}), 404

    if not driver.get("isVerified"):
        return jsonify({"error": "Driver is not verified"}), 403

    if driver.get("isBanned"):
        return jsonify({"error": "Driver is not available"}), 403

    # Log the call
    user_id = session["uid"]
    log_call(user_id, driver_id)

    # Return the real phone number only now
    return jsonify({
        "phone": driver["phone"],
        "name": driver["name"]
    }), 200


@commuter_bp.route("/history", methods=["GET"])
@commuter_required
def call_history():
    user_id = session["uid"]
    logs = get_user_call_logs(user_id)
    return jsonify(logs), 200


@commuter_bp.route("/stands", methods=["GET"])
def list_stands():
    stands = get_all_stands()
    return jsonify(stands), 200