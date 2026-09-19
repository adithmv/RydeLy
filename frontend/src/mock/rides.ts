import { drivers } from "./fixtures";
export const statuses = [
  "requested",
  "accepted",
  "arriving",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type RideStatus = (typeof statuses)[number];
export interface Ride {
  id: string;
  town: string;
  pickup: string;
  destination: string;
  status: RideStatus;
  driverId?: string;
  driverName?: string;
  autoNumber?: string;
  fare: number;
  service?: "auto" | "comfort";
  progress: number;
  createdAt: string;
  source: "commuter" | "driver" | "fixture";
}
let rides: Ride[] = statuses.map((status, i) => ({
  id: `sample-${i}`,
  town: i % 2 ? "Kannur" : "Kasaragod",
  pickup: "Railway station",
  destination: "Town centre",
  status,
  driverName: "Sajith Kumar",
  autoNumber: "KL 13 DEMO 001",
  fare: 80 + i * 10,
  progress: 0,
  createdAt: new Date(Date.now() - 86400000).toISOString(),
  source: "fixture",
}));
const listeners = new Set<() => void>();
export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const getSnapshot = () => rides;
const emit = () => listeners.forEach((fn) => fn());
export const active = (r: Ride) =>
  !["completed", "cancelled"].includes(r.status);
export async function requestRide(data: {
  town: string;
  pickup: string;
  destination?: string;
  service?: "auto" | "comfort";
  source?: "commuter" | "driver";
}) {
  const source = data.source ?? "commuter";
  const existing = rides.find((r) => r.source === source && active(r));
  if (existing) return structuredClone(existing);
  if (!data.town || !data.pickup.trim())
    throw new Error("Choose a town and pickup location.");
  const ride: Ride = {
    ...data,
    source,
    destination: data.destination?.trim() || "Town centre",
    id: crypto.randomUUID(),
    status: "requested",
    fare: data.service === "comfort" ? 125 : 95,
    progress: 0,
    createdAt: new Date().toISOString(),
  };
  rides = [ride, ...rides];
  emit();
  return structuredClone(ride);
}
export async function getRideStatus(id: string) {
  const r = rides.find((r) => r.id === id);
  if (!r) throw new Error("Ride not found");
  return structuredClone(r);
}
export function transition(
  id: string,
  status: RideStatus,
  assignment?: { id: string; name: string; autoNumber: string },
) {
  const r = rides.find((r) => r.id === id);
  if (!r) throw new Error("Ride not found");
  const next: Partial<Record<RideStatus, RideStatus>> = {
    requested: "accepted",
    accepted: "arriving",
    arriving: "in_progress",
    in_progress: "completed",
  };
  if (!(status === "cancelled" && active(r)) && next[r.status] !== status)
    throw new Error(`Cannot change ${r.status} to ${status}`);
  rides = rides.map((item) =>
    item.id === id
      ? {
          ...item,
          status,
          ...(["arriving", "in_progress", "completed"].includes(status)
            ? { progress: 1 }
            : {}),
          ...(assignment
            ? {
                driverId: assignment.id,
                driverName: assignment.name,
                autoNumber: assignment.autoNumber,
              }
            : {}),
        }
      : item,
  );
  emit();
}
export async function acceptRide(id: string, driver = drivers[0]) {
  transition(id, "accepted", driver);
}
export async function updateRideStatus(id: string, status: RideStatus) {
  transition(id, status);
}
export async function cancelRide(id: string) {
  transition(id, "cancelled");
}
export async function updateDriverLocation(id: string, progress: number) {
  rides = rides.map((r) =>
    r.id === id && r.status === "accepted"
      ? { ...r, progress: Math.max(0, Math.min(1, progress)) }
      : r,
  );
  emit();
}
