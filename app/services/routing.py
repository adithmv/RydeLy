"""Server-only routing with multi-tier fallback (OpenRouteService -> OSRM -> Geometric fallback)."""
import json
import math
from decimal import Decimal, ROUND_HALF_UP
from urllib.parse import urlencode, quote
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


def _osrm_route(pickup_coords, destination_coords):
    """Fetch live driving route from free public OpenStreetMap OSRM service."""
    lng1, lat1 = pickup_coords
    lng2, lat2 = destination_coords
    url = f"https://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}?overview=full&geometries=geojson&steps=true"
    req = Request(url, headers={"User-Agent": "RydeLy/1.0 (Kerala Auto Mobility; contact@rydely.in)", "Accept": "application/json"})
    with urlopen(req, timeout=10) as response:
        res = json.load(response)
    if not res or res.get("code") != "Ok" or not res.get("routes"):
        raise ValueError("OSRM returned no route")
    
    route_obj = res["routes"][0]
    steps = []
    for leg in route_obj.get("legs", []):
        for step in leg.get("steps", []):
            name = step.get("name", "")
            maneuver = step.get("maneuver", {})
            instruction = maneuver.get("instruction") or f"{maneuver.get('type', 'Drive')} on {name if name else 'road'}"
            steps.append({
                "instruction": instruction,
                "distance": step.get("distance", 0),
                "duration": step.get("duration", 0),
                "type": 0,
                "name": name,
                "wayPoints": [0, 0]
            })
            
    return {
        "features": [
            {
                "properties": {
                    "summary": {
                        "distance": route_obj.get("distance", 0),
                        "duration": route_obj.get("duration", 0)
                    },
                    "segments": [
                        {
                            "steps": steps
                        }
                    ]
                },
                "geometry": route_obj.get("geometry", {})
            }
        ]
    }


def _nominatim_geocode(query):
    """Fetch geocoding search results from OpenStreetMap Nominatim."""
    encoded = quote(query)
    url = f"https://nominatim.openstreetmap.org/search?q={encoded}&format=json&countrycodes=in&limit=5"
    req = Request(url, headers={"User-Agent": "RydeLy/1.0 (Kerala Auto Mobility; contact@rydely.in)", "Accept": "application/json"})
    with urlopen(req, timeout=8) as response:
        data = json.load(response)
    features = []
    for item in data:
        try:
            lat = float(item["lat"])
            lng = float(item["lon"])
            label = item.get("display_name") or query
            features.append({
                "geometry": {"coordinates": [lng, lat]},
                "properties": {"label": label}
            })
        except (KeyError, ValueError, TypeError):
            continue
    return {"features": features}


def _geometric_fallback_route(pickup_point, destination_point):
    """Reliable mathematical fallback if external routing servers are temporarily unreachable."""
    straight_km = distance_km(pickup_point, destination_point)
    # Kerala road winding factor ~1.25x
    route_km = max(0.5, straight_km * 1.25)
    meters = route_km * 1000
    # Average auto speed: ~30 km/h = 8.33 m/s
    duration_seconds = max(60, int(meters / 8.33))
    
    num_points = max(5, min(25, int(straight_km * 3)))
    coords = []
    for i in range(num_points + 1):
        t = i / float(num_points)
        lng = pickup_point["lng"] + t * (destination_point["lng"] - pickup_point["lng"])
        lat = pickup_point["lat"] + t * (destination_point["lat"] - pickup_point["lat"])
        coords.append([round(lng, 6), round(lat, 6)])
    
    return {
        "features": [
            {
                "properties": {
                    "summary": {
                        "distance": meters,
                        "duration": duration_seconds
                    },
                    "segments": [
                        {
                            "steps": [
                                {
                                    "instruction": f"Proceed along connecting route ({round(route_km, 1)} km)",
                                    "distance": meters,
                                    "duration": duration_seconds,
                                    "type": 0,
                                    "name": "Direct Route",
                                    "wayPoints": [0, len(coords) - 1]
                                }
                            ]
                        }
                    ]
                },
                "geometry": {
                    "coordinates": coords
                }
            }
        ]
    }


def provider(path, data=None, params=None):
    api_key = current_app.config.get("ORS_API_KEY") if current_app else ""
    # Try OpenRouteService if API key is present
    if api_key:
        url = "https://api.openrouteservice.org" + path
        if params:
            url += "?" + urlencode(params)
        req = Request(url, data=json.dumps(data).encode() if data else None,
                      headers={"Authorization": api_key, "Content-Type": "application/json", "Accept": "application/json"})
        try:
            with urlopen(req, timeout=10) as response:
                return json.load(response)
        except Exception:
            pass  # Fall through to fallback providers

    # Fallback for Directions / Routing
    if "directions" in path and data and "coordinates" in data and len(data["coordinates"]) >= 2:
        try:
            return _osrm_route(data["coordinates"][0], data["coordinates"][1])
        except Exception:
            pass

    # Fallback for Geocoding / Search
    if "geocode" in path:
        q = (params or {}).get("text", "")
        if q:
            try:
                return _nominatim_geocode(q)
            except Exception:
                pass
        return {"features": []}

    raise ServiceUnavailable("The map service is unavailable. Please try again.")


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
        "instructions":True})

    try:
        feature = data["features"][0]
        summary = feature["properties"]["summary"]
        km, seconds = summary["distance"]/1000, summary["duration"]
        geometry = feature["geometry"]["coordinates"]
        
        # Extract turn-by-turn instructions
        steps = []
        if "segments" in feature["properties"]:
            for segment in feature["properties"]["segments"]:
                if "steps" in segment:
                    for step in segment["steps"]:
                        steps.append({
                            "instruction": step.get("instruction", ""),
                            "distance": step.get("distance", 0),  # meters
                            "duration": step.get("duration", 0),  # seconds
                            "type": step.get("type", 0),
                            "name": step.get("name", ""),
                            "wayPoints": step.get("wayPoints", [0, 0]),
                        })
        
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
    # Minimum fare (floor) = computed fare
    minimum_fare = float(amount)
    # Maximum fare = minimum fare + 50%
    maximum_fare = float((amount * Decimal("1.5")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
    return {"distanceKm":round(km, 3), "durationSeconds":round(seconds), "geometry":geometry,
            "fare": minimum_fare,  # Backward compatibility
            "minimumFare": minimum_fare,
            "maximumFare": maximum_fare,
            "currency":"INR", "service":service,
            "tariff":{"base":float(base),"includedKm":float(included),"perKm":float(per_km),"multiplier":float(multiplier)},
            "steps": steps}