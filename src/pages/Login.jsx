import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Leaf, Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import toast from "react-hot-toast";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // login | register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Fill all fields");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
        toast.success("Welcome back!");
      } else {
        await register(email, password);
        toast.success("Account created!");
      }
      navigate("/");
    } catch (err) {
      toast.error(err.message?.replace("Firebase: ", "").replace(/\(auth\/.*\)/, "") || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      background: "var(--sand)",
      fontFamily: "var(--font-body)",
    }}>
      {/* Left panel — decorative */}
      <div style={{
        flex: 1,
        background: "linear-gradient(145deg, var(--olive-600) 0%, var(--olive-800) 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 48,
        position: "relative",
        overflow: "hidden",
      }}
        className="login-panel"
      >
        {/* Decorative circles */}
        {[200, 340, 480].map((s, i) => (
          <div key={i} style={{
            position: "absolute",
            width: s, height: s,
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "50%",
            top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
          }} />
        ))}

        <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{
            width: 72, height: 72,
            background: "rgba(255,255,255,0.15)",
            borderRadius: 20,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px",
            backdropFilter: "blur(8px)",
          }}>
            <Leaf size={36} color="#fff" />
          </div>
          <h1 style={{ color: "#fff", fontFamily: "var(--font-display)", fontSize: "2.5rem", marginBottom: 12 }}>
            Olive Seeds
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1.05rem", maxWidth: 300, lineHeight: 1.6 }}>
            Your centralized social media command center
          </p>

          <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 12 }}>
            {["📝 Blog & Content Planning", "📊 Analytics & Reporting", "📅 Calendar & Scheduling", "🔗 Multi-Platform Management"].map((f) => (
              <div key={f} style={{
                background: "rgba(255,255,255,0.08)",
                borderRadius: 10,
                padding: "10px 18px",
                color: "rgba(255,255,255,0.85)",
                fontSize: "0.875rem",
                textAlign: "left",
              }}>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        width: "min(480px, 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
      }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", marginBottom: 6 }}>
              {mode === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              {mode === "login"
                ? "Sign in to your Olive Seeds workspace"
                : "Set up your Olive Seeds account"}
            </p>
          </div>

          <form onSubmit={handle}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group" style={{ position: "relative" }}>
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: "absolute", right: 12, top: 34,
                  background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)",
                }}
              >
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "12px", marginTop: 8, fontSize: "1rem" }}
              disabled={loading}
            >
              {loading ? (
                <span className="spinner" />
              ) : mode === "login" ? (
                <><LogIn size={18} /> Sign In</>
              ) : (
                <><UserPlus size={18} /> Create Account</>
              )}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 24 }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              style={{ background: "none", border: "none", color: "var(--olive-600)", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem" }}
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .login-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}
