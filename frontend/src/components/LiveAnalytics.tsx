import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAnalytics, statusLabel, type RideStatus } from "@/lib/live";
export default function LiveAnalytics() {
  const [status, setStatus] = useState("");
  const query = useQuery({
    queryKey: ["ride-analytics"],
    queryFn: getAnalytics,
    refetchInterval: 15000,
  });
  const data = query.data;
  if (query.error) return <p role="alert">{query.error.message}</p>;
  if (!data) return <p>Loading ride analytics…</p>;
  return (
    <section className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ["Total rides", data.totalRides],
          ["Active rides", data.activeRides],
          ["Completed", data.completedRides],
          ["Cancellation rate", `${data.cancellationRate}%`],
          ["Completed fare value", `₹${data.completedFareTotal.toFixed(2)}`],
          ["Completed route km", data.distanceKm],
          [
            "Average match time",
            data.averageWaitMinutes === null
              ? "—"
              : `${data.averageWaitMinutes} min`,
          ],
          [
            "Average trip time",
            data.averageTripMinutes === null
              ? "—"
              : `${data.averageTripMinutes} min`,
          ],
          ["Average rating", data.averageRating ?? "—"],
        ].map(([label, value]) => (
          <div className="bg-white border rounded-xl p-4" key={label}>
            <small>{label}</small>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Completed fare value is the agreed cash fare, not verified payment
        revenue. Figures cover all stored rides; charts show up to 30 recorded
        days and the table the latest 200 rides.
      </p>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="demo-card">
          <h2 className="font-bold mb-3">Ride demand by day</h2>
          {data.daily.map((day) => (
            <div
              key={day.date}
              className="flex gap-3 items-center text-xs my-2"
            >
              <span>{day.date}</span>
              <meter
                className="flex-1"
                min={0}
                max={Math.max(1, ...data.daily.map((d) => d.rides))}
                value={day.rides}
              />
              <strong>{day.rides}</strong>
            </div>
          ))}
        </div>
        <div className="demo-card">
          <h2 className="font-bold mb-3">Popular ride types</h2>
          {Object.entries(data.byService).map(([service, total]) => (
            <p key={service}>
              {service}: <strong>{total}</strong>
            </p>
          ))}
        </div>
      </div>
      <label>
        Status filter{" "}
        <select
          className="border p-2 rounded"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {Object.entries(statusLabel).map(([key, label]) => (
            <option value={key} key={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              {[
                "Date",
                "Pickup / destination",
                "Status",
                "Distance",
                "Fare",
              ].map((label) => (
                <th className="p-3" key={label}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rides
              .filter((r) => !status || r.status === status)
              .map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">
                    {new Date(r.createdAt * 1000).toLocaleDateString("en-IN")}
                  </td>
                  <td className="p-3">
                    {r.pickup.label} → {r.destination.label}
                  </td>
                  <td className="p-3">{statusLabel[r.status as RideStatus]}</td>
                  <td className="p-3">{r.distanceKm.toFixed(1)} km</td>
                  <td className="p-3">₹{(r.finalFare ?? r.fare).toFixed(2)}</td>
                </tr>
              ))}
          </tbody>
        </table>
        {!data.rides.length && <p>No rides recorded yet.</p>}
      </div>
    </section>
  );
}
