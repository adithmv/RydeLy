import os
import secrets
from datetime import timedelta
from dotenv import load_dotenv
load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY") or secrets.token_urlsafe(48)
    FIREBASE_DATABASE_URL = os.getenv("FIREBASE_DATABASE_URL")
    FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH")
    FIREBASE_CREDENTIALS_JSON = os.getenv("FIREBASE_CREDENTIALS_JSON")
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_NAME = "rydely_session"
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = True
    PERMANENT_SESSION_LIFETIME = timedelta(hours=12)
    SESSION_REFRESH_EACH_REQUEST = False
    MAX_CONTENT_LENGTH = 32768
    ALLOWED_ORIGINS = [x.strip() for x in os.getenv("FRONTEND_URL", "http://localhost:5173,http://127.0.0.1:5173").split(",") if x.strip()]
    RATELIMIT_STORAGE_URI = os.getenv("RATELIMIT_STORAGE_URI", "memory://")
    ORS_API_KEY = os.getenv("ORS_API_KEY", "")
    FARE_BASE = float(os.getenv("FARE_BASE", "35"))
    FARE_INCLUDED_KM = float(os.getenv("FARE_INCLUDED_KM", "1.5"))
    FARE_PER_KM = float(os.getenv("FARE_PER_KM", "18"))
    FARE_COMFORT_MULTIPLIER = float(os.getenv("FARE_COMFORT_MULTIPLIER", "1.25"))
    MAX_TRIP_KM = float(os.getenv("MAX_TRIP_KM", "150"))
    DRIVER_RADIUS_KM = float(os.getenv("DRIVER_RADIUS_KM", "8"))
    # Broadcast matching settings (Phase 5)
    BROADCAST_RADIUS_KM = float(os.getenv("RIDE_BROADCAST_RADIUS_KM", "5"))
    BROADCAST_EXPANSION_RADIUS_KM = float(os.getenv("RIDE_BROADCAST_RADIUS_EXPANDED_KM", "8"))
    BROADCAST_RESPONSE_WINDOW_SECONDS = int(os.getenv("RIDE_DRIVER_RESPONSE_WINDOW_SEC", "25"))
    BROADCAST_MAX_EXPANSIONS = int(os.getenv("RIDE_BROADCAST_MAX_EXPANSIONS", "1"))
    # Timing constants
    BROADCAST_EXPANSION_DELAY_SECONDS = int(os.getenv("RIDE_BROADCAST_EXPANSION_DELAY_SEC", "45"))
    BROADCAST_TIMEOUT_SECONDS = int(os.getenv("RIDE_BROADCAST_TIMEOUT_SEC", "90"))

class DevelopmentConfig(Config):
    DEBUG = True
    SESSION_COOKIE_SECURE = False

class ProductionConfig(Config):
    DEBUG = False
    SESSION_COOKIE_SAMESITE = "None"  # Cross-origin requires SameSite=None with Secure=True

config = {"development": DevelopmentConfig, "production": ProductionConfig}
