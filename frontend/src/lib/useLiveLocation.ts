import { useEffect, useState } from "react";
import type { Position } from "./live";
export function currentLocation(): Promise<Position> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation)
      return reject(
        new Error("This browser does not support location sharing."),
      );
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: Math.min(Math.max(p.coords.accuracy || 20, 5), 50),
          capturedAt: p.timestamp ? (p.timestamp / 1000) : (Date.now() / 1000),
        }),
      (e) =>
        reject(
          new Error(
            e.code === 1
              ? "Location permission was denied. Enable it in your browser to share your position."
              : "Could not get a fresh GPS fix. Try near a window or outdoors.",
          ),
        ),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}
export function useLiveLocation(enabled: boolean) {
  const [position, setPosition] = useState<Position | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    if (!enabled) return;
    let mounted = true,
      pending = false;
    const tick = async () => {
      if (pending) return;
      pending = true;
      try {
        const p = await currentLocation();
        if (mounted) {
          setPosition(p);
          setError(
            p.accuracy > 5000
              ? "GPS accuracy is low. Location will be shared once GPS connects."
              : "",
          );
        }
      } catch (e) {
        if (mounted)
          setError(e instanceof Error ? e.message : "Location unavailable");
      } finally {
        pending = false;
      }
    };
    void tick();
    const timer = setInterval(() => void tick(), 5000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [enabled]);
  return { position: enabled ? position : null, error: enabled ? error : "" };
}
