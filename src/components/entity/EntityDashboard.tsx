import { useState, useEffect } from "react";
import { User, ZoneData } from "@/types/steplog";
import { CATEGORY_EMOJI } from "@/data/mockData";
import { useZones, useMapConfig } from "@/lib/api";
import { getOccupancyPercent, getOccupancyColor, getOccupancyLabel } from "@/lib/occupancy";
import { Icon, ICONS } from "@/lib/icons";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import CampusMap3D from "@/components/public/Map";
import OccupancyRing from "@/components/ui/OccupancyRing";

const I = {
  alert:   "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
  wind:    "M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2",
  trend:   "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
  activity:"M22 12h-4l-3 9L9 3l-3 9H2",
  users:   "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  cpu:     "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",
  map:     "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 7a3 3 0 100 6 3 3 0 000-6",
  shield:  "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  check:   "M20 6L9 17l-5-5",
  x:       "M18 6L6 18M6 6l12 12",
  send:    "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  download:"M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  zap:     "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  signal:  "M2 20h.01M7 20v-4M12 20v-8M17 20V4M22 20v-6",
  bar:     "M18 20V10M12 20V4M6 20v-6",
};

function generateHistory(zoneId: string, days = 7) {
  const hours = [];
  const now = Date.now();
  for (let d = days - 1; d >= 0; d--) {
    for (let h = 6; h <= 22; h += 2) {
      const ts = now - d * 86400000 + h * 3600000;
      const dayOfWeek = new Date(ts).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const base = isWeekend ? 20 : 55;
      const peak = h >= 11 && h <= 14 ? 30 : h >= 17 && h <= 19 ? 20 : 0;
      const occ = Math.min(100, Math.max(5, base + peak + (Math.random() - 0.5) * 20));
      hours.push({
        time: new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        day: new Date(ts).toLocaleDateString("en", { weekday: "short" }),
        date: new Date(ts).toLocaleDateString("en", { month: "short", day: "numeric" }),
        occ: Math.round(occ),
        wifi: Math.round(occ * 2.8 + Math.random() * 30),
        cv: Math.round(occ * 0.85 + Math.random() * 10),
      });
    }
  }
  return hours;
}

function generateWeeklyPattern() {
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => ({
    day,
    morning: Math.round(Math.random() * 40 + (day === "Sat" || day === "Sun" ? 10 : 40)),
    lunch:   Math.round(Math.random() * 30 + (day === "Sat" || day === "Sun" ? 15 : 60)),
    evening: Math.round(Math.random() * 30 + (day === "Sat" || day === "Sun" ? 8 : 35)),
  }));
}

function MiniArea({ data, color, height = 48, width = 200 }: { data: number[]; color: string; height?: number; width?: number }) {
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  });
  const path = `M ${pts.join(" L ")}`;
  const id = `a${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${width},${height} L 0,${height} Z`} fill={`url(#${id})`} />
      <path d={path} stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function BarGroup({ data, keys, colors, height = 80 }: { data: { label: string; [k: string]: number | string }[]; keys: string[]; colors: string[]; height?: number }) {
  const maxVal = Math.max(...data.flatMap(d => keys.map(k => d[k] as number)));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: height - 16, width: "100%" }}>
            {keys.map((k, ki) => (
              <div key={k} style={{ flex: 1, background: colors[ki], borderRadius: "3px 3px 0 0", height: `${((d[k] as number) / maxVal) * 100}%`, filter: `drop-shadow(0 0 4px ${colors[ki]}60)`, transition: "height 0.8s cubic-bezier(0.22,1,0.36,1)" }} />
            ))}
          </div>
          <div style={{ fontSize: 9, color: "var(--muted)", fontFamily: "var(--font-mono)", textAlign: "center" }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}


interface HvacZone { zoneId: string; name: string; enabled: boolean; mode: "auto" | "manual"; fanSpeed: number; autoThreshold: number; }
interface AutoRule  { id: string; zoneId: string; condition: string; action: string; threshold: number; enabled: boolean; triggered: boolean; }

// ─── CSV Export helper ────────────────────────────────────────────────────────
/**
 * Returns a human-readable "Best Time Window" string for a recommendation.
 * Uses the zone's trend data (predicted %) to find the optimal hour slot,
 * combined with day-of-week heuristics per campus type.
 */
function suggestTimeWindow(
  zone: ZoneData,
  nearby: ZoneData[],
  isUniversity: boolean,
  isCorporate: boolean,
  isPublic: boolean,
  purpose: "event" | "maintenance" | "immediate" | "energy" | "food"
): string {
  if (purpose === "immediate") return "Immediately";

  // Day-of-week heuristics by campus type
  const eventDays   = isPublic ? "Sat–Sun" : "Tue–Thu";
  const opsDays     = isPublic ? "Daily"   : "Mon–Fri";

  if (purpose === "food") return `${opsDays}, 11:30–14:00`;

  if (purpose === "energy" || purpose === "maintenance") {
    // Prefer the quietest hour in the zone's own trend (before 10:00 or after 20:00)
    const offPeakSlots = zone.trend
      .filter(pt => { const h = parseInt(pt.time, 10); return h <= 9 || h >= 20; })
      .sort((a, b) => a.predicted - b.predicted);
    if (offPeakSlots.length > 0) {
      const h   = parseInt(offPeakSlots[0].time, 10);
      const end = `${String(Math.min(h + 2, 23)).padStart(2, "0")}:00`;
      return `${opsDays}, ${offPeakSlots[0].time}–${end}`;
    }
    return `${opsDays}, 07:00–09:00`;
  }

  // ── event ────────────────────────────────────────────────────────────────
  // Score each time slot: want nearby zones BUSY but this zone NOT too full (< 70%)
  const zoneTrend: Record<string, number> = {};
  zone.trend.forEach(pt => { zoneTrend[pt.time] = pt.predicted; });

  const nearbyScore: Record<string, number> = {};
  nearby.forEach(o => o.trend.forEach(pt => {
    nearbyScore[pt.time] = (nearbyScore[pt.time] ?? 0) + pt.predicted;
  }));

  // If no trend data at all, fall back to heuristic
  const slots = Object.keys(nearbyScore).length > 0
    ? Object.keys(nearbyScore)
    : zone.trend.map(pt => pt.time);

  const best = slots
    .filter(t => (zoneTrend[t] ?? 100) < 70)
    .sort((a, b) => (nearbyScore[b] ?? 0) - (nearbyScore[a] ?? 0))[0];

  if (best) {
    const h   = parseInt(best, 10);
    const end = `${String(Math.min(h + 2, 22)).padStart(2, "0")}:00`;
    return `${eventDays}, ${best}–${end}`;
  }

  // Ultimate fallback
  return isPublic ? "Sat–Sun, 11:00–13:00" : "Tue–Thu, 11:00–13:00";
}

function generateOccupancyCSV(zones: ZoneData[], campusId: string, fromDate: Date, toDate: Date): string {
  const msPerDay = 86_400_000;
  const days: Date[] = [];
  for (let d = new Date(fromDate); d <= toDate; d = new Date(d.getTime() + msPerDay))
    days.push(new Date(d));

  const slots = [8, 10, 12, 14, 16, 18, 20];
  const isUniversity = ["fct", "sbe"].includes(campusId);
  const isCorporate  = ["Deloitte", "Accenture"].includes(campusId);
  const isPublic     = !isUniversity && !isCorporate;
  const nowStr = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";

  // Header
  const rows: string[][] = [[
    "Date", "Time", "Zone ID", "Zone Name", "Category", "Floor",
    "Capacity", "Occupancy", "Occupancy %", "WiFi Connections", "CV Count", "Wait Time (min)", "Status",
  ]];

  days.forEach(day => {
    const dayOfWeek = day.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    slots.forEach(h => {
      zones.forEach(z => {
        const basePct    = isWeekend ? 0.25 : 0.55;
        const peakBonus  = (h >= 11 && h <= 14) ? 0.25 : (h >= 17 && h <= 19) ? 0.15 : 0;
        const jitter     = (Math.random() - 0.5) * 0.18;
        const pct        = Math.min(1, Math.max(0.03, basePct + peakBonus + jitter));
        const occ        = Math.round(pct * z.capacity);
        const wifi       = Math.round(occ * 2.5 + Math.random() * 15);
        const cv         = Math.round(occ * 0.88 + Math.random() * 8);
        const wait       = h >= 12 && h <= 14 && z.category === "food" ? Math.round(Math.random() * 15 + 2) : 0;
        rows.push([
          day.toISOString().slice(0, 10),
          `${String(h).padStart(2, "0")}:00`,
          z.id, z.name, z.category, z.floor,
          String(z.capacity), String(occ), `${Math.round(pct * 100)}%`,
          String(wifi), String(cv), String(wait),
          z.isOpen ? "Open" : "Closed",
        ]);
      });
    });
  });

  // Blank separator + recommendations section
  rows.push([]);
  rows.push([`=== SMART RECOMMENDATIONS (generated at ${nowStr}) ===`]);
  rows.push(["Priority", "Category", "Zone", "Title", "Issue", "Recommended Action", "Best Time Window", "KPI", "Generated At"]);

  const PRIORITY_ORDER: Record<string, number> = { critical: 0, warning: 1, opportunity: 2, info: 3 };
  const recs: string[][] = [];

  zones.forEach(z => {
    const pct = getOccupancyPercent(z);
    if (pct >= 90 && z.isOpen)
      recs.push(["CRITICAL", "Safety", z.name, `Critical capacity at ${z.name}`,
        `${z.currentOccupancy}/${z.capacity} persons (${pct}%). Risk of overcrowding.`,
        isUniversity ? "Display 'Zone full' on entrance screens. Alert on-duty staff."
          : isCorporate ? "Restrict badge access until occupancy drops below 85%."
          : "Activate pedestrian diversion. Alert security staff.",
        suggestTimeWindow(z, [], isUniversity, isCorporate, isPublic, "immediate"),
        `${pct}% occupancy`, nowStr]);
    if (z.waitTime > 20)
      recs.push(["CRITICAL", "Staff", z.name, `Queue alert — ${z.name}`,
        `Current wait is ${z.waitTime} min. Users risk abandonment and crowd bottlenecks.`,
        isCorporate ? "Open additional counter. Consider staggered access windows."
          : "Offer timed entry or discount at nearby attraction to shift demand.",
        suggestTimeWindow(z, [], isUniversity, isCorporate, isPublic, "immediate"),
        `${z.waitTime} min wait`, nowStr]);
    if (pct >= 75 && pct < 90 && z.isOpen) {
      const alt = zones.find(o => o.id !== z.id && o.category === z.category && getOccupancyPercent(o) < 60);
      recs.push(["WARNING", "Flow", z.name, `${z.name} filling up`,
        `${pct}% and rising. ${alt ? `${alt.name} is at ${getOccupancyPercent(alt)}% — viable alternative.` : "No alternative identified."}`,
        alt ? `Redirect users to ${alt.name} via app or entrance display.` : "Issue proactive alert. Brief staff to guide overflow.",
        suggestTimeWindow(z, [], isUniversity, isCorporate, isPublic, "immediate"),
        `${pct}% trend ↑`, nowStr]);
    }
    if (pct < 15 && z.isOpen)
      recs.push(["OPPORTUNITY", "Energy", z.name, `Energy save — ${z.name} near empty`,
        `Only ${z.currentOccupancy} of ${z.capacity} spots occupied. HVAC/lighting over-provisioned.`,
        "Switch to eco mode: reduce HVAC to 30%. Estimated 40% energy reduction for this zone.",
        suggestTimeWindow(z, [], isUniversity, isCorporate, isPublic, "energy"),
        `${pct}% occupancy`, nowStr]);
    if (isCorporate && pct < 35 && new Date().getDay() === 5)
      recs.push(["OPPORTUNITY", "Space", z.name, `Friday under-use — ${z.name}`,
        `${pct}% on Friday. HVAC, cleaning and security spending not justified.`,
        "Close floor for maintenance. Concentrate staff in adjacent workspace.",
        "Fridays, business hours",
        `${pct}% on Friday`, nowStr]);
  });

  // ── Event recommendations ────────────────────────────────────────────────
  // "Nearby busy zones" = any zone on the same floor OR (for outdoor) any zone
  zones.forEach(z => {
    if (!z.isOpen) return;
    const pct = getOccupancyPercent(z);

    // Nearby zones: same floor or, for outdoor zones, the whole campus
    const nearbyBusy = zones.filter(o =>
      o.id !== z.id && o.isOpen &&
      (o.floor === z.floor || z.category === "outdoor") &&
      getOccupancyPercent(o) >= 55
    );
    const nearbyTotal   = nearbyBusy.reduce((s, o) => s + o.currentOccupancy, 0);
    const nearbyPreview = nearbyBusy.slice(0, 2).map(o => `${o.name} (${getOccupancyPercent(o)}%)`).join(", ");

    // Good event spot: zone has room AND there is foot traffic nearby
    if (pct >= 20 && pct <= 55 && nearbyBusy.length >= 1) {
      const freeSpots = z.capacity - z.currentOccupancy;
      recs.push(["OPPORTUNITY", "Events", z.name,
        `Event opportunity — ${z.name}`,
        `${z.name} is at ${pct}% (${freeSpots} free spots). Nearby active zones: ${nearbyPreview} — ${nearbyTotal} people within reach.`,
        `Announce a pop-up event or activity at ${z.name} now. Promote via app push notification to users in: ${nearbyPreview}.`,
        suggestTimeWindow(z, nearbyBusy, isUniversity, isCorporate, isPublic, "event"),
        `${pct}% + ${nearbyTotal} nearby`, nowStr]);
    }

    // Bad event timing: zone quiet AND no one around to attend
    if (pct < 20 && nearbyBusy.length === 0) {
      const allNearby = zones.filter(o => o.id !== z.id && (o.floor === z.floor || z.category === "outdoor"));
      const avgNearby = allNearby.length
        ? Math.round(allNearby.reduce((s, o) => s + getOccupancyPercent(o), 0) / allNearby.length)
        : 0;
      recs.push(["INFO", "Events", z.name,
        `Poor event timing — ${z.name}`,
        `${z.name} is at ${pct}% and surrounding zones average only ${avgNearby}%. Events now will have minimal attendance.`,
        "Reschedule to peak hours (typically 11:00–14:00 on weekdays) when foot traffic is highest.",
        suggestTimeWindow(z, allNearby, isUniversity, isCorporate, isPublic, "event"),
        `${pct}% zone / ${avgNearby}% area avg`, nowStr]);
    }

    // Maintenance/cleaning window: zone near-empty right now
    if (pct < 15 && z.currentOccupancy <= 5) {
      const hour = new Date().getHours();
      const goodHour = hour >= 7 && hour <= 22;
      recs.push(["OPPORTUNITY", "Operations", z.name,
        `Maintenance window — ${z.name}`,
        `Only ${z.currentOccupancy} people in ${z.name} right now. Minimal disruption if maintenance starts immediately.`,
        goodHour
          ? "Dispatch cleaning crew or technical team now. Target completion before next peak period."
          : "Schedule overnight deep-clean or equipment servicing for this zone.",
        suggestTimeWindow(z, [], isUniversity, isCorporate, isPublic, "maintenance"),
        `${z.currentOccupancy} people present`, nowStr]);
    }
  });

  // ── Food demand unmet ────────────────────────────────────────────────────
  // Busy non-food zones with no adjacent open food zone → pop-up opportunity
  const openFoodZones = zones.filter(z => z.category === "food" && z.isOpen);
  zones.filter(z => z.category !== "food" && z.isOpen && getOccupancyPercent(z) >= 65)
    .forEach(z => {
      const hasFoodNearby = openFoodZones.some(f => f.floor === z.floor || getOccupancyPercent(z) >= 80);
      if (!hasFoodNearby) {
        recs.push(["WARNING", "Service", z.name,
          `Food gap near ${z.name}`,
          `${z.name} is at ${getOccupancyPercent(z)}% with no food service on the same floor. Demand likely unmet.`,
          "Deploy a mobile food cart or vending service near the entrance of this zone.",
          suggestTimeWindow(z, [], isUniversity, isCorporate, isPublic, "food"),
          `${getOccupancyPercent(z)}% / no food nearby`, nowStr]);
      }
    });

  // ── Consolidate & free a zone ────────────────────────────────────────────
  // Two or more zones of the same category on the same floor both < 40% → merge
  const seenConsolid = new Set<string>();
  zones.forEach(z => {
    if (!z.isOpen || getOccupancyPercent(z) >= 40 || seenConsolid.has(z.id)) return;
    const twins = zones.filter(o =>
      o.id !== z.id && o.isOpen && o.category === z.category &&
      o.floor === z.floor && getOccupancyPercent(o) < 40 && !seenConsolid.has(o.id)
    );
    if (twins.length >= 1) {
      seenConsolid.add(z.id);
      twins.forEach(t => seenConsolid.add(t.id));
      const twin = twins[0];
      const combined = z.currentOccupancy + twin.currentOccupancy;
      const wouldFit  = combined <= z.capacity;
      recs.push(["OPPORTUNITY", "Events", `${z.name} / ${twin.name}`,
        `Consolidate & free space — floor ${z.floor}`,
        `${z.name} (${getOccupancyPercent(z)}%) and ${twin.name} (${getOccupancyPercent(twin)}%) are both low. Combined ${combined} people would ${wouldFit ? "fit in one zone" : "nearly fill one zone"}.`,
        wouldFit
          ? `Consolidate activity into ${z.name}. Free ${twin.name} for a pop-up event, exhibition, or deep-clean.`
          : `Partially merge groups. Repurpose freed capacity in ${twin.name} for a structured activity or event.`,
        suggestTimeWindow(z, zones.filter(o => o.floor === z.floor && o.id !== z.id && o.id !== twin.id), isUniversity, isCorporate, isPublic, "event"),
        `${combined} combined / ${z.capacity} cap`, nowStr]);
    }
  });

  // ── Campus-wide checks ───────────────────────────────────────────────────
  const total = zones.reduce((a, z) => a + z.currentOccupancy, 0);
  const cap   = zones.reduce((a, z) => a + z.capacity, 0);
  const campP = cap > 0 ? Math.round((total / cap) * 100) : 0;

  if (campP < 25)
    recs.push(["OPPORTUNITY", "Energy", "Campus-wide", "Campus-wide energy save window",
      `Overall load only ${campP}%. HVAC and lighting over-provisioned for current headcount.`,
      "Activate global eco mode. Potential saving: up to 45%.",
      isPublic ? "Daily, 22:00–07:00" : "Mon–Fri, 07:00–09:00",
      `${campP}% overall`, nowStr]);

  // Campus peak sweet-spot: 35–60% overall = ideal for large events
  if (campP >= 35 && campP <= 60) {
    const bestZone = zones
      .filter(z => z.isOpen && getOccupancyPercent(z) >= 20 && getOccupancyPercent(z) <= 55)
      .sort((a, b) => (b.capacity - b.currentOccupancy) - (a.capacity - a.currentOccupancy))[0];
    const otherZones = bestZone ? zones.filter(z => z.id !== bestZone.id && z.isOpen) : zones;
    recs.push(["OPPORTUNITY", "Events", bestZone ? bestZone.name : "Campus-wide",
      "Campus event sweet-spot",
      `Overall campus load is ${campP}% — enough people to ensure attendance, enough space to avoid overcrowding. Ideal conditions for a campus-wide event.`,
      bestZone
        ? `Best available venue: ${bestZone.name} (${getOccupancyPercent(bestZone)}%, ${bestZone.capacity - bestZone.currentOccupancy} free spots). Send push notification now to maximise reach.`
        : "Announce a campus-wide activity or initiative now via the app notification system.",
      bestZone
        ? suggestTimeWindow(bestZone, otherZones, isUniversity, isCorporate, isPublic, "event")
        : (isPublic ? "Sat–Sun, 11:00–13:00" : "Tue–Thu, 11:00–13:00"),
      `${campP}% campus load`, nowStr]);
  }

  // Campus too crowded for new events
  if (campP > 80)
    recs.push(["WARNING", "Events", "Campus-wide",
      "Campus too crowded for new events",
      `Overall load at ${campP}%. Adding event foot traffic risks overcrowding common areas and corridors.`,
      "Postpone any planned events. Focus on flow management and alternative exit routes.",
      "Immediately",
      `${campP}% overall`, nowStr]);

  recs.sort((a, b) => (PRIORITY_ORDER[a[0].toLowerCase()] ?? 9) - (PRIORITY_ORDER[b[0].toLowerCase()] ?? 9));
  recs.forEach(r => rows.push(r));

  return rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
}

function buildInitialHvac(zones: { id: string; name: string }[]): HvacZone[] {
  return zones.map((z, i) => ({
    zoneId:        z.id,
    name:          `${z.name} HVAC`,
    enabled:       i % 4 !== 2,          // disable every 3rd as a demo
    mode:          i === zones.length - 1 ? "manual" : "auto",
    fanSpeed:      [60, 40, 70, 30, 45][i % 5],
    autoThreshold: [70, 75, 80, 60, 80][i % 5],
  }));
}


interface EntityDashboardProps { user: User; onLogout: () => void; }

export default function EntityDashboard({ user, onLogout }: EntityDashboardProps) {
  const campusId = user.campus?.id ?? "fct";

  const { data: apiZones = [] }    = useZones(campusId);
  const { data: mapConfig = null } = useMapConfig(campusId);

  const [activeTab, setActiveTab]         = useState("overview");
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [zones, setZones]                 = useState<ZoneData[]>([]);
  const [lastUpdated, setLastUpdated]     = useState(new Date());
  const [isLoading, setIsLoading]         = useState(false);
  const [hvac, setHvac]                   = useState<HvacZone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportTime, setReportTime]       = useState<Date | null>(null);
  const [alerts, setAlerts]               = useState<string[]>([]);
  const [autoRules, setAutoRules]         = useState<AutoRule[]>([]);

  // Seed state once API data arrives
  useEffect(() => {
    if (apiZones.length === 0) return;
    setZones(apiZones);
    setHvac(buildInitialHvac(apiZones));
    const z = apiZones;
    setAutoRules([
      { id: "r1", zoneId: z[0]?.id ?? "", condition: "Occupancy ≥ 90%", action: "HVAC max + alert security", threshold: 90, enabled: true,  triggered: false },
      { id: "r2", zoneId: z[1]?.id ?? "", condition: "Occupancy ≥ 85%", action: "Alert staff + HVAC boost",  threshold: 85, enabled: true,  triggered: false },
      { id: "r3", zoneId: z[2]?.id ?? "", condition: "Wait time > 10m",  action: "Open extra window",         threshold: 10, enabled: true,  triggered: false },
      { id: "r4", zoneId: z[3]?.id ?? "", condition: "Occupancy < 20%",  action: "HVAC eco mode",             threshold: 20, enabled: false, triggered: false },
    ].filter(r => r.zoneId !== ""));
  }, [apiZones]);
  const [showLibraryRooms, setShowLibraryRooms] = useState(false);

  const histData  = generateHistory(apiZones[0]?.id ?? "canteen", 7);
  const weekData  = generateWeeklyPattern();

  // Season detection (auto from month, overridable)
  const autoSeason = (() => {
    const m = new Date().getMonth();
    if (m >= 5 && m <= 8) return "summer";
    if (m === 11 || m <= 2) return "winter";
    return "transition";
  })();
  const [season, setSeason] = useState<"summer" | "winter" | "transition">(autoSeason);

  // CSV export state
  const today     = new Date().toISOString().slice(0, 10);
  const sevenAgo  = new Date(Date.now() - 6 * 86_400_000).toISOString().slice(0, 10);
  const [csvPreset,   setCsvPreset]   = useState<"7d" | "14d" | "30d" | "custom">("7d");
  const [csvFrom,     setCsvFrom]     = useState(sevenAgo);
  const [csvTo,       setCsvTo]       = useState(today);
  const [csvExporting, setCsvExporting] = useState(false);

  const handleCsvExport = () => {
    setCsvExporting(true);
    setTimeout(() => {
      const from = new Date(csvFrom + "T00:00:00");
      const to   = new Date(csvTo   + "T23:59:59");
      const csv  = generateOccupancyCSV(zones, campusId, from, to);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `steplog-occupancy-${campusId}-${csvFrom}_${csvTo}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setCsvExporting(false);
    }, 400);
  };

  useEffect(() => {
    const tick = () => {
      setZones(prev => {
        const next = prev.map(z => {
          const pct    = (z.currentOccupancy / z.capacity) * 100;
          const newPct = Math.min(100, Math.max(0, pct + (Math.random() - 0.5) * 5));
          return { ...z, currentOccupancy: Math.round((newPct / 100) * z.capacity), wifiConnections: Math.round(z.currentOccupancy * 2.5 + Math.random() * 20) };
        });

        // Auto-rules engine
        next.forEach(z => {
          const pct = getOccupancyPercent(z);
          setAutoRules(rules => rules.map(r => {
            if (!r.enabled || r.zoneId !== z.id) return r;
            const triggered = pct >= r.threshold;
            if (triggered && !r.triggered) {
              setAlerts(a => [`🔴 Rule triggered: ${z.shortName} — ${r.action}`, ...a.slice(0, 9)]);
            }
            return { ...r, triggered };
          }));

          // Auto HVAC
          setHvac(h => h.map(hz => {
            if (hz.zoneId !== z.id || hz.mode !== "auto" || !hz.enabled) return hz;
            const speed = pct >= 90 ? 100 : pct >= hz.autoThreshold ? Math.round(50 + (pct - hz.autoThreshold) / (100 - hz.autoThreshold) * 50) : Math.round(30 + pct * 0.3);
            return { ...hz, fanSpeed: speed };
          }));
        });

        return next;
      });
      setLastUpdated(new Date());
    };
    const id = setInterval(tick, 6000);
    return () => clearInterval(id);
  }, []);

  const refresh = () => { setIsLoading(true); setTimeout(() => setIsLoading(false), 800); setLastUpdated(new Date()); };

  // Indoor dl-p* / fct-p* zones are only relevant inside the building view — exclude from lists/KPIs
  const displayZones  = zones.filter(z => !/(?:dl|fct)-p\d/.test(z.id));
  const libraryFloors = zones.filter(z => /fct-p\d/.test(z.id));

  const totalOcc = displayZones.reduce((a, z) => a + z.currentOccupancy, 0);
  const totalCap = displayZones.reduce((a, z) => a + z.capacity, 0);
  const campusPct = Math.round((totalOcc / totalCap) * 100);

  const triggerEmergency = () => {
    setEmergencyActive(true);
    setReportGenerated(true);
    setReportTime(new Date());
    setAlerts(a => [`🚨 EMERGENCY ACTIVATED — ${totalOcc} persons logged across campus`, ...a]);
    setTimeout(() => setEmergencyActive(false), 20000);
  };

  // ── SHARED CARD STYLE ─────────────────────────────────────────────────────
  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, ...extra,
  });

  const sectionTitle = (label: string, icon: string, color = "var(--purple)"): React.ReactNode => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
      <Icon d={icon} size={15} style={{ color }} />
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{label}</span>
    </div>
  );

  // ── KPI CARD ──────────────────────────────────────────────────────────────
  const KpiCard = ({ label, value, icon, color, sub }: { label: string; value: string | number; icon: string; color: string; sub?: string }) => (
    <div style={{ ...card(), display: "flex", flexDirection: "column", gap: 10, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `${color}08`, pointerEvents: "none" }} />
      <Icon d={icon} size={16} style={{ color }} />
      <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 26, color }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--muted)" }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: `${color}90`, fontFamily: "var(--font-mono)" }}>{sub}</div>}
    </div>
  );

  // ── ZONE ROW ──────────────────────────────────────────────────────────────
  const ZoneRow = ({ zone }: { zone: ZoneData }) => {
    const pct   = getOccupancyPercent(zone);
    const color = getOccupancyColor(pct);
    return (
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)") }
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{CATEGORY_EMOJI[zone.category]}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{zone.name}</div>
          <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>{zone.floor}</div>
        </div>
        <div style={{ width: 100 }}>
          <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", marginBottom: 4 }}>
            <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, filter: `drop-shadow(0 0 3px ${color})`, transition: "width 1s" }} />
          </div>
          <div style={{ fontSize: 9, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{zone.currentOccupancy}/{zone.capacity}</div>
        </div>
        <div style={{ width: 44, textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color }}>{pct}%</div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid-bg" style={{ height: "100dvh", display: "flex", overflow: "hidden", fontFamily: "var(--font-body)" }}>
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        campus={user.campus}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header
          user={user}
          isConnected={false}
          isLoading={isLoading}
          lastUpdated={lastUpdated}
          onRefresh={refresh}
          onLogout={onLogout}
          activeTab={activeTab}
          onMenuClick={() => setSidebarOpen(v => !v)}
          notifications={alerts}
          onDismissNotification={(i) => setAlerts(a => a.filter((_, idx) => idx !== i))}
          onClearAllNotifications={() => setAlerts([])}
        />

        <main style={{ flex: 1, overflow: "auto", padding: "clamp(10px, 3vw, 20px)", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ══ MAP ══════════════════════════════════════════════════════════ */}
          {activeTab === "map" && (
            <div className="animate-fade-scale" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Map */}
              <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)", flexShrink: 0, height: "clamp(260px, 45dvh, 480px)", position: "relative" }}>
                <CampusMap3D
                  zones={zones}
                  selectedZoneId={selectedZoneId}
                  onZoneClick={(z) => setSelectedZoneId(id => id === z.id ? null : z.id)}
                  onMapClick={() => setSelectedZoneId(null)}
                  mapConfig={mapConfig}
                />
              </div>

              {/* Zone detail panel — shown when a zone is selected */}
              {selectedZoneId && (() => {
                const z = zones.find(z => z.id === selectedZoneId);
                if (!z) return null;
                const pct = getOccupancyPercent(z);
                const color = getOccupancyColor(pct);
                return (
                  <div style={{ ...card(), border: `1px solid ${color}30`, background: `${color}06`, display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <div style={{ fontSize: 32 }}>{CATEGORY_EMOJI[z.category]}</div>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--text)", marginBottom: 4 }}>{z.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12 }}>{z.floor} · {z.isOpen ? "Open" : "Closed"}</div>
                      <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", marginBottom: 6, maxWidth: 240 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: color, transition: "width 1s", borderRadius: 99 }} />
                      </div>
                      <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{z.currentOccupancy} / {z.capacity} persons ({pct}%)</div>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {[
                        { label: "Occupancy", value: `${pct}%`, color },
                        { label: "WiFi Devices", value: z.wifiConnections, color: "var(--cyan)" },
                        { label: "CV Count", value: z.cvCount, color: "var(--purple)" },
                        { label: "Wait Time", value: `${z.waitTime}m`, color: "var(--orange)" },
                      ].map(({ label, value, color: c }) => (
                        <div key={label} style={{ textAlign: "center", minWidth: 68, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 14px" }}>
                          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 18, color: c }}>{value}</div>
                          <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 2 }}>{label}</div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setSelectedZoneId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 18, lineHeight: 1, padding: 4, alignSelf: "flex-start" }}>×</button>
                  </div>
                );
              })()}

              {/* Responsive zone stat cards — or library drill-down */}
              {showLibraryRooms ? (
                <div>
                  {/* ── Library rooms drill-down ── */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <button
                      onClick={() => { setShowLibraryRooms(false); setSelectedZoneId(null); }}
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 12px", color: "var(--text)", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
                    >← Voltar</button>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--text)" }}>Biblioteca – Salas</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: 10 }}>
                    {libraryFloors.map(z => {
                      const pct   = getOccupancyPercent(z);
                      const color = getOccupancyColor(pct);
                      return (
                        <div
                          key={z.id}
                          onClick={() => setSelectedZoneId(id => id === z.id ? null : z.id)}
                          style={{
                            background: selectedZoneId === z.id ? `${color}10` : "var(--surface)",
                            border: `1px solid ${selectedZoneId === z.id ? color + "50" : "var(--border)"}`,
                            borderRadius: 14, padding: "14px 12px", cursor: "pointer",
                            transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 9,
                            boxShadow: selectedZoneId === z.id ? `0 0 12px ${color}20` : "none",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 22 }}>{CATEGORY_EMOJI[z.category]}</span>
                            <OccupancyRing pct={pct} color={color} size={38} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 12, color: "var(--text)", marginBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{z.name}</div>
                            <div style={{ fontSize: 9, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{z.floor}</div>
                          </div>
                          <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 1s", filter: `drop-shadow(0 0 3px ${color})` }} />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", color, fontWeight: 700 }}>{pct}%</span>
                            <span style={{ fontSize: 9, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{z.currentOccupancy}/{z.capacity}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 2, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                              <Icon d={ICONS.wifi} size={9} style={{ color: "var(--muted)" }} />
                              <span style={{ fontSize: 9, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{z.wifiConnections}</span>
                            </div>
                            {z.waitTime > 0
                              ? <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                  <Icon d={ICONS.clock} size={9} style={{ color: "var(--orange)" }} />
                                  <span style={{ fontSize: 9, color: "var(--orange)", fontFamily: "var(--font-mono)" }}>{z.waitTime}m</span>
                                </div>
                              : <span style={{ fontSize: 9, color: "var(--green)", fontFamily: "var(--font-mono)" }}>✓ free</span>
                            }
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: 10 }}>
                {displayZones.map(z => {
                  const pct   = getOccupancyPercent(z);
                  const color = getOccupancyColor(pct);
                  return (
                    <div
                      key={z.id}
                      onClick={() => {
                        if (z.id === "library") { setShowLibraryRooms(true); return; }
                        setSelectedZoneId(id => id === z.id ? null : z.id);
                      }}
                      style={{
                        background: selectedZoneId === z.id ? `${color}10` : "var(--surface)",
                        border: `1px solid ${selectedZoneId === z.id ? color + "50" : "var(--border)"}`,
                        borderRadius: 14, padding: "14px 12px", cursor: "pointer",
                        transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 9,
                        boxShadow: selectedZoneId === z.id ? `0 0 12px ${color}20` : "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 22 }}>{CATEGORY_EMOJI[z.category]}</span>
                        <OccupancyRing pct={pct} color={color} size={38} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 12, color: "var(--text)", marginBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{z.name}</div>
                        <div style={{ fontSize: 9, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{z.floor}</div>
                      </div>
                      <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 1s", filter: `drop-shadow(0 0 3px ${color})` }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", color, fontWeight: 700 }}>{pct}%</span>
                        <span style={{ fontSize: 9, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{z.currentOccupancy}/{z.capacity}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 2, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <Icon d={ICONS.wifi} size={9} style={{ color: "var(--muted)" }} />
                          <span style={{ fontSize: 9, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{z.wifiConnections}</span>
                        </div>
                        {z.waitTime > 0
                          ? <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                              <Icon d={ICONS.clock} size={9} style={{ color: "var(--orange)" }} />
                              <span style={{ fontSize: 9, color: "var(--orange)", fontFamily: "var(--font-mono)" }}>{z.waitTime}m</span>
                            </div>
                          : <span style={{ fontSize: 9, color: "var(--green)", fontFamily: "var(--font-mono)" }}>✓ free</span>
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          )}

          {/* ══ OVERVIEW ══════════════════════════════════════════════════════ */}
          {activeTab === "overview" && (
            <div className="animate-fade-scale" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
                <KpiCard label="Total Persons" value={totalOcc} icon={I.users} color="var(--cyan)" sub={`of ${totalCap} capacity`} />
                <KpiCard label="Load" value={`${campusPct}%`} icon={I.activity} color="var(--purple)" sub={campusPct > 80 ? "⚠️ Near capacity" : "Nominal"} />
                <KpiCard label="WiFi Devices" value={displayZones.reduce((a, z) => a + z.wifiConnections, 0)} icon={ICONS.wifi} color="var(--green)" />
                <KpiCard label="Zones Open" value={`${displayZones.filter(z => z.isOpen).length}/${displayZones.length}`} icon={I.signal} color="var(--orange)" />
                <KpiCard label="Avg Wait" value={`${Math.round(displayZones.reduce((a, z) => a + z.waitTime, 0) / displayZones.length)}m`} icon={ICONS.clock} color="var(--red)" />
              </div>

              {/* Overview grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
                {/* Zone status table */}
                <div style={{ ...card({ padding: 0 }), gridColumn: "1 / 2", overflow: "hidden" }}>
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
                    {sectionTitle("Live Zone Status", I.bar, "var(--purple)")}
                  </div>
                  {displayZones.map(z => <ZoneRow key={z.id} zone={z} />)}
                </div>

                {/* Campus load bar chart */}
                <div style={{ ...card() }}>
                  {sectionTitle("Occupancy by Zone", I.bar, "var(--cyan)")}
                  <BarGroup
                    data={displayZones.map(z => ({ label: z.shortName, occ: getOccupancyPercent(z) }))}
                    keys={["occ"]}
                    colors={displayZones.map(z => getOccupancyColor(getOccupancyPercent(z)))}
                    height={160}
                  />
                  <div style={{ display: "flex", gap: 12, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                    {["< 50% Quiet", "50–70% Moderate", "70–85% Busy", "> 85% Full"].map((l, i) => {
                      const colors = ["var(--green)", "hsl(85,100%,50%)", "var(--orange)", "var(--red)"];
                      return (
                        <div key={l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: "var(--muted)" }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: colors[i] }} />
                          {l}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ ANALYTICS ══════════════════════════════════════════════════════ */}
          {activeTab === "analytics" && (
            <div className="animate-fade-scale" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* ── CSV Export panel ── */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <Icon d={I.download} size={15} style={{ color: "var(--purple)" }} />
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--text)" }}>Export Occupancy Report</span>
                  <span style={{ fontSize: 10, color: "var(--muted)", marginLeft: 4 }}>· CSV with occupancy data + smart recommendations</span>
                </div>

                {/* Preset buttons */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                  {(["7d", "14d", "30d", "custom"] as const).map(p => {
                    const labels = { "7d": "Last 7 days", "14d": "Last 14 days", "30d": "Last 30 days", "custom": "Custom range" };
                    const active = csvPreset === p;
                    return (
                      <button key={p} onClick={() => {
                        setCsvPreset(p);
                        if (p !== "custom") {
                          const daysBack = p === "7d" ? 6 : p === "14d" ? 13 : 29;
                          setCsvFrom(new Date(Date.now() - daysBack * 86_400_000).toISOString().slice(0, 10));
                          setCsvTo(new Date().toISOString().slice(0, 10));
                        }
                      }}
                      style={{ padding: "5px 14px", borderRadius: 8, fontSize: 11, fontWeight: active ? 700 : 400, cursor: "pointer", fontFamily: "var(--font-mono)", transition: "all 0.15s",
                        background: active ? "rgba(191,127,255,0.12)" : "transparent",
                        border: `1px solid ${active ? "rgba(191,127,255,0.5)" : "var(--border)"}`,
                        color: active ? "var(--purple)" : "var(--muted)" }}>
                        {labels[p]}
                      </button>
                    );
                  })}
                </div>

                {/* Date pickers (always visible, editable in custom mode) */}
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 9, color: "var(--muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>From</label>
                    <input type="date" value={csvFrom} max={csvTo}
                      onChange={e => { setCsvFrom(e.target.value); setCsvPreset("custom"); }}
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 10px", color: "var(--text)", fontSize: 12, fontFamily: "var(--font-mono)", colorScheme: "dark" }} />
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", paddingBottom: 8 }}>→</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 9, color: "var(--muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>To</label>
                    <input type="date" value={csvTo} min={csvFrom} max={today}
                      onChange={e => { setCsvTo(e.target.value); setCsvPreset("custom"); }}
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 10px", color: "var(--text)", fontSize: 12, fontFamily: "var(--font-mono)", colorScheme: "dark" }} />
                  </div>

                  <button onClick={handleCsvExport} disabled={csvExporting || !csvFrom || !csvTo}
                    style={{ padding: "8px 20px", borderRadius: 10, border: "none", cursor: csvExporting ? "not-allowed" : "pointer", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 7, transition: "all 0.2s",
                      background: csvExporting ? "rgba(191,127,255,0.15)" : "var(--purple)",
                      color: csvExporting ? "var(--purple)" : "#0a0a14",
                      opacity: !csvFrom || !csvTo ? 0.5 : 1 }}>
                    <Icon d={I.download} size={13} />
                    {csvExporting ? "Generating…" : "Download CSV"}
                  </button>
                </div>

                {/* What's included */}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {[
                    { icon: "📊", label: "Occupancy % per zone",        sub: "every 2-hour slot" },
                    { icon: "📶", label: "WiFi + CV sensor data",        sub: "fused readings" },
                    { icon: "⏱️", label: "Wait times",                   sub: "food zones" },
                    { icon: "💡", label: "Smart recommendations",        sub: "auto-appended" },
                  ].map(({ icon, label, sub }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <span style={{ fontSize: 14 }}>{icon}</span>
                      <div>
                        <div style={{ fontSize: 11, color: "var(--text)", fontWeight: 500 }}>{label}</div>
                        <div style={{ fontSize: 9, color: "var(--muted)" }}>{sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sensor fusion explainer */}
              <div style={{ ...card(), background: "rgba(123,200,255,0.04)", borderColor: "rgba(123,200,255,0.15)" }}>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                  {[
                    { label: "WiFi Raw", val: zones.reduce((a, z) => a + z.wifiConnections, 0), note: "÷2.5 device bias", color: "var(--cyan)", icon: ICONS.wifi },
                    { label: "CV Count", val: zones.reduce((a, z) => a + z.cvCount, 0), note: "60% weight", color: "var(--purple)", icon: ICONS.camera },
                    { label: "Fused Total", val: totalOcc, note: "Ground truth", color: "var(--green)", icon: I.activity },
                    { label: "Accuracy", val: "94%", note: "vs manual count", color: "var(--orange)", icon: I.trend },
                  ].map(({ label, val, note, color, icon }) => (
                    <div key={label} style={{ flex: 1, minWidth: 120, display: "flex", gap: 10, alignItems: "center" }}>
                      <Icon d={icon} size={18} style={{ color }} />
                      <div>
                        <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 20, color }}>{val}</div>
                        <div style={{ fontSize: 11, color: "var(--text)" }}>{label}</div>
                        <div style={{ fontSize: 9, color: "var(--muted)" }}>{note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Historical 7-day trend */}
              <div style={{ ...card() }}>
                {sectionTitle("7-Day Occupancy Trend — Canteen", I.trend, "var(--cyan)")}
                <div style={{ marginBottom: 8, fontSize: 11, color: "var(--muted)" }}>Raw WiFi connections vs. normalized occupancy % vs. CV count</div>
                <MiniArea data={histData.map(d => d.occ)} color="var(--cyan)" height={72} width={800} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 8, marginTop: 12 }}>
                  {histData.filter((_, i) => i % 4 === 0).slice(0, 12).map((d, i) => (
                    <div key={i} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700, color: getOccupancyColor(d.occ) }}>{d.occ}%</div>
                      <div style={{ fontSize: 9, color: "var(--muted)" }}>{d.day} {d.time}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly heatmap pattern + staffing */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
                <div style={{ ...card() }}>
                  {sectionTitle("Weekly Traffic Pattern", I.bar, "var(--purple)")}
                  <BarGroup
                    data={weekData.map(d => ({ label: d.day, morning: d.morning, lunch: d.lunch, evening: d.evening }))}
                    keys={["morning", "lunch", "evening"]}
                    colors={["var(--cyan)", "var(--purple)", "var(--orange)"]}
                    height={100}
                  />
                  <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                    {["Morning", "Lunch", "Evening"].map((l, i) => {
                      const c = ["var(--cyan)", "var(--purple)", "var(--orange)"][i];
                      return (
                        <div key={l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--muted)" }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                          {l}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ EMERGENCY ══════════════════════════════════════════════════════ */}
          {activeTab === "emergency" && (
            <div className="animate-fade-scale" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Big trigger */}
              <div style={{ ...card({ padding: 24, border: emergencyActive ? "2px solid var(--red)" : "2px solid rgba(255,64,96,0.25)", background: emergencyActive ? "rgba(255,64,96,0.05)" : "var(--surface)", boxShadow: emergencyActive ? "0 0 40px rgba(255,64,96,0.15)" : "none", transition: "all 0.4s" }) }}>
                <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ width: 72, height: 72, borderRadius: "50%", border: `3px solid ${emergencyActive ? "var(--red)" : "rgba(255,64,96,0.4)"}`, display: "flex", alignItems: "center", justifyContent: "center", background: emergencyActive ? "rgba(255,64,96,0.2)" : "rgba(255,64,96,0.08)", flexShrink: 0, animation: emergencyActive ? "pulse 1s infinite" : "none" }}>
                    <Icon d={I.alert} size={32} style={{ color: "var(--red)" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, color: "var(--red)", marginBottom: 6 }}>
                      {emergencyActive ? "🚨 EMERGENCY ACTIVE" : "Emergency Response"}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12, lineHeight: 1.5 }}>
                      Instantly generates a headcount report of all zones at this exact moment. For use during security threats, fire, or evacuation scenarios. Report is timestamped and can be exported.
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        onClick={triggerEmergency}
                        disabled={emergencyActive}
                        style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: emergencyActive ? "rgba(255,64,96,0.2)" : "var(--red)", color: emergencyActive ? "var(--red)" : "#fff", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12, cursor: emergencyActive ? "not-allowed" : "pointer", letterSpacing: "0.08em", transition: "all 0.2s" }}
                      >
                        {emergencyActive ? "EMERGENCY ACTIVE..." : "🚨 TRIGGER EMERGENCY HEADCOUNT"}
                      </button>
                      {reportGenerated && (
                        <button
                          onClick={() => { const d = document.createElement("a"); d.href = "#"; d.download = `emergency-report-${reportTime?.toISOString()}.txt`; }}
                          style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                        >
                          <Icon d={I.download} size={13} /> Export PDF
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Live headcount */}
              {reportGenerated && (
                <div style={{ ...card({ padding: 0 }), border: "1px solid rgba(255,64,96,0.3)", animation: "slideUp 0.3s ease forwards" }}>
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14 }}>📋 Emergency Headcount Report</div>
                      <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
                        Generated: {reportTime?.toLocaleString()} · CONFIDENTIAL
                      </div>
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: "var(--red)" }}>{totalOcc} <span style={{ fontSize: 11, color: "var(--muted)" }}>total</span></div>
                  </div>
                  {displayZones.map(z => {
                    const pct   = getOccupancyPercent(z);
                    const color = getOccupancyColor(pct);
                    return (
                      <div key={z.id} style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}15`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                          {CATEGORY_EMOJI[z.category]}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{z.name}</div>
                          <div style={{ fontSize: 10, color: "var(--muted)" }}>{z.floor} · {z.isOpen ? "OPEN" : "CLOSED"}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 22, color }}>{z.currentOccupancy}</div>
                          <div style={{ fontSize: 9, color: "var(--muted)" }}>persons ({pct}%)</div>
                        </div>
                        <div style={{ width: 60 }}>
                          <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: color }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ padding: "14px 16px", background: "rgba(255,64,96,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-display)" }}>TOTAL</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 26, color: "var(--red)" }}>{totalOcc} <span style={{ fontSize: 11, color: "var(--muted)" }}>/ {totalCap} cap.</span></div>
                  </div>
                </div>
              )}

              {/* Privacy notice */}
              <div style={{ ...card({ padding: 14, background: "rgba(255,140,66,0.06)", borderColor: "rgba(255,140,66,0.2)" }) }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <Icon d={I.alert} size={14} style={{ color: "var(--orange)", flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.6 }}>
                    <strong style={{ color: "var(--text)" }}>Privacy Notice:</strong> All headcounts use aggregated integer data only. Camera frames are deleted immediately after local processing on Raspberry Pi. This report contains only zone-level counts.
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}