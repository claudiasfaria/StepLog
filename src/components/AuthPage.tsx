import { useState, useEffect, useMemo } from "react";
import { User } from "@/types/steplog";
import { Icon, ICONS } from "@/lib/icons";
import { CAMPUSES, ENTERPRISE, LISBON_PUBLIC } from "@/lib/clients";
import { AUTH_STYLES } from "./ui/authStyles";


interface AuthPageProps {
  onLogin: (user: User) => void;
}

export default function AuthPage({ onLogin }: AuthPageProps) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = AUTH_STYLES;
    document.head.appendChild(el);
    return () => {
      document.head.removeChild(el);
    };
  }, []);

const campus = useMemo(() => {
  const parts = email.split("@");
  if (parts.length < 2 || !parts[1]) return null;
  const domain = "@" + parts[1].toLowerCase();
  return [...CAMPUSES, ...ENTERPRISE].find(c => c.domain === domain) ?? null;
}, [email]);

  const accentColor  = campus?.color    ?? "#7BC8FF";
  const accentRaw    = campus?.colorRaw ?? "123,200,255";

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  // 1. Validação básica de formato
  if (!email.includes("@") || !email.split("@")[1]) {
    setError("Enter a valid email address.");
    return;
  }
  if (password.length < 4) {
    setError("Enter a valid password.");
    return;
  }

  setLoading(true);
  await new Promise(r => setTimeout(r, 1100));
  setLoading(false);

  const detectedClient = campus;

  onLogin({
    id: crypto.randomUUID(),
    email,
    role: "student",
    campus: detectedClient,
    name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    rewardPoints: 340,
  });
};

  return (
    <div className="auth-wrap">
      {/* Accent blob changes colour with campus */}
      <div
        className="auth-blob-1"
        style={{ background: `radial-gradient(circle, rgba(${accentRaw},0.07), transparent 65%)`, transition: "background 0.6s" }}
      />
      <div className="auth-blob-2" />

      <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>

        {/* ── Logo ── */}
        <div className="auth-float" style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "flex-start", gap: 20, marginBottom: 14 }}>
            <div
              className="auth-logo-icon"
              style={{
                
                background:  `rgba(${accentRaw},0.1)`,
                border:      `1.5px solid rgba(${accentRaw},0.35)`,
                transition: "all 0.5s cubic-bezier(0.22, 1, 0.36, 1)"
              }}
            >
              {campus ? (
                <span className="animate-in zoom-in duration-300">{campus.logo}</span>
              ) : (
                <Icon d={ICONS.zap} size={30} style={{ color: accentColor }} />
              )}
            </div>
            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
             
            }}>
            <div
              className="auth-logo-text"
              style={{
                color: accentColor,
                textShadow: `0 0 20px rgba(${accentRaw},0.65), 0 0 60px rgba(${accentRaw},0.28)`,
                
              }}
            >
              StepLog
            </div>
            <div style={{ 
              fontSize: 11, 
              color: `rgba(${accentRaw},0.5)`, 
              letterSpacing: "0.15em", 
              textTransform: "uppercase", 
              fontFamily: "var(--font-mono)", 
              marginTop: "12px", /* Espaço real entre título e slogan */
              whiteSpace: "nowrap",
              textAlign: "left",
            }}>
              Find your spot before you arrive
            </div>
          </div>
          </div>
          <div style={{ fontSize: 14, color: "rgba(232,234,240,0.38)" }}>
            {campus ? `${campus.name} · ${campus.tagline}` : "Multi-Spots Intelligence Platform"}
          </div>
        </div>

        {/* ── Card ── */}
        <div
          className="auth-card"
          style={{ "--card-accent": accentColor } as React.CSSProperties}
        >
          {/* Top accent line */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, rgba(${accentRaw},0.5) 50%, transparent)`, transition: "background 0.5s" }} />

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 18 }}>
              <label className="auth-label">Email</label>
              <input
                className="auth-input"
                type="email"
                placeholder="yourname@university.edu"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                autoComplete="email"
                style={{
                  borderColor: campus ? `rgba(${accentRaw},0.35)` : undefined,
                  boxShadow:   campus ? `0 0 0 3px rgba(${accentRaw},0.08)` : undefined,
                }}
              />
              {/* Live campus badge */}
              {campus && (
                <div className="campus-badge" style={{ background: `rgba(${accentRaw},0.1)`, border: `1px solid rgba(${accentRaw},0.25)`, color: accentColor }}>
                  <span>{campus.logo}</span>
                  <span>{campus.name}</span>
                  <span style={{ opacity: 0.55, fontWeight: 400 }}>· {campus.tagline}</span>
                </div>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label className="auth-label">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  className="auth-input"
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingRight: 52 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(232,234,240,0.3)", display: "flex", padding: 4, transition: "color 0.18s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = accentColor)}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(232,234,240,0.3)")}
                >
                  <Icon d={showPwd ? ICONS.eyeOff : ICONS.eye} size={16} />
                </button>
              </div>
            </div>

            {error && (
              <div className="auth-error">
                <Icon d={ICONS.shield} size={14} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="auth-submit"
              style={{
                backgroundColor: accentColor, 
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
                boxShadow: `0 4px 28px rgba(${accentRaw},0.35), 0 0 0 1px rgba(${accentRaw},0.3)`,
                color: "#03050d", 
                fontWeight: "700"
              }}
            >
              {loading ? (
                <><div className="auth-spinner" /> Authenticating...</>
              ) : (
                <><Icon d={ICONS.zap} size={16} /> Access StepLog</>
              )}
            </button>
          </form>

          {/* Guest access */}
          <button
            className="auth-guest-btn"
            onClick={() => onLogin({
              id: crypto.randomUUID(),
              email: "guest@steplog.app",
              role: "student",
              campus: LISBON_PUBLIC,
              name: "Visitante",
              rewardPoints: 0,
            })}
          >
            <Icon d={ICONS.mapPin} size={14} />
            Explorar Lisboa sem conta — spots públicos
          </button>

          <div className="auth-privacy">
            <Icon d={ICONS.shield} size={14} style={{ color: `rgba(${accentRaw},0.4)`, marginTop: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "rgba(232,234,240,0.28)", lineHeight: 1.65 }}>
              {campus
                ? <>Accessing <strong style={{ color: `rgba(${accentRaw},0.55)`, fontWeight: 500 }}>{campus.name}</strong> — {campus.tagline}. All data processed on-device.</>
                : <>Enter your email to detect your enterprise/institution automatically. </>
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}