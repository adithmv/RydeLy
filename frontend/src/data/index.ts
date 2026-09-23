// ============================================================
// RydeLy — Unified Location Data Index
// Merges all districts: Kasaragod + Kannur
// Add new district files here as the app expands
// ============================================================

import { KASARAGOD_STANDS } from "./kasaragod";
import { KANNUR_STANDS } from "./kannur";

export type { Stand } from "./kasaragod"; // shared interface

// ── All stands across every district ─────────────────────────
export const ALL_STANDS = [...KASARAGOD_STANDS, ...KANNUR_STANDS];

// ── All unique districts ──────────────────────────────────────
export const ALL_DISTRICTS = [...new Set(ALL_STANDS.map(s => s.district))].sort();

// ── All unique towns (sorted) ─────────────────────────────────
export const ALL_TOWNS = [...new Set(ALL_STANDS.map(s => s.town))].sort();

// ── Get towns filtered by district ───────────────────────────
export function getTownsByDistrict(district: string): string[] {
  return [...new Set(
    ALL_STANDS.filter(s => s.district === district).map(s => s.town)
  )].sort();
}

// ── Get towns filtered by taluk ───────────────────────────────
export function getTownsByTaluk(taluk: string): string[] {
  return [...new Set(
    ALL_STANDS.filter(s => s.taluk === taluk).map(s => s.town)
  )].sort();
}

// ── Get stands for a specific town ───────────────────────────
export function getStandsByTown(town: string) {
  return ALL_STANDS.filter(s => s.town === town);
}

// ── Get all taluks for a district ────────────────────────────
export function getTaluksByDistrict(district: string): string[] {
  return [...new Set(
    ALL_STANDS.filter(s => s.district === district).map(s => s.taluk)
  )].sort();
}

// ── Format for backend /commuter/stands compatibility ─────────
// Returns the same shape the backend returns: { id, name, town }
export function getAllStandsFlat() {
  return ALL_STANDS.map(s => ({
    id: s.id,
    name: s.name,
    town: s.town,
    taluk: s.taluk,
    district: s.district,
  }));
}

// ── Default coordinates for Kerala towns (lat, lng) ───────────
const TOWN_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Kannur": { lat: 11.8745, lng: 75.3704 },
  "Kannur-1": { lat: 11.8745, lng: 75.3704 },
  "Kannur-2": { lat: 11.8700, lng: 75.3750 },
  "Thalassery": { lat: 11.7491, lng: 75.4890 },
  "Payyanur": { lat: 12.1028, lng: 75.2045 },
  "Taliparamba": { lat: 12.0437, lng: 75.3585 },
  "Mattannur": { lat: 11.9317, lng: 75.5786 },
  "Iritty": { lat: 11.9796, lng: 75.6669 },
  "Kuthuparamba": { lat: 11.8288, lng: 75.5684 },
  "Kasaragod": { lat: 12.4996, lng: 74.9869 },
  "Kasaragod Town": { lat: 12.4996, lng: 74.9869 },
  "Kanhangad": { lat: 12.3082, lng: 75.0906 },
  "Nileshwar": { lat: 12.2536, lng: 75.1321 },
  "Manjeshwar": { lat: 12.7161, lng: 74.8879 },
  "Uppala": { lat: 12.6897, lng: 74.9015 },
  "Cheruvathur": { lat: 12.2167, lng: 75.1667 },
  "Bekal": { lat: 12.3925, lng: 75.0322 },
  "Alakode": { lat: 12.1970, lng: 75.4789 },
  "Sreekandapuram": { lat: 12.0306, lng: 75.5186 },
  "Peringome": { lat: 12.2541, lng: 75.3142 },
  "Payyambalam": { lat: 11.8696, lng: 75.3536 },
  "Thavakkara": { lat: 11.8715, lng: 75.3684 },
  "Chovva": { lat: 11.8592, lng: 75.3941 },
  "Edakkad": { lat: 11.8152, lng: 75.4321 },
  "Dharmadam": { lat: 11.7765, lng: 75.4674 },
  "Azhikode": { lat: 11.9167, lng: 75.3167 },
  "Pappinisseri": { lat: 11.9500, lng: 75.3500 },
  "Valapattanam": { lat: 11.9056, lng: 75.3611 },
  "Chirakkal": { lat: 11.9000, lng: 75.3667 },
  "Pilathara": { lat: 12.1333, lng: 75.2500 },
  "Cherukkunnu": { lat: 11.9833, lng: 75.2833 },
  "Madayi": { lat: 12.0333, lng: 75.2500 },
  "Pazhayangadi": { lat: 12.0167, lng: 75.2667 },
  "Trikaripur": { lat: 12.1500, lng: 75.1500 },
  "Kumbla": { lat: 12.5833, lng: 74.9500 },
  "Mogral Puthur": { lat: 12.5333, lng: 74.9667 },
  "Badiadka": { lat: 12.5667, lng: 75.0667 },
  "Mulleria": { lat: 12.5500, lng: 75.1500 },
  "Bandadka": { lat: 12.4833, lng: 75.2667 },
  "Panathur": { lat: 12.4500, lng: 75.3333 },
  "Vellarikundu": { lat: 12.3333, lng: 75.3500 },
  "Chittarikkal": { lat: 12.2833, lng: 75.3333 },
  "Rajapuram": { lat: 12.4167, lng: 75.2500 },
  "Thana": { lat: 11.8720, lng: 75.3780 },
  "South Bazaar": { lat: 11.8680, lng: 75.3720 },
  "Mele Chovva": { lat: 11.8620, lng: 75.3900 },
  "Thazhe Chovva": { lat: 11.8550, lng: 75.3980 },
  "Puthiyatheru": { lat: 11.8950, lng: 75.3620 },
};

export function getTownCoordinates(town: string, district?: string): { lat: number; lng: number } {
  if (TOWN_COORDINATES[town]) {
    return TOWN_COORDINATES[town];
  }
  // Try partial match
  for (const [key, coords] of Object.entries(TOWN_COORDINATES)) {
    if (town.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(town.toLowerCase())) {
      return coords;
    }
  }
  // District defaults
  if (district?.toLowerCase() === "kasaragod") {
    return { lat: 12.4996, lng: 74.9869 };
  }
  return { lat: 11.8745, lng: 75.3704 }; // Default Kannur
}

export interface NearestLocationResult {
  lat: number;
  lng: number;
  name: string;
  town: string;
  district: string;
  label: string;
  distanceKm: number;
}

function calculateStraightDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function findNearestKnownLocation(lat: number, lng: number): NearestLocationResult {
  let closest: NearestLocationResult | null = null;
  let minDistance = Infinity;

  // Search all stands
  for (const stand of ALL_STANDS) {
    const coords = getTownCoordinates(stand.town, stand.district);
    const d = calculateStraightDistance(lat, lng, coords.lat, coords.lng);
    if (d < minDistance) {
      minDistance = d;
      closest = {
        lat: coords.lat,
        lng: coords.lng,
        name: stand.name,
        town: stand.town,
        district: stand.district,
        label: `${stand.name}, ${stand.town}`,
        distanceKm: d,
      };
    }
  }

  // Check towns
  for (const [townName, coords] of Object.entries(TOWN_COORDINATES)) {
    const d = calculateStraightDistance(lat, lng, coords.lat, coords.lng);
    if (d < minDistance) {
      minDistance = d;
      closest = {
        lat: coords.lat,
        lng: coords.lng,
        name: townName,
        town: townName,
        district:
          townName.includes("Kasaragod") ||
          ["Kanhangad", "Nileshwar", "Manjeshwar", "Uppala", "Bekal", "Trikaripur"].includes(townName)
            ? "Kasaragod"
            : "Kannur",
        label: `${townName}, Kerala`,
        distanceKm: d,
      };
    }
  }

  if (closest) {
    return closest;
  }

  return {
    lat: 11.8745,
    lng: 75.3704,
    name: "Kannur Central",
    town: "Kannur",
    district: "Kannur",
    label: "Kannur Central, Kerala",
    distanceKm: 0,
  };
}