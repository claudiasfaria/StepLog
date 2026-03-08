import { ZoneData } from "@/types/steplog";
import { getOccupancyPercent, getOccupancyColor, getOccupancyLabel } from "@/lib/occupancy";
import { CATEGORY_EMOJI } from "@/data/mockData";
import { Icon, ICONS } from "@/lib/icons";
import OccupancyRing from "@/components/ui/OccupancyRing";
import Sparkline from "@/components/ui/Sparkline";
import { getHourlyPattern, getBestHour, getPeakHour } from "@/lib/hourlyPattern";

interface ZoneCardProps {
  zone: ZoneData;
  isSelected: boolean;
  onClick: () => void;
  floorSummary?: { label: string; pct: number }[];
}

export default function ZoneCard({ zone, isSelected, onClick, floorSummary }: ZoneCardProps) {
  const pct     = getOccupancyPercent(zone);
  const color   = getOccupancyColor(pct);
  const label   = getOccupancyLabel(pct);
  const hourly  = getHourlyPattern(zone);
  const bestH   = getBestHour(hourly);
  const peakH   = getPeakHour(hourly);

  return (
    <div
      onClick={onClick}
      className={`zone-card glass ${isSelected ? "selected" : ""}`}
      style={{
        borderColor: isSelected ? color : "var(--border)",
        boxShadow: isSelected
          ? `0 0 28px ${color}25, 0 8px 32px rgba(0,0,0,0.4)`
          : "0 4px 24px rgba(0,0,0,0.3)",
      }}
    >
      {/* Header: emoji + name + floor + status dot */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <span style={{ fontSize: 16 }}>{CATEGORY_EMOJI[zone.category]}</span>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, marginTop: 3, color: "var(--text)" }}>
            {zone.shortName}
          </div>
          <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 1 }}>{zone.floor}</div>
        </div>
        <div
          className={zone.isOpen ? "pulse-dot status-dot" : "status-dot"}
          style={{ backgroundColor: zone.isOpen ? color : "var(--muted)", marginTop: 3 }}
        />
      </div>

      {/* Ring + info */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <OccupancyRing pct={pct} color={color} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color }}>{label}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
            <Icon d={ICONS.users} size={10} style={{ color: "var(--muted)" }} />
            <span style={{ fontSize: 10, color: "var(--muted)" }}>{zone.currentOccupancy}/{zone.capacity}</span>
          </div>
          {zone.waitTime > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
              <Icon d={ICONS.clock} size={10} style={{ color: "var(--orange)" }} />
              <span style={{ fontSize: 10, color: "var(--orange)" }}>{zone.waitTime}m wait</span>
            </div>
          )}
        </div>
      </div>

      {/* Best / peak badges */}
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "2px 6px", borderRadius: 6, background: "rgba(0,220,130,0.1)", border: "1px solid rgba(0,220,130,0.2)", flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 9 }}>✅</span>
          <span style={{ fontSize: 9, color: "#00dc82", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{bestH}h–{bestH + 1}h</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "2px 6px", borderRadius: 6, background: "rgba(255,60,60,0.08)", border: "1px solid rgba(255,60,60,0.18)", flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 9 }}>⚠️</span>
          <span style={{ fontSize: 9, color: "#ff4455", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>pico {peakH}h</span>
        </div>
      </div>

      {/* Sparkline */}
      <Sparkline data={zone.trend} color={color} height={28} width={156} />

      {/* Indoor floor occupancy bars (e.g. library) */}
      {floorSummary && floorSummary.length > 0 && (
        <div style={{ marginTop: 8, borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 7 }}>
          <div style={{ fontSize: 8, color: "var(--muted)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", marginBottom: 5 }}>PISOS</div>
          {floorSummary.map(({ label, pct: p }) => {
            const barColor = p < 40 ? "#00dc82" : p < 70 ? "#ffb400" : "#ff3c3c";
            return (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--muted)", width: 24, flexShrink: 0 }}>{label}</span>
                <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${p}%`, height: "100%", background: barColor, borderRadius: 2, transition: "width 0.4s" }} />
                </div>
                <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: barColor, width: 26, textAlign: "right", flexShrink: 0 }}>{p}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}