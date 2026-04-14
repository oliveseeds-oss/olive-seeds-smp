import { useState, useEffect } from "react";
import { BarChart2, Download, TrendingUp, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { db } from "../firebase/config";
import { collection, onSnapshot } from "firebase/firestore";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from "recharts";
import jsPDF from "jspdf";
import toast from "react-hot-toast";

const COLLECTIONS = [
  { key: "blogs", label: "Blogs", color: "#6b7c2c" },
  { key: "carousels", label: "Carousels", color: "#3b82f6" },
  { key: "reels", label: "Reels", color: "#8b5cf6" },
  { key: "media", label: "Media", color: "#ec4899" },
  { key: "tweets", label: "Tweets", color: "#0ea5e9" },
];

const STATUS_COLORS = {
  pending: "#ef4444",
  "in-progress": "#f59e0b",
  completed: "#3b82f6",
  published: "#22c55e",
};

const PLATFORMS = ["instagram", "facebook", "linkedin", "twitter", "youtube", "pinterest", "wix", "threads", "podcast"];

export default function Analytics() {
  const [period, setPeriod] = useState("monthly");
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs = [];
    const temp = {};
    let loaded = 0;
    COLLECTIONS.forEach(({ key }) => {
      const unsub = onSnapshot(collection(db, key), (snap) => {
        temp[key] = snap.docs.map(d => d.data());
        loaded++;
        if (loaded >= COLLECTIONS.length) {
          setData({ ...temp });
          setLoading(false);
        }
      });
      unsubs.push(unsub);
    });
    return () => unsubs.forEach(u => u());
  }, []);

  // Compute summary stats
  const all = Object.values(data).flat();
  const totalRecords = all.length;
  const totalPublished = all.filter(r => r.status === "published").length;
  const totalPending = all.filter(r => r.status === "pending").length;
  const totalInProgress = all.filter(r => r.status === "in-progress").length;

  // Status distribution per collection
  const statusData = COLLECTIONS.map(({ key, label, color }) => {
    const records = data[key] || [];
    return {
      name: label,
      published: records.filter(r => r.status === "published").length,
      completed: records.filter(r => r.status === "completed").length,
      "in-progress": records.filter(r => r.status === "in-progress").length,
      pending: records.filter(r => r.status === "pending").length,
      color,
    };
  });

  // Platform response fill rate
  const platformData = PLATFORMS.map((p) => {
    let filled = 0, total = 0;
    Object.values(data).flat().forEach(r => {
      if (r.response && p in r.response) {
        total++;
        if (r.response[p]) filled++;
      }
    });
    return { name: p.charAt(0).toUpperCase() + p.slice(1), filled, total, rate: total ? Math.round((filled / total) * 100) : 0 };
  }).filter(p => p.total > 0);

  // Overall pie
  const overallPie = [
    { name: "Published", value: totalPublished, color: "#22c55e" },
    { name: "In Progress", value: totalInProgress, color: "#f59e0b" },
    { name: "Pending", value: totalPending, color: "#ef4444" },
    { name: "Completed", value: all.filter(r => r.status === "completed").length, color: "#3b82f6" },
  ].filter(d => d.value > 0);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Olive Seeds - Analytics Report", 20, 20);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.line(20, 35, 190, 35);

    let y = 45;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Summary", 20, y); y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Total Records: ${totalRecords}`, 20, y); y += 7;
    doc.text(`Published: ${totalPublished}`, 20, y); y += 7;
    doc.text(`Pending: ${totalPending}`, 20, y); y += 7;
    doc.text(`In Progress: ${totalInProgress}`, 20, y); y += 12;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Records by Collection", 20, y); y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    statusData.forEach(({ name, published, pending }) => {
      doc.text(`${name}: ${published + pending} total (${published} published, ${pending} pending)`, 20, y);
      y += 7;
    });

    doc.save("olive-seeds-analytics.pdf");
    toast.success("PDF exported!");
  };

  const exportCSV = () => {
    const rows = [
      ["Collection", "Total", "Published", "In Progress", "Completed", "Pending"],
      ...statusData.map(d => [
        d.name, d.published + d["in-progress"] + d.completed + d.pending,
        d.published, d["in-progress"], d.completed, d.pending
      ])
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "olive-seeds-analytics.csv";
    a.click();
    toast.success("CSV exported!");
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
      <span className="spinner-olive spinner" />
    </div>
  );

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="section-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="stat-icon" style={{ background: "#6b7c2c20", color: "#6b7c2c", marginBottom: 0 }}>
            <BarChart2 size={20} />
          </div>
          <h2 className="section-title">Analytics</h2>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}><Download size={14} /> CSV</button>
          <button className="btn btn-primary btn-sm" onClick={exportPDF}><Download size={14} /> PDF Report</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: "Total Records", value: totalRecords, icon: TrendingUp, color: "#6b7c2c", bg: "#6b7c2c15" },
          { label: "Published", value: totalPublished, icon: CheckCircle, color: "#22c55e", bg: "#22c55e15" },
          { label: "In Progress", value: totalInProgress, icon: Clock, color: "#f59e0b", bg: "#f59e0b15" },
          { label: "Pending", value: totalPending, icon: AlertCircle, color: "#ef4444", bg: "#ef444415" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
            <div className="stat-icon" style={{ background: bg, color, marginBottom: 12 }}>
              <Icon size={20} />
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Row 1: Status stacked bar + Pie */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ fontFamily: "var(--font-display)", marginBottom: 20 }}>Status by Collection</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusData} margin={{ left: -20, right: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--parchment)" }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="published" fill="#22c55e" stackId="a" radius={[0,0,0,0]} name="Published" />
              <Bar dataKey="completed" fill="#3b82f6" stackId="a" name="Completed" />
              <Bar dataKey="in-progress" fill="#f59e0b" stackId="a" name="In Progress" />
              <Bar dataKey="pending" fill="#ef4444" stackId="a" radius={[4,4,0,0]} name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ fontFamily: "var(--font-display)", marginBottom: 20 }}>Overall Status</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={overallPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40} strokeWidth={2}>
                  {overallPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--parchment)" }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 110 }}>
              {overallPie.map((d) => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{d.name}</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>{d.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Platform fill rate */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: "var(--font-display)", marginBottom: 20 }}>Platform Response Fill Rate</h3>
        {platformData.length === 0 ? (
          <div className="empty-state" style={{ padding: 32 }}>
            <p>No platform response data yet. Add records with responses to see stats.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={platformData} margin={{ left: -20, right: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--parchment)" }}
                formatter={(v) => [`${v}%`, "Fill Rate"]}
              />
              <Bar dataKey="rate" radius={[4, 4, 0, 0]} name="Fill Rate %">
                {platformData.map((_, i) => (
                  <Cell key={i} fill={`hsl(${80 + i * 25}, 55%, 45%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Row 3: Collection breakdown table */}
      <div className="card">
        <h3 style={{ fontFamily: "var(--font-display)", marginBottom: 20 }}>Collection Breakdown</h3>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Collection</th>
                <th>Total</th>
                <th>Published</th>
                <th>Completed</th>
                <th>In Progress</th>
                <th>Pending</th>
                <th>Completion %</th>
              </tr>
            </thead>
            <tbody>
              {statusData.map((d) => {
                const total = d.published + d.completed + d["in-progress"] + d.pending;
                const done = d.published + d.completed;
                const pct = total ? Math.round((done / total) * 100) : 0;
                return (
                  <tr key={d.name}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color }} />
                        <strong>{d.name}</strong>
                      </div>
                    </td>
                    <td><strong>{total}</strong></td>
                    <td><span className="badge badge-green">{d.published}</span></td>
                    <td><span className="badge badge-blue">{d.completed}</span></td>
                    <td><span className="badge badge-amber">{d["in-progress"]}</span></td>
                    <td><span className="badge badge-red">{d.pending}</span></td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: "var(--parchment)", borderRadius: 99, maxWidth: 80 }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: d.color, borderRadius: 99 }} />
                        </div>
                        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: d.color }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
