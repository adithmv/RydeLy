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
    """Returns verified, unbanned drivers filtered by stand and town."""
    ref = db.reference("/drivers")
    drivers = ref.get()
    if not drivers:
        return []
    return [
        {"id": k, **v}
        for k, v in drivers.items()
        if v.get("standId") == stand_id
        and v.get("town") == town
        and v.get("isVerified") == True
        and v.get("isBanned") == False
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