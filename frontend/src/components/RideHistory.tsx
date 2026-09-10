import { useState } from "react";
import { useRides, rideLabel } from "@/mock/useRides";
import { statuses } from "@/mock/rides";
export default function RideHistory({ admin = false }: { admin?: boolean }) {
  const rides = useRides();
  const [status, setStatus] = useState("");
  const [town, setTown] = useState("");
  const filtered = rides.filter(
    (r) =>
      (admin || r.source !== "driver") &&
      (!status || r.status === status) &&
      (!town || r.town === town),
  );
  return (
    <section className="demo-card mb-6">
      <h2>{admin ? "All demo rides" : "Ride history"}</h2>
      {admin && (
        <div className="flex gap-4 my-4 flex-wrap">
          <label>
            Status
            <select
              className="block border rounded p-2"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          <label>
            Town
            <select
              className="block border rounded p-2"
              value={town}
              onChange={(e) => setTown(e.target.value)}
            >
              <option value="">All towns</option>
              {[...new Set(rides.map((r) => r.town))].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr>
              {["Trip", "Town", "Status", "Fare"].map((h) => (
                <th key={h} className="p-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">
                  {r.pickup} → {r.destination}
                  <small className="block">
                    {new Date(r.createdAt).toLocaleString("en-IN")}
                  </small>
                </td>
                <td className="p-3">{r.town}</td>
                <td className="p-3">{rideLabel(r.status)}</td>
                <td className="p-3">₹{r.fare}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <p className="p-4">No rides match these filters.</p>
        )}
      </div>
    </section>
  );
}
