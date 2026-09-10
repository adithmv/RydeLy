import { ALL_STANDS } from "../data/index";
import type {
  AdminDriver,
  AdminUser,
  AdminReport,
  CallLog,
} from "../lib/backend";
export const stands = ALL_STANDS;
export const drivers: AdminDriver[] = stands.flatMap((stand, i) =>
  [0, 1].map((n) => ({
    id: `driver-${i}-${n}`,
    name: ["Sajith Kumar", "Nabeel P", "Anil K", "Ramesh V"][(i + n) % 4],
    phone: "0000000000",
    town: stand.town,
    stand: stand.name,
    autoNumber: `KL 13 DEMO ${String(i * 2 + n).padStart(4, "0")}`,
    status: (n === 0
      ? "verified"
      : i % 3 === 0
        ? "pending"
        : i % 3 === 1
          ? "banned"
          : "verified") as AdminDriver["status"],
    warningCount: 0,
    isAvailable: n === 0,
  })),
);
export const users: AdminUser[] = [
  {
    id: "commuter-demo",
    name: "Anjali M",
    phone: "0000000000",
    callCount: 3,
    reportCount: 0,
    joinedAt: new Date().toISOString(),
  },
];
export const reports: AdminReport[] = [
  {
    id: "report-demo",
    type: "driver",
    reporterPhone: "0000000000",
    targetName: drivers[0].name,
    reason: "Demo: driver arrived at the opposite entrance.",
    timestamp: new Date().toISOString(),
    resolved: false,
  },
];
export const calls: CallLog[] = [
  {
    id: "call-demo",
    driverName: drivers[0].name,
    stand: drivers[0].stand,
    town: drivers[0].town,
    timestamp: new Date().toISOString(),
    wasReported: false,
  },
];
export const announcements = [
  {
    message:
      "Welcome to the RydeLy demo. All rides, calls and reports are simulated.",
  },
];
