import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Place, Position } from "@/lib/live";
export default function LiveMap({
  pickup,
  destination,
  geometry,
  rider,
  driver,
  onPick,
}: {
  pickup?: Place;
  destination?: Place;
  geometry?: [number, number][];
  rider?: Position | null;
  driver?: Position;
  onPick?: (lat: number, lng: number) => void;
}) {
  const node = useRef<HTMLDivElement>(null),
    map = useRef<L.Map | null>(null),
    layers = useRef<L.LayerGroup | null>(null),
    fitKey = useRef("");
  const callback = useRef(onPick);
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    callback.current = onPick;
  }, [onPick]);
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
      m.remove();
      map.current = null;
      layers.current = null;
      fitKey.current = "";
    };
  }, []);
  useEffect(() => {
    if (!map.current || !layers.current) return;
    const layer = layers.current;
    layer.clearLayers();
    const marker = (
      p: { lat: number; lng: number },
      color: string,
      label: string,
    ) => {
      const tip = document.createElement("span");
      tip.textContent = label;
      L.circleMarker([p.lat, p.lng], {
        radius: 9,
        color: "#fff",
        weight: 3,
        fillColor: color,
        fillOpacity: 1,
      })
        .bindTooltip(tip)
        .addTo(layer);
    };
    if (pickup) marker(pickup, "#263d31", `Pickup: ${pickup.label}`);
    if (destination)
      marker(destination, "#ed7b35", `Destination: ${destination.label}`);
    if (rider)
      marker(
        rider,
        "#2563eb",
        `Rider · ${Math.max(0, Math.round(Date.now() / 1000 - (rider.updatedAt || rider.capturedAt)))}s ago`,
      );
    if (driver)
      marker(
        driver,
        "#087f5b",
        `Driver · ${Math.max(0, Math.round(Date.now() / 1000 - (driver.updatedAt || driver.capturedAt)))}s ago`,
      );
    if (geometry?.length)
      L.polyline(
        geometry.map(([lng, lat]) => [lat, lng]),
        { color: "#263d31", weight: 5 },
      ).addTo(layer);
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
      map.current.fitBounds(L.latLngBounds(points), {
        padding: [65, 65],
        maxZoom: 15,
      });
    }
  }, [pickup, destination, geometry, rider, driver]);
  return (
    <div className="live-map-wrap">
      <div
        ref={node}
        className="live-map"
        aria-label="Interactive street map"
      />
      {tileError && (
        <p className="map-warning" role="status">
          Map tiles could not load. Check your connection.
        </p>
      )}
      <div className="live-map-key">
        <span>● Pickup</span>
        <span style={{ color: "#ed7b35" }}>● Destination</span>
        <span style={{ color: "#2563eb" }}>● Rider</span>
        <span style={{ color: "#087f5b" }}>● Driver</span>
      </div>
    </div>
  );
}
