from firebase_admin import db
from datetime import datetime


def get_or_create_user(uid, phone):
    """Checks if user exists in Firebase DB. If not, creates a new commuter record."""
    ref = db.reference(f"/users/{uid}")
    user = ref.get()

    if user is None:
        new_user = {
            "phone": phone,
            "role": "commuter",
            "warningCount": 0,
            "isBanned": False,
            "registeredAt": datetime.utcnow().isoformat()
        }
        ref.set(new_user)
        return new_user

    return user


def register_driver(data):
    """Creates a new driver record with pending status."""
    ref = db.reference("/drivers")
    new_driver_ref = ref.push()

    driver = {
        "name": data["name"],
        "phone": data["phone"],
        "standId": data["standId"],
        "town": data["town"],
        "isVerified": False,
        "isAvailable": False,
        "isBanned": False,
        "warningCount": 0,
        "registeredAt": datetime.utcnow().isoformat()
    }

    new_driver_ref.set(driver)
    return {"id": new_driver_ref.key, **driver}


def get_all_drivers():
    """Returns all drivers."""
    ref = db.reference("/drivers")
    drivers = ref.get()
    if not drivers:
        return []
    return [{"id": k, **v} for k, v in drivers.items()]


def get_drivers_by_stand(stand_id, town):
    """Get verified, available, non-banned drivers for a stand."""
    ref = db.reference("/drivers")
    all_drivers = ref.get()
    if not all_drivers:
        return []
    return [
        {"id": k, **v}
        for k, v in all_drivers.items()
        if v.get("standId") == stand_id
        and v.get("town") == town
        and v.get("isVerified") == True
        and v.get("isBanned") == False
        and v.get("isAvailable") == True
    ]


def update_driver(driver_id, updates):
    """Updates a driver record."""
    ref = db.reference(f"/drivers/{driver_id}")
    ref.update(updates)
    return ref.get()


def get_driver(driver_id):
    """Returns a single driver by ID."""
    ref = db.reference(f"/drivers/{driver_id}")
    return ref.get()


def get_all_stands():
    """Returns all stands."""
    ref = db.reference("/stands")
    stands = ref.get()
    if not stands:
        return []
    return [{"id": k, **v} for k, v in stands.items()]


def create_stand(name, town):
    """Creates a new auto stand."""
    ref = db.reference("/stands")
    new_stand_ref = ref.push()
    stand = {
        "name": name,
        "town": town
    }
    new_stand_ref.set(stand)
    return {"id": new_stand_ref.key, **stand}

def create_report(reported_by, reported_type, target_id, reason):
    """Creates a new report."""
    ref = db.reference("/reports")
    new_report_ref = ref.push()
    report = {
        "reportedBy": reported_by,
        "reportedType": reported_type,
        "targetId": target_id,
        "reason": reason,
        "resolvedByAdmin": False,
        "timestamp": datetime.utcnow().isoformat()
    }
    new_report_ref.set(report)
    return {"id": new_report_ref.key, **report}


def get_all_reports():
    """Returns all reports."""
    ref = db.reference("/reports")
    reports = ref.get()
    if not reports:
        return []
    return [{"id": k, **v} for k, v in reports.items()]


def resolve_report(report_id):
    """Marks a report as resolved."""
    ref = db.reference(f"/reports/{report_id}")
    ref.update({"resolvedByAdmin": True})
    return ref.get()

def update_driver_availability(driver_id, is_available):
    """Toggle driver availability status."""
    ref = db.reference(f"/drivers/{driver_id}")
    ref.update({"isAvailable": is_available})
    return ref.get()

def get_driver_by_phone(phone):
    """Find a driver record by phone number."""
    ref = db.reference("/drivers")
    all_drivers = ref.get()
    if not all_drivers:
        return None
    for k, v in all_drivers.items():
        if v.get("phone") == phone:
            return {"id": k, **v}
    return None

def get_announcements():
    """Get all announcement messages."""
    ref = db.reference("/announcements")
    data = ref.get()
    if not data:
        return []
    if isinstance(data, list):
        return [a for a in data if a]
    return [v for v in data.values() if v]

def add_announcement(message):
    """Add a new announcement."""
    ref = db.reference("/announcements")
    ref.push({"message": message})

def delete_announcement(announcement_id):
    """Delete an announcement by ID."""
    ref = db.reference(f"/announcements/{announcement_id}")
    ref.delete()
def get_driver_profile(driver_id):
    """Returns a shaped driver profile for the portal page."""
    driver = db.reference(f"/drivers/{driver_id}").get()
    if not driver:
        return None

    # Look up stand name from standId
    stand_name = driver.get("standId", "")
    stand_ref = db.reference(f"/stands/{driver.get('standId')}").get()
    if stand_ref:
        stand_name = stand_ref.get("name", driver.get("standId", ""))

    # Count calls this week
    from datetime import datetime, timedelta
    one_week_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
    logs_ref = db.reference("/callLogs").get() or {}
    calls_this_week = sum(
        1 for log in logs_ref.values()
        if log.get("driverId") == driver_id and log.get("timestamp", "") >= one_week_ago
    )

    # Derive status
    if driver.get("isBanned"):
        status = "banned"
    elif driver.get("isVerified"):
        status = "verified"
    else:
        status = "pending"

    return {
        "id": driver_id,
        "name": driver.get("name", ""),
        "phone": driver.get("phone", ""),
        "stand": stand_name,
        "town": driver.get("town", ""),
        "autoNumber": driver.get("autoNumber", "N/A"),
        "isAvailable": driver.get("isAvailable", False),
        "warningCount": driver.get("warningCount", 0),
        "callsThisWeek": calls_this_week,
        "status": status,
    }

def get_all_drivers_admin():
    """Returns all drivers with derived status field for admin dashboard."""
    ref = db.reference("/drivers")
    drivers = ref.get()
    if not drivers:
        return []

    result = []
    stands_ref = db.reference("/stands").get() or {}

    for driver_id, driver in drivers.items():
        # Derive status
        if driver.get("isBanned"):
            status = "banned"
        elif driver.get("isVerified"):
            status = "verified"
        else:
            status = "pending"

        # Resolve stand name
        stand_name = ""
        stand_data = stands_ref.get(driver.get("standId", ""))
        if stand_data:
            stand_name = stand_data.get("name", "")

        result.append({
            "id": driver_id,
            "name": driver.get("name", ""),
            "phone": driver.get("phone", ""),
            "town": driver.get("town", ""),
            "stand": stand_name,
            "autoNumber": driver.get("autoNumber", "N/A"),
            "status": status,
            "warningCount": driver.get("warningCount", 0),
            "isAvailable": driver.get("isAvailable", False),
        })

    return result
