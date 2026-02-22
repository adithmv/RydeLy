from flask import request, jsonify, session
from app.auth import auth_bp
from app.services.otp_service import verify_firebase_token
from app.services.firebase_service import (
    get_or_create_user, get_driver_by_phone
)

@auth_bp.route("/verify-token", methods=["POST"])
def verify_token():
    data = request.get_json()

    if not data or "idToken" not in data:
        return jsonify({"error": "idToken is required"}), 400

    # 1. Verify Firebase token
    try:
        decoded = verify_firebase_token(data["idToken"])
    except ValueError as e:
        return jsonify({"error": str(e)}), 401

    uid   = decoded["uid"]
    phone = decoded.get("phone_number", "")

    # 2. Check if banned
    user = get_or_create_user(uid, phone)
    if user.get("isBanned"):
        return jsonify({"error": "Account is banned"}), 403

    # 3. Role detection
    # Check admin list first
    from firebase_admin import db
    admin_ref = db.reference(f"/admins/{uid}")
    is_admin  = admin_ref.get() is not None

    # Check driver by phone
    driver = get_driver_by_phone(phone)
    is_driver = driver is not None and driver.get("isVerified")

    # 4. Assign role
    if is_admin:
        role = "admin"
    elif is_driver:
        role = "driver"
    else:
        role = "commuter"

    # 5. Set session
    session["uid"]      = uid
    session["phone"]    = phone
    session["role"]     = role

    if is_driver:
        session["driverId"] = driver["id"]

    # 6. Build response
    response = {
        "message": "Login successful",
        "role":    role,
        "uid":     uid,
    }

    # 7. First-time commuter — check if name exists
    if role == "commuter":
        name = user.get("name")
        response["isFirstLogin"] = not bool(name)
        response["name"] = name or ""

    return jsonify(response), 200


@auth_bp.route("/set-name", methods=["POST"])
def set_name():
    """Called after first login to save commuter's name."""
    if "uid" not in session:
        return jsonify({"error": "Authentication required"}), 401

    data = request.get_json()
    if not data or "name" not in data:
        return jsonify({"error": "name is required"}), 400

    name = data["name"].strip()
    if len(name) < 2:
        return jsonify({"error": "Name must be at least 2 characters"}), 400

    from firebase_admin import db
    db.reference(f"/users/{session['uid']}").update({"name": name})
    session["name"] = name

    return jsonify({"message": "Name saved.", "name": name}), 200


@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"}), 200