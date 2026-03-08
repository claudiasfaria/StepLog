import { useEffect, useState } from "react";
import { LayoutDashboard, BarChart3, AlertTriangle, Thermometer, Map, X, Menu } from "lucide-react";
import { CampusConfig } from "@/types/steplog";

const NAV = [
  { id: "overview",  label: "Overview",  Icon: LayoutDashboard },
  { id: "map",       label: "Map",       Icon: Map             },
  { id: "analytics", label: "Analytics", Icon: BarChart3       },
  { id: "emergency", label: "Emergency", Icon: AlertTriangle   },
  { id: "alerts",    label: "Climate",   Icon: Thermometer     },
];

const DEFAULT_CAMPUS: CampusConfig = {
  id: "default", name: "Campus", shortName: "Campus",
  domain: "", tagline: "Management Dashboard",
  color: "var(--purple)", colorRaw: "191,127,255", logo: "🏢",
};

interface SidebarProps {
  activeTab:   string;
  onTabChange: (tab: string) => void;
  campus:      CampusConfig | null;
  isOpen:      boolean;         
  onClose:     () => void;
}

export default function Sidebar({ activeTab, onTabChange, campus, isOpen, onClose }: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const resolved = campus ?? DEFAULT_CAMPUS;
  const c = resolved.color;
  const cr = resolved.colorRaw;

  // Detect mobile
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobile, isOpen]);

  const handleNav = (id: string) => {
    onTabChange(id);
    if (isMobile) onClose();
  };

  const sidebarWidth = isMobile ? 260 : collapsed ? 64 : 220;

  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 40,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? "auto" : "none",
            transition: "opacity 0.28s",
          }}
        />

        {/* Drawer */}
        <aside
          style={{
            position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50,
            width: sidebarWidth,
            background: "rgba(3,5,13,0.98)",
            borderRight: `1px solid rgba(${cr},0.15)`,
            display: "flex", flexDirection: "column",
            transform: isOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.3s cubic-bezier(0.22,1,0.36,1)",
            boxShadow: isOpen ? `4px 0 40px rgba(0,0,0,0.6), 0 0 60px rgba(${cr},0.08)` : "none",
          }}
        >
          <SidebarContent
            campus={resolved} c={c} cr={cr}
            activeTab={activeTab} onNav={handleNav}
            isMobile showClose onClose={onClose}
          />
        </aside>
      </>
    );
  }

  // ── Desktop: static sidebar ───────────────────────────────────────────────
  return (
    <aside
      style={{
        width: sidebarWidth,
        background: "rgba(3,5,13,0.95)",
        borderRight: `1px solid rgba(255,255,255,0.06)`,
        display: "flex", flexDirection: "column",
        flexShrink: 0,
        transition: "width 0.28s cubic-bezier(0.22,1,0.36,1)",
        position: "relative", zIndex: 20,
      }}
    >
      <SidebarContent
        campus={resolved} c={c} cr={cr}
        activeTab={activeTab} onNav={handleNav}
        collapsed={collapsed}
        onCollapse={() => setCollapsed(v => !v)}
      />
    </aside>
  );
}

function SidebarContent({
  campus, c, cr, activeTab, onNav,
  collapsed = false, onCollapse,
  isMobile = false, showClose = false, onClose,
}: {
  campus: CampusConfig; c: string; cr: string;
  activeTab: string; onNav: (id: string) => void;
  collapsed?: boolean; onCollapse?: () => void;
  isMobile?: boolean; showClose?: boolean; onClose?: () => void;
}) {
  return (
    <>
      {/* Logo / campus header */}
      <div style={{
        padding: collapsed ? "20px 0" : "20px 16px",
        borderBottom: `1px solid rgba(${cr},0.12)`,
        display: "flex", alignItems: "center",
        gap: 10, overflow: "hidden",
        justifyContent: collapsed ? "center" : "space-between",
        flexShrink: 0,
        background: `linear-gradient(180deg, rgba(${cr},0.06) 0%, transparent 100%)`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: `rgba(${cr},0.15)`,
            border: `1px solid rgba(${cr},0.3)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
            boxShadow: `0 0 12px rgba(${cr},0.2)`,
          }}>
            {campus.logo}
          </div>
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, color: c, textShadow: `0 0 16px rgba(${cr},0.5)`, whiteSpace: "nowrap" }}>
                StepLog
              </div>
              <div style={{ fontSize: 9, color: `rgba(${cr},0.6)`, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
                Admin
              </div>
            </div>
          )}
        </div>
        {showClose && (
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--muted)", flexShrink: 0 }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Campus chip */}
      {!collapsed && (
        <div style={{ padding: "10px 16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: `rgba(${cr},0.08)`, border: `1px solid rgba(${cr},0.18)`, borderRadius: 8 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: c, boxShadow: `0 0 6px ${c}`, animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 10, color: `rgba(${cr},0.8)`, fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.1em" }}>
              {campus.name.toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 3 }}>
        {NAV.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onNav(id)}
              title={collapsed ? label : undefined}
              style={{
                width: "100%",
                display: "flex", alignItems: "center",
                gap: 10,
                padding: collapsed ? "11px 0" : "11px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                borderRadius: 10,
                border: isActive ? `1px solid rgba(${cr},0.25)` : "1px solid transparent",
                background: isActive ? `rgba(${cr},0.1)` : "transparent",
                color: isActive ? c : "rgba(232,234,240,0.35)",
                cursor: "pointer",
                transition: "all 0.18s",
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                fontFamily: "var(--font-body)",
                whiteSpace: "nowrap", overflow: "hidden",
                boxShadow: isActive ? `0 0 16px rgba(${cr},0.1) inset` : "none",
                position: "relative",
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.color = isActive ? c : "rgba(232,234,240,0.65)"; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = isActive ? c : "rgba(232,234,240,0.35)"; }}
            >
              {/* Active bar */}
              {isActive && (
                <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 20, borderRadius: "0 3px 3px 0", background: c, boxShadow: `0 0 8px ${c}` }} />
              )}
              <Icon size={15} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer / collapse */}
      <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        {!isMobile && onCollapse && (
          <button
            onClick={onCollapse}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 8, padding: "8px 12px", borderRadius: 8, background: "none", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", color: "rgba(232,234,240,0.3)", fontSize: 11, fontFamily: "var(--font-body)", transition: "all 0.18s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "rgba(232,234,240,0.65)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(232,234,240,0.3)"; (e.currentTarget as HTMLElement).style.background = "none"; }}
          >
            <span style={{ fontSize: 14 }}>{collapsed ? "→" : "←"}</span>
            {!collapsed && <span>Collapse</span>}
          </button>
        )}
        {!collapsed && (
          <div style={{ marginTop: 8, fontSize: 9, color: "rgba(232,234,240,0.18)", textAlign: "center", fontFamily: "var(--font-mono)" }}>
            FlowState v2.1 · {campus.shortName}
          </div>
        )}
      </div>
    </>
  );
}