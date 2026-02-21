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