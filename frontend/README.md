# RydeLy frontend demo

Run `npm install` and `npm run dev` in `frontend/`. No `.env`, Flask process, Firebase project, phone number or API key is required. The default is demo mode.

## Try it

- Open **Login**, choose Commuter, Driver or Admin, then enter the demo. Log out to switch roles without resetting the data.
- Commuter: choose a town and pickup, optionally enter a destination, then **Find a driver**. Matching takes about 4 seconds, approach 30 seconds, arrival 5 seconds, and the trip 10 seconds. Cancel at any active stage; completed trips have a preview star rating. Ride history updates with your trips.
- Driver: **Go online**, wait 2 seconds for an offer, then Accept → Arrived → Start trip → Complete trip. Decline and request another offer, or enable auto-play after accepting. The offer countdown is visual only. Finish or cancel an active ride before going offline.
- Admin: browse Rides (filter by town/status), Drivers (pending/verified/banned), Users, Call Logs, Reports and Announce. Approvals, warnings, removals, reports, registrations and announcements update the in-memory fixtures.
- **Browse auto stands instead** preserves the existing stand search. Calls show a fictional number and never open the dialer.

All state is browser memory: navigation and role switching retain it; a full reload resets fixtures and signs out. Commuter simulations continue while navigating. Driver auto-play stops when its card unmounts. No real ride, payment, SMS or report is sent. The SVG map uses simulated positions; it does not use GPS, map tiles or routing services. Fonts use local fallbacks to avoid external requests.

## Structure and backend mode

`src/mock/fixtures.ts` reuses the existing location data. `api.ts` implements the legacy API contracts and local mutations; `rides.ts` owns the shared ride state machine; `simulate.ts` advances time and marker position. React Query handles async UI operations; ride views subscribe to immutable snapshots.

`src/lib/api.ts` is the mode boundary. Set `VITE_DEMO_MODE=false` and restart Vite to use the preserved backend API and Firebase login. That mode needs the original backend and Firebase configuration. New ride screens are demo-only until corresponding backend endpoints exist; backend mode retains the original stand-search and driver portal. Flask and Firebase implementation files are preserved.

## Validation

`npm run build` type-checks and builds; `npm run lint` checks source; `npm run test:demo` checks mock mutations, state transitions, simulation, cancellation and fixture coverage without a server.

The source plan is in `../docs/RydeLy-frontend-only-plan.md`. The implemented map choice is the fully offline illustration.
