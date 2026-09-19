import assert from "node:assert/strict";
import * as api from "../src/mock/api";
import { stands } from "../src/mock/fixtures";
import {
  getSnapshot,
  getRideStatus,
  requestRide,
  acceptRide,
  updateRideStatus,
  cancelRide,
  statuses,
} from "../src/mock/rides";
import { simulateRideProgress, stopSimulation } from "../src/mock/simulate";

globalThis.fetch = async () => {
  throw new Error("Unexpected network request");
};
assert.deepEqual(
  new Set(getSnapshot().map((r) => r.status)),
  new Set(statuses),
);
for (const role of ["commuter", "driver", "admin"]) {
  assert.equal((await api.verifyToken(role)).role, role);
}
const stand = stands.find((s) => s.town === "Kannur")!;
const drivers = await api.getDrivers(stand.town, stand.id);
assert.ok(drivers.length);
assert.ok(
  drivers.every(
    (d) => d.town === stand.town && d.stand === stand.name && d.isVerified,
  ),
);
drivers[0].name = "Caller mutation";
assert.notEqual(
  (await api.getDrivers(stand.town, stand.id))[0].name,
  "Caller mutation",
);
await api.initiateCall(drivers[0].id);
await api.reportDriver(drivers[0].id, "Demo report");
assert.equal((await api.getCallHistory())[0].wasReported, true);
const report = (await api.adminGetReports())[0];
await api.adminResolveReport(report.id);
assert.equal((await api.adminGetReports())[0].resolved, true);
await api.postAnnouncement("Test announcement");
assert.equal((await api.getAnnouncements())[0].message, "Test announcement");
await api.registerDriver({
  name: "Demo Driver",
  phone: "0000000000",
  town: stand.town,
  standId: stand.id,
  autoNumber: "DEMO",
});
const registered = (await api.adminGetDrivers()).at(-1)!;
assert.equal(registered.status, "pending");
await api.adminVerifyDriver(registered.id, true);
await api.adminWarn("driver", registered.id);
assert.equal(
  (await api.adminGetDrivers()).find((d) => d.id === registered.id)
    ?.warningCount,
  1,
);
await api.adminRemove("driver", registered.id);
assert.ok(!(await api.adminGetDrivers()).find((d) => d.id === registered.id));
await api.setAvailability(true);
assert.equal((await api.getDriverProfile()).isAvailable, true);

const request = { town: stand.town, pickup: stand.name };
await assert.rejects(requestRide({ town: "", pickup: "" }));
const ride = await requestRide(request);
assert.equal(
  (await requestRide(request)).id,
  ride.id,
  "Duplicate requests reuse the active ride",
);
await assert.rejects(updateRideStatus(ride.id, "completed"));
await acceptRide(ride.id);
await updateRideStatus(ride.id, "arriving");
await updateRideStatus(ride.id, "in_progress");
await updateRideStatus(ride.id, "completed");
await assert.rejects(cancelRide(ride.id));
assert.equal((await getRideStatus(ride.id)).status, "completed");

// Exercise the real interval callback with a deterministic clock.
let now = 0;
const callbacks = new Map<number, () => void>();
let timerId = 0;
const originalNow = Date.now,
  originalSet = globalThis.setInterval,
  originalClear = globalThis.clearInterval;
Date.now = () => now;
globalThis.setInterval = ((callback: () => void) => {
  callbacks.set(++timerId, callback);
  return timerId;
}) as typeof setInterval;
globalThis.clearInterval = ((id: number) => {
  callbacks.delete(id);
}) as typeof clearInterval;
const advance = (milliseconds: number) => {
  for (let t = 0; t < milliseconds; t += 250) {
    now += 250;
    [...callbacks.values()].forEach((fn) => fn());
  }
};
try {
  const auto = await requestRide(request);
  simulateRideProgress(auto.id);
  simulateRideProgress(auto.id);
  assert.equal(callbacks.size, 1, "Only one simulation per ride");
  advance(5000);
  assert.equal((await getRideStatus(auto.id)).status, "accepted");
  advance(15000);
  assert.ok((await getRideStatus(auto.id)).progress > 0);
  advance(16000);
  assert.equal((await getRideStatus(auto.id)).status, "arriving");
  advance(6000);
  assert.equal((await getRideStatus(auto.id)).status, "in_progress");
  advance(11000);
  assert.equal((await getRideStatus(auto.id)).status, "completed");
  assert.equal(callbacks.size, 0);
  for (const phase of [
    "requested",
    "accepted",
    "arriving",
    "in_progress",
  ] as const) {
    const cancelled = await requestRide(request);
    if (phase !== "requested") await acceptRide(cancelled.id);
    if (["arriving", "in_progress"].includes(phase))
      await updateRideStatus(cancelled.id, "arriving");
    if (phase === "in_progress")
      await updateRideStatus(cancelled.id, "in_progress");
    simulateRideProgress(cancelled.id);
    await cancelRide(cancelled.id);
    advance(60000);
    assert.equal((await getRideStatus(cancelled.id)).status, "cancelled");
    assert.equal(callbacks.size, 0);
  }
  const missing = await requestRide({
    town: "Unknown town",
    pickup: "Station",
  });
  simulateRideProgress(missing.id);
  advance(6000);
  assert.equal((await getRideStatus(missing.id)).status, "cancelled");
  const manual = await requestRide({ ...request, source: "driver" });
  simulateRideProgress(manual.id);
  stopSimulation(manual.id);
  advance(60000);
  assert.equal((await getRideStatus(manual.id)).status, "requested");
  await cancelRide(manual.id);
} finally {
  Date.now = originalNow;
  globalThis.setInterval = originalSet;
  globalThis.clearInterval = originalClear;
}
console.log(
  "Demo checks passed: API mutations, fixtures, manual and timed lifecycle, duplicate requests, cancellation at every stage, unavailable drivers and timer cleanup.",
);

const comfort = await requestRide({
  town: stand.town,
  pickup: stand.name,
  destination: "Town centre",
  service: "comfort",
});
assert.equal(comfort.fare, 125);
assert.equal(comfort.service, "comfort");
await cancelRide(comfort.id);
const standard = await requestRide({
  town: stand.town,
  pickup: stand.name,
  service: "auto",
});
assert.equal(standard.fare, 95);
await cancelRide(standard.id);
console.log("Ride selection preserves the selected service and fare.");
