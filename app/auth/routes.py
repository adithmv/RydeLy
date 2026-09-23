import secrets
import time
from flask import jsonify, session, g
from firebase_admin import db
from app.auth import auth_bp
from app.extensions import limiter
from app.security import body, text
from app.services.otp_service import verify_firebase_token
from app.services.firebase_service import get_or_create_user, get_driver_by_phone, get_driver_by_email, get_driver_by_uid
from app.middleware.auth_guard import commuter_required


@auth_bp.get("/csrf")
def csrf():
    session.setdefault("csrf", secrets.token_urlsafe(32))
    return jsonify(csrfToken=session["csrf"])


@auth_bp.post("/verify-token")
@limiter.limit("10 per minute")
def verify_token():
    token = text(body().get("idToken"), "idToken", 20, 12000)
    try:
        decoded = verify_firebase_token(token)
    except ValueError as error:
        return jsonify(error=str(error)), 401

    uid = decoded["uid"]
    provider_data = decoded.get("firebase", {}).get("sign_in_provider") or decoded.get("provider_id")
    # Determine auth provider and primary identifier
    phone = decoded.get("phone_number")
    email = decoded.get("email")
    email_verified = decoded.get("email_verified", False)

    if provider_data == "phone" or phone:
        auth_provider = "phone"
        identifier = phone
        if not identifier or time.time() - decoded.get("auth_time", 0) > 300:
            return jsonify(error="A recent verified phone sign-in is required"), 401
    elif provider_data == "password" or email:
        auth_provider = "email"
        identifier = email
        if not identifier:
            return jsonify(error="Email not found in token"), 401
        # For email auth, we don't require recent auth_time check
    else:
        return jsonify(error="Unsupported authentication provider"), 401

    user = get_or_create_user(uid, identifier, auth_provider)
    if user.get("isBanned"):
        return jsonify(error="Account is unavailable"), 403

    # Link existing driver registration by driverId, email, phone, or UID
    driver = None
    if user.get("driverId"):
        driver_data = db.reference(f"/drivers/{user['driverId']}").get()
        if driver_data:
            driver = {"id": user["driverId"], **driver_data}
    if not driver and email:
        driver = get_driver_by_email(email)
    if not driver and phone:
        driver = get_driver_by_phone(phone)
    if not driver:
        driver = get_driver_by_uid(uid)

    if driver and not driver.get("isBanned"):
        db.reference(f"/drivers/{driver['id']}").update({"uid": uid})
        db.reference(f"/users/{uid}").update({"driverId": driver["id"], "role": "driver"})

    old_sid = session.get("sid")
    if old_sid:
        db.reference(f"/sessions/{old_sid}").delete()
    session.clear()
    sid = secrets.token_urlsafe(32)
    session.update(sid=sid, csrf=secrets.token_urlsafe(32))
    session.permanent = True
    db.reference(f"/sessions/{sid}").set({
        "uid": uid,
        "authTime": decoded.get("auth_time", int(time.time())),
        "expiresAt": time.time() + 43200,
        "authProvider": auth_provider
    })
    return jsonify(success=True, csrfToken=session["csrf"])


@auth_bp.get("/me")
@commuter_required
def me():
    return jsonify(g.user)


@auth_bp.post("/set-name")
@commuter_required
def set_name():
    name = text(body().get("name"), "Name", 2, 80)
    db.reference(f"/users/{g.user['uid']}").update({"name": name})
    return jsonify(success=True)


@auth_bp.post("/logout")
def logout():
    if session.get("sid"):
        db.reference(f"/sessions/{session['sid']}").delete()
    session.clear()
    return jsonify(success=True)
