import { useRides, rideLabel } from "@/mock/useRides";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ALL_TOWNS, getStandsByTown } from "@/data/index";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getDriverProfile, setAvailability, getAnnouncements } from "@/lib/api";
import {
  requestRide,
  active,
  cancelRide,
  acceptRide,
  updateRideStatus,
  type Ride,
} from "@/mock/rides";
import {
  simulateDriverFound,
  simulateRideProgress,
  stopSimulation,
} from "@/mock/simulate";
import MockMap from "./MockMap";
function RideCard({
  ride,
  driverMode,
  onAgain,
}: {
  ride: Ride;
  driverMode: boolean;
  onAgain: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [phone, setPhone] = useState(false);
  const [auto, setAuto] = useState(false);
  const action = useMutation({
    mutationFn: async (command: string) => {
      if (command === "cancel") {
        stopSimulation(ride.id);
        await cancelRide(ride.id);
      } else if (command === "accept") await acceptRide(ride.id);
      else await updateRideStatus(ride.id, command as Ride["status"]);
    },
  });
  useEffect(() => {
    if (!driverMode || !auto) return;
    simulateRideProgress(ride.id);
    return () => stopSimulation(ride.id);
  }, [auto, driverMode, ride.id]);
  const [countdown, setCountdown] = useState(30);
  useEffect(() => {
    if (!driverMode || ride.status !== "requested") return;
    const t = setInterval(
      () => setCountdown((c) => (c > 0 ? c - 1 : 30)),
      1000,
    );
    return () => clearInterval(t);
  }, [driverMode, ride.status]);
  return (
    <section className="demo-card space-y-5">
      <p className="demo-eyebrow">
        {driverMode && ride.status === "requested"
          ? `INCOMING RIDE OFFER • ${countdown}s preview`
          : "YOUR DEMO RIDE"}
      </p>
      <h2 aria-live="polite">
        {driverMode && ride.status === "requested"
          ? "New ride request"
          : rideLabel(ride.status)}
      </h2>
      <MockMap town={ride.town} progress={ride.progress} />
      <div className="flex justify-between gap-4">
        <div>
          <strong>{ride.pickup}</strong>
          <p>
            → {ride.destination}, {ride.town}
          </p>
        </div>
        <strong>
          ₹{ride.fare}
          <small className="block font-normal">Estimate • 3.2 km</small>
        </strong>
      </div>
      {ride.status === "requested" && (
        <p>
          {driverMode
            ? "Anjali M is waiting at the pickup. The countdown is a visual preview."
            : "Matching a nearby auto. Your demo driver will be found in about 4 seconds."}
        </p>
      )}
      {!driverMode && ride.driverName && (
        <div className="rounded-xl bg-orange-50 p-4">
          <strong>◉ {ride.driverName}</strong>
          <p>{ride.autoNumber}</p>
          {ride.status === "accepted" && (
            <p>
              ETA {Math.max(1, Math.ceil((1 - ride.progress) * 30))} demo
              seconds
            </p>
          )}
          <button className="underline" onClick={() => setPhone(!phone)}>
            Call driver (demo)
          </button>
          {phone && (
            <p role="status">
              0000000000 — fictional number; no call is placed.
            </p>
          )}
        </div>
      )}
      {action.error && <p role="alert">{action.error.message}</p>}
      <div className="flex gap-3 flex-wrap">
        {driverMode && active(ride) && (
          <button
            className="demo-button"
            disabled={action.isPending}
            onClick={() =>
              action.mutate(
                (
                  {
                    requested: "accept",
                    accepted: "arriving",
                    arriving: "in_progress",
                    in_progress: "completed",
                  } as Record<string, string>
                )[ride.status],
              )
            }
          >
            {
              (
                {
                  requested: "Accept ride",
                  accepted: "Arrived",
                  arriving: "Start trip",
                  in_progress: "Complete trip",
                } as Record<string, string>
              )[ride.status]
            }
          </button>
        )}
        {active(ride) && (
          <button
            className="demo-secondary"
            disabled={action.isPending}
            onClick={() => action.mutate("cancel")}
          >
            {driverMode && ride.status === "requested"
              ? "Decline offer"
              : "Cancel ride"}
          </button>
        )}
        {!active(ride) && (
          <button className="demo-button" onClick={onAgain}>
            {driverMode ? "Find next offer" : "Request another ride"}
          </button>
        )}
      </div>
      {driverMode && active(ride) && ride.status !== "requested" && (
        <label className="flex gap-2">
          <input
            type="checkbox"
            checked={auto}
            onChange={(e) => setAuto(e.target.checked)}
          />{" "}
          Auto-play remaining trip
        </label>
      )}
      {ride.status === "completed" && (
        <div>
          <p>Thanks for riding with RydeLy. Demo fare: ₹{ride.fare}</p>
          {!driverMode && (
            <>
              <p>Rate your ride (preview only)</p>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  aria-label={`Rate ${n} stars`}
                  aria-pressed={rating === n}
                  className="text-3xl p-1"
                  style={{ color: n <= rating ? "#d86d15" : "#aaa" }}
                  onClick={() => setRating(n)}
                >
                  ★
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </section>
  );
}
export default function RideDemo({
  driverMode = false,
}: {
  driverMode?: boolean;
}) {
  const rides = useRides();
  const source = driverMode ? "driver" : "commuter";
  const [town, setTown] = useState(
    ALL_TOWNS.includes("Kannur") ? "Kannur" : ALL_TOWNS[0],
  );
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [dismissed, setDismissed] = useState<string[]>([]);
  const ride = rides.find(
    (r) => r.source === source && !dismissed.includes(r.id),
  );
  const profile = useQuery({
    queryKey: ["demo-driver-profile"],
    queryFn: getDriverProfile,
    enabled: driverMode,
  });
  const announcements = useQuery({
    queryKey: ["announcements"],
    queryFn: getAnnouncements,
  });
  const availability = useMutation({
    mutationFn: setAvailability,
    onSuccess: () => {
      void profile.refetch();
    },
  });
  const request = useMutation({
    mutationFn: async () => {
      const t = driverMode ? profile.data!.town : town;
      const r = await requestRide({
        town: t,
        pickup: driverMode
          ? profile.data!.stand
          : pickup || getStandsByTown(t)[0]?.name || "Railway station",
        destination,
        source,
      });
      if (!driverMode) simulateDriverFound(r.id);
    },
  });
  useEffect(() => {
    if (!driverMode || !profile.data?.isAvailable || ride || request.isPending)
      return;
    const t = setTimeout(() => request.mutate(), 2000);
    return () => clearTimeout(t);
  }, [driverMode, profile.data?.isAvailable, ride, request]);
  return (
    <div className="space-y-6">
      {driverMode && (
        <section className="demo-card">
          <p className="demo-eyebrow">DRIVER PORTAL</p>
          <h1>{profile.data?.name ?? "Your driver profile"}</h1>
          <p>
            {profile.data?.autoNumber} • {profile.data?.town}
          </p>
          <button
            className="demo-button"
            disabled={
              !profile.data ||
              availability.isPending ||
              (!!ride && active(ride))
            }
            onClick={() => availability.mutate(!profile.data?.isAvailable)}
          >
            {profile.data?.isAvailable ? "Go offline" : "Go online"}
          </button>
          <p>
            {profile.data?.isAvailable
              ? "Online • a sample offer appears in 2 seconds."
              : "Go online to receive a sample ride offer."}
          </p>
          {(profile.error || availability.error) && (
            <p role="alert">Unable to update driver profile. Please retry.</p>
          )}
        </section>
      )}
      {ride ? (
        <RideCard
          key={ride.id}
          ride={ride}
          driverMode={driverMode}
          onAgain={() => setDismissed((ids) => [...ids, ride.id])}
        />
      ) : (
        !driverMode && (
          <section className="demo-card">
            <p className="demo-eyebrow">LET’S GET YOU THERE</p>
            <h1>Where are you heading?</h1>
            <p>A local auto, a familiar face, a simpler journey.</p>
            <MockMap town={town} />
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                request.mutate();
              }}
            >
              <label className="demo-label">
                Town
                <select
                  value={town}
                  onChange={(e) => {
                    setTown(e.target.value);
                    setPickup("");
                  }}
                >
                  {ALL_TOWNS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="demo-label">
                Pickup point
                <select
                  value={pickup || getStandsByTown(town)[0]?.name}
                  onChange={(e) => setPickup(e.target.value)}
                >
                  {getStandsByTown(town).map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="demo-label">
                Destination (optional)
                <input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Town centre"
                  maxLength={100}
                />
              </label>
              <button className="demo-button" disabled={request.isPending}>
                {request.isPending ? "Requesting…" : "Find a driver →"}
              </button>
            </form>
          </section>
        )
      )}
      {request.error && <p role="alert">{request.error.message}</p>}
      {announcements.data?.map((a, i) => (
        <p key={i} className="text-sm text-muted-foreground">
          {a.message}
        </p>
      ))}
      <div className="flex gap-5 flex-wrap">
        {driverMode ? (
          <Link to="/driver/complaint" className="underline">
            Report a commuter
          </Link>
        ) : (
          <>
            <Link to="/stands" className="underline">
              Browse auto stands instead
            </Link>
            <Link to="/history" className="underline">
              Ride & call history
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
