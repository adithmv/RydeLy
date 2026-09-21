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
  Locate,
  AlertCircle,
  List,
  Map,
  LocateFixed,
  X,
  ChevronDown,
} from "lucide-react";
import {
  bookRide,
  changeStatus,
  getRides,
  getBroadcastStatus,
  isActive,
  quoteRide,
  rateRide,
  retryRide,
  sendPosition,
  statusLabel,
  searchPlaces,
  type Place,
} from "@/lib/live";
import { currentLocation, useLiveLocation } from "@/lib/useLiveLocation";
import LiveMap from "@/components/LiveMap";
import PlaceSearch from "@/components/PlaceSearch";
import StandsList from "@/components/StandsList";
import { searchPlaces as searchPlacesApi } from "@/lib/live";
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
    [clock, setClock] = useState(Date.now()),
    [showPickupPicker, setShowPickupPicker] = useState(false),
    [pickupMethod, setPickupMethod] = useState<"list" | "map" | "gps" | null>(null),
    [showDestinationStands, setShowDestinationStands] = useState(false),
    [quoteDebounceTimer, setQuoteDebounceTimer] = useState<NodeJS.Timeout | null>(null),
    [broadcastStatus, setBroadcastStatus] = useState<{
      status: string;
      elapsed: number;
      notifiedCount: number;
      expansionIn: number;
      timeoutIn: number;
    } | null>(null),
    [retrying, setRetrying] = useState(false),
    [chosenFare, setChosenFare] = useState<number | null>(null);
  const ride = rides.data?.find((r) => !dismissed.includes(r.id));
  const rideActive = !!ride && isActive(ride);
  
  // Rider location sharing: only after driver accepts (accepted, arriving)
  // Stops at in_progress (pickup confirmed via OTP) and after completion/cancellation
  const shouldShareLocation = !!ride && 
    ["accepted", "arriving"].includes(ride.status);
  
  const gps = useLiveLocation(shouldShareLocation);
  const requestKey = useRef({ quote: "", key: "" });
  const quoteMutation = useMutation({
    mutationFn: () => quoteRide(pickup!, destination!, service),
    onError: (error: Error) => {
      setError(error.message);
    },
    onSuccess: (data) => {
      // Default to minimum fare when new quote arrives
      setChosenFare(data.minimumFare);
    },
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
      return bookRide(quote.id, requestKey.current.key, chosenFare ?? undefined);
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

  // Broadcast status polling for requested rides
  const broadcastQuery = useQuery({
    queryKey: ["broadcast-status", ride?.id],
    queryFn: () => getBroadcastStatus(ride!.id),
    enabled: !!ride && ride.status === "requested",
    refetchInterval: 2000,
    retry: 1,
  });

  // Update broadcast status state from query
  useEffect(() => {
    if (broadcastQuery.data) {
      setBroadcastStatus(broadcastQuery.data);
    }
  }, [broadcastQuery.data]);

  const retry = useMutation({
    mutationFn: () => retryRide(ride!.id),
    onSuccess: (data) => {
      // Reset state to allow new booking with same parameters
      setRetrying(false);
      setDismissed((rides.data || []).map((r) => r.id));
      setSharing(false);
      quoteMutation.reset();
      setChosenFare(null);
      // Pre-fill pickup and destination from retry response
      if (data.pickup) setPickup(data.pickup);
      if (data.destination) setDestination(data.destination);
      if (data.service) setService(data.service);
    },
    onError: (error: Error) => {
      setRetrying(false);
      setError(error.message);
    },
  });

  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (
      !gps.position ||
      !shouldShareLocation ||
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
  }, [gps.position, ride?.id, shouldShareLocation]);
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
    if (mapTarget === "pickup") {
      // For pickup, reverse geocode to get a readable address
      setMapTarget(null);
      reverseGeocodeAndSetPickup(lat, lng);
    } else {
      const place = {
        lat,
        lng,
        label: `Destination at ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      };
      setDestination(place);
      setMapTarget(null);
    }
  };

  // Reverse geocode helper for map selections
  const reverseGeocodeAndSetPickup = async (lat: number, lng: number) => {
    setError("");
    try {
      const results = await searchPlaces(`${lat},${lng}`);
      const label = results[0]?.label || `Pickup at ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setPickup({ lat, lng, label, source: "map" });
    } catch (e) {
      setPickup({ 
        lat, 
        lng, 
        label: `Pickup at ${lat.toFixed(5)}, ${lng.toFixed(5)}`, 
        source: "map" 
      });
    }
  };

  // Current location with reverse geocode
  const handleUseCurrentLocation = async () => {
    setError("");
    setPickupMethod("gps");
    try {
      const p = await currentLocation();
      if (p.accuracy > 100) {
        setError("Location accuracy is low. Select your pickup on the map or from the list.");
        setPickupMethod(null);
        return;
      }
      // Reverse geocode for better label
      try {
        const results = await searchPlaces(`${p.lat},${p.lng}`);
        const label = results[0]?.label || "Current location";
        setPickup({ lat: p.lat, lng: p.lng, label, source: "gps" });
      } catch {
        setPickup({ lat: p.lat, lng: p.lng, label: "Current location", source: "gps" });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Location unavailable");
      setPickupMethod(null);
    }
  };

  // Auto-trigger quote when both pickup and destination are set
  useEffect(() => {
    if (pickup && destination && !quoteMutation.isPending && !quote) {
      if (quoteDebounceTimer) clearTimeout(quoteDebounceTimer);
      const timer = setTimeout(() => {
        const distance = calculateDistance(pickup, destination);
        if (distance < 0.1) {
          setError("Destination is too close to pickup. Please choose a different location.");
          return;
        }
        quoteMutation.mutate();
      }, 500);
      setQuoteDebounceTimer(timer);
    }
    return () => {
      if (quoteDebounceTimer) clearTimeout(quoteDebounceTimer);
    };
  }, [pickup, destination, service, quoteMutation, quote, quoteDebounceTimer]);

  // Helper to calculate straight-line distance between two points (for minimum check)
  const calculateDistance = (p1: Place, p2: Place): number => {
    const R = 6371;
    const lat1 = p1.lat * Math.PI / 180;
    const lat2 = p2.lat * Math.PI / 180;
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLng = (p2.lng - p1.lng) * Math.PI / 180;
    const haversineA = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(haversineA), Math.sqrt(1-haversineA));
  };

  // Helper to get source label
  const getSourceLabel = (source?: string) => {
    switch (source) {
      case "list": return "Selected from stands list";
      case "map": return "Selected on map";
      case "gps": return "From your current location";
      default: return "Set via search";
    }
  };

  // Helper to get source color
  const getSourceColor = (source?: string) => {
    switch (source) {
      case "list": return "text-blue-600";
      case "map": return "text-green-600";
      case "gps": return "text-purple-600";
      default: return "text-muted-foreground";
    }
  };

  const staleDriver =
    ride?.driverLiveLocation && ride.driverLiveLocation.stale;
  const driverLiveLocation = ride?.driverLiveLocation && !ride.driverLiveLocation.stale 
    ? ride.driverLiveLocation 
    : (ride?.locations?.driver && !staleDriver ? ride.locations.driver : null);
  const riderLiveLocation = ride?.riderLiveLocation && !ride.riderLiveLocation.stale
    ? ride.riderLiveLocation
    : null;
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
                {ride.status === "requested" ? (
                  <>
                    {broadcastStatus && (
                      <>
                        {broadcastStatus.status === "searching" && (
                          <span className="flex items-center gap-2">
                            <span className="animate-pulse">🔍</span>
                            Looking for drivers nearby… 
                            <span className="text-xs text-muted-foreground">
                              ({broadcastStatus.notifiedCount} notified)
                            </span>
                          </span>
                        )}
                        {broadcastStatus.status === "expanded" && (
                          <span className="flex items-center gap-2" style={{ color: "#ea580c" }}>
                            <AlertCircle size={14} />
                            Still looking — expanding search area… 
                            <span className="text-xs text-muted-foreground">
                              ({broadcastStatus.notifiedCount} notified)
                            </span>
                          </span>
                        )}
                        {broadcastStatus.status === "unmatched" && (
                          <span className="flex items-center gap-2" style={{ color: "#dc2626" }}>
                            <AlertCircle size={14} />
                            No drivers available
                          </span>
                        )}
                      </>
                    )}
                    {!broadcastStatus && (
                      <span>Nearby online drivers can now accept your request. We&apos;ll update this page when one accepts.</span>
                    )}
                  </>
                ) : ride.status === "completed"
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
                  {/* Rider location sharing status */}
                  <div className="location-sharing-status">
                    {shouldShareLocation ? (
                      <>
                        <p className="live-muted small flex items-center gap-2" style={{ color: gps.position && gps.position.accuracy <= 100 ? "#166534" : "#ea580c" }}>
                          <Locate size={14} /> 
                          {gps.position && gps.position.accuracy <= 100
                            ? "Sharing your live location with driver"
                            : gps.position && gps.position.accuracy > 100
                              ? "GPS accuracy low — waiting for better fix"
                              : "Acquiring GPS..."}
                        </p>
                        {riderLiveLocation && (
                          <p className="live-muted small flex items-center gap-2" style={{ color: "#166534" }}>
                            <ShieldCheck size={14} /> Your live location is visible to driver (updated {Math.round((Date.now()/1000) - (riderLiveLocation.updatedAt || riderLiveLocation.capturedAt || 0))}s ago)
                          </p>
                        )}
                      </>
                    ) : ride.status === "requested" ? (
                      <p className="live-muted small flex items-center gap-2">
                        <AlertCircle size={14} /> Live location sharing starts after a driver accepts your ride
                      </p>
                    ) : (
                      <p className="live-muted small flex items-center gap-2">
                        <AlertCircle size={14} /> Live location sharing available only during active ride
                      </p>
                    )}
                  </div>
                  
                  {/* Driver location display */}
                  {driverLiveLocation && (
                    <div className="driver-location-status">
                      <p className="live-muted small flex items-center gap-2" style={{ color: "#166534" }}>
                        <MapPin size={14} style={{ color: "#087f5b" }} /> Driver live location visible (updated {Math.round((Date.now()/1000) - (driverLiveLocation.updatedAt || driverLiveLocation.capturedAt || 0))}s ago)
                      </p>
                    </div>
                  )}
                  {staleDriver && (
                    <p role="status" className="live-error flex items-center gap-2">
                      <AlertCircle size={14} /> Driver location is stale. Last update{" "}
                      {Math.round(
                        clock / 1000 - (ride.locations!.driver!.updatedAt || 0),
                      )}{" "}
                      seconds ago.
                    </p>
                  )}
                  {!ride.locations?.driver && ride.driverId && !staleDriver && (
                    <p className="live-muted flex items-center gap-2">
                      <MapPin size={14} style={{ color: "#087f5b" }} /> Waiting for the driver's GPS update.
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
              {ride.status === "unmatched" && broadcastStatus?.status === "unmatched" && (
                <div style={{ marginTop: "16px", padding: "16px", background: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca" }}>
                  <p className="live-muted" style={{ marginBottom: "12px", color: "#dc2626" }}>
                    <AlertCircle size={16} className="inline" /> No drivers were available within the search area.
                  </p>
                  <button
                    className="live-primary"
                    onClick={() => retry.mutate()}
                    disabled={retry.isPending}
                    style={{ width: "100%" }}
                  >
                    {retry.isPending ? "Retrying…" : "Try Again"}
                    <RefreshCw size={16} />
                  </button>
                </div>
              )}
              {!rideActive && ride.status !== "unmatched" && (
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

              {/* Pickup Method Selector */}
              <div className="pickup-method-selector">
                <p className="live-eyebrow">HOW TO SET PICKUP</p>
                <div className="method-buttons">
                  <button
                    type="button"
                    className={`method-btn ${pickupMethod === "list" ? "active" : ""}`}
                    onClick={() => { setPickupMethod("list"); setShowPickupPicker(true); }}
                  >
                    <List size={20} /> Stands List
                    <span className="method-desc">Pick from known stands</span>
                  </button>
                  <button
                    type="button"
                    className={`method-btn ${pickupMethod === "map" ? "active" : ""}`}
                    onClick={() => { setPickupMethod("map"); setMapTarget("pickup"); }}
                  >
                    <Map size={20} /> Choose on Map
                    <span className="method-desc">Tap to select location</span>
                  </button>
                  <button
                    type="button"
                    className={`method-btn ${pickupMethod === "gps" ? "active" : ""}`}
                    onClick={handleUseCurrentLocation}
                  >
                    <LocateFixed size={20} /> Current Location
                    <span className="method-desc">Use GPS</span>
                  </button>
                </div>
              </div>

              {/* Selected Pickup Display */}
              {pickup && (
                <div className="pickup-selected">
                  <div className="selected-pickup-card">
                    <div className="pickup-info">
                      <MapPin size={18} className={getSourceColor(pickup.source)} />
                      <div>
                        <p className="font-body text-sm font-medium">{pickup.label}</p>
                        <p className="font-body text-xs text-muted-foreground">
                          {getSourceLabel(pickup.source)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="live-link"
                      onClick={() => { setPickup(undefined); setPickupMethod(null); }}
                    >
                      <X size={14} /> Change
                    </button>
                  </div>
                </div>
              )}

              {!pickup && !pickupMethod && (
                <p className="live-muted small text-center" style={{ marginTop: "8px" }}>
                  Select a method above to set your pickup location
                </p>
              )}

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
                    <h2>₹{chosenFare ? chosenFare.toFixed(2) : quote.minimumFare.toFixed(2)}</h2>
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
                  {quote.maximumFare > quote.minimumFare && (
                    <div style={{ marginTop: "12px", marginBottom: "12px" }}>
                      <p className="live-muted small" style={{ marginBottom: "8px" }}>
                        Choose your fare (₹{quote.minimumFare.toFixed(2)} – ₹{quote.maximumFare.toFixed(2)})
                      </p>
                      <input
                        type="number"
                        step="0.5"
                        min={quote.minimumFare}
                        max={quote.maximumFare}
                        value={chosenFare ?? quote.minimumFare}
                        onChange={(e) => setChosenFare(parseFloat(e.target.value) || quote.minimumFare)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          fontSize: "16px",
                          fontFamily: "inherit",
                        }}
                      />
                    </div>
                  )}
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
            rider={riderLiveLocation ?? (ride?.locations?.rider ?? gps.position)}
            driver={driverLiveLocation ?? ride?.locations?.driver}
            steps={ride?.steps}
            onPick={ride ? undefined : onMap}
          />
          <p className="routing-credit">
            Routing & address search: © openrouteservice / HeiGIT ·
            OpenStreetMap contributors
          </p>
        </section>
      </div>

      {/* Stands List Modal - Pickup */}
      {showPickupPicker && pickupMethod === "list" && (
        <StandsList
          onSelect={(stand) => {
            setPickup({ 
              lat: 0,
              lng: 0,
              label: `${stand.name}, ${stand.town}`,
              source: "list"
            });
            setShowPickupPicker(false);
            setPickupMethod(null);
          }}
          onClose={() => { setShowPickupPicker(false); setPickupMethod(null); }}
        />
      )}

      {/* Stands List Modal - Destination */}
      {showDestinationStands && (
        <StandsList
          onSelect={(stand) => {
            setDestination({ 
              lat: 0,
              lng: 0,
              label: `${stand.name}, ${stand.town}`,
              source: "list"
            });
            setShowDestinationStands(false);
          }}
          onClose={() => { setShowDestinationStands(false); }}
        />
      )}

    </main>
  );
}
