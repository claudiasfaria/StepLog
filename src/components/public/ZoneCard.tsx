import { ZoneData } from "@/types/steplog";
import { getOccupancyPercent, getOccupancyColor, getOccupancyLabel } from "@/lib/occupancy";
import { CATEGORY_EMOJI } from "@/data/mockData";
import { Icon, ICONS } from "@/lib/icons";
import OccupancyRing from "@/components/ui/OccupancyRing";
import Sparkline from "@/components/ui/Sparkline";  

interface ZoneCardProps {
  zone: ZoneData;
  isSelected: boolean;
  onClick: () => void;
}

export default function ZoneCard({ zone, isSelected, onClick }: ZoneCardProps) {
  const pct   = getOccupancyPercent(zone);
  const color = getOccupancyColor(pct);
  const label = getOccupancyLabel(pct);

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
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <span style={{ fontSize: 18 }}>{CATEGORY_EMOJI[zone.category]}</span>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, marginTop: 4, color: "var(--text)" }}>
            {zone.shortName}
          </div>
          <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>{zone.floor}</div>
        </div>
        <div
          className={zone.isOpen ? "pulse-dot status-dot" : "status-dot"}
          style={{ backgroundColor: zone.isOpen ? color : "var(--muted)", marginTop: 4 }}
        />
      </div>

      {/* Ring + info */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <OccupancyRing pct={pct} color={color} size={52} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color }}>{label}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
            <Icon d={ICONS.users} size={11} style={{ color: "var(--muted)" }} />
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{zone.currentOccupancy}/{zone.capacity}</span>
          </div>
          {zone.waitTime > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
              <Icon d={ICONS.clock} size={11} style={{ color: "var(--orange)" }} />
              <span style={{ fontSize: 11, color: "var(--orange)" }}>{zone.waitTime}m wait</span>
            </div>
          )}
        </div>
      </div>

      {/* Sparkline */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
          <Icon d={ICONS.trend} size={10} style={{ color: "var(--muted)" }} />
          <span style={{ fontSize: 10, color: "var(--muted)" }}>3h forecast</span>
        </div>
        <Sparkline data={zone.trend} color={color} height={36} width={156} />
      </div>

      {/* Sensors */}
      <div style={{ display: "flex", gap: 12, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Icon d={ICONS.wifi} size={11} style={{ color: "var(--muted)" }} />
          <span style={{ fontSize: 10, color: "var(--muted)" }}>{zone.wifiConnections}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Icon d={ICONS.camera} size={11} style={{ color: "var(--muted)" }} />
          <span style={{ fontSize: 10, color: "var(--muted)" }}>{zone.cvCount}</span>
        </div>
      </div>
    </div>
  );
}