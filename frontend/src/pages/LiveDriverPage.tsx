import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDriverProfile } from "@/lib/api";
import {
  acceptOffer,
  changeStatus,
  declineOffer,
  getOffers,
  getRides,
  isActive,
  sendPosition,
  setPresence,
  statusLabel,
  type RideStatus,
} from "@/lib/live";
import { currentLocation, useLiveLocation } from "@/lib/useLiveLocation";
import LiveMap from "@/components/LiveMap";
import "./live.css";
export default function LiveDriverPage() {
  const cache = useQueryClient();
  const [online, setOnline] = useState(false),
    [sharing, setSharing] = useState(false),
    [pin, setPin] = useState(""),
    [error, setError] = useState("");
  const profile = useQuery({
    queryKey: ["driver-profile"],
    queryFn: getDriverProfile,
  });
  const rides = useQuery({
    queryKey: ["rides"],
    queryFn: getRides,
    refetchInterval: 3000,
  });
  const ride = rides.data?.find(isActive);
  const rideId = ride?.id;
  const gps = useLiveLocation(sharing && (online || !!ride));
  const offers = useQuery({
    queryKey: ["offers"],
    queryFn: getOffers,
    refetchInterval: 5000,
    enabled: online && sharing && !ride,
  });
  const availability = useMutation({
    mutationFn: async () => {
      if (online) {
        await setPresence(false);
        setOnline(false);
        setSharing(false);
      } else {
        const pos = await currentLocation();
        await setPresence(true, pos);
        setOnline(true);
        setSharing(true);
      }
    },
    onSuccess: () => void cache.invalidateQueries({ queryKey: ["offers"] }),
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
          {ride ? (
            <>
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
                  Rider’s trip PIN
                  <input
                    inputMode="numeric"
                    value={pin}
                    onChange={(e) =>
                      setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    maxLength={4}
                  />
                </label>
              )}
              <button
                className="live-primary"
                disabled={
                  action.isPending ||
                  !sharing ||
                  !gps.position ||
                  (ride.status === "arriving" && pin.length !== 4)
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
                      accepted: "I’ve arrived",
                      arriving: "Start trip",
                      in_progress: "Complete trip",
                    } as Record<string, string>
                  )[ride.status]
                }
              </button>
              {ride.status !== "in_progress" && (
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
              )}
              <p className="live-muted small">
                A fresh GPS fix near the stop is required. Enter the rider’s PIN
                only when they are ready to start.
              </p>
            </>
          ) : (
            <>
              <button
                className="live-primary"
                disabled={availability.isPending}
                onClick={() => availability.mutate()}
              >
                {availability.isPending
                  ? "Updating…"
                  : online
                    ? "Go offline"
                    : "Go online"}
              </button>
              <p className="live-muted">
                {online
                  ? "Looking for nearby ride requests. Keep this page open and location enabled."
                  : "Go online to share your location and receive nearby requests."}
              </p>
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
              {online && offers.data?.length === 0 && (
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
            </>
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
            availability.error?.message,
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
            rider={ride?.locations?.rider}
            driver={gps.position ?? ride?.locations?.driver}
          />
        </section>
      </div>
    </main>
  );
}
