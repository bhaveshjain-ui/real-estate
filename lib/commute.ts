import { Locality, PUNE_LOCALITIES } from "./types";

/**
 * Approximate drive times between Pune localities.
 *
 * This is NOT live traffic data - there is no paid maps API call here by
 * design (see the brief). Each locality is pinned to a rough (x, y) position
 * in km reflecting its real position in Pune relative to its neighbours, and
 * the "drive time" between any two localities is derived from that straight-
 * line distance plus a fixed city-traffic overhead. This keeps the whole
 * matrix internally consistent (symmetric, respects the triangle inequality)
 * without hand-typing ~190 pairwise numbers that would inevitably disagree
 * with each other.
 *
 * Always label these numbers as approximate in the UI.
 */
const LOCALITY_COORDS_KM: Record<Locality, [number, number]> = {
  Hinjewadi: [-13, 3],
  Wakad: [-10, 4],
  Baner: [-7, 3],
  Balewadi: [-8, 2],
  "Pimple Saudagar": [-9, 6],
  Bavdhan: [-9, -1],
  Aundh: [-6, 4],
  Pashan: [-8, 1],
  Kothrud: [-5, -3],
  "Karve Nagar": [-4, -5],
  Warje: [-7, -5],
  Deccan: [-1, 0],
  Shivajinagar: [0, 1],
  "Koregaon Park": [3, 1],
  "Kalyani Nagar": [4, 3],
  "Viman Nagar": [6, 4],
  Yerwada: [2, 3],
  Kharadi: [8, 3],
  Hadapsar: [5, -4],
  Magarpatta: [4, -5],
};

const BASE_OVERHEAD_MIN = 8; // parking, signals, local roads near either end
const MIN_PER_KM = 4; // ~15 km/h effective city speed in peak traffic

function roundTo5(minutes: number): number {
  return Math.max(5, Math.round(minutes / 5) * 5);
}

function computeMinutes(a: Locality, b: Locality): number {
  if (a === b) return 5;
  const [ax, ay] = LOCALITY_COORDS_KM[a];
  const [bx, by] = LOCALITY_COORDS_KM[b];
  const distanceKm = Math.hypot(ax - bx, ay - by);
  return roundTo5(BASE_OVERHEAD_MIN + distanceKm * MIN_PER_KM);
}

let matrix: Record<string, number> | null = null;

function key(a: Locality, b: Locality): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function getMatrix(): Record<string, number> {
  if (matrix) return matrix;
  matrix = {};
  for (const a of PUNE_LOCALITIES) {
    for (const b of PUNE_LOCALITIES) {
      const k = key(a, b);
      if (!(k in matrix)) matrix[k] = computeMinutes(a, b);
    }
  }
  return matrix;
}

/** Approximate one-way drive time in minutes between two Pune localities. */
export function getCommuteMinutes(a: Locality, b: Locality): number {
  return getMatrix()[key(a, b)];
}
