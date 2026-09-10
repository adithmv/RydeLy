import { useSyncExternalStore } from "react";
import { subscribe, getSnapshot } from "./rides";
export function useRides() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
export const rideLabel = (status: string) =>
  ({
    requested: "Searching for a driver",
    accepted: "Driver on the way",
    arriving: "Driver has arrived",
    in_progress: "Trip in progress",
    completed: "Ride completed",
    cancelled: "Ride cancelled",
  })[status] ?? status;
