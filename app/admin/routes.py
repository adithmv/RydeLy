from flask import request, jsonify
from app.security import key, body, text
from app.admin import admin_bp
from app.middleware.auth_guard import admin_required
from app.services.firebase_service import (
    get_all_drivers, get_all_drivers_admin, update_driver, get_all_stands,
    create_stand, get_driver
)
from firebase_admin import db
from app.services.call_service import get_all_call_logs
import time
@admin_bp.route("/drivers", methods=["GET"])
@admin_required
def list_drivers():
    drivers = get_all_drivers_admin()
    return jsonify(drivers), 200

@admin_bp.route("/driver/<driver_id>/verify", methods=["PATCH"])
@admin_required
def toggle_verify(driver_id):
    key(driver_id)
    driver = get_driver(driver_id)
    if not driver:
        return jsonify({"error": "Driver not found"}), 404
    verified = body().get("isVerified")
    if not isinstance(verified, bool):
        return jsonify(error="isVerified must be true or false"), 400
    updated = update_driver(driver_id, {"isVerified": verified})
    return jsonify({"message": "Driver verification status updated", "driver": updated}), 200

@admin_bp.route("/warn/<target_type>/<target_id>", methods=["PATCH"])
@admin_required
def issue_warning(target_type, target_id):
    key(target_id)
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
    key(target_id)
    if target_type not in ["driver", "user"]:
        return jsonify({"error": "Invalid target type"}), 400

    path = f"/drivers/{target_id}" if target_type == "driver" else f"/users/{target_id}"
    if not db.reference(path).get():
        return jsonify(error="Account not found"), 404
    db.reference(path).update({"isBanned":True,"isAvailable":False})
    return jsonify({"message": f"{target_type.capitalize()} suspended"}), 200

@admin_bp.route("/stands", methods=["POST"])
@admin_required
def add_stand():
    data = body()
    stand = create_stand(text(data.get("name"), "Name", 2, 100), text(data.get("town"), "Town", 2, 100))
    return jsonify(stand), 201

@admin_bp.route("/users", methods=["GET"])
@admin_required
def list_users():
    ref = db.reference("/users")
    users = ref.get()
    if not users:
        return jsonify([]), 200
    logs = db.reference("/callLogs").get() or {}
    reports = db.reference("/reports").get() or {}
    return jsonify([{ "id": k, "name": v.get("name", "Rider"), "phone": v.get("phone", ""),
        "joinedAt": v.get("registeredAt", ""), "isBanned": v.get("isBanned", False),
        "callCount": sum(log.get("userId") == k for log in logs.values()),
        "reportCount": sum(r.get("targetId") == k for r in reports.values())
        } for k, v in users.items()]), 200


@admin_bp.route("/logs", methods=["GET"])
@admin_required
def call_logs():
    logs = get_all_call_logs()
    users = db.reference("/users").get() or {}
    drivers = db.reference("/drivers").get() or {}
    stands = db.reference("/stands").get() or {}
    for log in logs:
        driver = drivers.get(log.get("driverId"), {})
        log.update(commuterPhone=users.get(log.get("userId"), {}).get("phone", ""),
                   driverName=driver.get("name", "Driver"), town=driver.get("town", ""),
                   stand=stands.get(driver.get("standId"), {}).get("name", ""))
    return jsonify(logs), 200

from app.services.firebase_service import get_all_reports, resolve_report

@admin_bp.route("/reports", methods=["GET"])
@admin_required
def list_reports():
    reports = get_all_reports()
    users = db.reference("/users").get() or {}
    drivers = db.reference("/drivers").get() or {}
    for report in reports:
        target = (drivers if report.get("reportedType") == "driver" else users).get(report.get("targetId"), {})
        reporter = users.get(report.get("reportedBy"), {}) or drivers.get(report.get("reportedBy"), {})
        report.update(type=report.get("reportedType"), reporterPhone=reporter.get("phone", ""),
                      targetName=target.get("name", "Account"), resolved=report.get("resolvedByAdmin", False))
    return jsonify(reports), 200


@admin_bp.route("/reports/<report_id>/resolve", methods=["PATCH"])
@admin_required
def resolve_report_endpoint(report_id):
    key(report_id)
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
    result = add_announcement(text(body().get("message"), "Message", 1, 2000))
    return jsonify({"message": "Announcement posted.", "id": result["id"]}), 201

@admin_bp.route("/announcements", methods=["GET"])
@admin_required
def list_announcements():
    announcements = get_announcements()
    return jsonify(announcements), 200


@admin_bp.route("/analytics/driver-earnings", methods=["GET"])
@admin_required
def driver_earnings_analytics():
    """Returns average driver earnings analytics for admin dashboard."""
    period = request.args.get("period", "allTime")
    
    rides_ref = db.reference("/rideOperations/rides")
    all_rides = rides_ref.get() or {}
    drivers_ref = db.reference("/drivers")
    all_drivers = drivers_ref.get() or {}
    
    now_ts = int(time.time())
    one_day_ago = now_ts - 86400
    one_week_ago = now_ts - 604800
    one_month_ago = now_ts - 2592000
    
    # Filter completed rides
    completed_rides = [
        r for r in all_rides.values()
        if r.get("status") == "completed"
    ]
    
    # Calculate time window
    if period == "today":
        cutoff = one_day_ago
    elif period == "week":
        cutoff = one_week_ago
    elif period == "month":
        cutoff = one_month_ago
    else:
        cutoff = 0
    
    if cutoff > 0:
        completed_rides = [r for r in completed_rides if r.get("completedAt", 0) >= cutoff]
    
    # Aggregate earnings by driver
    driver_earnings = {}
    for ride in completed_rides:
        driver_id = ride.get("driverId")
        fare = ride.get("finalFare", ride.get("fare", 0))
        if driver_id:
            driver_earnings[driver_id] = driver_earnings.get(driver_id, 0) + fare
    
    # Count active drivers (verified, not banned)
    active_drivers = [
        d for d in all_drivers.values()
        if d.get("isVerified") and not d.get("isBanned")
    ]
    active_driver_count = len(active_drivers)
    
    # Calculate totals
    total_fares = sum(driver_earnings.values())
    avg_earnings = total_fares / active_driver_count if active_driver_count > 0 else 0
    
    # Per-driver breakdown (top 10 / bottom 10)
    driver_breakdown = []
    for driver in active_drivers:
        driver_id = driver.get("id")
        earnings = driver_earnings.get(driver_id, 0)
        driver_breakdown.append({
            "driverId": driver_id,
            "name": driver.get("name", ""),
            "phone": driver.get("phone", ""),
            "autoNumber": driver.get("autoNumber", "N/A"),
            "town": driver.get("town", ""),
            "earnings": round(earnings, 2),
            "rideCount": sum(1 for r in completed_rides if r.get("driverId") == driver_id),
        })
    
    driver_breakdown.sort(key=lambda x: x["earnings"], reverse=True)
    
    return jsonify({
        "period": period,
        "activeDriverCount": active_driver_count,
        "totalFares": round(total_fares, 2),
        "averageEarnings": round(avg_earnings, 2),
        "topEarners": driver_breakdown[:10],
        "lowestEarners": driver_breakdown[-10:] if len(driver_breakdown) > 10 else [],
        "allDrivers": driver_breakdown,
    }), 200