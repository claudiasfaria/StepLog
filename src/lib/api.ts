/**
 * API client — typed fetch helpers + React Query hooks
 * All requests are proxied through Vite → Flask on :5000
 */
import { useQuery } from "@tanstack/react-query";
import type { ZoneData, CampusConfig } from "@/types/steplog";
import type { CampusMapConfig } from "@/lib/clients";

// ─── raw fetchers ────────────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

// ─── response shapes ─────────────────────────────────────────────────────────

export interface CampusesResponse {
  campuses:   CampusConfig[];
  enterprise: CampusConfig[];
  public:     CampusConfig;
}

export interface DailyForecastDay {
  label:    string;
  isToday:  boolean;
  peak:     number;
  bestHour: number;
  hours:    { h: number; v: number }[];
}

// ─── React Query hooks ────────────────────────────────────────────────────────

/** All campuses + enterprise list + public config */
export function useCampuses() {
  return useQuery<CampusesResponse>({
    queryKey: ["campuses"],
    queryFn:  () => get<CampusesResponse>("/api/campuses"),
    staleTime: Infinity,   // config rarely changes
  });
}

/** Admin e-mail list — used to decide if user goes to EntityDashboard */
export function useAdminEmails() {
  return useQuery<string[]>({
    queryKey: ["admin-emails"],
    queryFn:  () => get<string[]>("/api/admin-emails"),
    staleTime: Infinity,
  });
}

/** Zone data for a given campus id */
export function useZones(campusId: string) {
  return useQuery<ZoneData[]>({
    queryKey: ["zones", campusId],
    queryFn:  () => get<ZoneData[]>(`/api/zones/${campusId}`),
    enabled:  !!campusId,
    staleTime: 30_000,   // re-fetch every 30 s is handled by the live-sim in components
  });
}

/** Category → emoji map */
export function useCategoryEmoji() {
  return useQuery<Record<string, string>>({
    queryKey: ["category-emoji"],
    queryFn:  () => get<Record<string, string>>("/api/category-emoji"),
    staleTime: Infinity,
  });
}

/** Map config for a campus */
export function useMapConfig(campusId: string) {
  return useQuery<CampusMapConfig>({
    queryKey: ["map-config", campusId],
    queryFn:  () => get<CampusMapConfig>(`/api/map-config/${campusId}`),
    enabled:  !!campusId,
    staleTime: Infinity,
  });
}

/** Daily forecast for a specific zone */
export function useZoneForecast(campusId: string, zoneId: string | null) {
  return useQuery<DailyForecastDay[]>({
    queryKey: ["forecast", campusId, zoneId],
    queryFn:  () => get<DailyForecastDay[]>(`/api/zones/${campusId}/${zoneId}/forecast`),
    enabled:  !!campusId && !!zoneId,
  });
}
