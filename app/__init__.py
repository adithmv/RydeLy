from flask import Flask
from app.config import config
from app.extensions import init_firebase, limiter

def create_app(env="development"):
    app = Flask(__name__)
    
    # Load config
    app.config.from_object(config[env])
    
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