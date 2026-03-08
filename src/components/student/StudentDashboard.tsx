import { useState, useEffect, useRef } from "react";
import { User, ZoneData } from "@/types/steplog";
import { CATEGORY_EMOJI } from "@/data/mockData";
import { useZones, useMapConfig, useZoneForecast } from "@/lib/api";
import { getOccupancyPercent, getOccupancyColor, getOccupancyLabel } from "@/lib/occupancy";
import { getHourlyPattern, getBestHour, getPeakHour } from "@/lib/hourlyPattern";
import { Icon, ICONS } from "@/lib/icons";
import ZoneCard from "@/components/student/ZoneCard";
import OccupancyRing from "@/components/ui/OccupancyRing";
import Sparkline from "@/components/ui/Sparkline";
import Map from "@/components/public/Map";

interface StudentDashboardProps {
  user: User;
  onLogout: () => void; 
}

export default function StudentDashboard({ user, onLogout }: StudentDashboardProps) {
  const campusId  = user.campus?.id ?? "fct";
  const isPublic  = user.campus?.isPublic === true;

  const { data: campusZones = [], isLoading: zonesLoading } = useZones(campusId);
  const { data: mapConfig = null }                          = useMapConfig(campusId);

  const [forecastDay, setForecastDay] = useState<number | null>(null);

  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [activeTab, setActiveTab]           = useState<"map" | "stats">("map");
  const [zones, setZones]                   = useState<ZoneData[]>([]);
  const [lastUpdated, setLastUpdated]       = useState<Date>(new Date());
  const [isLoading, setIsLoading]           = useState(false);
  const [searchQuery, setSearchQuery]       = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Seed local zones state once API data arrives
  useEffect(() => {
    if (campusZones.length > 0) setZones(campusZones);
  }, [campusZones]);

  // Live simulation
  useEffect(() => {
    const tick = () => {
      setZones(prev =>
        prev.map(z => {
          const pct    = (z.currentOccupancy / z.capacity) * 100;
          const newPct = Math.min(100, Math.max(0, pct + (Math.random() - 0.5) * 4));
          return {
            ...z,
            currentOccupancy: Math.round((newPct / 100) * z.capacity),
            wifiConnections:  Math.round(z.currentOccupancy * 2.5 + Math.random() * 15),
          };
        })
      );
      setLastUpdated(new Date());
    };
    const id = setInterval(tick, 8000);
    return () => clearInterval(id);
  }, []);

  const selectedZone = zones.find(z => z.id === selectedZoneId);
  const { data: zoneForecast = [] } = useZoneForecast(campusId, selectedZoneId);

  // Reset forecast day selection when zone changes
  useEffect(() => { setForecastDay(null); }, [selectedZoneId]);

  const zoneRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Auto-scroll to the zone card when a zone is selected on the map
  useEffect(() => {
    if (!selectedZoneId) return;
    const el = zoneRefs.current[selectedZoneId];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [selectedZoneId]);

  const handleZoneClick = (zone: ZoneData) =>
    setSelectedZoneId(prev => (prev === zone.id ? null : zone.id));

  // Public category labels
  const PUBLIC_CATEGORIES = [
    { id: "outdoor", label: "Parques & Vistas",  emoji: "🌿" },
    { id: "food",    label: "Mercados & Comida",  emoji: "🍽️" },
    { id: "service", label: "Museus & Cultura",   emoji: "🏛️" },
  ];

  // Filter zones by search + category (only active for public view)
  const visibleZones = isPublic
    ? zones.filter(z => {
        const matchCat   = !activeCategory || z.category === activeCategory;
        const matchQuery = !searchQuery || z.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchQuery;
      })
    : zones;

  const refresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 900);
    setLastUpdated(new Date());
  };

  return (
    <div className="grid-bg" style={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── Header ── */}
      <header className="glass" style={{ borderBottom: "1px solid var(--border)", padding: "10px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d={ICONS.zap} size={17} style={{ color: "var(--text)" }} />
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, letterSpacing: "0.04em", color: "var(--text)" }}>StepLog</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="icon-btn" onClick={onLogout} style={{ padding: 6 }}>
            <Icon d={ICONS.logout} size={15} />
          </button>
        </div>
      </header>

      {/* ══ MAP TAB ══ */}
      <div style={{ flex: 1, display: activeTab === "map" ? "flex" : "none", flexDirection: "column", overflow: "hidden" }}>

          {/* 3D MAP — grows to fill available space above cards */}
          <div style={{ flex: 1, position: "relative", background: "rgba(3,5,13,0.6)", minHeight: 160, overflow: "hidden" }}>
            <Map zones={visibleZones} selectedZoneId={selectedZoneId} flyToZone={selectedZone} mapConfig={mapConfig} onZoneClick={handleZoneClick} />

            {/* Gradient fade at bottom — blends map into zone cards */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 48, background: "linear-gradient(to bottom, transparent, var(--bg, #0a0a14))", zIndex: 4, pointerEvents: "none" }} />

            {/* Top-left badge */}
            <div className="glass" style={{ position: "absolute", top: 12, left: 12, borderRadius: 8, padding: "5px 10px", display: "flex", alignItems: "center", gap: 6, zIndex: 5 }}>
              <div className="pulse-dot status-dot" style={{ backgroundColor: "var(--green)" }} />
              <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
                {user.campus?.shortName ?? "FCT"} · {visibleZones.filter(z => z.isOpen).length} spots live
              </span>
            </div>

            {/* Top-right clock + refresh */}
            <div className="glass" style={{ position: "absolute", top: 12, right: 12, borderRadius: 8, padding: "5px 10px", display: "flex", alignItems: "center", gap: 8, zIndex: 5 }}>
              <Icon d={ICONS.clock} size={11} style={{ color: "var(--muted)" }} />
              <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--muted)" }}>{lastUpdated.toLocaleTimeString()}</span>
              <button className={`icon-btn${isLoading ? " animate-spin" : ""}`} onClick={refresh} style={{ padding: 4, borderRadius: 6 }}>
                <Icon d={ICONS.refresh} size={11} />
              </button>
            </div>
          </div>

          {/* ── Bottom overlay: selected zone + cards ── */}
          <div style={{ flexShrink: 0 }}>

          {/* Selected zone — expanded detail panel */}
          {selectedZone && (() => {
            const pct      = getOccupancyPercent(selectedZone);
            const color    = getOccupancyColor(pct);
            const label    = getOccupancyLabel(pct);
            const hourly   = getHourlyPattern(selectedZone);
            const bestH    = getBestHour(hourly);
            const peakH    = getPeakHour(hourly);
            const curHour  = new Date().getHours();
            const fmtH     = (h: number) => `${h}h`;
            return (
              <div className="animate-slide-up" style={{ flexShrink: 0, background: "rgba(3,5,13,0.98)", borderBottom: `1px solid ${color}25` }}>
                {/* Title row */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px 8px" }}>
                  <OccupancyRing pct={pct} color={color} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {CATEGORY_EMOJI[selectedZone.category]} {selectedZone.name}
                      </span>
                      <span style={{ flexShrink: 0, fontSize: 10, padding: "2px 7px", borderRadius: 6, background: `${color}18`, color, border: `1px solid ${color}30`, fontFamily: "var(--font-mono)" }}>
                        {label.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 14, marginTop: 4 }}>
                      {[
                        { icon: ICONS.users, val: `${selectedZone.currentOccupancy}/${selectedZone.capacity}`, c: "var(--muted)" },
                        { icon: ICONS.clock, val: selectedZone.waitTime > 0 ? `${selectedZone.waitTime}m espera` : "Sem espera", c: selectedZone.waitTime > 0 ? "var(--orange)" : "var(--green)" },
                        { icon: ICONS.wifi,  val: `${selectedZone.capacity - selectedZone.currentOccupancy} livres`, c: "var(--muted)" },
                      ].map(({ icon, val, c }) => (
                        <div key={val} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Icon d={icon} size={10} style={{ color: c }} />
                          <span style={{ fontSize: 10, color: c, fontFamily: "var(--font-mono)" }}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button className="icon-btn" onClick={() => setSelectedZoneId(null)} style={{ padding: 5, flexShrink: 0, fontSize: 14, lineHeight: 1 }}>×</button>
                </div>

                {/* Best time + peak badges */}
                <div style={{ display: "flex", gap: 8, padding: "0 16px 10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: "rgba(0,220,130,0.1)", border: "1px solid rgba(0,220,130,0.2)" }}>
                    <span style={{ fontSize: 13 }}>✅</span>
                    <span style={{ fontSize: 11, color: "var(--green)", fontFamily: "var(--font-mono)" }}>Melhor hora: {fmtH(bestH)}–{fmtH(bestH + 1)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, background: "rgba(255,60,60,0.08)", border: "1px solid rgba(255,60,60,0.18)" }}>
                    <span style={{ fontSize: 13 }}>⚠️</span>
                    <span style={{ fontSize: 11, color: "var(--red, #ff4455)", fontFamily: "var(--font-mono)" }}>Pico: {fmtH(peakH)}–{fmtH(peakH + 1)}</span>
                  </div>
                </div>

                {/* Hourly bars com selector de dia */}
<div style={{ padding: "0 16px 12px" }}>
  {/* Day selector */}
  <div style={{ display: "flex", gap: 4, marginBottom: 10, overflowX: "auto" }}>
    {zoneForecast.map((day, i) => (
      <button
        key={i}
        onClick={() => setForecastDay(forecastDay === i ? null : i)}
        style={{
          flexShrink: 0,
          padding: "3px 10px",
          borderRadius: 8,
          fontSize: 10,
          fontFamily: "var(--font-mono)",
          border: "1px solid",
          cursor: "pointer",
          background: forecastDay === i
            ? `${color}20`
            : day.isToday ? "rgba(255,255,255,0.07)" : "transparent",
          borderColor: forecastDay === i
            ? color
            : day.isToday ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)",
          color: forecastDay === i ? color : day.isToday ? "var(--text)" : "var(--muted)",
          fontWeight: day.isToday ? 700 : 400,
        }}
      >
        {day.isToday ? "Hoje" : day.label}
        <div style={{ fontSize: 8, opacity: 0.7, marginTop: 1 }}>{day.peak}%</div>
      </button>
    ))}
  </div>

  {/* Bars — hoje ou dia selecionado */}
  {(() => {
    const forecast = zoneForecast;
    const dayData  = forecastDay !== null ? forecast[forecastDay] : null;
    const bars     = dayData ? dayData.hours : hourly.slice(7, 23).map((v, i) => ({ h: i + 7, v }));
    const isFuture = forecastDay !== null;

    return (
      <>
        <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 6, fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
          {isFuture ? `PREVISÃO — ${forecast[forecastDay!].label.toUpperCase()}` : "AFLUÊNCIA POR HORA"}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 44 }}>
          {bars.map(({ h, v }) => {
            const isCur  = !isFuture && h === curHour;
            const isBest = h === bestH;
            const isPeak = h === peakH;
            const barColor = isBest ? "#00dc82" : isPeak ? "#ff4455" : isCur ? color : isFuture ? `${color}70` : "rgba(255,255,255,0.12)";
            return (
              <div key={h} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div style={{
                  width: "100%", borderRadius: 3,
                  height: `${Math.max(4, Math.round(v * 40))}px`,
                  background: barColor,
                  opacity: isCur ? 1 : 0.75,
                  boxShadow: isCur ? `0 0 6px ${color}80` : undefined,
                  transition: "height 0.4s ease",
                }} />
                {(h % 3 === 0) && (
                  <span style={{ fontSize: 8, color: isCur ? color : "rgba(255,255,255,0.25)", fontFamily: "var(--font-mono)", lineHeight: 1 }}>{h}h</span>
                )}
              </div>
            );
          })}
        </div>
      </>
    );
  })()}
</div>

                {/* Forecast sparkline */}
                <div style={{ padding: "0 16px 12px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                    <Icon d={ICONS.trend} size={10} style={{ color: "var(--muted)" }} />
                    <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>PREVISÃO PRÓXIMAS 3H</span>
                  </div>
                  <Sparkline data={selectedZone.trend} color={color} height={32} width="100%" />
                </div>
              </div>
            );
          })()}

          {/* ZONE CARDS */}
          <div style={{ flexShrink: 0, padding: "16px 16px 16px", display: "flex", flexDirection: "column", gap: 6, background: "var(--bg, #0a0a14)" }}>
            {/* Zone cards */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                <Icon d={ICONS.wifi} size={13} style={{ color: "var(--muted)" }} />
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13 }}>Live Zones</span>
              </div>
              <div className="scroll-x" style={{ paddingTop: 6, paddingBottom: 6 }}>
                {visibleZones.map(zone => (
                  <div key={zone.id} ref={el => { zoneRefs.current[zone.id] = el; }}>
                    <ZoneCard zone={zone} isSelected={zone.id === selectedZoneId} onClick={() => handleZoneClick(zone)} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          </div>{/* end bottom overlay */}
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 16, display: activeTab === "stats" ? "block" : "none" }}>
          <div className="animate-fade-scale" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {visibleZones.map((zone, i) => {
              const pct   = getOccupancyPercent(zone);
              const color = getOccupancyColor(pct);
              return (
                <div
                  key={zone.id} className="glass"
                  style={{ borderRadius: 16, padding: 16, animationDelay: `${i * 60}ms`, animation: "slideUp 0.4s cubic-bezier(0.22,1,0.36,1) both", border: `1px solid ${color}20`, cursor: "pointer" }}
                  onClick={() => { setSelectedZoneId(zone.id); setActiveTab("map"); }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 20 }}>{CATEGORY_EMOJI[zone.category]}</span>
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13 }}>{zone.name}</div>
                      <div style={{ fontSize: 10, color: "var(--muted)" }}>{zone.floor}</div>
                    </div>
                    <div style={{ marginLeft: "auto" }}><OccupancyRing pct={pct} color={color} size={42} /></div>
                  </div>
                  <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99, marginBottom: 10, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, filter: `drop-shadow(0 0 4px ${color})`, transition: "width 1.2s cubic-bezier(0.22,1,0.36,1)" }} />
                  </div>
                  <Sparkline data={zone.trend} color={color} height={36} width={220} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, color: "var(--muted)" }}>
                    <span style={{ fontFamily: "var(--font-mono)" }}>{zone.currentOccupancy}/{zone.capacity}</span>
                    {zone.waitTime > 0 && <span style={{ color: "var(--orange)", fontFamily: "var(--font-mono)" }}>{zone.waitTime}m wait</span>}
                  </div>
                </div>
              );
            })}
          </div>
      </div>
    </div>
  );
}