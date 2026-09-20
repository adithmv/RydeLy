from flask import request, jsonify, session
from app.driver import driver_bp
from app.middleware.auth_guard import driver_required, commuter_required
from app.security import body, text
from firebase_admin import db
from app.services.firebase_service import (
    register_driver,
    get_all_stands,
    create_report,
    update_driver_availability,
    get_driver_by_phone,
    get_driver_profile,
)


@driver_bp.route("/register", methods=["POST"])
@commuter_required
def register():
    data = body()
    if get_driver_by_phone(session["phone"]):
        return jsonify(error="You already have a driver application"), 409
    cleaned = {field:text(data.get(field),field,2,120) for field in ("name","standId","town","autoNumber")}
    cleaned["phone"] = session["phone"]
    driver = register_driver(cleaned)
    db.reference(f"/drivers/{driver['id']}").update({"uid":session["uid"]})
    db.reference(f"/users/{session['uid']}").update({"driverId":driver["id"]})
    return jsonify(success=True,driverId=driver["id"]), 201


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