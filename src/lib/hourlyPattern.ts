import { ZoneData } from "@/types/steplog";

const BASE_PATTERNS: Record<string, number[]> = {
  food:    [0,0,0,0,0,0,0,.05,.15,.25,.40,.70,.95,.90,.55,.35,.30,.40,.80,.85,.50,.25,.10,.02],
  study:   [0,0,0,0,0,0,0,.05,.20,.45,.60,.65,.55,.70,.85,.90,.88,.80,.65,.45,.30,.15,.05,.01],
  sport:   [0,0,0,0,0,0,0,.10,.30,.50,.45,.40,.60,.50,.45,.55,.70,.80,.75,.60,.40,.20,.10,.02],
  service: [0,0,0,0,0,0,0,0,.10,.30,.55,.70,.80,.75,.65,.60,.55,.45,.30,.15,.05,.01,0,0],
  outdoor: [0,0,0,0,0,0,0,.05,.15,.30,.50,.65,.70,.75,.80,.85,.75,.65,.50,.35,.20,.10,.03,.01],
};

export function getHourlyPattern(zone: ZoneData): number[] {
  const base = zone.currentOccupancy / zone.capacity;
  const pat  = BASE_PATTERNS[zone.category] ?? BASE_PATTERNS.service;
  const hour = new Date().getHours();
  const scale = pat[hour] > 0.05 ? base / pat[hour] : 1;
  return pat.map(v => Math.min(1, v * scale));
}

/** Hour with lowest occupancy in daytime window (8–20h) */
export function getBestHour(pattern: number[]): number {
  const slice = pattern.slice(8, 21);
  return slice.indexOf(Math.min(...slice)) + 8;
}

/** Hour with highest occupancy in daytime window (8–20h) */
export function getPeakHour(pattern: number[]): number {
  const slice = pattern.slice(8, 21);
  return slice.indexOf(Math.max(...slice)) + 8;
}
