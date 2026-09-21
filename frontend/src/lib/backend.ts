import { request } from "./http";
export async function verifyToken(idToken: string) {
  return request<{
    role: "commuter" | "driver" | "admin";
    firstLogin: boolean;
    uid: string;
  }>("/auth/verify-token", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
}

export async function setName(name: string) {
  return request<{ success: boolean }>("/auth/set-name", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function logoutApi() {
  return request<{ success: boolean }>("/auth/logout", { method: "POST" });
}

// ── COMMUTER ──────────────────────────────────────────────
export interface Driver {
  id: string;
  name: string;
  autoNumber: string;
  stand: string;
  town: string;
  isVerified: boolean;
  isAvailable: boolean;
}

export interface CallLog {
  id: string;
  driverName: string;
  stand: string;
  town: string;
  timestamp: string;
  wasReported: boolean;
}

export async function getDrivers(town: string, stand: string) {
  return request<Driver[]>(
    `/commuter/drivers?standId=${encodeURIComponent(stand)}&town=${encodeURIComponent(town)}`
  );
}

export async function initiateCall(driverId: string) {
  return request<{ phone: string }>("/commuter/call/initiate", {
    method: "POST",
    body: JSON.stringify({ driverId }),
  });
}

export async function reportDriver(driverId: string, reason: string) {
  return request<{ success: boolean }>("/commuter/report", {
    method: "POST",
    body: JSON.stringify({ driverId, reason }),
  });
}

export async function getCallHistory() {
  return request<CallLog[]>("/commuter/history");
}

// ── DRIVER ────────────────────────────────────────────────
export async function setAvailability(isAvailable: boolean) {
  return request<{ success: boolean }>("/driver/availability", {
    method: "PATCH",
    body: JSON.stringify({ isAvailable }),
  });
}

export async function registerDriver(data: {
  name: string;
  phone: string;
  town: string;
  standId: string;
  autoNumber: string;
  email?: string;
  emailVerified?: boolean;
}) {
  return request<{ success: boolean }>("/driver/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function reportCommuter(commuterPhone: string, reason: string) {
  return request<{ success: boolean }>("/driver/report", {
    method: "POST",
    body: JSON.stringify({ commuterPhone, reason }),
  });
}

// ── DRIVER EARNINGS ──────────────────────────────────────────
export interface DriverEarnings {
  rides: DriverEarningRide[];
  summary: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    allTime: number;
    rideCount: number;
    averageRating: number | null;
  };
}

export interface DriverEarningRide {
  rideId: string;
  fare: number;
  distanceKm: number;
  durationSeconds: number;
  rating: number | null;
  completedAt: number;
  pickup: { lat: number; lng: number; label: string };
  destination: { lat: number; lng: number; label: string };
}

export async function getDriverEarnings() {
  return request<DriverEarnings>("/driver/earnings");
}

// ── SHIFT MANAGEMENT ─────────────────────────────────────────
export interface Shift {
  startedAt: number;
  scheduledDurationMinutes: number;
  shiftEndsAt: number;
  extensions: { addedMinutes: number; addedAt: number }[];
  status: "active" | "ended" | "expired";
}

export interface ShiftStatus {
  hasActiveShift: boolean;
  shift: (Shift & {
    timeRemainingSeconds: number;
    showExtendPrompt: boolean;
    extensionsUsed: number;
    extensionsRemaining: number;
  }) | null;
}

export async function startShift(durationMinutes: number) {
  return request<{ success: boolean; shift: Shift }>("/driver/shift/start", {
    method: "POST",
    body: JSON.stringify({ durationMinutes }),
  });
}

export async function extendShift(additionalMinutes: number) {
  return request<{
    success: boolean;
    shiftEndsAt: number;
    extensions: { addedMinutes: number; addedAt: number }[];
    extensionsUsed: number;
    extensionsRemaining: number;
  }>("/driver/shift/extend", {
    method: "POST",
    body: JSON.stringify({ additionalMinutes }),
  });
}

export async function stopShift() {
  return request<{ success: boolean; message: string }>("/driver/shift/stop", {
    method: "POST",
  });
}

export async function getShiftStatus() {
  return request<ShiftStatus>("/driver/shift/status");
}

// ── ADMIN TYPES ───────────────────────────────────────────
export interface AdminDriver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  emailVerified?: boolean;
  town: string;
  stand: string;
  autoNumber: string;
  status: "verified" | "pending" | "banned";
  warningCount: number;
  isAvailable: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  phone: string;
  callCount: number;
  reportCount: number;
  joinedAt: string;
}

export interface AdminLog {
  id: string;
  commuterPhone: string;
  driverName: string;
  stand: string;
  town: string;
  timestamp: string;
}

export interface AdminReport {
  id: string;
  type: "driver" | "commuter";
  reporterPhone: string;
  targetName: string;
  reason: string;
  timestamp: string;
  resolved: boolean;
}

// ── ADMIN FUNCTIONS ───────────────────────────────────────
export async function adminGetDrivers() {
  return request<AdminDriver[]>("/admin/drivers");
}

export async function adminGetUsers() {
  return request<AdminUser[]>("/admin/users");
}

export async function adminGetLogs() {
  return request<AdminLog[]>("/admin/logs");
}

export async function adminGetReports() {
  return request<AdminReport[]>("/admin/reports");
}

export async function adminVerifyDriver(driverId: string, isVerified: boolean) {
  return request<{ success: boolean }>(`/admin/driver/${driverId}/verify`, {
    method: "PATCH",
    body: JSON.stringify({ isVerified }),
  });
}

export async function adminWarn(type: "driver" | "user", id: string) {
  return request<{ success: boolean }>(`/admin/warn/${type}/${id}`, {
    method: "PATCH",
  });
}

export async function adminRemove(type: "driver" | "user", id: string) {
  return request<{ success: boolean }>(`/admin/remove/${type}/${id}`, {
    method: "DELETE",
  });
}

export async function adminResolveReport(reportId: string) {
  return request<{ success: boolean }>(`/admin/reports/${reportId}/resolve`, {
    method: "PATCH",
  });
}


// ── ADMIN DRIVER EARNINGS ANALYTICS ─────────────────────────
export interface AdminDriverEarnings {
  period: string;
  activeDriverCount: number;
  totalFares: number;
  averageEarnings: number;
  topEarners: AdminDriverEarning[];
  lowestEarners: AdminDriverEarning[];
  allDrivers: AdminDriverEarning[];
}

export interface AdminDriverEarning {
  driverId: string;
  name: string;
  phone: string;
  autoNumber: string;
  town: string;
  earnings: number;
  rideCount: number;
}

export async function adminGetDriverEarnings(period: "today" | "week" | "month" | "allTime" = "allTime") {
  return request<AdminDriverEarnings>(`/admin/analytics/driver-earnings?period=${period}`);
}


export const getAnnouncements = () =>
  request<{ message: string }[]>('/commuter/announcements');
export const getDriverProfile = () => request<AdminDriver & { callsThisWeek: number }>("/driver/profile");
export const postAnnouncement = (message: string) => request<{ success: boolean }>("/admin/announcement", { method: "POST", body: JSON.stringify({ message }) });
