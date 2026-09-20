# RydeLy

Rider-first ride booking with a React/Leaflet frontend, Flask API, Firebase Phone Authentication and Firebase Realtime Database. This replaces the routed demo experience with authenticated, persisted rides. External services must be configured before live use; there is no login, routing or location simulation fallback.

## Run locally

1. Create a Firebase project, enable Phone Authentication, configure authorized domains and SMS settings, and create a Realtime Database. Register a web app. Download a service account to a private directory outside the repository.
2. Apply `database.rules.json` in the Firebase Realtime Database Rules console. It denies direct browser database access; all application data goes through the authenticated Flask API. The Admin SDK bypasses these rules, so keep its credentials private and restrict service-account permissions.
3. Copy `.env.example` to `.env`, set the database URL, private credentials path, random session secret and an openrouteservice key with Directions and Geocoding enabled. Never put a service account or ORS key in a VITE variable.
4. Copy `frontend/.env.example` to `frontend/.env` and fill the Firebase web configuration. Web configuration is public; restrict the associated API key and authorized domains appropriately.
5. Create a Python virtual environment and install `pip install -r requirements-dev.txt`. Run `python run.py` for the API on port 5000.
6. Run `npm ci --prefix frontend` then `npm run dev --prefix frontend`. Open localhost:5173. Vite proxies API requests to Flask. Phone authentication and browser GPS require an allowed secure context; use HTTPS for testing on two physical devices.

## First accounts and a full trip

Sign in with a phone number and SMS code. Complete driver registration while signed in. Driver records start pending. To appoint an administrator, a trusted Firebase operator must create `/admins/FIREBASE_AUTH_UID` with `{ "enabled": true }` in the database console. There is no browser role selector or public admin link. An authorized administrator can open `/admin` and verify a driver; signing in again or refreshing the session picks up the role. Never grant admin membership based on a phone number supplied by a browser.

On the driver device, open the driver workspace, allow GPS and go online. On the rider device, choose pickup and destination through address search or map clicks; current location is optional. Request a server-priced road route, select the service and book. A nearby online driver sees the offer and can accept it. Both participants can explicitly enable location sharing. The driver must be near pickup to arrive and start, and must enter the rider's four-digit PIN. Completion requires a fresh GPS fix near the destination. The rider can rate the completed trip.

GPS is sampled roughly every 5 seconds while the page is open, and ride state is polled every 3 seconds. This is foreground tracking, not a background mobile tracking service. Browser permission, GPS accuracy and connectivity are required. Driver availability expires after 45 seconds without an accurate update. Locations originate from devices and are not proof against GPS spoofing. The system does not invent locations when permission is denied.

## Fares and stored data

The backend obtains driving distance and geometry from openrouteservice. The default illustrative tariff is INR 35 including 1.5 km, then INR 18/km; Comfort multiplies the result by 1.25. Configure these values for your service before launch. Quotes expire after five minutes and are locked when booked. Completion retains the agreed fare; waiting charges, tolls, diversions and metered actual travel are not implemented. Payment is cash; analytics show completed fare totals, not verified payments.

Firebase stores users, driver verification, server sessions, quotes, rides, pickup/destination, road routes, fare snapshots, status events, participant location updates/history and ratings. `/rideOperations` holds transactional ride data; `/admins` controls administrator access. Ride history and admin analytics use these records. Availability uses expiring GPS presence. Set an appropriate retention/deletion policy and backups for sensitive trip data before launch; automatic history deletion is not enabled.

Admin analytics include ride counts, active/completed/cancelled rides, completion fare totals, distance, matching/trip duration, ratings, service distribution and daily totals. Passenger/driver live coordinates and PINs are not exposed in the analytics response.

## Production deployment

Build with `npm run build --prefix frontend` and serve `frontend/dist` over HTTPS with SPA fallback. Set `VITE_API_URL=/api` before building. Proxy same-origin `/api/` to Flask, stripping `/api` (e.g. `/api/rides` becomes `/rides`). Use a production WSGI server rather than Flask's development server. Set `FLASK_ENV=production`, a persistent random `SECRET_KEY` of at least 32 characters, the exact HTTPS `FRONTEND_URL`, Firebase credentials, ORS key, and a shared Redis `RATELIMIT_STORAGE_URI`. Production startup rejects missing secret strength, HTTP frontend origins or in-memory rate limits. Keep Redis and the backend private behind the gateway. Rate limits use the immediate peer IP; configure gateway per-client limits as well. Do not blindly trust forwarded IP headers.

Use one origin for frontend and API: session cookies are HttpOnly, Secure in production and SameSite=Lax. Apply HTTPS/HSTS, nosniff, frame protection and an appropriate Content Security Policy to the static frontend at the gateway. Firebase reCAPTCHA and map tiles require their provider origins. Do not cache API responses. Restrict request sizes, configure request timeouts and add monitoring, backups and provider quota alerts. The health endpoint checks process availability only, not provider readiness.

The API checks server sessions, Firebase revocation/disabled status, database bans, database administrator membership and verified driver ownership. Mutations require CSRF tokens and approved Origins. Fare calculation, ride access, status transitions, GPS freshness and PIN checks run server-side. Acceptance and active-ride constraints use database transactions. The development authentication bypasses have been removed.

Current transactions run over the complete `/rideOperations` aggregate to guarantee acceptance consistency. This is suitable for a small pilot; partition active rides and archive/query historical data before high-volume use. The current analytics scan stored rides. A security review, operational testing and load testing are still required before a public transportation service launch; this implementation is not a guarantee of complete security.

OpenStreetMap standard tiles require attribution and compliance with their usage policy. For a public/high-traffic deployment use a suitable hosted tile provider. Routing/geocoding quotas, SMS charges and service availability depend on your provider accounts.

## Checks

- `python -m pytest -q` runs API tests with an isolated in-memory Firebase reference double, including concurrent acceptance, participant isolation, CSRF, revocation, fare integrity, PIN lockout and the persisted lifecycle. It does not exercise live Firebase, SMS or routing infrastructure.
- `npm run lint --prefix frontend`
- `npm run build --prefix frontend`

Before launch, test OTP, both roles on physical devices, poor GPS, denied permissions, stale drivers, reconnect/reload, concurrent acceptance, cancellation, completion, database persistence and administrator access against your configured Firebase project. No credentials were available to verify these live services during implementation.

Provider documentation: [Firebase phone authentication](https://firebase.google.com/docs/auth/web/phone-auth), [Firebase session revocation](https://firebase.google.com/docs/auth/admin/manage-sessions), [openrouteservice](https://openrouteservice.org/dev/), [Leaflet](https://leafletjs.com/reference.html), [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/).
