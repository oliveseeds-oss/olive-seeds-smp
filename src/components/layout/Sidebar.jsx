import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FileText, Images, Film, Mic, MessageCircle,
  Calendar, BarChart2, Settings, LogOut, Menu, X, Leaf
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/blogs", icon: FileText, label: "Blogs" },
  { to: "/carousels", icon: Images, label: "Carousels" },
  { to: "/reels", icon: Film, label: "Reels" },
  { to: "/media", icon: Mic, label: "Podcast / YouTube" },
  { to: "/tweets", icon: MessageCircle, label: "Tweets" },
  { to: "/calendar", icon: Calendar, label: "Calendar" },
  { to: "/analytics", icon: BarChart2, label: "Analytics" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar({ open, onClose }) {
  const { logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch {
      toast.error("Logout failed");
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)",
            zIndex: 99, display: "none"
          }}
        />
      )}

      <aside
        className={`sidebar ${open ? "open" : ""}`}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: "var(--sidebar-w)",
          background: "var(--warm-white)",
          borderRight: "1px solid rgba(139,160,84,0.15)",
          display: "flex",
          flexDirection: "column",
          zIndex: 100,
          boxShadow: "2px 0 20px rgba(0,0,0,0.04)",
          transition: "transform var(--transition)",
        }}
      >
        {/* Logo */}
        <div style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid var(--olive-100)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <div style={{
            width: 38, height: 38,
            background: "linear-gradient(135deg, var(--olive-500), var(--olive-700))",
            borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Leaf size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.05rem", color: "var(--olive-700)" }}>
              Olive Seeds
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 1 }}>Social Planner</div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            style={{ marginLeft: "auto", display: "none" }}
            id="sidebar-close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 12px", overflowY: "auto" }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={onClose}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                marginBottom: 2,
                fontSize: "0.875rem",
                fontWeight: 500,
                color: isActive ? "var(--olive-700)" : "var(--text-muted)",
                background: isActive ? "var(--olive-100)" : "transparent",
                borderLeft: isActive ? "3px solid var(--olive-500)" : "3px solid transparent",
                transition: "all var(--transition)",
              })}
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: "12px", borderTop: "1px solid var(--olive-100)" }}>
          <button
            onClick={handleLogout}
            className="btn btn-ghost"
            style={{ width: "100%", justifyContent: "flex-start", gap: 10, color: "var(--accent-red)" }}
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </aside>

      <style>{`
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0); box-shadow: var(--shadow-lg); }
          .sidebar.open + .sidebar-overlay { display: block !important; }
          #sidebar-close { display: flex !important; }
        }
      `}</style>
    </>
  );
}
