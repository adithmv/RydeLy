import secrets
import time
from flask import jsonify, session, g
from firebase_admin import db
from app.auth import auth_bp
from app.extensions import limiter
from app.security import body, text
from app.services.otp_service import verify_firebase_token
from app.services.firebase_service import get_or_create_user, get_driver_by_phone
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
    uid, phone = decoded["uid"], decoded.get("phone_number")
    if not phone or time.time() - decoded.get("auth_time", 0) > 300:
        return jsonify(error="A recent verified phone sign-in is required"), 401
    user = get_or_create_user(uid, phone)
    if user.get("isBanned"):
        return jsonify(error="Account is unavailable"), 403
    # Link existing verified-phone registration once; never trust a caller-supplied role.
    driver = get_driver_by_phone(phone)
    if driver and not driver.get("uid"):
        db.reference(f"/drivers/{driver['id']}").update({"uid": uid})
        db.reference(f"/users/{uid}").update({"driverId": driver["id"]})
    old_sid = session.get("sid")
    if old_sid:
        db.reference(f"/sessions/{old_sid}").delete()
    session.clear()
    sid = secrets.token_urlsafe(32)
    session.update(sid=sid, csrf=secrets.token_urlsafe(32))
    session.permanent = True
    db.reference(f"/sessions/{sid}").set({"uid": uid, "authTime": decoded["auth_time"], "expiresAt": time.time() + 43200})
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
