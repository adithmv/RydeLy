import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Place, Position, NavigationStep } from "@/lib/live";
import { Volume2, VolumeX, Navigation, RefreshCw, MapPin, Locate, Clock } from "lucide-react";

interface LiveMapProps {
  pickup?: Place;
  destination?: Place;
  geometry?: [number, number][];
  rider?: Position | null;
  driver?: Position;
  steps?: NavigationStep[];
  onPick?: (lat: number, lng: number) => void;
  isNavigating?: boolean;
  currentLeg?: "toPickup" | "toDestination";
}

const STEP_TYPE_LABELS: Record<number, string> = {
  0: "Continue straight",
  1: "Turn right",
  2: "Turn left",
  3: "Turn sharp right",
  4: "Turn sharp left",
  5: "Turn slight right",
  6: "Turn slight left",
  7: "U-turn",
  8: "Roundabout",
  9: "Exit roundabout",
  10: "Merge",
  11: "Fork",
  12: "On ramp",
  13: "Off ramp",
  14: "End of road",
};

export default function LiveMap({
  pickup,
  destination,
  geometry,
  rider,
  driver,
  steps,
  onPick,
  isNavigating = false,
  currentLeg = "toPickup",
}: LiveMapProps) {
  const node = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layers = useRef<L.LayerGroup | null>(null);
  const fitKey = useRef("");
  const callback = useRef(onPick);
  const driverMarker = useRef<L.Marker | null>(null);
  const routeLayer = useRef<L.Polyline | null>(null);
  const nextStepMarker = useRef<L.Marker | null>(null);
  const [tileError, setTileError] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [navigationPanelOpen, setNavigationPanelOpen] = useState(isNavigating && !!steps && steps.length > 0);
  const [rerouteCount, setRerouteCount] = useState(0);
  const lastSpokenStepRef = useRef(-1);
  const rerouteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    callback.current = onPick;
  }, [onPick]);

  // Initialize map
  useEffect(() => {
    if (!node.current) return;
    const m = L.map(node.current, { zoomControl: true }).setView(
      [11.8745, 75.3704],
      13,
    );
    map.current = m;
    const tiles = L.tileLayer(
      import.meta.env.VITE_MAP_TILE_URL ||
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    ).addTo(m);
    tiles.on("tileerror", () => setTileError(true));
    tiles.on("load", () => setTileError(false));
    layers.current = L.layerGroup().addTo(m);
    m.on("click", (e: L.LeafletMouseEvent) =>
      callback.current?.(e.latlng.lat, e.latlng.lng),
    );
    const resize = new ResizeObserver(() => m.invalidateSize());
    resize.observe(node.current);
    return () => {
      resize.disconnect();
      if (rerouteTimeoutRef.current) clearTimeout(rerouteTimeoutRef.current);
      m.remove();
      map.current = null;
      layers.current = null;
      fitKey.current = "";
    };
  }, []);

  // Speech synthesis for turn-by-turn
  const speak = useCallback((text: string) => {
    if (!ttsEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  }, [ttsEnabled]);

  // Calculate distance from driver to a route point
  const getDistanceToPoint = useCallback((driverPos: Position, point: [number, number]): number => {
    const R = 6371000; // Earth radius in meters
    const lat1 = driverPos.lat * Math.PI / 180;
    const lat2 = point[1] * Math.PI / 180;
    const dLat = (point[1] - driverPos.lat) * Math.PI / 180;
    const dLon = (point[0] - driverPos.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }, []);

  // Find closest point on route geometry to driver
  const findClosestPointOnRoute = useCallback((driverPos: Position, geometry: [number, number][]): number => {
    let minDist = Infinity;
    let closestIndex = 0;
    for (let i = 0; i < geometry.length; i++) {
      const dist = getDistanceToPoint(driverPos, geometry[i]);
      if (dist < minDist) {
        minDist = dist;
        closestIndex = i;
      }
    }
    return closestIndex;
  }, [getDistanceToPoint]);

  // Update navigation step based on driver position
  useEffect(() => {
    if (!isNavigating || !steps || steps.length === 0 || !driver || !geometry || geometry.length === 0) {
      return;
    }

    // Find closest point on route
    const closestIdx = findClosestPointOnRoute(driver, geometry);
    
    // Find which step we're on based on wayPoints
    let newStepIndex = 0;
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepEndIdx = step.wayPoints[1];
      if (closestIdx < stepEndIdx) {
        newStepIndex = i;
        break;
      }
      newStepIndex = i;
    }

    // Clamp to valid range
    newStepIndex = Math.max(0, Math.min(newStepIndex, steps.length - 1));

    if (newStepIndex !== currentStepIndex) {
      setCurrentStepIndex(newStepIndex);
    }

    // Speak new step if we haven't spoken it yet
    if (newStepIndex > lastSpokenStepRef.current && newStepIndex < steps.length) {
      const step = steps[newStepIndex];
      const distanceKm = (step.distance / 1000).toFixed(1);
      const instruction = step.instruction || STEP_TYPE_LABELS[step.type] || "Continue";
      speak(`In ${distanceKm} kilometers, ${instruction.toLowerCase()}${step.name ? ` onto ${step.name}` : ""}`);
      lastSpokenStepRef.current = newStepIndex;
    }
  }, [driver, geometry, steps, isNavigating, currentStepIndex, findClosestPointOnRoute, speak]);

  // Re-route logic: check if driver deviates significantly from route
  useEffect(() => {
    if (!isNavigating || !driver || !geometry || geometry.length === 0 || rerouteCount >= 3) {
      return;
    }

    const checkDeviation = () => {
      if (!driver || !geometry) return;
      
      const closestIdx = findClosestPointOnRoute(driver, geometry);
      const closestPoint = geometry[closestIdx];
      const dist = getDistanceToPoint(driver, closestPoint);
      
      // If more than 100m off route, trigger re-route
      if (dist > 100) {
        if (rerouteTimeoutRef.current) clearTimeout(rerouteTimeoutRef.current);
        rerouteTimeoutRef.current = setTimeout(() => {
          // In a real app, this would call the backend to get a new route
          // For now, we just increment the counter and show a notification
          setRerouteCount((c) => c + 1);
          speak("Route updated. Recalculating directions.");
        }, 5000); // Wait 5 seconds before re-routing
      }
    };

    const interval = setInterval(checkDeviation, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [driver, geometry, isNavigating, rerouteCount, findClosestPointOnRoute, getDistanceToPoint, speak]);

  // Render map layers
  useEffect(() => {
    if (!map.current || !layers.current) return;
    const layer = layers.current;
    layer.clearLayers();

    const createMarker = (
      p: { lat: number; lng: number },
      color: string,
      label: string,
      icon?: L.DivIcon,
    ) => {
      const tip = document.createElement("span");
      tip.textContent = label;
      const marker = icon
        ? L.marker([p.lat, p.lng], { icon }).bindTooltip(tip).addTo(layer)
        : L.circleMarker([p.lat, p.lng], {
            radius: 9,
            color: "#fff",
            weight: 3,
            fillColor: color,
            fillOpacity: 1,
          }).bindTooltip(tip).addTo(layer);
      return marker;
    };

    if (pickup) createMarker(pickup, "#263d31", `Pickup: ${pickup.label}`);
    if (destination) createMarker(destination, "#ed7b35", `Destination: ${destination.label}`);
    
    if (rider) {
      const age = Math.max(0, Math.round(Date.now() / 1000 - (rider.updatedAt || rider.capturedAt)));
      createMarker(rider, "#2563eb", `Rider · ${age}s ago`);
    }
    
    if (driver) {
      const age = Math.max(0, Math.round(Date.now() / 1000 - (driver.updatedAt || driver.capturedAt)));
      // Use a car icon for driver when navigating
      if (isNavigating) {
        const carIcon = L.divIcon({
          className: "driver-car-marker",
          html: `<div style="font-size: 24px; transform: rotate(${getBearing(driver)}deg);">🚗</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        if (driverMarker.current) {
          driverMarker.current.setLatLng([driver.lat, driver.lng]);
        } else {
          driverMarker.current = createMarker(driver, "#087f5b", `Driver · ${age}s ago`, carIcon) as L.Marker;
        }
      } else {
        createMarker(driver, "#087f5b", `Driver · ${age}s ago`);
      }
    }

    // Draw route polyline
    if (geometry?.length) {
      if (routeLayer.current) {
        routeLayer.current.setLatLngs(geometry.map(([lng, lat]) => [lat, lng]));
      } else {
        routeLayer.current = L.polyline(
          geometry.map(([lng, lat]) => [lat, lng]),
          { color: "#263d31", weight: 5, opacity: 0.8 },
        ).addTo(layer);
      }
      
      // Highlight remaining portion of route from current position
      if (isNavigating && driver && steps && steps.length > 0 && currentStepIndex < steps.length) {
        const currentStep = steps[currentStepIndex];
        const stepEndIdx = currentStep.wayPoints[1];
        if (stepEndIdx < geometry.length) {
          const remainingGeometry = geometry.slice(stepEndIdx);
          L.polyline(
            remainingGeometry.map(([lng, lat]) => [lat, lng]),
            { color: "#ed7b35", weight: 5, opacity: 1, dashArray: "10, 10" },
          ).addTo(layer);
        }
      }
    }

    // Next step marker
    if (isNavigating && steps && steps.length > 0 && currentStepIndex < steps.length && geometry) {
      const currentStep = steps[currentStepIndex];
      const stepEndIdx = currentStep.wayPoints[1];
      if (stepEndIdx < geometry.length) {
        const nextPoint = geometry[stepEndIdx];
        const nextMarkerIcon = L.divIcon({
          className: "next-step-marker",
          html: `<div style="font-size: 20px;">📍</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        if (nextStepMarker.current) {
          nextStepMarker.current.setLatLng([nextPoint[1], nextPoint[0]]);
        } else {
          nextStepMarker.current = createMarker(
            { lat: nextPoint[1], lng: nextPoint[0] },
            "#ed7b35",
            `Next: ${currentStep.instruction || STEP_TYPE_LABELS[currentStep.type] || "Turn"}`,
            nextMarkerIcon
          ) as L.Marker;
        }
      }
    }

    // Auto-fit bounds on first load or when pickup/destination changes
    const key = JSON.stringify([
      pickup?.lat,
      pickup?.lng,
      destination?.lat,
      destination?.lng,
    ]);
    if (fitKey.current !== key && (pickup || destination)) {
      fitKey.current = key;
      const points = [pickup, destination]
        .filter((p): p is Place => !!p)
        .map((p) => L.latLng(p.lat, p.lng));
      if (points.length > 0) {
        map.current.fitBounds(L.latLngBounds(points), {
          padding: [65, 65],
          maxZoom: 15,
        });
      }
    }
  }, [pickup, destination, geometry, rider, driver, steps, currentStepIndex, isNavigating, findClosestPointOnRoute]);

  // Calculate bearing for car icon rotation
  function getBearing(pos: Position): number {
    if (!geometry || geometry.length < 2) return 0;
    const idx = findClosestPointOnRoute(pos, geometry);
    if (idx >= geometry.length - 1) return 0;
    const current = geometry[idx];
    const next = geometry[idx + 1];
    const dLng = (next[0] - current[0]) * Math.PI / 180;
    const lat1 = current[1] * Math.PI / 180;
    const lat2 = next[1] * Math.PI / 180;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }

  // Format distance for display
  function formatDistance(meters: number): string {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${Math.round(meters)} m`;
  }

  // Format duration for display
  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}:${secs.toString().padStart(2, "0")}`;
    return `${secs}s`;
  }

  // Toggle TTS
  const toggleTts = () => {
    setTtsEnabled((prev) => !prev);
    if (!ttsEnabled) {
      speak("Voice guidance enabled");
    }
  };

  // Toggle navigation panel
  const toggleNavigationPanel = () => {
    setNavigationPanelOpen((prev) => !prev);
  };

  // Current step info
  const currentStep = steps && currentStepIndex < (steps?.length || 0) ? steps[currentStepIndex] : null;
  const nextStep = steps && currentStepIndex + 1 < (steps?.length || 0) ? steps[currentStepIndex + 1] : null;

  return (
    <div className="live-map-wrap">
      <div
        ref={node}
        className="live-map"
        aria-label="Interactive street map with turn-by-turn navigation"
      />
      {tileError && (
        <p className="map-warning" role="status">
          Map tiles could not load. Check your connection.
        </p>
      )}

      {/* Navigation Panel */}
      {isNavigating && steps && steps.length > 0 && (
        <div className={`navigation-panel ${navigationPanelOpen ? "open" : "collapsed"}`}>
          <button
            className="navigation-toggle"
            onClick={toggleNavigationPanel}
            aria-label={navigationPanelOpen ? "Collapse navigation" : "Expand navigation"}
          >
            <Navigation size={20} />
          </button>

          {navigationPanelOpen && (
            <div className="navigation-content">
              <div className="navigation-header">
                <h4>{currentLeg === "toPickup" ? "Navigate to Pickup" : "Navigate to Destination"}</h4>
                <label className="tts-toggle">
                  <input
                    type="checkbox"
                    checked={ttsEnabled}
                    onChange={toggleTts}
                  />
                  <span>{ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />} Voice</span>
                </label>
              </div>

              {currentStep && (
                <div className="current-step">
                  <div className="step-instruction">
                    <span className="step-type">{currentStep.instruction || STEP_TYPE_LABELS[currentStep.type] || "Continue"}</span>
                    {currentStep.name && <span className="step-name">onto {currentStep.name}</span>}
                  </div>
                  <div className="step-meta">
                    <span><MapPin size={14} /> {formatDistance(currentStep.distance)}</span>
                    <span><Clock size={14} /> {formatDuration(currentStep.duration)}</span>
                  </div>
                </div>
              )}

              {nextStep && (
                <div className="next-step">
                  <span className="next-label">Then</span>
                  <div className="step-instruction">
                    <span className="step-type">{nextStep.instruction || STEP_TYPE_LABELS[nextStep.type] || "Continue"}</span>
                    {nextStep.name && <span className="step-name">onto {nextStep.name}</span>}
                  </div>
                  <div className="step-meta">
                    <span>{formatDistance(nextStep.distance)}</span>
                    <span>{formatDuration(nextStep.duration)}</span>
                  </div>
                </div>
              )}

              {rerouteCount > 0 && (
                <div className="reroute-notice">
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Route updated {rerouteCount} time{rerouteCount > 1 ? "s" : ""}</span>
                </div>
              )}

              <button className="close-panel" onClick={() => setNavigationPanelOpen(false)}>
                <span>Close</span>
              </button>
            </div>
          )}
        </div>
      )}

      <div className="live-map-key">
        <span>● Pickup</span>
        <span style={{ color: "#ed7b35" }}>● Destination</span>
        <span style={{ color: "#2563eb" }}>● Rider</span>
        <span style={{ color: "#087f5b" }}>● Driver</span>
        {isNavigating && <span style={{ color: "#ed7b35" }}>● Next Turn</span>}
      </div>

      {isNavigating && !navigationPanelOpen && (
        <button className="floating-nav-toggle" onClick={() => setNavigationPanelOpen(true)}>
          <Navigation size={24} />
          <span className="nav-toggle-text">Navigation</span>
        </button>
      )}
    </div>
  );
}