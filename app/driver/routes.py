from flask import request, jsonify, session
from app.driver import driver_bp
from app.middleware.auth_guard import driver_required
from app.services.firebase_service import (
    register_driver,
    get_all_stands,
    create_report,
    update_driver_availability,
    get_driver_by_phone,
    get_driver_profile,
)


@driver_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    required_fields = ["name", "phone", "standId", "town"]
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({"error": f"{field} is required"}), 400

    phone = data["phone"].strip()
    if phone.startswith("+91"):
        if len(phone) != 13:
            return jsonify({"error": "Invalid phone number"}), 400
    else:
        if len(phone) != 10 or not phone.isdigit():
            return jsonify({"error": "Invalid phone number"}), 400
        phone = "+91" + phone

    data["phone"] = phone
    driver = register_driver(data)
    return jsonify({
        "message": "Registration successful. Awaiting admin approval.",
        "driverId": driver["id"]
    }), 201


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
    data = request.get_json()
    if data is None or "isAvailable" not in data:
        return jsonify({"error": "isAvailable field is required"}), 400
    if not isinstance(data["isAvailable"], bool):
        return jsonify({"error": "isAvailable must be true or false"}), 400

    driver_id = session.get("driverId")
    if not driver_id:
        return jsonify({"error": "Driver ID not found in session"}), 400

    updated = update_driver_availability(driver_id, data["isAvailable"])
    return jsonify({
        "message": "Availability updated.",
        "isAvailable": updated.get("isAvailable")
    }), 200


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