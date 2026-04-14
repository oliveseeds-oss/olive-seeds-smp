import { useState, useEffect } from "react";
import { FileText, Images, Film, Mic, MessageCircle, CheckCircle, Clock, AlertCircle, TrendingUp } from "lucide-react";
import { db } from "../firebase/config";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLLECTIONS = [
  { key: "blogs", label: "Blogs", icon: FileText, color: "#6b7c2c" },
  { key: "carousels", label: "Carousels", icon: Images, color: "#3b82f6" },
  { key: "reels", label: "Reels", icon: Film, color: "#8b5cf6" },
  { key: "media", label: "Media", icon: Mic, color: "#ec4899" },
  { key: "tweets", label: "Tweets", icon: MessageCircle, color: "#0ea5e9" },
];

const DAY_TASKS = {
  Monday: "Blog",
  Tuesday: "App/Web",
  Wednesday: "Carousel",
  Thursday: "Reel",
  Friday: "YouTube/Podcast",
  Saturday: "Campaign/Brand",
  Sunday: "Review & Plan",
};

function useCollectionCount(col) {
  const [counts, setCounts] = useState({ total: 0, pending: 0, completed: 0 });
  useEffect(() => {
    const unsub = onSnapshot(collection(db, col), (snap) => {
      const docs = snap.docs.map(d => d.data());
      setCounts({
        total: docs.length,
        pending: docs.filter(d => d.status === "pending").length,
        completed: docs.filter(d => d.status === "published" || d.status === "completed").length,
      });
    });
    return unsub;
  }, [col]);
  return counts;
}

function StatBox({ col }) {
  const counts = useCollectionCount(col.key);
  const Icon = col.icon;
  return (
    <div className="stat-card" style={{ borderTop: `3px solid ${col.color}` }}>
      <div className="stat-icon" style={{ background: col.color + "15", color: col.color }}>
        <Icon size={20} />
      </div>
      <div className="stat-value">{counts.total}</div>
      <div className="stat-label">{col.label}</div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <span className="badge badge-red" style={{ fontSize: "0.68rem" }}>{counts.pending} pending</span>
        <span className="badge badge-green" style={{ fontSize: "0.68rem" }}>{counts.completed} done</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const today = format(new Date(), "EEEE");
  const todayTask = DAY_TASKS[today] || "Rest";
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [allCounts, setAllCounts] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "blogs"), orderBy("createdAt", "desc"), limit(5)),
      (snap) => setRecentBlogs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, []);

  useEffect(() => {
    const unsubs = [];
    const tempCounts = {};
    COLLECTIONS.forEach(({ key, label }) => {
      const unsub = onSnapshot(collection(db, key), (snap) => {
        tempCounts[label] = snap.docs.length;
        setAllCounts(Object.entries(tempCounts).map(([name, count]) => ({ name, count })));
      });
      unsubs.push(unsub);
    });
    return () => unsubs.forEach(u => u());
  }, []);

  const PIE_COLORS = ["#6b7c2c", "#3b82f6", "#8b5cf6", "#ec4899", "#0ea5e9"];

  return (
    <div className="fade-in">
      {/* Welcome */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.9rem", marginBottom: 4 }}>
          Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"} 🌿
        </h1>
        <p style={{ color: "var(--text-muted)" }}>
          {format(new Date(), "EEEE, MMMM d, yyyy")} — Today's focus: <strong style={{ color: "var(--olive-700)" }}>{todayTask}</strong>
        </p>
      </div>

      {/* Today's Task Banner */}
      <div style={{
        background: "linear-gradient(135deg, var(--olive-600), var(--olive-800))",
        borderRadius: "var(--radius-lg)",
        padding: "20px 28px",
        marginBottom: 28,
        display: "flex",
        alignItems: "center",
        gap: 16,
        color: "#fff",
      }}>
        <div style={{
          width: 48, height: 48,
          background: "rgba(255,255,255,0.15)",
          borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.5rem",
        }}>
          📋
        </div>
        <div>
          <div style={{ fontSize: "0.78rem", opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
            Today's Scheduled Task
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 600 }}>
            {todayTask}
          </div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontSize: "0.8rem", opacity: 0.7 }}>Day</div>
          <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{today}</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {COLLECTIONS.map((col) => <StatBox key={col.key} col={col} />)}
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: 28 }}>
        {/* Bar chart */}
        <div className="card">
          <h3 style={{ marginBottom: 20, fontFamily: "var(--font-display)" }}>Content Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={allCounts} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid var(--parchment)", borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="count" fill="var(--olive-500)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="card">
          <h3 style={{ marginBottom: 16, fontFamily: "var(--font-display)" }}>Content Mix</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={allCounts} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} strokeWidth={2}>
                  {allCounts.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid var(--parchment)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {allCounts.map((d, i) => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.8rem" }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                  <span style={{ color: "var(--text-mid)" }}>{d.name}</span>
                  <span style={{ fontWeight: 700, color: "var(--text-dark)", marginLeft: "auto" }}>{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Blogs + Day Schedule */}
      <div className="grid-2">
        {/* Recent */}
        <div className="card">
          <h3 style={{ marginBottom: 16, fontFamily: "var(--font-display)" }}>Recent Blogs</h3>
          {recentBlogs.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              <p style={{ fontSize: "0.85rem" }}>No blogs yet</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentBlogs.map((b) => (
                <div key={b.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", background: "var(--sand)", borderRadius: "var(--radius-sm)"
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {b.title || "Untitled"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>{b.date || "—"}</div>
                  </div>
                  <span className={`badge ${b.status === "published" ? "badge-green" : b.status === "pending" ? "badge-red" : "badge-amber"}`}>
                    {b.status || "pending"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Day Schedule */}
        <div className="card">
          <h3 style={{ marginBottom: 16, fontFamily: "var(--font-display)" }}>Weekly Schedule</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(DAY_TASKS).map(([day, task]) => (
              <div key={day} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "9px 14px",
                borderRadius: "var(--radius-sm)",
                background: day === today ? "var(--olive-100)" : "var(--sand)",
                border: day === today ? "1.5px solid var(--olive-300)" : "1.5px solid transparent",
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: day === today ? "var(--olive-500)" : "var(--olive-200)",
                  flexShrink: 0,
                }} />
                <span style={{
                  fontWeight: day === today ? 700 : 400,
                  color: day === today ? "var(--olive-700)" : "var(--text-mid)",
                  fontSize: "0.875rem",
                  width: 80,
                }}>
                  {day}
                </span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{task}</span>
                {day === today && <span className="badge badge-green" style={{ marginLeft: "auto", fontSize: "0.65rem" }}>Today</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
