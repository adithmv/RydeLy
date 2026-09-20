from firebase_admin import auth


def verify_firebase_token(id_token):
    try:
        return auth.verify_id_token(id_token, check_revoked=True)
    except Exception:
        raise ValueError("Your sign-in could not be verified. Please sign in again.") from None
