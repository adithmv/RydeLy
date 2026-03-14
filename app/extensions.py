import os
import firebase_admin
from firebase_admin import credentials, db
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address


def init_firebase(app):
    cred = None

    # Option 1 — individual env variables (Railway/production)
    private_key = os.getenv("FIREBASE_PRIVATE_KEY")
    if private_key:
        # Railway sometimes escapes \n as literal \\n — fix it
        private_key = private_key.replace("\\n", "\n")

        cred_dict = {
            "type": "service_account",
            "project_id": os.getenv("FIREBASE_PROJECT_ID"),
            "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
            "private_key": private_key,
            "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
            "client_id": os.getenv("FIREBASE_CLIENT_ID"),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_CERT_URL"),
            "universe_domain": "googleapis.com",
        }
        cred = credentials.Certificate(cred_dict)

    # Option 2 — local file (development)
    elif app.config.get("FIREBASE_CREDENTIALS_PATH"):
        cred = credentials.Certificate(app.config["FIREBASE_CREDENTIALS_PATH"])

    else:
        raise ValueError(
            "No Firebase credentials found. "
            "Set FIREBASE_PRIVATE_KEY and related vars, or FIREBASE_CREDENTIALS_PATH."
        )

    firebase_admin.initialize_app(cred, {
        "databaseURL": app.config["FIREBASE_DATABASE_URL"]
    })


limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[]
)
