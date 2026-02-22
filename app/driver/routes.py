from flask import request, jsonify, session
from app.driver import driver_bp
from app.middleware.auth_guard import commuter_required
from app.services.firebase_service import register_driver, get_all_stands

@driver_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    required_fields = ["name", "phone", "standId", "town"]
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({"error": f"{field} is required"}), 400

    # Check phone format (basic check)
    phone = data["phone"].strip()
    if not phone.startswith("+91") or len(phone) != 13:
        return jsonify({"error": "Invalid phone number. Use format +91XXXXXXXXXX"}), 400

    driver = register_driver(data)
    return jsonify({
        "message": "Registration successful. Awaiting admin approval.",
        "driverId": driver["id"]
    }), 201

@driver_bp.route("/stands", methods=["GET"])
def get_stands():
    stands = get_all_stands()
    return jsonify(stands), 200

from app.middleware.auth_guard import driver_required
from app.services.firebase_service import create_report

@driver_bp.route("/report", methods=["POST"])
@driver_required
def report_commuter():
    data = request.get_json()

    if not data or "userId" not in data or "reason" not in data:
        return jsonify({"error": "userId and reason are required"}), 400

    if not data["reason"].strip():
        return jsonify({"error": "Reason cannot be empty"}), 400

    report = create_report(
        reported_by=session["uid"],
        reported_type="commuter",
        target_id=data["userId"],
        reason=data["reason"].strip()
    )

    return jsonify({
        "message": "Report submitted successfully.",
        "reportId": report["id"]
    }), 201


from flask import request, jsonify, session
from app.driver import driver_bp
from app.middleware.auth_guard import driver_required
from app.services.firebase_service import (
    create_report, update_driver_availability,
    get_driver_by_phone
)

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