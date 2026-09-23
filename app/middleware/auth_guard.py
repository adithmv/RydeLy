import time
from functools import wraps
from flask import session, jsonify, g
from firebase_admin import db, auth


def identity():
    sid = session.get("sid")
    record = db.reference(f"/sessions/{sid}").get() if sid else None
    if not record or record.get("expiresAt", 0) <= time.time():
        return None
    uid = record["uid"]
    user = db.reference(f"/users/{uid}").get()
    if not user or user.get("isBanned"):
        return None
    try:
        firebase_user = auth.get_user(uid)
        if firebase_user.disabled:
            return None
        if firebase_user.tokens_valid_after_timestamp and (record["authTime"] * 1000 < (firebase_user.tokens_valid_after_timestamp - 5000)):
            return None
    except Exception:
        return None
    membership = db.reference(f"/admins/{uid}").get()
    role, driver_id = "commuter", user.get("driverId")
    if membership is True or (isinstance(membership, dict) and membership.get("enabled") is True):
        role = "admin"
    elif driver_id:
        driver = db.reference(f"/drivers/{driver_id}").get()
        if driver and not driver.get("isBanned"):
            role = "driver"
            if driver.get("uid") != uid:
                db.reference(f"/drivers/{driver_id}").update({"uid": uid})
    else:
        # Fallback: check if driver exists by UID, email, or phone
        from app.services.firebase_service import get_driver_by_email, get_driver_by_phone, get_driver_by_uid
        email = user.get("email")
        phone = user.get("phone")
        driver = get_driver_by_uid(uid)
        if not driver and email:
            driver = get_driver_by_email(email)
        if not driver and phone:
            driver = get_driver_by_phone(phone)
        if driver and not driver.get("isBanned"):
            role = "driver"
            driver_id = driver["id"]
            db.reference(f"/users/{uid}").update({"driverId": driver_id, "role": "driver"})
            db.reference(f"/drivers/{driver_id}").update({"uid": uid})

    return {
        "uid": uid,
        "name": user.get("name", ""),
        "phone": user.get("phone", ""),
        "email": user.get("email", ""),
        "role": role,
        "driverId": driver_id if role == "driver" else None,
        "authProvider": user.get("authProvider", record.get("authProvider", "phone"))
    }


def require_role(role=None):
    def decorate(f):
        @wraps(f)
        def guarded(*args, **kwargs):
            user = identity()
            if not user:
                session.clear()
                return jsonify(error="Please sign in again"), 401
            if role and user["role"] != role:
                return jsonify(error="Access denied"), 403
            g.user = user
            # Preserve legacy endpoint compatibility, always from freshly checked DB identity.
            session.update({k: user[k] for k in ("uid", "phone", "email", "role", "driverId", "authProvider") if k in user})
            return f(*args, **kwargs)
        return guarded
    return decorate

commuter_required = require_role()
rider_required = require_role("commuter")
driver_required = require_role("driver")
admin_required = require_role("admin")
