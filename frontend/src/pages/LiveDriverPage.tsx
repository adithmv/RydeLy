import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDriverProfile } from "@/lib/api";
import {
  startShift,
  extendShift,
  stopShift,
  getShiftStatus,
  type ShiftStatus,
} from "@/lib/api";
import {
  getRiderLocation,
  isActive,
  getRides,
  getOffers,
  acceptOffer,
  declineOffer,
  changeStatus,
  sendPosition,
  setPresence,
  statusLabel,
  type RideStatus,
} from "@/lib/live";
import { getQueryArray, findQueryItem } from "@/lib/queryUtils";
import { currentLocation, useLiveLocation } from "@/lib/useLiveLocation";
import LiveMap from "@/components/LiveMap";
import { 
  Clock, Plus, X, AlertTriangle, Pause, Play, MapPin, Locate, Wallet, 
  Bell, BellOff, CheckCircle, XCircle, AlertCircle 
} from "lucide-react";
import { registerFCMTokenForDriver, onFCMMessage, getStoredFCMToken } from "@/lib/firebase";
import "./live.css";

const SHIFT_DURATION_OPTIONS = [
  { label: "2 hours", minutes: 120 },
  { label: "4 hours", minutes: 240 },
  { label: "6 hours", minutes: 360 },
  { label: "8 hours", minutes: 480 },
];

const EXTEND_OPTIONS = [
  { label: "+2 hours", minutes: 120 },
  { label: "+3 hours", minutes: 180 },
  { label: "+4 hours", minutes: 240 },
];

function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return "0:00";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function LiveDriverPage() {
  const cache = useQueryClient();
  const [sharing, setSharing] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showExtendPrompt, setShowExtendPrompt] = useState(false);
  const [extendLoading, setExtendLoading] = useState(false);
  
  const [showRideRequestModal, setShowRideRequestModal] = useState(false);
  const [pendingRideRequest, setPendingRideRequest] = useState<{
    rideId: string;
    pickup: string;
    destination: string;
    fare: string;
    responseWindow: number;
    expiresAt: number;
  } | null>(null);
  const [countdown, setCountdown] = useState(0);

  const profile = useQuery({
    queryKey: ["driver-profile"],
    queryFn: getDriverProfile,
  });

  const rides = useQuery({
    queryKey: ["rides"],
    queryFn: getRides,
    refetchInterval: 3000,
  });

  const ride = findQueryItem(rides, isActive);
  const rideId = ride?.id;

  const shiftQuery = useQuery({
    queryKey: ["shift-status"],
    queryFn: getShiftStatus,
    refetchInterval: rideId ? 30000 : 10000,
    retry: 1,
  });

  const riderLocationQuery = useQuery({
    queryKey: ["rider-location", rideId],
    queryFn: () => getRiderLocation(rideId!),
    enabled: !!rideId && ["accepted", "arriving"].includes(ride?.status || ""),
    refetchInterval: 5000,
    retry: 1,
  });

  const shift = shiftQuery.data?.shift;
  const hasActiveShift = shiftQuery.data?.hasActiveShift ?? false;
  const timeRemaining = shift?.timeRemainingSeconds ?? 0;
  const showExtendPromptFromServer = shift?.showExtendPrompt ?? false;

  const riderLiveLocation = riderLocationQuery.data?.location && !riderLocationQuery.data?.stale
    ? riderLocationQuery.data.location
    : null;

  useEffect(() => {
    if (showExtendPromptFromServer && hasActiveShift && !rideId) {
      setShowExtendPrompt(true);
    }
  }, [showExtendPromptFromServer, hasActiveShift, rideId]);

  useEffect(() => {
    let mounted = true;
    let cleanupFn: (() => void) | null = null;
    
    const initFCM = async () => {
      const storedToken = getStoredFCMToken();
      if (!storedToken) {
        await registerFCMTokenForDriver();
      }
      
      const cleanup = await onFCMMessage((payload) => {
        if (!mounted) return;
        
        const data = payload.data;
        if (!data) return;
        
        if (data.type === "ride_request") {
          const responseWindow = parseInt(data.responseWindow || "30", 10);
          const expiresAt = Date.now() + responseWindow * 1000;
          
          setPendingRideRequest({
            rideId: data.rideId,
            pickup: data.pickup,
            destination: data.destination,
            fare: data.fare,
            responseWindow,
            expiresAt,
          });
          setShowRideRequestModal(true);
        } else if (data.type === "ride_taken") {
          if (pendingRideRequest?.rideId === data.rideId) {
            setShowRideRequestModal(false);
            setPendingRideRequest(null);
          }
        }
      });
      
      if (cleanup) {
        cleanupFn = cleanup;
      }
    };
    
    initFCM();
    
    return () => {
      mounted = false;
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, []);

  // Countdown timer for ride request modal
  useEffect(() => {
    if (!showRideRequestModal || !pendingRideRequest) {
      setCountdown(0);
      return;
    }
    
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((pendingRideRequest.expiresAt - Date.now()) / 1000));
      setCountdown(remaining);
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [showRideRequestModal, pendingRideRequest]);

  // Auto-dismiss modal when countdown hits 0
  useEffect(() => {
    if (showRideRequestModal && countdown <= 0) {
      setShowRideRequestModal(false);
      setPendingRideRequest(null);
    }
  }, [countdown, showRideRequestModal]);

  const gps = useLiveLocation(sharing && (hasActiveShift || !!ride));

  const offers = useQuery({
    queryKey: ["offers"],
    queryFn: getOffers,
    refetchInterval: 5000,
    enabled: hasActiveShift && sharing && !rideId,
  });

  const startShiftMutation = useMutation({
    mutationFn: (minutes: number) => startShift(minutes),
    onSuccess: () => {
      setShowDurationPicker(false);
      void cache.invalidateQueries({ queryKey: ["shift-status"] });
      void cache.invalidateQueries({ queryKey: ["offers"] });
    },
    onError: (e: Error) => { setError(e.message); },
  });

  const extendShiftMutation = useMutation({
    mutationFn: (minutes: number) => extendShift(minutes),
    onSuccess: () => {
      setShowExtendPrompt(false);
      setExtendLoading(false);
      void cache.invalidateQueries({ queryKey: ["shift-status"] });
    },
    onError: (e: Error) => {
      setExtendLoading(false);
      setError(e.message);
    },
  });

  const stopShiftMutation = useMutation({
    mutationFn: () => stopShift(),
    onSuccess: () => {
      setSharing(false);
      void cache.invalidateQueries({ queryKey: ["shift-status"] });
      void cache.invalidateQueries({ queryKey: ["offers"] });
    },
    onError: (e: Error) => { setError(e.message); },
  });

  const action = useMutation({
    mutationFn: async ({ id, command }: { id: string; command: string }) => {
      if (command === "accept") return acceptOffer(id);
      if (command === "decline") return declineOffer(id);
      return changeStatus(id, command as RideStatus, pin);
    },
    onSuccess: () => {
      setPin("");
      void cache.invalidateQueries({ queryKey: ["rides"] });
      void cache.invalidateQueries({ queryKey: ["offers"] });
    },
    onError: (e: Error) => { setError(e.message); },
  });

  useEffect(() => {
    if (!gps.position || gps.position.accuracy > 100) return;
    let mounted = true;
    const operation = rideId
      ? sendPosition(rideId, gps.position)
      : setPresence(true, gps.position);
    operation
      .then(() => {
        if (mounted) setError("");
      })
      .catch((e) => {
        if (mounted) setError(e.message);
      });
    return () => {
      mounted = false;
    };
  }, [gps.position, rideId]);

  const handleStartShift = async (minutes: number) => {
    try {
      const pos = await currentLocation();
      if (pos.accuracy > 100) {
        setError("Location accuracy too low. Enable GPS and try again.");
        return;
      }
      await startShiftMutation.mutateAsync(minutes);
      setSharing(true);
      await setPresence(true, pos);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start shift");
    }
  };

  const handleExtendShift = async (minutes: number) => {
    setExtendLoading(true);
    try {
      await extendShiftMutation.mutateAsync(minutes);
    } catch (e) {
    }
  };

  const handleStopShift = async () => {
    if (rideId && ride?.status !== "completed" && ride?.status !== "cancelled") {
      if (window.confirm("End shift after current ride completes?")) {
        await stopShiftMutation.mutateAsync();
      }
      return;
    }
    if (window.confirm("End shift now?")) {
      await stopShiftMutation.mutateAsync();
    }
  };

  const dismissExtendPrompt = () => {
    setShowExtendPrompt(false);
  };

  const renderShiftCard = () => {
    if (!hasActiveShift || !shift) return null;

    return (
      <div className="shift-status-card" style={hasActiveShift ? {} : { opacity: 0.7 }}>
        <div className="shift-header">
          <span className="shift-badge active">
            <Play size={12} /> Shift Active
          </span>
          <div className="shift-countdown" style={{ color: timeRemaining <= 15 * 60 ? "#ef4444" : "inherit" }}>
            <Clock size={18} /> {formatTimeRemaining(timeRemaining)}
          </div>
        </div>
        <div className="shift-progress">
          <div 
            className="shift-progress-bar" 
            style={{ 
              width: `${Math.max(0, Math.min(100, (timeRemaining / (shift.scheduledDurationMinutes * 60)) * 100))}%`,
              background: timeRemaining <= 15 * 60 ? "#ef4444" : "#263d31"
          }} 
        />
      </div>
      <div className="shift-meta">
        <span>Extensions used: {shift.extensionsUsed}/{shift.extensionsUsed + shift.extensionsRemaining}</span>
        {shift.extensionsUsed > 0 && shift.extensions.length > 0 && (
          <span>Last: +{shift.extensions[shift.extensions.length - 1].addedMinutes / 60}h</span>
        )}
      </div>

      <div className="shift-actions">
        {rideId && ride?.status !== "completed" && ride?.status !== "cancelled" ? (
          <button
            className="live-secondary"
            disabled={stopShiftMutation.isPending}
            onClick={handleStopShift}
          >
            <Pause size={14} /> End Shift After Ride
          </button>
        ) : (
          <button
            className="live-secondary"
            disabled={stopShiftMutation.isPending}
            onClick={handleStopShift}
          >
            <X size={14} /> End Shift
          </button>
        )}
      </div>
    </div>
  );
  };

  const renderNoShiftCard = () => {
    return (
      <div className="shift-status-card" style={{ opacity: 0.7 }}>
        <div className="shift-header">
          <span className="shift-badge inactive">
            <X size={12} /> No Active Shift
          </span>
        </div>
        <button
          className="live-primary"
          disabled={startShiftMutation.isPending}
          onClick={() => setShowDurationPicker(true)}
        >
          <Play size={14} /> Start Shift
        </button>
      </div>
    );
  };

  const renderRideView = () => {
    if (!ride) return null;
    return (
      <div>
        <h2>{statusLabel[ride.status]}</h2>
        <p>Rider: {ride.riderName}</p>
        <div className="live-receipt">
          <p>
            <small>PICKUP</small>
            {ride.pickup.label}
          </p>
          <p>
            <small>DESTINATION</small>
            {ride.destination.label}
          </p>
          <div>
            <span>{ride.distanceKm.toFixed(1)} km · Cash</span>
            <strong>₹{ride.fare.toFixed(2)}</strong>
          </div>
        </div>
        <label className="share-location">
          <input
            type="checkbox"
            checked={sharing}
            onChange={(e) => setSharing(e.target.checked)}
          />{" "}
          Share live driver location
        </label>
        {!sharing && (
          <p className="live-error">
            Enable location sharing to continue this ride.
          </p>
        )}
        {ride.status === "arriving" && (
          <label>
            Rider's trip PIN (6 digits)
            <input
              inputMode="numeric"
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              maxLength={6}
              placeholder="000000"
            />
          </label>
        )}
        <button
          className="live-primary"
          disabled={
            action.isPending ||
            !sharing ||
            !gps.position ||
            (ride.status === "arriving" && pin.length !== 6)
          }
          onClick={() =>
            action.mutate({
              id: ride.id,
              command: (
                {
                  accepted: "arriving",
                  arriving: "in_progress",
                  in_progress: "completed",
                } as Record<string, string>
              )[ride.status],
            })
        }
        >
          {
            (
              {
                accepted: "I've arrived",
                arriving: "Start trip",
                in_progress: "Complete trip",
              } as Record<string, string>
            )[ride.status]
          }
        </button>
        {ride.status !== "in_progress" && (
          <>
            <button
              className="live-secondary"
              disabled={action.isPending}
              onClick={() => {
                if (window.confirm("Cancel this ride?"))
                  action.mutate({ id: ride.id, command: "cancelled" });
              }}
            >
              Cancel ride
            </button>
            <p className="live-muted small">
              A fresh GPS fix near the stop is required. Enter the rider's PIN
              only when they are ready to start.
            </p>
          </>
        )}
      </div>
    );
  };

  const renderNoRideView = () => {
    return (
      <div>
        {!hasActiveShift && (
          <p className="live-muted">
            Start a shift to share your location and receive nearby requests.
          </p>
        )}
        {hasActiveShift && !sharing && (
          <p className="live-error">
            Enable location sharing to receive ride requests.
          </p>
        )}
        {getQueryArray(offers).map((offer) => (
          <section className="driver-offer" key={offer.id}>
            <small>
              {offer.service === "comfort" ? "Ryde Comfort" : "Ryde Auto"}
            </small>
            <h2>₹{offer.fare.toFixed(2)}</h2>
            <p>
              <strong>Pickup:</strong> {offer.pickup.label}
            </p>
            <p>
              <strong>To:</strong> {offer.destination.label}
            </p>
            <p>{offer.distanceKm.toFixed(1)} km</p>
            <button
              className="live-primary"
              disabled={action.isPending}
              onClick={() =>
                action.mutate({ id: offer.id, command: "accept" })
            }
            >
              Accept ride
            </button>
            <button
              className="live-link"
              disabled={action.isPending}
              onClick={() =>
                action.mutate({ id: offer.id, command: "decline" })
            }
            >
              Decline
            </button>
          </section>
        ))}
        {hasActiveShift && sharing && getQueryArray(offers).length === 0 && (
          <p>No nearby requests yet. New offers appear automatically.</p>
        )}
        <h2 className="mt-6">Recent trips</h2>
        {getQueryArray(rides)
          .filter((r) => !isActive(r))
          .slice(0, 5)
          .map((r) => (
            <p className="driver-history" key={r.id}>
              {r.destination.label}
              <small>
                {statusLabel[r.status]} · ₹
                {(r.finalFare ?? r.fare).toFixed(2)}
              </small>
            </p>
          ))}
      </div>
    );
  };

  return (
    <main className="live-app">
      <header className="live-subnav">
        <strong>Driver workspace</strong>
        <Link to="/driver/complaint">Report an issue</Link>
      </header>
      <div className="live-layout">
        <aside className="live-booking">
          <p className="live-eyebrow">YOUR DAY, YOUR JOURNEYS</p>
          <h1>{profile.data?.name || "Driver portal"}</h1>
          <p className="live-muted">
            {profile.data?.autoNumber} · {profile.data?.town}
          </p>

          {hasActiveShift ? (
            <div>
              {renderShiftCard()}
            </div>
          ) : (
            <div className="shift-status-card" style={{ opacity: 0.7 }}>
              <div className="shift-header">
                <span className="shift-badge inactive">
                  <X size={12} /> No Active Shift
                </span>
              </div>
              <button
                className="live-primary"
                disabled={startShiftMutation.isPending}
                onClick={() => setShowDurationPicker(true)}
              >
                <Play size={14} /> Start Shift
              </button>
            </div>
          )}

          {showDurationPicker && (
            <section className="driver-offer" style={{ marginTop: "16px" }}>
              <h3>Choose Shift Duration</h3>
              <div className="duration-options">
                {SHIFT_DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.minutes}
                    className="live-secondary"
                    onClick={() => handleStartShift(opt.minutes)}
                    disabled={startShiftMutation.isPending}
                  >
                    {opt.label}
                  </button>
                ))}
                <button
                  className="live-link"
                  onClick={() => setShowDurationPicker(false)}
                >
                  Cancel
                </button>
              </div>
            </section>
          )}

          {showExtendPrompt && hasActiveShift && (
            <section className="driver-offer" style={{ marginTop: "16px", borderColor: "#ef4444", background: "#fef2f2" }}>
              <div className="flex items-center gap-2" style={{ color: "#ef4444" }}>
                <AlertTriangle size={20} />
                <h3 style={{ margin: 0 }}>Shift Ending Soon</h3>
              </div>
              <p className="live-muted" style={{ margin: "8px 0" }}>
                Your shift ends in <strong>{formatTimeRemaining(timeRemaining)}</strong>. Extend to keep receiving rides?
              </p>
              <div className="duration-options">
                {EXTEND_OPTIONS.map((opt) => (
                  <button
                    key={opt.minutes}
                    className="live-primary"
                    onClick={() => handleExtendShift(opt.minutes)}
                    disabled={extendShiftMutation.isPending || extendLoading}
                    style={{ marginBottom: "8px" }}
                  >
                    {extendLoading && extendShiftMutation.variables === opt.minutes
                      ? "Extending..."
                      : opt.label}
                  </button>
                ))}
                <button
                  className="live-secondary"
                  onClick={dismissExtendPrompt}
                  disabled={extendLoading}
                >
                  Not now (shift will end)
                </button>
              </div>
            </section>
          )}

          {showRideRequestModal && pendingRideRequest && (
            <section className="driver-offer" style={{ 
              marginTop: "16px", 
              borderColor: "#2563eb", 
              background: "#eff6ff",
              animation: "slideIn 0.3s ease"
            }}>
              <div className="flex items-center gap-2" style={{ color: "#1d4ed8" }}>
                <Bell size={20} />
                <h3 style={{ margin: 0 }}>New Ride Request</h3>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-mono">
                  {countdown}s
                </span>
              </div>
              <p className="live-muted" style={{ margin: "8px 0" }}>
                <strong>₹{pendingRideRequest.fare}</strong> &mdash; 
                {pendingRideRequest.pickup} to {pendingRideRequest.destination}
              </p>
              <div className="duration-options" style={{ marginTop: "12px" }}>
                <button
                  className="live-primary"
                  onClick={() => {
                    acceptOffer(pendingRideRequest.rideId);
                    setShowRideRequestModal(false);
                    setPendingRideRequest(null);
                  }}
                  disabled={countdown <= 0}
                >
                  <CheckCircle size={16} /> Accept (₹{pendingRideRequest.fare})
                </button>
                <button
                  className="live-secondary"
                  onClick={() => {
                    declineOffer(pendingRideRequest.rideId);
                    setShowRideRequestModal(false);
                    setPendingRideRequest(null);
                  }}
                  disabled={false}
                >
                  <XCircle size={16} /> Decline
                </button>
              </div>
              {countdown <= 0 && (
                <p className="live-error" style={{ marginTop: "8px", fontSize: "12px" }}>
                  Offer expired. Response window was 25 seconds.
                </p>
              )}
            </section>
          )}

          {ride ? (
            <div>
              <h2>{statusLabel[ride.status]}</h2>
              <p>Rider: {ride.riderName}</p>
              <div className="live-receipt">
                <p>
                  <small>PICKUP</small>
                  {ride.pickup.label}
                </p>
                <p>
                  <small>DESTINATION</small>
                  {ride.destination.label}
                </p>
                <div>
                  <span>{ride.distanceKm.toFixed(1)} km · Cash</span>
                  <strong>₹{ride.fare.toFixed(2)}</strong>
                </div>
              </div>
              <label className="share-location">
                <input
                  type="checkbox"
                  checked={sharing}
                  onChange={(e) => setSharing(e.target.checked)}
                />{" "}
                Share live driver location
              </label>
              {!sharing && (
                <p className="live-error">
                  Enable location sharing to continue this ride.
                </p>
              )}
              {ride.status === "arriving" && (
                <label>
                  Rider's trip PIN (6 digits)
                  <input
                    inputMode="numeric"
                    value={pin}
                    onChange={(e) =>
                      setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    maxLength={6}
                    placeholder="000000"
                  />
                </label>
              )}
              <button
                className="live-primary"
                disabled={
                  action.isPending ||
                  !sharing ||
                  !gps.position ||
                  (ride.status === "arriving" && pin.length !== 6)
                }
                onClick={() =>
                  action.mutate({
                    id: ride.id,
                    command: (
                      {
                        accepted: "arriving",
                        arriving: "in_progress",
                        in_progress: "completed",
                      } as Record<string, string>
                    )[ride.status],
                  })
              }
              >
                {
                  (
                    {
                      accepted: "I've arrived",
                      arriving: "Start trip",
                      in_progress: "Complete trip",
                    } as Record<string, string>
                  )[ride.status]
                }
              </button>
              {ride.status !== "in_progress" && (
                <>
                  <button
                    className="live-secondary"
                    disabled={action.isPending}
                    onClick={() => {
                      if (window.confirm("Cancel this ride?"))
                        action.mutate({ id: ride.id, command: "cancelled" });
                    }}
                  >
                    Cancel ride
                  </button>
                  <p className="live-muted small">
                    A fresh GPS fix near the stop is required. Enter the rider's PIN
                    only when they are ready to start.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div>
              {!hasActiveShift && (
                <p className="live-muted">
                  Start a shift to share your location and receive nearby requests.
                </p>
              )}
              {hasActiveShift && !sharing && (
                <p className="live-error">
                  Enable location sharing to receive ride requests.
                </p>
              )}
              {offers.data?.map((offer) => (
                <section className="driver-offer" key={offer.id}>
                  <small>
                    {offer.service === "comfort" ? "Ryde Comfort" : "Ryde Auto"}
                  </small>
                  <h2>₹{offer.fare.toFixed(2)}</h2>
                  <p>
                    <strong>Pickup:</strong> {offer.pickup.label}
                  </p>
                  <p>
                    <strong>To:</strong> {offer.destination.label}
                  </p>
                  <p>{offer.distanceKm.toFixed(1)} km</p>
                  <button
                    className="live-primary"
                    disabled={action.isPending}
                    onClick={() =>
                      action.mutate({ id: offer.id, command: "accept" })
                  }
                  >
                    Accept ride
                  </button>
                  <button
                    className="live-link"
                    disabled={action.isPending}
                    onClick={() =>
                      action.mutate({ id: offer.id, command: "decline" })
                  }
                  >
                    Decline
                  </button>
                </section>
              ))}
              {hasActiveShift && sharing && offers.data?.length === 0 && (
                <p>No nearby requests yet. New offers appear automatically.</p>
              )}
              <h2 className="mt-6">Recent trips</h2>
              {rides.data
                ?.filter((r) => !isActive(r))
                .slice(0, 5)
                .map((r) => (
                  <p className="driver-history" key={r.id}>
                    {r.destination.label}
                    <small>
                      {statusLabel[r.status]} · ₹
                      {(r.finalFare ?? r.fare).toFixed(2)}
                    </small>
                  </p>
                ))}
            </div>
          )}

          <p className="live-muted small">
            Location updates are sent about every 5 seconds while this page is
            open. Closing it or disabling permission stops updates; your
            availability expires after 45 seconds without an accurate GPS
            update.
          </p>
          {[
            profile.error?.message,
            rides.error?.message,
            offers.error?.message,
            shiftQuery.error?.message,
            startShiftMutation.error?.message,
            extendShiftMutation.error?.message,
            stopShiftMutation.error?.message,
            action.error?.message,
            gps.error,
            error,
          ]
            .filter(Boolean)
            .map((e, i) => (
              <p key={i} role="alert" className="live-error">
                {e}
              </p>
            ))}
        </aside>
        <section className="live-map-panel">
          <LiveMap
            pickup={ride?.pickup}
            destination={ride?.destination}
            geometry={ride?.geometry}
            rider={riderLiveLocation ?? ride?.locations?.rider}
            driver={gps.position ?? ride?.locations?.driver}
            steps={ride?.steps}
            isNavigating={!!ride && ["accepted", "arriving", "in_progress"].includes(ride.status)}
            currentLeg={ride?.status === "accepted" || ride?.status === "arriving" ? "toPickup" : "toDestination"}
          />
        </section>
      </div>
    </main>
  );
}