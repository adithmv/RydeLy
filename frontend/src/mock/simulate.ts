import { getSnapshot, transition, updateDriverLocation } from "./rides";
import { findAvailableDriver } from "./api";
const timers = new Map<string, ReturnType<typeof setInterval>>();
export function stopSimulation(id: string) {
  clearInterval(timers.get(id));
  timers.delete(id);
}
export function simulateRideProgress(id: string) {
  if (timers.has(id)) return;
  let previous = "";
  let since = Date.now();
  const timer = setInterval(() => {
    const ride = getSnapshot().find((r) => r.id === id);
    if (!ride || ["completed", "cancelled"].includes(ride.status)) {
      stopSimulation(id);
      return;
    }
    if (previous !== ride.status) {
      previous = ride.status;
      since = Date.now();
    }
    const elapsed = Date.now() - since;
    if (ride.status === "requested" && elapsed >= 4000) {
      const d = findAvailableDriver(ride.town);
      transition(id, d ? "accepted" : "cancelled", d);
    } else if (ride.status === "accepted") {
      void updateDriverLocation(id, elapsed / 30000);
      if (elapsed >= 30000) transition(id, "arriving");
    } else if (ride.status === "arriving" && elapsed >= 5000)
      transition(id, "in_progress");
    else if (ride.status === "in_progress" && elapsed >= 10000)
      transition(id, "completed");
  }, 250);
  timers.set(id, timer);
}
export const simulateDriverFound = simulateRideProgress;
export const simulateDriverApproaching = simulateRideProgress;
