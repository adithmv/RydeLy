from flask import request, jsonify, session
from app.auth import auth_bp
from app.services.otp_service import verify_firebase_token
from app.services.firebase_service import get_or_create_user

@auth_bp.route("/verify-token", methods=["POST"])
def verify_token():
    data = request.get_json()

    if not data or "idToken" not in data:
        return jsonify({"error": "ID token is required"}), 400

    try:
        user_data = verify_firebase_token(data["idToken"])
    except ValueError as e:
        return jsonify({"error": str(e)}), 401

    # Get or create user in Firebase DB
    user = get_or_create_user(user_data["uid"], user_data["phone"])

    if user.get("isBanned"):
        return jsonify({"error": "Your account has been banned."}), 403

    # Create session
    session["uid"] = user_data["uid"]
    session["phone"] = user_data["phone"]
    session["role"] = user.get("role", "commuter")

    return jsonify({
        "message": "Authentication successful",
        "role": session["role"]
    }), 200

@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"}), 200