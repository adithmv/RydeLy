from flask import Blueprint
rides_bp = Blueprint("rides", __name__)
from app.rides import routes  # noqa: E402,F401
