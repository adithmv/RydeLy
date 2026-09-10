# RydeLy — Frontend-Only Click-Through Prototype
### Plan for a fully mocked, backend-free build

**Goal:** every screen for the new Uber/Apido-style flow exists and is navigable in the browser, with realistic-looking data, zero calls to the Flask backend or Firebase. You should be able to click through commuter, driver, and admin flows end-to-end on a laptop with the backend not even running.

---

## 1. What "disconnected from backend" means concretely

Three things currently reach out to a server, and all three get replaced with local fakes:

| Current | Replacement |
|---|---|
| `lib/api.ts` — fetch calls to Flask (`/auth`, `/commuter`, `/driver`, `/admin`) | A `mock/api.ts` with the **same function signatures**, returning `Promise.resolve(fixtureData)` (optionally after a `setTimeout` to fake network latency) |
| `lib/firebase.ts` — real Firebase Auth (OTP) | A mock auth module: "login" just sets a fake user in context, no OTP sent anywhere |
| `ProtectedRoute` checking real session/role from the backend | Reads role from local mock state (context) instead — still gates routes, just against fake data, so the demo behaves like the real app but nothing leaves the browser |
| React Query calls (`useQuery`/`useMutation` hitting `api.ts`) | Unchanged in structure — they just call the mock functions instead of real ones, so loading/error states still work naturally |

Keeping the *same function signatures* in the mock layer means later reconnecting to the real backend is a one-file swap, not a rewrite — worth doing even though today's goal is "no backend."

---

## 2. Mock data layer

New folder: `frontend/src/mock/`

- `mock/fixtures.ts` — hardcoded arrays: sample drivers (some online, some offline, some pending/banned), sample stands (reuse existing Kannur/Kasaragod town data already in `data/`), sample rides in every lifecycle state, sample users, sample reports, a sample announcement.
- `mock/api.ts` — fake versions of every function currently in `lib/api.ts`, plus new ones for the ride-request flow (`requestRide`, `getRideStatus`, `acceptRide`, `updateRideStatus`, `cancelRide`, `updateDriverLocation`, `toggleDriverOnline`).
- `mock/simulate.ts` — small helpers that fake the *passage of time* so the demo feels alive without a backend:
  - `simulateDriverFound(rideId)` — after ~3–5s, flips a requested ride to `accepted` with a random driver from the fixtures
  - `simulateDriverApproaching(rideId)` — moves a mock driver marker along a canned path toward the pickup pin over ~30s
  - `simulateRideProgress(rideId)` — walks the ride through `arriving → in_progress → completed` on a timer so you can watch a full ride play out without manually triggering each step

This is the key trick for "hover through the app easily" — the demo doesn't need you to fake being two users (driver + commuter) in two tabs; it plays itself forward.

---

## 3. Screens to build/update

### Commuter flow (new, since this replaces stand-browsing as primary)
1. **Request Ride** — pickup pin (default to a fixed mock coordinate per town, or a simple "tap on map" if using Leaflet with free OSM tiles — no API key, no backend involved, just tile images from the internet), optional destination, "Find a driver" button
2. **Searching** — spinner/animation state, auto-advances via `simulateDriverFound`
3. **Driver Found / En Route** — driver's mock name, auto number, photo placeholder, live-moving marker (via `simulateDriverApproaching`), ETA text, "Call driver" button (mock — just shows a fake number, no real dialer requirement), Cancel button
4. **In Progress** — trip status, dropoff, fare estimate
5. **Completed** — trip summary, mock rating stars (visual only, no submit endpoint needed)
6. Keep existing: **Landing**, **Login** (mocked), **Call History** (extend with ride history), **Driver Listing** (repurpose as the "stand fallback" browse view from the plan doc, or keep as-is for now since it's already built)

### Driver flow
1. **Go Online / Offline toggle** on the existing Driver Portal page — flips mock `isAvailable`, no real geolocation call needed (can fake a static or slightly-jittering mock coordinate)
2. **Incoming Ride Offer** — full-screen card with mock pickup address, distance, fare estimate, Accept/Decline, countdown timer (visual only)
3. **Active Ride** screen — mock map, "Arrived," "Start Trip," "Complete Trip" buttons walking through the state machine manually (in addition to the auto-simulation, so you can also click through each transition by hand)
4. Keep existing: **Registration**, **Complaint/report page**

### Admin flow
1. Extend existing **AdminDashboard** with a **Rides** tab — a table of mock rides across all lifecycle states, filterable by status/town
2. Keep existing: Drivers, Users, Reports, Announcements tabs — just point them at `mock/fixtures.ts` instead of the API

---

## 4. Map without a backend

Two options, pick one:

- **Leaflet + OpenStreetMap tiles** (free, no API key, no billing) — real-looking map, markers move smoothly, still "disconnected" in the sense that matters (no calls to *your* backend; it does fetch public map tiles from the internet, which is a different thing from hitting Flask/Firebase)
- **Fully offline fake map** — a static illustration/SVG with dots representing driver/pickup positions, animated via CSS/JS — truly zero network calls of any kind, but looks less convincing

Worth a quick decision — I'd lean Leaflet since it costs nothing and looks far more like the real product, but say so if you want the fully-offline version instead.

---

## 5. What gets stripped out for this build

- All real Firebase config/env requirements (`.env`, `FIREBASE_*` vars) — not needed to run the demo
- All real `fetch` calls to `localhost:5000` (or wherever Flask runs)
- Any code path that depends on the Flask backend actually being up

The Flask backend and Firebase code stay untouched in the repo (not deleted) — this is a frontend-mode toggle, not a backend removal. A single flag or import swap (`mock/api.ts` vs `lib/api.ts`) controls which mode the app runs in, so nothing about the real backend work from the earlier plan is lost.

---

## 6. Deliverable

- Runs with `npm run dev` in `frontend/`, no backend process, no `.env` needed
- Every route in `App.tsx` reachable and populated with plausible mock data
- Full commuter ride request → completion cycle playable end-to-end without manual state-hacking
- Driver online → offer → accept → complete cycle playable the same way
- Admin dashboard fully browsable with mock data across all tabs

## 7. Open question before I start building

Leaflet/OSM map (looks real, small external tile requests) vs. fully offline fake map (zero network calls, less polished)?
