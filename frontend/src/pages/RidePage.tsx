import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Banknote,
  Check,
  ChevronDown,
  Clock3,
  MapPin,
  Navigation,
  Plus,
  Minus,
  ShieldCheck,
  Star,
  UserRound,
  X,
  CarFront,
} from "lucide-react";
import { ALL_TOWNS, getStandsByTown } from "@/data";
import { useRides, rideLabel } from "@/mock/useRides";
import { requestRide, cancelRide, active } from "@/mock/rides";
import { simulateDriverFound, stopSimulation } from "@/mock/simulate";
import RiderMap from "@/components/RiderMap";
import "./rider.css";

export default function RidePage() {
  const rides = useRides();
  const modalRef = useRef<HTMLElement>(null);
  const [town, setTown] = useState("Kannur");
  const [pickup, setPickup] = useState("Railway Station Auto Stand");
  const [destination, setDestination] = useState("");
  const [step, setStep] = useState<"route" | "choose">("route");
  const [selected, setSelected] = useState<"auto" | "comfort">("auto");
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState("");
  const ride = rides.find(
    (r) => r.source === "commuter" && !dismissed.includes(r.id),
  );
  const places = getStandsByTown(town);
  const recent = rides
    .filter((r) => r.source === "commuter" && r.status === "completed")
    .slice(0, 2);
  useEffect(() => {
    if (!cancelOpen && !helpOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCancelOpen(false);
        setHelpOpen(false);
      }
      if (event.key !== "Tab") return;
      const buttons = modalRef.current?.querySelectorAll<HTMLButtonElement>(
        "button:not(:disabled)",
      );
      if (!buttons?.length) return;
      const first = buttons[0],
        last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [cancelOpen, helpOpen]);
  const fare = selected === "auto" ? 95 : 125;
  const request = useMutation({
    mutationFn: async () => {
      const result = await requestRide({
        town,
        pickup: pickup.trim(),
        destination: destination.trim(),
        service: selected,
      });
      simulateDriverFound(result.id);
    },
  });
  const cancel = useMutation({
    mutationFn: async () => {
      if (!ride) return;
      await cancelRide(ride.id);
      stopSimulation(ride.id);
      setCancelOpen(false);
    },
  });
  const restart = () => {
    if (ride) setDismissed((ids) => [...ids, ride.id]);
    setStep("route");
    setRating(0);
    setError("");
  };
  const showPrices = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup.trim() || !destination.trim())
      return setError("Add both a pickup and a destination.");
    if (pickup.trim().toLowerCase() === destination.trim().toLowerCase())
      return setError("Choose a destination different from your pickup.");
    setError("");
    setStep("choose");
  };
  return (
    <main className="rider-app">
      <header className="rider-subnav">
        <div>
          <span className="rider-tab">
            <CarFront size={19} /> Ride
          </span>
          <Link to="/history">Activity</Link>
        </div>
        <button onClick={() => setHelpOpen(true)}>
          <ShieldCheck size={17} /> Help & safety
        </button>
      </header>
      <div className="rider-layout">
        <aside className="booking-panel">
          <div className="booking-content">
            {!ride ? (
              <>
                <div className="rider-location">
                  <MapPin size={14} />
                  <label className="sr-only" htmlFor="ride-town">
                    Town
                  </label>
                  <select
                    id="ride-town"
                    value={town}
                    onChange={(e) => {
                      setTown(e.target.value);
                      setPickup("");
                      setDestination("");
                      setStep("route");
                    }}
                  >
                    {ALL_TOWNS.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} />
                </div>
                {step === "route" ? (
                  <>
                    <p className="rider-kicker">
                      YOUR EVERYDAY, A LITTLE EASIER
                    </p>
                    <h1>
                      Where to<span>?</span>
                    </h1>
                    <p className="rider-intro">
                      A ride around the corner. A town full of possibilities.
                    </p>
                  </>
                ) : (
                  <>
                    <button
                      className="rider-back"
                      onClick={() => setStep("route")}
                    >
                      <ArrowLeft size={16} /> Edit your trip
                    </button>
                    <h1 className="smaller-title">Choose your ride</h1>
                    <p className="rider-intro">
                      A little comfort for wherever life takes you.
                    </p>
                  </>
                )}
                <form onSubmit={showPrices}>
                  <div className="route-inputs">
                    <div className="route-line" />
                    <label>
                      <span className="route-dot" />
                      <span className="sr-only">Pickup location</span>
                      <input
                        list="rider-places"
                        aria-label="Pickup location"
                        placeholder="Enter pickup location"
                        maxLength={120}
                        value={pickup}
                        onChange={(e) => {
                          setPickup(e.target.value);
                          setStep("route");
                        }}
                      />
                      <Navigation size={17} />
                    </label>
                    <label>
                      <span className="route-square" />
                      <span className="sr-only">Destination</span>
                      <input
                        list="rider-places"
                        aria-label="Destination"
                        placeholder="Where would you like to go?"
                        maxLength={120}
                        value={destination}
                        onChange={(e) => {
                          setDestination(e.target.value);
                          setStep("route");
                        }}
                      />
                      <button
                        type="button"
                        aria-label="Swap pickup and destination"
                        onClick={() => {
                          setPickup(destination);
                          setDestination(pickup);
                          setStep("route");
                        }}
                      >
                        <ArrowUpDown size={17} />
                      </button>
                    </label>
                  </div>
                  <datalist id="rider-places">
                    {places.map((p) => (
                      <option key={p.id} value={p.name} />
                    ))}
                  </datalist>
                  {error && (
                    <p className="rider-error" role="alert">
                      {error}
                    </p>
                  )}
                  {step === "route" && (
                    <>
                      <div className="rider-timing">
                        <Clock3 size={16} />
                        <span>Leave now</span>
                        <span className="timing-separator">·</span>
                        <UserRound size={16} />
                        <span>For me</span>
                      </div>
                      <button className="rider-primary" type="submit">
                        See prices <ArrowRight size={18} />
                      </button>
                    </>
                  )}
                </form>
                {step === "route" ? (
                  <>
                    <div className="rider-section-heading">
                      <h2>
                        {recent.length ? "Ride again" : "Popular around you"}
                      </h2>
                      <span>{town}</span>
                    </div>
                    <div className="place-list">
                      {(recent.length
                        ? recent.map((r) => ({ id: r.id, name: r.destination }))
                        : places.filter((p) => p.name !== pickup).slice(0, 3)
                      ).map((place) => (
                        <button
                          key={place.id}
                          onClick={() => setDestination(place.name)}
                        >
                          <span className="place-icon">
                            {recent.length ? (
                              <Clock3 size={18} />
                            ) : (
                              <MapPin size={18} />
                            )}
                          </span>
                          <span>
                            <strong>
                              {place.name.replace(/ Auto Stand$/, "")}
                            </strong>
                            <small>{town}, Kerala</small>
                          </span>
                          <ArrowRight size={15} />
                        </button>
                      ))}
                    </div>
                    <div className="local-promo">
                      <span>MADE FOR YOUR NEIGHBOURHOOD</span>
                      <h3>
                        Short trips.
                        <br />
                        Great connections.
                      </h3>
                      <p>Your local auto, one tap away.</p>
                      <div className="promo-auto">
                        <CarFront size={63} strokeWidth={1.4} />
                      </div>
                    </div>
                    <Link className="browse-stands" to="/stands">
                      Prefer your usual stand? <ArrowUpDown size={14} /> Browse
                      stands
                    </Link>
                  </>
                ) : (
                  <>
                    <div
                      className="ride-options"
                      role="radiogroup"
                      aria-label="Ride type"
                    >
                      {[
                        {
                          id: "auto" as const,
                          name: "Ryde Auto",
                          price: 95,
                          detail: "Easy, everyday rides",
                          eta: "3 min",
                        },
                        {
                          id: "comfort" as const,
                          name: "Ryde Comfort",
                          price: 125,
                          detail: "Extra room to settle in",
                          eta: "5 min",
                        },
                      ].map((option) => (
                        <button
                          key={option.id}
                          role="radio"
                          aria-checked={selected === option.id}
                          className={selected === option.id ? "selected" : ""}
                          onClick={() => setSelected(option.id)}
                        >
                          <span className="vehicle-icon">
                            <CarFront size={35} />
                          </span>
                          <span className="vehicle-details">
                            <strong>{option.name}</strong>
                            <small>{option.eta} away · 3 seats</small>
                            <span>{option.detail}</span>
                          </span>
                          <span className="ride-price">
                            ₹{option.price}
                            {selected === option.id && <Check size={14} />}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="payment-row">
                      <Banknote size={21} />
                      <div>
                        <strong>Cash</strong>
                        <small>Pay your driver at the end of your trip</small>
                      </div>
                    </div>
                    <button
                      className="rider-primary"
                      disabled={request.isPending}
                      onClick={() => request.mutate()}
                    >
                      {request.isPending
                        ? "Requesting your ride…"
                        : `Request ${selected === "auto" ? "Ryde Auto" : "Ryde Comfort"}`}
                      <span>₹{fare}</span>
                    </button>
                    <p className="fare-note">
                      Estimated fare for this route. No payment is taken here.
                    </p>
                  </>
                )}
              </>
            ) : (
              <>
                <p className="rider-kicker">
                  {ride.status === "completed"
                    ? "THANKS FOR RIDING WITH US"
                    : "YOUR RIDE"}
                </p>
                <h1 className="smaller-title" aria-live="polite">
                  {rideLabel(ride.status)}
                </h1>
                <p className="rider-intro">
                  {
                    {
                      requested: "Finding your next friendly face nearby.",
                      accepted: "Your driver is heading to your pickup point.",
                      arriving:
                        "Your driver is at the pickup. You’re ready to go.",
                      in_progress: "Sit back. You’re on your way.",
                      completed: "A little journey, a little more connected.",
                      cancelled:
                        "Plans change. Find another ride whenever you’re ready.",
                    }[ride.status]
                  }
                </p>
                {ride.status === "requested" && (
                  <div className="matching-animation">
                    <span />
                    <CarFront size={38} />
                    <p>Connecting you with a driver</p>
                  </div>
                )}
                {ride.driverName && (
                  <div className="rider-driver">
                    <span className="driver-avatar">
                      {ride.driverName.charAt(0)}
                    </span>
                    <div>
                      <strong>{ride.driverName}</strong>
                      <small>
                        <Star size={12} fill="currentColor" /> 4.9 · Your driver
                      </small>
                    </div>
                    <span className="driver-eta">
                      {ride.status === "accepted" ? "Arriving" : "RydeLy"}
                    </span>
                    <p>{ride.autoNumber?.replace(" DEMO", "")}</p>
                  </div>
                )}
                <div className="trip-receipt">
                  <div>
                    <span className="route-dot" />
                    <div>
                      <small>PICKUP</small>
                      <strong>{ride.pickup}</strong>
                    </div>
                  </div>
                  <div>
                    <span className="route-square" />
                    <div>
                      <small>DESTINATION</small>
                      <strong>{ride.destination}</strong>
                    </div>
                  </div>
                  <footer>
                    <span>
                      {ride.service === "comfort"
                        ? "Ryde Comfort"
                        : "Ryde Auto"}{" "}
                      · Cash
                    </span>
                    <strong>₹{ride.fare}</strong>
                  </footer>
                </div>
                {ride.status === "completed" && (
                  <div className="rider-rating">
                    <h2>How was your ride?</h2>
                    <div>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          aria-label={`Rate ${n} stars`}
                          aria-pressed={rating === n}
                          onClick={() => setRating(n)}
                        >
                          <Star
                            size={30}
                            fill={n <= rating ? "#ed7b35" : "none"}
                            color={n <= rating ? "#ed7b35" : "#bcb7b0"}
                          />
                        </button>
                      ))}
                    </div>
                    {rating > 0 && (
                      <p role="status">Thanks for your feedback.</p>
                    )}
                  </div>
                )}
                {active(ride) ? (
                  <>
                    <button
                      className="rider-secondary"
                      onClick={() => setHelpOpen(true)}
                    >
                      <ShieldCheck size={18} /> Trip support
                    </button>
                    <button
                      className="cancel-link"
                      onClick={() => setCancelOpen(true)}
                    >
                      Cancel ride
                    </button>
                  </>
                ) : (
                  <button className="rider-primary" onClick={restart}>
                    Book another ride <ArrowRight size={18} />
                  </button>
                )}
              </>
            )}
            {(request.error || cancel.error) && (
              <p className="rider-error" role="alert">
                {request.error?.message || cancel.error?.message}
              </p>
            )}
          </div>
          <div className="rider-panel-footer">
            <ShieldCheck size={15} />
            <span>Local rides. Familiar roads.</span>
            <small>Prototype · rides and fares are simulated</small>
          </div>
        </aside>
        <section className="rider-map-panel" aria-label="Trip map">
          <RiderMap
            town={ride?.town ?? town}
            pickup={ride?.pickup ?? pickup}
            destination={ride?.destination ?? destination}
            progress={ride?.progress ?? 0}
            zoom={zoom}
            showRoute={!!ride || step === "choose"}
          />
          <div className="map-location">
            <span className="live-dot" />
            <span>
              {ride ? rideLabel(ride.status) : `Explore ${town}`}
              <small>
                {ride
                  ? `${ride.pickup} → ${ride.destination}`
                  : "Your next ride starts here"}
              </small>
            </span>
          </div>
          <div className="map-legend">
            <span /> Pickup <i /> Destination
          </div>
          <div className="map-controls">
            <button
              aria-label="Zoom in"
              disabled={zoom >= 1.8}
              onClick={() => setZoom((z) => Math.min(1.8, z + 0.2))}
            >
              <Plus size={19} />
            </button>
            <button
              aria-label="Zoom out"
              disabled={zoom <= 1}
              onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
            >
              <Minus size={19} />
            </button>
            <button aria-label="Recenter map" onClick={() => setZoom(1)}>
              <Navigation size={18} />
            </button>
          </div>
          <span className="map-attribution">RydeLy · Illustrative map</span>
        </section>
      </div>
      {(cancelOpen || helpOpen) && (
        <div
          className="rider-modal-backdrop"
          onClick={() => {
            setCancelOpen(false);
            setHelpOpen(false);
          }}
        >
          <section
            ref={modalRef}
            className="rider-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rider-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              autoFocus
              className="modal-close"
              aria-label="Close dialog"
              onClick={() => {
                setCancelOpen(false);
                setHelpOpen(false);
              }}
            >
              <X size={20} />
            </button>
            <ShieldCheck size={30} />
            <h2 id="rider-dialog-title">
              {cancelOpen ? "Cancel this ride?" : "Here for your journey"}
            </h2>
            <p>
              {cancelOpen
                ? "Your current ride will end. You can request a new one at any time. There is no cancellation fee in this prototype."
                : "This is a working prototype: trips progress automatically, and no real driver is dispatched. Calls, emergency assistance and payments are not connected."}
            </p>
            {cancelOpen ? (
              <>
                <button
                  className="rider-primary"
                  disabled={cancel.isPending}
                  onClick={() => cancel.mutate()}
                >
                  Yes, cancel ride
                </button>
                <button
                  className="rider-secondary"
                  onClick={() => setCancelOpen(false)}
                >
                  Keep my ride
                </button>
              </>
            ) : (
              <button
                className="rider-primary"
                onClick={() => setHelpOpen(false)}
              >
                Got it
              </button>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
