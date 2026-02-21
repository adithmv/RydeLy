from flask import Blueprint
ivr_bp = Blueprint("ivr", __name__)
from app.ivr import routes