import os
from flask import Flask
from flask_cors import CORS
from app.config import config
from app.extensions import init_firebase, limiter


def create_app(env=None):
    if env is None:
        env = os.getenv("FLASK_ENV", "development")

    app = Flask(__name__)

    # Load config
    app.config.from_object(config[env])

    # CORS — allow both local dev and production Cloudflare domain
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    frontend_urls = os.getenv("FRONTEND_URL", "")
for url in frontend_urls.split(","):
    url = url.strip()
    if url:
        allowed_origins.append(url)

    CORS(app,
     origins=allowed_origins,
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
     automatic_options=True)

    # Initialize extensions
    init_firebase(app)
    limiter.init_app(app)

    # Register blueprints
    from app.auth import auth_bp
    from app.commuter import commuter_bp
    from app.driver import driver_bp
    from app.admin import admin_bp
    from app.ivr import ivr_bp

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(commuter_bp, url_prefix="/commuter")
    app.register_blueprint(driver_bp, url_prefix="/driver")
    app.register_blueprint(admin_bp, url_prefix="/admin")
    app.register_blueprint(ivr_bp, url_prefix="/ivr")

    return app
