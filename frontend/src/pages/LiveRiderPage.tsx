import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Navigation,
  ShieldCheck,
  Star,
  MapPin,
  RefreshCw,
} from "lucide-react";
import {
  bookRide,
  changeStatus,
  getRides,
  isActive,
  quoteRide,
  rateRide,
  sendPosition,
  statusLabel,
  type Place,
} from "@/lib/live";
import { currentLocation, useLiveLocation } from "@/lib/useLiveLocation";
import LiveMap from "@/components/LiveMap";
import PlaceSearch from "@/components/PlaceSearch";
import "./live.css";
export default function LiveRiderPage() {
  const cache = useQueryClient();
  const rides = useQuery({
    queryKey: ["rides"],
    queryFn: getRides,
    refetchInterval: 3000,
    retry: 1,
  });
  const [pickup, setPickup] = useState<Place>(),
    [destination, setDestination] = useState<Place>(),
    [service, setService] = useState("auto"),
    [mapTarget, setMapTarget] = useState<"pickup" | "destination" | null>(null),
    [sharing, setSharing] = useState(false),
    [error, setError] = useState(""),
    [cancelOpen, setCancelOpen] = useState(false),
    [dismissed, setDismissed] = useState<string[]>([]),
    [clock, setClock] = useState(Date.now());
  const ride = rides.data?.find((r) => !dismissed.includes(r.id));
  const rideActive = !!ride && isActive(ride);
  const gps = useLiveLocation(sharing && rideActive);
  const requestKey = useRef({ quote: "", key: "" });
  const quoteMutation = useMutation({
    mutationFn: () => quoteRide(pickup!, destination!, service),
  });
  const candidate = quoteMutation.data;
  const quote =
    candidate &&
    candidate.service === service &&
    JSON.stringify(candidate.pickup) === JSON.stringify(pickup) &&
    JSON.stringify(candidate.destination) === JSON.stringify(destination)
      ? candidate
      : undefined;
  const book = useMutation({
    mutationFn: async () => {
      if (!quote) throw new Error("Check prices first");
      if (requestKey.current.quote !== quote.id)
        requestKey.current = { quote: quote.id, key: crypto.randomUUID() };
      return bookRide(quote.id, requestKey.current.key);
    },
    onSuccess: () => {
      void cache.invalidateQueries({ queryKey: ["rides"] });
    },
  });
  const update = useMutation({
    mutationFn: () => changeStatus(ride!.id, "cancelled"),
    onSuccess: () => {
      setCancelOpen(false);
      void cache.invalidateQueries({ queryKey: ["rides"] });
    },
  });
  const rating = useMutation({
    mutationFn: (n: number) => rateRide(ride!.id, n),
    onSuccess: () => {
      void cache.invalidateQueries({ queryKey: ["rides"] });
    },
  });
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (
      !gps.position ||
      !rideActive ||
      !ride?.id ||
      gps.position.accuracy > 100
    )
      return;
    let mounted = true;
    sendPosition(ride.id, gps.position)
      .then(() => {
        if (mounted) setError("");
      })
      .catch((e) => {
        if (mounted) setError(e.message);
      });
    return () => {
      mounted = false;
    };
  }, [gps.position, ride?.id, rideActive]);
  const setPickupFromLocation = async () => {
    setError("");
    try {
      const p = await currentLocation();
      if (p.accuracy > 100)
        throw new Error(
          "Location accuracy is low. Select your pickup on the map.",
        );
      setPickup({ lat: p.lat, lng: p.lng, label: "Current location" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Location unavailable");
    }
  };
  const onMap = (lat: number, lng: number) => {
    if (!mapTarget) return;
    const place = {
      lat,
      lng,
      label: `${mapTarget === "pickup" ? "Pickup" : "Destination"} at ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    };
    if (mapTarget === "pickup") setPickup(place);
    else setDestination(place);
    setMapTarget(null);
  };
  const staleDriver =
    ride?.locations?.driver &&
    clock / 1000 - (ride.locations.driver.updatedAt || 0) > 45;
  return (
    <main className="live-app">
      <header className="live-subnav">
        <span>
          <MapPin size={18} /> Book a ride
        </span>
        <Link to="/history">Your trips</Link>
      </header>
      <div className="live-layout">
        <aside className="live-booking">
          {rides.isPending ? (
            <p role="status">Loading your rides…</p>
          ) : rides.error ? (
            <div role="alert">
              <p className="live-error">{rides.error.message}</p>
              <button
                className="live-secondary"
                onClick={() => void rides.refetch()}
              >
                <RefreshCw size={15} /> Retry
              </button>
            </div>
          ) : ride ? (
            <>
              <p className="live-eyebrow">YOUR RIDE</p>
              <h1 aria-live="polite">{statusLabel[ride.status]}</h1>
              <p className="live-muted">
                {ride.status === "requested"
                  ? "Nearby online drivers can now accept your request. We’ll update this page when one accepts."
                  : ride.status === "completed"
                    ? "Thank you for riding with RydeLy."
                    : "Your trip information is updated automatically."}
              </p>
              {ride.status === "requested" &&
                clock / 1000 - ride.createdAt > 600 && (
                  <p className="live-error">
                    No driver accepted within ten minutes. Cancel this request
                    and try again.
                  </p>
                )}
              {ride.driverName && (
                <div className="live-driver-card">
                  <span className="driver-initial">{ride.driverName[0]}</span>
                  <div>
                    <strong>{ride.driverName}</strong>
                    <small>{ride.autoNumber}</small>
                  </div>
                </div>
              )}
              {ride.startPin && (
                <div className="trip-pin">
                  <small>TRIP START PIN</small>
                  <strong>{ride.startPin}</strong>
                  <p>
                    Share this only with your driver when you are ready to
                    start.
                  </p>
                </div>
              )}
              <div className="live-receipt">
                <p>
                  <small>PICKUP</small>
                  <strong>{ride.pickup.label}</strong>
                </p>
                <p>
                  <small>DESTINATION</small>
                  <strong>{ride.destination.label}</strong>
                </p>
                <div>
                  <span>
                    {ride.distanceKm.toFixed(1)} km ·{" "}
                    {Math.ceil(ride.durationSeconds / 60)} min route estimate
                  </span>
                  <strong>₹{(ride.finalFare ?? ride.fare).toFixed(2)}</strong>
                </div>
                <small>
                  Cash · agreed route fare
                  {ride.status === "completed" ? " · pay your driver" : ""}
                </small>
              </div>
              {rideActive && (
                <>
                  <label className="share-location">
                    <input
                      type="checkbox"
                      checked={sharing}
                      onChange={(e) => setSharing(e.target.checked)}
                    />{" "}
                    Share my live location with my assigned driver
                  </label>
                  <p className="live-muted small">
                    Location is collected about every 5 seconds while this page
                    is open and sharing is enabled. Trip location history is
                    stored with your ride.
                  </p>
                  {!sharing && (
                    <p className="live-muted small">
                      Your selected pickup is still visible to the driver. Live
                      position sharing is off.
                    </p>
                  )}
                  {staleDriver && (
                    <p role="status" className="live-error">
                      Driver location is stale. Last update{" "}
                      {Math.round(
                        clock / 1000 - (ride.locations!.driver!.updatedAt || 0),
                      )}{" "}
                      seconds ago.
                    </p>
                  )}
                  {!ride.locations?.driver && ride.driverId && (
                    <p className="live-muted">
                      Waiting for the driver’s GPS update.
                    </p>
                  )}
                  {ride.status !== "in_progress" && (
                    <button
                      className="live-secondary"
                      onClick={() => setCancelOpen(true)}
                    >
                      Cancel ride
                    </button>
                  )}
                </>
              )}
              {cancelOpen && (
                <section
                  className="inline-confirm"
                  aria-label="Cancel ride confirmation"
                >
                  <p>Cancel this ride? This action cannot be reversed.</p>
                  <button
                    className="live-primary"
                    disabled={update.isPending}
                    onClick={() => update.mutate()}
                  >
                    Confirm cancellation
                  </button>
                  <button
                    className="live-link"
                    onClick={() => setCancelOpen(false)}
                  >
                    Keep ride
                  </button>
                </section>
              )}
              {ride.status === "completed" && (
                <div className="live-rating">
                  <h2>How was your ride?</h2>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      aria-label={`Rate ${n} stars`}
                      aria-pressed={ride.rating === n}
                      disabled={rating.isPending}
                      key={n}
                      onClick={() => rating.mutate(n)}
                    >
                      <Star
                        size={28}
                        fill={n <= (ride.rating || 0) ? "#ed7b35" : "none"}
                      />
                    </button>
                  ))}
                  {ride.rating && <p>Rating saved. Thank you.</p>}
                </div>
              )}
              {!rideActive && (
                <button
                  className="live-primary"
                  onClick={() => {
                    setDismissed((rides.data || []).map((r) => r.id));
                    setSharing(false);
                    quoteMutation.reset();
                  }}
                >
                  Book another ride <ArrowRight size={18} />
                </button>
              )}
            </>
          ) : (
            <>
              <p className="live-eyebrow">YOUR EVERYDAY, A LITTLE EASIER</p>
              <h1>
                Where to<span>?</span>
              </h1>
              <p className="live-muted">
                Find a real route. Meet your local driver.
              </p>
              <PlaceSearch label="Pickup" value={pickup} onChange={setPickup} />
              <div className="place-actions">
                <button onClick={() => void setPickupFromLocation()}>
                  <Navigation size={14} /> Use my location
                </button>
                <button onClick={() => setMapTarget("pickup")}>
                  Choose on map
                </button>
              </div>
              <PlaceSearch
                label="Destination"
                value={destination}
                onChange={setDestination}
              />
              <div className="place-actions">
                <button onClick={() => setMapTarget("destination")}>
                  Choose destination on map
                </button>
              </div>
              {mapTarget && (
                <p className="map-pick-notice" role="status">
                  Tap the map to set your {mapTarget}.{" "}
                  <button onClick={() => setMapTarget(null)}>Cancel</button>
                </p>
              )}
              <label className="live-service">
                Ride type
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                >
                  <option value="auto">Ryde Auto</option>
                  <option value="comfort">Ryde Comfort</option>
                </select>
              </label>
              <button
                className="live-primary"
                disabled={!pickup || !destination || quoteMutation.isPending}
                onClick={() => quoteMutation.mutate()}
              >
                {quoteMutation.isPending
                  ? "Calculating road distance…"
                  : "Check route & price"}
                <ArrowRight size={17} />
              </button>
              {quote && (
                <div className="quote-card">
                  <div>
                    <h2>₹{quote.fare.toFixed(2)}</h2>
                    <p>
                      {quote.distanceKm.toFixed(1)} km · about{" "}
                      {Math.ceil(quote.durationSeconds / 60)} minutes
                    </p>
                  </div>
                  <p>
                    ₹{quote.tariff.base} includes {quote.tariff.includedKm} km,
                    then ₹{quote.tariff.perKm}/km
                    {quote.tariff.multiplier !== 1
                      ? ` × ${quote.tariff.multiplier} Comfort rate`
                      : ""}
                    .
                  </p>
                  <p className="live-muted small">
                    Road-distance estimate, locked when booked. Route changes
                    require a new booking. Pay by cash; no online payment is
                    collected.
                  </p>
                  <button
                    className="live-primary"
                    disabled={book.isPending || quote.expiresAt * 1000 <= clock}
                    onClick={() => book.mutate()}
                  >
                    {quote.expiresAt * 1000 <= clock
                      ? "Quote expired — check price again"
                      : book.isPending
                        ? "Requesting…"
                        : "Request this ride"}
                  </button>
                </div>
              )}
              <Link className="live-link" to="/stands">
                Browse auto stands instead
              </Link>
              <Link className="live-link" to="/register">
                Apply to drive with RydeLy
              </Link>
            </>
          )}
          {[
            error,
            gps.error,
            quoteMutation.error?.message,
            book.error?.message,
            update.error?.message,
            rating.error?.message,
          ]
            .filter(Boolean)
            .map((message, i) => (
              <p key={i} role="alert" className="live-error">
                {message}
              </p>
            ))}
          <div className="live-safety">
            <ShieldCheck size={17} /> Only you and your assigned driver can
            access trip tracking.
          </div>
        </aside>
        <section className="live-map-panel">
          <LiveMap
            pickup={ride?.pickup ?? pickup}
            destination={ride?.destination ?? destination}
            geometry={ride?.geometry ?? quote?.geometry}
            rider={ride?.locations?.rider ?? gps.position}
            driver={ride?.locations?.driver}
            onPick={ride ? undefined : onMap}
          />
          <p className="routing-credit">
            Routing & address search: © openrouteservice / HeiGIT ·
            OpenStreetMap contributors
          </p>
        </section>
      </div>
    </main>
  );
}
