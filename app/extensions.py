import firebase_admin
from firebase_admin import credentials, db
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

def init_firebase(app):
    cred = credentials.Certificate(app.config["FIREBASE_CREDENTIALS_PATH"])
    firebase_admin.initialize_app(cred, {
        "databaseURL": app.config["FIREBASE_DATABASE_URL"]
    })

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[]
)