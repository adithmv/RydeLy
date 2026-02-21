from firebase_admin import db
from datetime import datetime

def get_or_create_user(uid, phone):
    """
    Checks if user exists in Firebase DB.
    If not, creates a new commuter record.
    """
    ref = db.reference(f"/users/{uid}")
    user = ref.get()

    if user is None:
        # New user - create record
        new_user = {
            "phone": phone,
            "role": "commuter",
            "warningCount": 0,
            "isBanned": False,
            "registeredAt": datetime.utcnow().isoformat()
        }
        ref.set(new_user)
        return new_user

    return user