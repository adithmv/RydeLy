import { useQuery } from "@tanstack/react-query";
import { getRides, statusLabel } from "@/lib/live";
export default function LiveRideHistory() {
  const query = useQuery({ queryKey: ["rides"], queryFn: getRides });
  return (
    <section className="demo-card mb-6">
      <h2>Your rides</h2>
      {query.isPending && <p>Loading trips…</p>}
      {query.error && <p role="alert">{query.error.message}</p>}
      {query.data?.length === 0 && <p>No rides yet.</p>}
      {query.data?.map((ride) => (
        <article className="border-b py-4" key={ride.id}>
          <p className="font-semibold">
            {ride.pickup.label} → {ride.destination.label}
          </p>
          <p>
            {statusLabel[ride.status]} · {ride.distanceKm.toFixed(1)} km · ₹
            {(ride.finalFare ?? ride.fare).toFixed(2)}
          </p>
          <small>
            {new Date(ride.createdAt * 1000).toLocaleString("en-IN")}
          </small>
        </article>
      ))}
    </section>
  );
}
