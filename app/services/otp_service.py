from firebase_admin import auth

def verify_firebase_token(id_token):
    """
    Verifies the Firebase ID token sent from the frontend.
    Returns decoded token data if valid, raises exception if not.
    """
    try:
        decoded_token = auth.verify_id_token(id_token)
        return {
            "uid": decoded_token["uid"],
            "phone": decoded_token.get("phone_number")
        }
    except auth.ExpiredIdTokenError:
        raise ValueError("Token has expired. Please login again.")
    except auth.InvalidIdTokenError:
        raise ValueError("Invalid token. Please login again.")
    except Exception as e:
        raise ValueError(f"Token verification failed: {str(e)}")