import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, FileText, Images, Film, Mic, MessageCircle,
  Calendar, BarChart2, Settings, LogOut, X, Leaf, FileBarChart
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const navGroups = [
  {
    label: "Overview",
    items: [
      { to: "/", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/calendar", icon: Calendar, label: "Calendar" },
    ],
  },
  {
    label: "Content",
    items: [
      { to: "/blogs", icon: FileText, label: "Blogs", color: "#6366f1" },
      { to: "/carousels", icon: Images, label: "Carousels", color: "#06b6d4" },
      { to: "/reels", icon: Film, label: "Reels", color: "#8b5cf6" },
      { to: "/media", icon: Mic, label: "Podcast / YouTube", color: "#f43f5e" },
      { to: "/tweets", icon: MessageCircle, label: "Tweets", color: "#0ea5e9" },
    ],
  },
  {
    label: "Insights",
    items: [
      { to: "/analytics", icon: BarChart2, label: "Analytics" },
      { to: "/reports", icon: FileBarChart, label: "Reports" },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    try { await logout(); toast.success("Signed out"); } catch { toast.error("Logout failed"); }
  };

  return (
    <>
      {open && (
        <div onClick={onClose} style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)",
          zIndex: 99, display: "block",
        }} className="sidebar-backdrop" />
      )}

      <aside className={`sidebar ${open ? "open" : ""}`} style={{
        position: "fixed", top: 0, left: 0, height: "100vh",
        width: "var(--sidebar-w)", background: "#0f172a",
        display: "flex", flexDirection: "column", zIndex: 100,
        overflowY: "auto",
      }}>
        {/* Logo */}
        <div style={{
          padding: "18px 16px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 34, height: 34, flexShrink: 0,
            background: "linear-gradient(135deg, #6366f1, #06b6d4)",
            borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Leaf size={17} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "0.95rem", color: "#fff", letterSpacing: "-0.01em" }}>
              Olive Seeds
            </div>
            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", marginTop: 1, fontWeight: 500 }}>Social Media Planner</div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon" style={{ marginLeft: "auto", color: "rgba(255,255,255,0.4)" }} id="sb-close">
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 10px" }}>
          {navGroups.map(({ label, items }) => (
            <div key={label} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", padding: "0 6px", marginBottom: 4 }}>
                {label}
              </div>
              {items.map(({ to, icon: Icon, label: lbl, color }) => (
                <NavLink key={to} to={to} end={to === "/"} onClick={onClose}
                  style={({ isActive }) => ({
                    display: "flex", alignItems: "center", gap: 9,
                    padding: "8px 10px", borderRadius: 8, marginBottom: 1,
                    fontSize: "0.84rem", fontWeight: 500,
                    color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
                    background: isActive ? "rgba(99,102,241,0.2)" : "transparent",
                    borderLeft: isActive ? "3px solid #6366f1" : "3px solid transparent",
                    transition: "all 0.15s",
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={15} color={isActive ? "#818cf8" : (color || "rgba(255,255,255,0.4)")} />
                      {lbl}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8, padding: "6px 10px" }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #06b6d4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: "0.75rem", flexShrink: 0,
            }}>
              {user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.email?.split("@")[0]}
              </div>
              <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.email}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 8,
            padding: "7px 10px", borderRadius: 8, color: "rgba(255,255,255,0.4)",
            background: "transparent", border: "none", cursor: "pointer", fontSize: "0.82rem",
            transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; e.currentTarget.style.color = "#fca5a5"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      <style>{`
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0); }
          #sb-close { display: flex !important; }
          .sidebar-backdrop { display: block !important; }
        }
        @media (min-width: 769px) {
          #sb-close { display: none; }
          .sidebar-backdrop { display: none !important; }
        }
      `}</style>
    </>
  );
}
