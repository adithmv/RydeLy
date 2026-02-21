from flask import Blueprint
commuter_bp = Blueprint("commuter", __name__)
from app.commuter import routes