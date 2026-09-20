"""Request validation and browser/session protections shared by all APIs."""
import math
import re
import secrets
from flask import request, session, jsonify, current_app
from werkzeug.exceptions import BadRequest


def body():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise BadRequest("A JSON object is required")
    return data


def text(value, name, minimum=1, maximum=200):
    if not isinstance(value, str) or not minimum <= len(value.strip()) <= maximum:
        raise BadRequest(f"{name} must contain {minimum}–{maximum} characters")
    return value.strip()


def key(value):
    if not isinstance(value, str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,128}", value):
        raise BadRequest("Invalid identifier")
    return value


def point(value):
    if not isinstance(value, dict):
        raise BadRequest("Coordinates are required")
    result = {}
    for field, limit in (("lat", 90), ("lng", 180)):
        number = value.get(field)
        if isinstance(number, bool) or not isinstance(number, (int, float)) or not math.isfinite(number) or abs(number) > limit:
            raise BadRequest("Invalid coordinates")
        result[field] = float(number)
    return result


def install_security(app):
    @app.before_request
    def protect_writes():
        if request.method in ("POST", "PUT", "PATCH", "DELETE"):
            origin = request.headers.get("Origin")
            if origin and origin not in current_app.config["ALLOWED_ORIGINS"]:
                return jsonify(error="Origin not allowed"), 403
            token = request.headers.get("X-CSRF-Token", "")
            if not token or not secrets.compare_digest(token, session.get("csrf", "")):
                return jsonify(error="Your session changed. Refresh and try again."), 403
        if request.content_length and request.content_length > 32768:
            return jsonify(error="Request is too large"), 413

    @app.after_request
    def headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Cache-Control"] = "no-store"
        response.headers["Permissions-Policy"] = "geolocation=(self), camera=(), microphone=()"
        if not app.debug and not app.testing:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response
