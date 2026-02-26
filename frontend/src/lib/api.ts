const BASE = "http://127.0.0.1:5000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    credentials: "include",
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── AUTH ──────────────────────────────────────────────────
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
    `/commuter/drivers?town=${encodeURIComponent(town)}&stand=${encodeURIComponent(stand)}`
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

// ── ADMIN TYPES ───────────────────────────────────────────
export interface AdminDriver {
  id: string;
  name: string;
  phone: string;
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
