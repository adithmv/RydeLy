import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "rydely-dev-secret-key")
    FIREBASE_DATABASE_URL = os.getenv("FIREBASE_DATABASE_URL")
    FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH")
    FIREBASE_CREDENTIALS_JSON = os.getenv("FIREBASE_CREDENTIALS_JSON")
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_NAME = "rydely_session"
    SESSION_COOKIE_SECURE = False

class DevelopmentConfig(Config):
    DEBUG = True
    SESSION_COOKIE_SAMESITE = "None"
    SESSION_COOKIE_SECURE = True

class ProductionConfig(Config):
    DEBUG = False
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = False

config = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}