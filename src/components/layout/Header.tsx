import { useState } from "react";
import { RefreshCw, Bell, LogOut, Menu } from "lucide-react";
import { User } from "@/types/steplog";

interface HeaderProps {
  user: User;
  isConnected: boolean;
  isLoading: boolean;
  lastUpdated: Date;
  onRefresh: () => void;
  onLogout: () => void;
  activeTab: string;
  onMenuClick?: () => void;
  notifications?: string[];
  onDismissNotification?: (index: number) => void;
  onClearAllNotifications?: () => void;
}

const TAB_META: Record<string, { label: string; desc: string }> = {
  overview:   { label: "Overview",    desc: "Real-time occupancy" },
  map:        { label: "Map",  desc: "3D interactive building view" },
  analytics:  { label: "Analytics",   desc: "Sensor fusion & historical patterns" },
  emergency:  { label: "Emergency",   desc: "Headcount & incident response" },
  alerts:     { label: "Climate Alerts", desc: "Smart HVAC recommendations" },
};

export default function Header({ user, isConnected, isLoading, lastUpdated, onRefresh, onLogout, activeTab, onMenuClick, notifications = [], onDismissNotification, onClearAllNotifications }: HeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const meta = TAB_META[activeTab] ?? TAB_META.overview;
  const initials = user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <header style={{ height: 56, borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(3,5,13,0.85)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", flexShrink: 0, gap: 12 }}>
      {/* Left: hamburger (mobile) + page title */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="icon-btn"
            title="Menu"
            style={{ display: "flex", flexShrink: 0 }}
          >
            <Menu size={16} />
          </button>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{meta.label}</div>
          <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{meta.desc}</div>
        </div>
      </div>

      {/* Right: controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          className={`icon-btn${isLoading ? " animate-spin" : ""}`}
          title="Refresh data"
        >
          <RefreshCw size={14} />
        </button>

        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button
            className="icon-btn"
            title="Notifications"
            style={{ position: "relative" }}
            onClick={() => setNotifOpen(v => !v)}
          >
            <Bell size={14} />
            {notifications.length > 0 && (
              <span style={{ position: "absolute", top: 4, right: 4, width: 7, height: 7, borderRadius: "50%", background: "var(--red)", border: "1px solid rgba(3,5,13,0.9)", fontSize: 0 }} />
            )}
          </button>

          {/* Dropdown panel */}
          {notifOpen && (
            <>
              {/* Click-away overlay */}
              <div
                style={{ position: "fixed", inset: 0, zIndex: 98 }}
                onClick={() => setNotifOpen(false)}
              />
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 300, background: "rgba(10,12,22,0.98)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, boxShadow: "0 8px 40px rgba(0,0,0,0.7)", zIndex: 99, overflow: "hidden" }}>
                <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>Notifications {notifications.length > 0 && <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--red)" }}>({notifications.length})</span>}</span>
                  {notifications.length > 0 && (
                    <button onClick={() => { onClearAllNotifications?.(); setNotifOpen(false); }} style={{ fontSize: 10, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", padding: "2px 6px", borderRadius: 4 }}>Clear all</button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: "20px 14px", fontSize: 11, color: "var(--muted)", textAlign: "center" }}>No notifications</div>
                ) : (
                  <div style={{ maxHeight: 300, overflowY: "auto" }}>
                    {notifications.map((n, i) => (
                      <div key={i} style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <span style={{ flex: 1, fontSize: 11, color: "var(--text)", lineHeight: 1.5 }}>{n}</span>
                        <button
                          onClick={() => { onDismissNotification?.(i); if (notifications.length <= 1) setNotifOpen(false); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 16, lineHeight: 1, padding: "0 2px", flexShrink: 0 }}
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Avatar */}
        <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(191,127,255,0.15)", border: "1px solid rgba(191,127,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--purple)", fontFamily: "var(--font-mono)", cursor: "default" }} title={user.name}>
          {initials}
        </div>

        {/* Logout */}
        <button className="icon-btn" onClick={onLogout} title="Logout">
          <LogOut size={14} />
        </button>
      </div>
    </header>
  );
}