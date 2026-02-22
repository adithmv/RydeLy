from functools import wraps
from flask import session, jsonify

def commuter_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "uid" not in session:
            return jsonify({"error": "Authentication required"}), 401
        if session.get("role") == "banned":
            return jsonify({"error": "Account is banned"}), 403
        return f(*args, **kwargs)
    return decorated

def driver_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "uid" not in session:
            return jsonify({"error": "Authentication required"}), 401
        if session.get("role") != "driver":
            return jsonify({"error": "Driver access required"}), 403
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "uid" not in session:
            return jsonify({"error": "Authentication required"}), 401
        if session.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return f(*args, **kwargs)
    return decorated