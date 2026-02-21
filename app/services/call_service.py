from firebase_admin import db
from datetime import datetime


def log_call(user_id, driver_id):
    """Logs a call event to Firebase."""
    ref = db.reference("/callLogs")
    new_log = ref.push()
    log = {
        "userId": user_id,
        "driverId": driver_id,
        "timestamp": datetime.utcnow().isoformat(),
        "wasReported": False
    }
    new_log.set(log)
    return {"id": new_log.key, **log}


def get_user_call_logs(user_id):
    """Returns all call logs for a specific user."""
    ref = db.reference("/callLogs")
    logs = ref.get()
    if not logs:
        return []
    return [
        {"id": k, **v}
        for k, v in logs.items()
        if v.get("userId") == user_id
    ]


def get_all_call_logs():
    """Returns all call logs for admin."""
    ref = db.reference("/callLogs")
    logs = ref.get()
    if not logs:
        return []
    return [{"id": k, **v} for k, v in logs.items()]