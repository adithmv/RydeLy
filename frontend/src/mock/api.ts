import * as fixtures from "./fixtures";
import type { AdminDriver } from "../lib/backend";
export type Role = "commuter" | "driver" | "admin";
const db = structuredClone({
  drivers: fixtures.drivers,
  users: fixtures.users,
  reports: fixtures.reports,
  calls: fixtures.calls,
  announcements: fixtures.announcements,
});
db.drivers[0].isAvailable = false;
const ok = () => Promise.resolve({ success: true });
const copy = <T>(value: T): Promise<T> =>
  Promise.resolve(structuredClone(value));
const driver = (id = fixtures.drivers[0].id) => {
  const d = db.drivers.find((d) => d.id === id);
  if (!d) throw new Error("Driver not found");
  return d;
};
export async function verifyToken(idToken: string) {
  return {
    role: (["driver", "admin"].includes(idToken)
      ? idToken
      : "commuter") as Role,
    firstLogin: false,
    uid: "commuter-demo",
  };
}
export async function setName(name: string) {
  db.users[0].name = name;
  return ok();
}
export const logoutApi = ok;
export async function getDrivers(town: string, stand: string) {
  const location = fixtures.stands.find(
    (s) => s.id === stand || s.name === stand,
  );
  return copy(
    db.drivers
      .filter(
        (d) =>
          (!town || d.town === town) &&
          (!stand || d.stand === (location?.name ?? stand)) &&
          d.status === "verified",
      )
      .map((d) => ({ ...d, isVerified: true })),
  );
}
export async function initiateCall(driverId: string) {
  const d = driver(driverId);
  db.calls.unshift({
    id: crypto.randomUUID(),
    driverName: d.name,
    stand: d.stand,
    town: d.town,
    timestamp: new Date().toISOString(),
    wasReported: false,
  });
  return { phone: "0000000000 (demo only)" };
}
export async function reportDriver(driverId: string, reason: string) {
  const d = driver(driverId);
  db.calls
    .filter((c) => c.driverName === d.name)
    .forEach((c) => {
      c.wasReported = true;
    });
  db.reports.unshift({
    id: crypto.randomUUID(),
    type: "driver",
    reporterPhone: "0000000000",
    targetName: d.name,
    reason,
    timestamp: new Date().toISOString(),
    resolved: false,
  });
  return ok();
}
export const getCallHistory = () => copy(db.calls);
export async function setAvailability(isAvailable: boolean) {
  driver().isAvailable = isAvailable;
  return ok();
}
export const toggleDriverOnline = setAvailability;
export const getDriverProfile = () =>
  copy({ ...driver(), callsThisWeek: db.calls.length });
export async function registerDriver(data: {
  name: string;
  phone: string;
  town: string;
  standId: string;
  autoNumber: string;
}) {
  db.drivers.push({
    ...data,
    id: crypto.randomUUID(),
    stand:
      fixtures.stands.find((s) => s.id === data.standId)?.name ?? data.standId,
    status: "pending",
    warningCount: 0,
    isAvailable: false,
  });
  return ok();
}
export async function reportCommuter(commuterPhone: string, reason: string) {
  db.reports.unshift({
    id: crypto.randomUUID(),
    type: "commuter",
    reporterPhone: "0000000000",
    targetName: commuterPhone,
    reason,
    timestamp: new Date().toISOString(),
    resolved: false,
  });
  return ok();
}
export const adminGetDrivers = () => copy(db.drivers);
export const adminGetUsers = () => copy(db.users);
export const adminGetLogs = () =>
  copy(db.calls.map((c) => ({ ...c, commuterPhone: "0000000000" })));
export const adminGetReports = () => copy(db.reports);
export async function adminVerifyDriver(id: string, verified: boolean) {
  driver(id).status = verified ? "verified" : "pending";
  return ok();
}
export async function adminWarn(type: "driver" | "user", id: string) {
  if (type === "driver") driver(id).warningCount++;
  else {
    const u = db.users.find((u) => u.id === id);
    if (u) u.reportCount++;
  }
  return ok();
}
export async function adminRemove(type: "driver" | "user", id: string) {
  if (type === "driver") db.drivers = db.drivers.filter((d) => d.id !== id);
  else db.users = db.users.filter((u) => u.id !== id);
  return ok();
}
export async function adminResolveReport(id: string) {
  const r = db.reports.find((r) => r.id === id);
  if (r) r.resolved = true;
  return ok();
}
export const getAnnouncements = () => copy(db.announcements);
export async function postAnnouncement(message: string) {
  db.announcements.unshift({ message });
  return ok();
}
export const findAvailableDriver = (town: string): AdminDriver | undefined =>
  db.drivers.find(
    (d) => d.town === town && d.status === "verified" && d.isAvailable,
  );
export {
  requestRide,
  getRideStatus,
  acceptRide,
  updateRideStatus,
  cancelRide,
  updateDriverLocation,
} from "./rides";
