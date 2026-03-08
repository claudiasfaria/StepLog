import { useState, useEffect } from "react";
import { User, ZoneData } from "@/types/steplog";
import { FCT_ZONES, ZONES_BY_CAMPUS, CATEGORY_EMOJI } from "@/data/mockData";
import { getOccupancyPercent, getOccupancyColor, getOccupancyLabel } from "@/lib/occupancy";
import { Icon, ICONS } from "@/lib/icons";
import { CAMPUS_MAP_CONFIG } from "@/lib/clients";
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
  const campusId     = user.campus?.id ?? "fct";
  const initialZones = ZONES_BY_CAMPUS[campusId] ?? FCT_ZONES;
  const mapConfig    = CAMPUS_MAP_CONFIG[campusId] ?? null;

  const [activeTab, setActiveTab]         = useState("overview");
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [zones, setZones]                 = useState<ZoneData[]>(initialZones);
  const [lastUpdated, setLastUpdated]     = useState(new Date());
  const [isLoading, setIsLoading]         = useState(false);
  const [hvac, setHvac]                   = useState<HvacZone[]>(() => buildInitialHvac(initialZones));
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportTime, setReportTime]       = useState<Date | null>(null);
  const [alerts, setAlerts]               = useState<string[]>([]);
  const [autoRules, setAutoRules]         = useState<AutoRule[]>(() => {
    const z = initialZones;
    return [
      { id: "r1", zoneId: z[0]?.id ?? "", condition: "Occupancy ≥ 90%", action: "HVAC max + alert security", threshold: 90, enabled: true,  triggered: false },
      { id: "r2", zoneId: z[1]?.id ?? "", condition: "Occupancy ≥ 85%", action: "Alert staff + HVAC boost",  threshold: 85, enabled: true,  triggered: false },
      { id: "r3", zoneId: z[2]?.id ?? "", condition: "Wait time > 10m",  action: "Open extra window",         threshold: 10, enabled: true,  triggered: false },
      { id: "r4", zoneId: z[3]?.id ?? "", condition: "Occupancy < 20%",  action: "HVAC eco mode",             threshold: 20, enabled: false, triggered: false },
    ].filter(r => r.zoneId !== "");
  });

  const histData  = generateHistory(initialZones[0]?.id ?? "canteen", 7);
  const weekData  = generateWeeklyPattern();

  // Season detection (auto from month, overridable)
  const autoSeason = (() => {
    const m = new Date().getMonth();
    if (m >= 5 && m <= 8) return "summer";
    if (m === 11 || m <= 2) return "winter";
    return "transition";
  })();
  const [season, setSeason] = useState<"summer" | "winter" | "transition">(autoSeason);

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

  const totalOcc = zones.reduce((a, z) => a + z.currentOccupancy, 0);
  const totalCap = zones.reduce((a, z) => a + z.capacity, 0);
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

              {/* Responsive zone stat cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: 10 }}>
                {zones.map(z => {
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
          )}

          {/* ══ OVERVIEW ══════════════════════════════════════════════════════ */}
          {activeTab === "overview" && (
            <div className="animate-fade-scale" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
                <KpiCard label="Total Persons" value={totalOcc} icon={I.users} color="var(--cyan)" sub={`of ${totalCap} capacity`} />
                <KpiCard label="Load" value={`${campusPct}%`} icon={I.activity} color="var(--purple)" sub={campusPct > 80 ? "⚠️ Near capacity" : "Nominal"} />
                <KpiCard label="WiFi Devices" value={zones.reduce((a, z) => a + z.wifiConnections, 0)} icon={ICONS.wifi} color="var(--green)" />
                <KpiCard label="Zones Open" value={`${zones.filter(z => z.isOpen).length}/${zones.length}`} icon={I.signal} color="var(--orange)" />
                <KpiCard label="Avg Wait" value={`${Math.round(zones.reduce((a, z) => a + z.waitTime, 0) / zones.length)}m`} icon={ICONS.clock} color="var(--red)" />
              </div>

              {/* Overview grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
                {/* Zone status table */}
                <div style={{ ...card({ padding: 0 }), gridColumn: "1 / 2", overflow: "hidden" }}>
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
                    {sectionTitle("Live Zone Status", I.bar, "var(--purple)")}
                  </div>
                  {zones.map(z => <ZoneRow key={z.id} zone={z} />)}
                </div>

                {/* Campus load bar chart */}
                <div style={{ ...card() }}>
                  {sectionTitle("Occupancy by Zone", I.bar, "var(--cyan)")}
                  <BarGroup
                    data={zones.map(z => ({ label: z.shortName, occ: getOccupancyPercent(z) }))}
                    keys={["occ"]}
                    colors={zones.map(z => getOccupancyColor(getOccupancyPercent(z)))}
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
                  {zones.map(z => {
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

          {/* ══ CLIMATE ALERTS ══════════════════════════════════════════════ */}
          {activeTab === "alerts" && (() => {
            // Per-zone climate recommendation logic
            const getClimateRec = (pct: number) => {
              if (season === "summer") {
                if (pct >= 70) return { icon: "🌬️", title: "Activate stronger AC", desc: "High occupancy is generating heat. Increase cooling output.", color: "var(--cyan)", urgency: "high" };
                if (pct < 30)  return { icon: "💡", title: "AC eco mode", desc: "Low occupancy. Reduce AC output to save energy.", color: "var(--green)", urgency: "low" };
                return { icon: "✅", title: "AC at standard level", desc: "Occupancy nominal. Current cooling is adequate.", color: "var(--muted)", urgency: "ok" };
              }
              if (season === "winter") {
                if (pct >= 70) return { icon: "🌡️", title: "Reduce heating", desc: "Body heat from high occupancy partially compensates. Lower heater power.", color: "var(--orange)", urgency: "medium" };
                if (pct < 30)  return { icon: "🔥", title: "Increase heating", desc: "Low occupancy — room stays colder. Boost heater to maintain comfort.", color: "var(--red)", urgency: "high" };
                return { icon: "✅", title: "Heating nominal", desc: "Occupancy moderate. Current heating is sufficient.", color: "var(--muted)", urgency: "ok" };
              }
              return { icon: "🪟", title: "Natural ventilation", desc: "Mild weather — open windows where possible. HVAC on standby.", color: "var(--green)", urgency: "low" };
            };

            const campusRec = getClimateRec(campusPct);
            const seasonColors = { summer: "var(--cyan)", winter: "var(--purple)", transition: "var(--green)" };
            const seasonLabels = { summer: "☀️ Summer", winter: "❄️ Winter", transition: "🍂 Transition" };

            return (
              <div className="animate-fade-scale" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Season selector + campus summary */}
                <div style={{ ...card(), background: `${seasonColors[season]}08`, borderColor: `${seasonColors[season]}25` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--text)", marginBottom: 4 }}>
                        Climate Overview — {seasonLabels[season]}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>At <strong style={{ color: getOccupancyColor(campusPct) }}>{campusPct}%</strong> capacity · {totalOcc} persons</div>
                    </div>
                    {/* Season override */}
                    <div style={{ display: "flex", gap: 6 }}>
                      {(["summer", "winter", "transition"] as const).map(s => (
                        <button key={s} onClick={() => setSeason(s)} style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${season === s ? seasonColors[s] : "rgba(255,255,255,0.1)"}`, background: season === s ? `${seasonColors[s]}18` : "transparent", color: season === s ? seasonColors[s] : "var(--muted)", fontSize: 10, fontFamily: "var(--font-mono)", cursor: "pointer", transition: "all 0.15s" }}>
                          {s === "summer" ? "☀️ Summer" : s === "winter" ? "❄️ Winter" : "🍂 Transition"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Campus-wide recommendation banner */}
                  <div style={{ background: `${seasonColors[season]}10`, border: `1px solid ${seasonColors[season]}25`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 22 }}>{campusRec.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", marginBottom: 2 }}>Wide: {campusRec.title}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{campusRec.desc}</div>
                    </div>
                  </div>
                </div>

                {/* Per-zone climate cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                  {zones.map(z => {
                    const pct = getOccupancyPercent(z);
                    const rec = getClimateRec(pct);
                    const occColor = getOccupancyColor(pct);
                    return (
                      <div key={z.id} style={{ ...card({ padding: 0 }), overflow: "hidden", border: `1px solid ${rec.urgency === "high" ? "rgba(255,64,96,0.2)" : rec.urgency === "medium" ? "rgba(255,140,66,0.2)" : "var(--border)"}` }}>
                        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 18 }}>{CATEGORY_EMOJI[z.category]}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>{z.name}</div>
                            <div style={{ fontSize: 10, color: "var(--muted)" }}>{z.floor}</div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 16, color: occColor }}>{pct}%</div>
                            <div style={{ fontSize: 9, color: "var(--muted)" }}>{z.currentOccupancy}/{z.capacity}</div>
                          </div>
                        </div>
                        <div style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                            <span style={{ fontSize: 18, lineHeight: 1.2 }}>{rec.icon}</span>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: rec.urgency === "ok" ? "var(--text)" : rec.color, marginBottom: 3 }}>{rec.title}</div>
                              <div style={{ fontSize: 10, color: "var(--muted)", lineHeight: 1.5 }}>{rec.desc}</div>
                            </div>
                          </div>
                          {/* Occupancy bar */}
                          <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: occColor, transition: "width 1s", borderRadius: 99 }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Info note */}
                <div style={{ ...card({ padding: 14, background: "rgba(255,140,66,0.05)", borderColor: "rgba(255,140,66,0.15)" }) }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <Icon d={I.alert} size={13} style={{ color: "var(--orange)", flexShrink: 0, marginTop: 1 }} />
                    <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.6 }}>
                      <strong style={{ color: "var(--text)" }}>Note:</strong> These are smart recommendations based on real-time occupancy data. We do not have direct API access to ACs, air quality sensors, or thermostats — please act on these alerts manually or forward them to facilities management.
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        </main>
      </div>
    </div>
  );
}