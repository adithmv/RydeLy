from flask import request, jsonify
from app.admin import admin_bp
from app.middleware.auth_guard import admin_required
from app.services.firebase_service import (
    get_all_drivers, get_all_drivers_admin, update_driver, get_all_stands,
    create_stand, get_driver
)
from firebase_admin import db
from app.services.call_service import get_all_call_logs
@admin_bp.route("/drivers", methods=["GET"])
@admin_required
def list_drivers():
    drivers = get_all_drivers_admin()
    return jsonify(drivers), 200

@admin_bp.route("/driver/<driver_id>/verify", methods=["PATCH"])
@admin_required
def toggle_verify(driver_id):
    driver = get_driver(driver_id)
    if not driver:
        return jsonify({"error": "Driver not found"}), 404
    updated = update_driver(driver_id, {"isVerified": not driver.get("isVerified", False)})
    return jsonify({"message": "Driver verification status updated", "driver": updated}), 200

@admin_bp.route("/warn/<target_type>/<target_id>", methods=["PATCH"])
@admin_required
def issue_warning(target_type, target_id):
    if target_type not in ["driver", "user"]:
        return jsonify({"error": "Invalid target type"}), 400

    path = f"/drivers/{target_id}" if target_type == "driver" else f"/users/{target_id}"
    ref = db.reference(path)
    record = ref.get()

    if not record:
        return jsonify({"error": f"{target_type.capitalize()} not found"}), 404

    new_warning_count = record.get("warningCount", 0) + 1
    updates = {"warningCount": new_warning_count}

    # Auto ban at 3 warnings
    if new_warning_count >= 3:
        updates["isBanned"] = True

    ref.update(updates)
    message = f"Warning {new_warning_count}/3 issued."
    if new_warning_count >= 3:
        message += " Account has been automatically banned."

    return jsonify({"message": message, "warningCount": new_warning_count}), 200

@admin_bp.route("/remove/<target_type>/<target_id>", methods=["DELETE"])
@admin_required
def remove_record(target_type, target_id):
    if target_type not in ["driver", "user"]:
        return jsonify({"error": "Invalid target type"}), 400

    path = f"/drivers/{target_id}" if target_type == "driver" else f"/users/{target_id}"
    db.reference(path).delete()
    return jsonify({"message": f"{target_type.capitalize()} removed successfully"}), 200

@admin_bp.route("/stands", methods=["POST"])
@admin_required
def add_stand():
    data = request.get_json()
    if not data.get("name") or not data.get("town"):
        return jsonify({"error": "name and town are required"}), 400
    stand = create_stand(data["name"], data["town"])
    return jsonify(stand), 201

@admin_bp.route("/users", methods=["GET"])
@admin_required
def list_users():
    ref = db.reference("/users")
    users = ref.get()
    if not users:
        return jsonify([]), 200
    return jsonify([{"id": k, **v} for k, v in users.items()]), 200

    s

@admin_bp.route("/logs", methods=["GET"])
@admin_required
def call_logs():
    logs = get_all_call_logs()
    return jsonify(logs), 200

from app.services.firebase_service import get_all_reports, resolve_report

@admin_bp.route("/reports", methods=["GET"])
@admin_required
def list_reports():
    reports = get_all_reports()
    return jsonify(reports), 200


@admin_bp.route("/reports/<report_id>/resolve", methods=["PATCH"])
@admin_required
def resolve_report_endpoint(report_id):
    report = resolve_report(report_id)
    if not report:
        return jsonify({"error": "Report not found"}), 404
    return jsonify({
        "message": "Report marked as resolved.",
        "report": report
    }), 200

from app.services.firebase_service import (
    get_announcements, add_announcement, delete_announcement
)

from app.services.firebase_service import get_announcements, add_announcement, delete_announcement

@admin_bp.route("/announcement", methods=["POST"])
@admin_required
def post_announcement():
    data = request.get_json()
    if not data or not data.get("message", "").strip():
        return jsonify({"error": "message is required"}), 400
    result = add_announcement(data["message"].strip())
    return jsonify({"message": "Announcement posted.", "id": result["id"]}), 201

@admin_bp.route("/announcements", methods=["GET"])
@admin_required
def list_announcements():
    announcements = get_announcements()
    return jsonify(announcements), 200