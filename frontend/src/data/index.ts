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