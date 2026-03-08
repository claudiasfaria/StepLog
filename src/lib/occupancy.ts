import { ZoneData } from "@/types/steplog";

export function getOccupancyPercent(zone: ZoneData): number {
  return Math.round((zone.currentOccupancy / zone.capacity) * 100);
}

export function getOccupancyColor(pct: number): string {
  if (pct < 30) return "hsl(145,100%,50%)";
  if (pct < 50) return "hsl(85,100%,50%)";
  if (pct < 70) return "hsl(35,100%,55%)";
  if (pct < 85) return "hsl(15,100%,55%)";
  return "hsl(0,100%,60%)";
}

export function getOccupancyLabel(pct: number): string {
  if (pct < 30) return "Quiet";
  if (pct < 50) return "Moderate";
  if (pct < 70) return "Busy";
  if (pct < 85) return "Very Busy";
  return "Full";
}