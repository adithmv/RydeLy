import { request } from "./http";
export interface Point {
  lat: number;
  lng: number;
}
export interface Place extends Point {
  label: string;
  source?: "list" | "map" | "gps";
}
export interface Position extends Point {
  accuracy: number;
  capturedAt: number;
  updatedAt?: number;
}
export type RideStatus =
  | "requested"
  | "accepted"
  | "arriving"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "unmatched";
export interface Quote {
  id: string;
  pickup: Place;
  destination: Place;
  service: "auto" | "comfort";
  fare: number;  // Deprecated: use minimumFare instead
  minimumFare: number;
  maximumFare: number;
  distanceKm: number;
  durationSeconds: number;
  geometry: [number, number][];
  expiresAt: number;
  tariff: {
    base: number;
    includedKm: number;
    perKm: number;
    multiplier: number;
  };
  steps?: NavigationStep[];
}
export interface LiveRide extends Quote {
  status: RideStatus;
  createdAt: number;
  updatedAt: number;
  driverId?: string;
  driverName?: string;
  autoNumber?: string;
  riderName: string;
  startPin?: string;
  locations?: { rider?: Position; driver?: Position };
  riderLiveLocation?: Position & { stale?: boolean; lastUpdate?: number };
  driverLiveLocation?: Position & { stale?: boolean; lastUpdate?: number };
  rating?: number;
  finalFare?: number;
  chosenFare?: number;
  steps?: NavigationStep[];
}
export interface Identity {
  uid: string;
  role: "commuter" | "driver" | "admin";
  name: string;
  phone: string;
  email?: string;
  driverId?: string;
  authProvider?: "phone" | "email";
}
const post = <T>(path: string, body: unknown = {}) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body) });
export const getIdentity = () => request<Identity>("/auth/me");
export const loginToken = (idToken: string, mode?: "rider" | "driver") =>
  post<{ success: boolean }>("/auth/verify-token", { idToken, mode });
export const searchPlaces = (q: string) =>
  request<Place[]>(`/rides/places?q=${encodeURIComponent(q)}`);
export const quoteRide = (pickup: Place, destination: Place, service: string) =>
  post<Quote>("/rides/quote", { pickup, destination, service });
export const bookRide = (quoteId: string, requestKey: string, chosenFare?: number) =>
  post<LiveRide>("/rides", { quoteId, requestKey, chosenFare });
export const getRides = () => request<LiveRide[]>("/rides");
export const getOffers = () => request<LiveRide[]>("/rides/offers");
export const getPresence = () =>
  request<{ online: boolean }>("/rides/presence");
export const setPresence = (online: boolean, position?: Position) =>
  post("/rides/presence", { online, ...position });
export const sendPosition = (id: string, position: Position) =>
  post(`/rides/${id}/location`, position);
export const acceptOffer = (id: string) =>
  post<LiveRide>(`/rides/${id}/accept`);
export const declineOffer = (id: string) => post(`/rides/${id}/decline`);
export const changeStatus = (id: string, status: RideStatus, pin?: string) =>
  post<LiveRide>(`/rides/${id}/status`, { status, pin });
export const rateRide = (id: string, rating: number) =>
  post(`/rides/${id}/rating`, { rating });
export const getRiderLocation = (id: string) =>
  request<{ location: (Position & { stale?: boolean; lastUpdate?: number }) | null; stale: boolean; lastUpdate?: number; accuracy?: number }>(`/rides/${id}/rider-location`);

export interface BroadcastStatus {
  status: "not_started" | "searching" | "expanded" | "matched" | "unmatched";
  elapsed: number;
  notifiedCount: number;
  expansionIn: number;
  timeoutIn: number;
}

export const getBroadcastStatus = (id: string) => request<BroadcastStatus>(`/rides/${id}/broadcast-status`);

export const retryRide = (id: string) =>
  request<{ pickup: Place; destination: Place; service: string; message: string }>(`/rides/${id}/retry`, { method: "POST" });

export const isActive = (ride: LiveRide) =>
  !["completed", "cancelled", "unmatched"].includes(ride.status);
export const statusLabel: Record<RideStatus, string> = {
  requested: "Finding a driver",
  accepted: "Driver on the way",
  arriving: "Your driver has arrived",
  in_progress: "On your way",
  completed: "Ride completed",
  cancelled: "Ride cancelled",
  unmatched: "No drivers available",
};
export interface Analytics {
  totalRides: number;
  completedRides: number;
  activeRides: number;
  cancellationRate: number;
  completedFareTotal: number;
  distanceKm: number;
  averageWaitMinutes: number | null;
  averageTripMinutes: number | null;
  averageRating: number | null;
  byStatus: Record<string, number>;
  byService: Record<string, number>;
  daily: { date: string; rides: number }[];
  rides: LiveRide[];
}
export const getAnalytics = () => request<Analytics>("/rides/analytics");

export interface NavigationStep {
  instruction: string;
  distance: number;      // meters
  duration: number;      // seconds
  type: number;
  name: string;
  wayPoints: [number, number];  // indices into geometry array
}