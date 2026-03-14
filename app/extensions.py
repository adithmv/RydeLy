import json
import os
import firebase_admin
from firebase_admin import credentials, db
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address


def init_firebase(app):
    cred = None

    # Option 1 — credentials from JSON env variable (Railway/production)
    cred_json = app.config.get("FIREBASE_CREDENTIALS_JSON")
    if cred_json:
        cred_dict = json.loads(cred_json)
        cred = credentials.Certificate(cred_dict)

    # Option 2 — credentials from file path (local development)
    elif app.config.get("FIREBASE_CREDENTIALS_PATH"):
        cred = credentials.Certificate(app.config["FIREBASE_CREDENTIALS_PATH"])

    else:
        raise ValueError(
            "No Firebase credentials found. "
            "Set FIREBASE_CREDENTIALS_JSON or FIREBASE_CREDENTIALS_PATH in your .env"
        )

    firebase_admin.initialize_app(cred, {
        "databaseURL": app.config["FIREBASE_DATABASE_URL"]
    })


limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[]
)
