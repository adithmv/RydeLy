"""Server-only routing. Never silently fall back to straight-line fare estimates."""
import json
import math
from decimal import Decimal, ROUND_HALF_UP
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import URLError
from flask import current_app
from werkzeug.exceptions import BadRequest, ServiceUnavailable
from app.security import point, text


def distance_km(a, b):
    lat1, lat2 = math.radians(a["lat"]), math.radians(b["lat"])
    dlat, dlng = lat2-lat1, math.radians(b["lng"]-a["lng"])
    h = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlng/2)**2
    return 6371 * 2 * math.asin(min(1, math.sqrt(h)))


def provider(path, data=None, params=None):
    api_key = current_app.config.get("ORS_API_KEY")
    if not api_key:
        raise ServiceUnavailable("Address search and routing are not configured yet")
    # Host and endpoints are fixed; user input can never select a request URL.
    url = "https://api.openrouteservice.org" + path
    if params:
        url += "?" + urlencode(params)
    req = Request(url, data=json.dumps(data).encode() if data else None,
                  headers={"Authorization": api_key, "Content-Type": "application/json", "Accept": "application/json"})
    try:
        with urlopen(req, timeout=12) as response:
            return json.load(response)
    except (URLError, TimeoutError, ValueError):
        raise ServiceUnavailable("The map service is unavailable. Please try again.") from None


def geocode(query):
    query = text(query, "Search", 3, 160)
    data = provider("/geocode/search", params={"text":query,"boundary.country":"IND","size":5})
    results = []
    for feature in data.get("features", []):
        lng, lat = feature["geometry"]["coordinates"][:2]
        results.append({"lat":lat, "lng":lng, "label":feature["properties"]["label"]})
    return results


def route(pickup, destination, service):
    pickup_point, destination_point = point(pickup), point(destination)
    if service not in ("auto", "comfort"):
        raise BadRequest("Choose a supported ride type")
    if distance_km(pickup_point, destination_point) < .05:
        raise BadRequest("Pickup and destination must be different locations")
    if distance_km(pickup_point, destination_point) > current_app.config["MAX_TRIP_KM"]:
        raise BadRequest("This trip is outside our service distance")
    data = provider("/v2/directions/driving-car/geojson", {
        "coordinates":[[pickup_point["lng"],pickup_point["lat"]],[destination_point["lng"],destination_point["lat"]]],
        "instructions":False})
    try:
        feature = data["features"][0]
        summary = feature["properties"]["summary"]
        km, seconds = summary["distance"]/1000, summary["duration"]
        geometry = feature["geometry"]["coordinates"]
        if not math.isfinite(km) or not math.isfinite(seconds) or km <= 0 or seconds < 0 or not geometry:
            raise ValueError()
    except (KeyError, IndexError, TypeError, ValueError):
        raise ServiceUnavailable("No drivable route could be found") from None
    if km > current_app.config["MAX_TRIP_KM"]:
        raise BadRequest("This route is outside our service distance")
    base = Decimal(str(current_app.config["FARE_BASE"]))
    included = Decimal(str(current_app.config["FARE_INCLUDED_KM"]))
    per_km = Decimal(str(current_app.config["FARE_PER_KM"]))
    multiplier = Decimal(str(current_app.config["FARE_COMFORT_MULTIPLIER"] if service == "comfort" else 1))
    amount = ((base + max(Decimal(0), Decimal(str(km))-included)*per_km)*multiplier).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return {"distanceKm":round(km, 3), "durationSeconds":round(seconds), "geometry":geometry,
            "fare":float(amount), "currency":"INR", "service":service,
            "tariff":{"base":float(base),"includedKm":float(included),"perKm":float(per_km),"multiplier":float(multiplier)}}
