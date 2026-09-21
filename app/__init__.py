import os
from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
from app.config import config
from app.extensions import init_firebase, limiter
from app.security import install_security


def create_app(env=None, overrides=None):
    env = env or os.getenv("FLASK_ENV", "development")
    app = Flask(__name__)
    app.config.from_object(config[env])
    if overrides:
        app.config.update(overrides)
    if env == "production" and not app.testing:
        if len(os.getenv("SECRET_KEY", "")) < 32:
            raise RuntimeError("Production requires a strong SECRET_KEY (32+ characters)")
        if not app.config["RATELIMIT_STORAGE_URI"].startswith(("redis://", "rediss://")):
            raise RuntimeError("Production requires Redis for shared rate limits")
        if any(not url.startswith("https://") for url in app.config["ALLOWED_ORIGINS"]):
            raise RuntimeError("Production FRONTEND_URL must use HTTPS")
    CORS(app, origins=app.config["ALLOWED_ORIGINS"], supports_credentials=True,
         allow_headers=["Content-Type", "X-CSRF-Token"], methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"])
    if not app.testing:
        init_firebase(app)
    limiter.init_app(app)
    install_security(app)
    from app.auth import auth_bp
    from app.commuter import commuter_bp
    from app.driver import driver_bp
    from app.admin import admin_bp
    from app.rides import rides_bp
    for blueprint, prefix in ((auth_bp,"/auth"),(commuter_bp,"/commuter"),(driver_bp,"/driver"),(admin_bp,"/admin"),(rides_bp,"/rides")):
        app.register_blueprint(blueprint, url_prefix=prefix)

    @app.errorhandler(HTTPException)
    def http_error(error):
        return jsonify(error=error.description), error.code

    @app.errorhandler(Exception)
    def server_error(error):
        # Do not log tokens, locations, phone numbers or provider URLs containing API keys.
        app.logger.error("Request failed: %s", type(error).__name__)
        return jsonify(error="Service temporarily unavailable. Please try again."), 503

    @app.get("/health")
    def health():
        return jsonify(status="ok")

    @app.get("/")
    def root():
        return jsonify(status="ok", service="RydeLy API", frontend=app.config["ALLOWED_ORIGINS"][0])

    return app
