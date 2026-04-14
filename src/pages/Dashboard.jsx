import { useState, useEffect } from "react";
import { FileText, Images, Film, Mic, MessageCircle, CheckCircle, Clock, AlertCircle, TrendingUp, ArrowUpRight } from "lucide-react";
import { db } from "../firebase/config";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLS = [
  { key: "blogs", label: "Blogs", icon: FileText, color: "#6366f1", bg: "#eef2ff" },
  { key: "carousels", label: "Carousels", icon: Images, color: "#06b6d4", bg: "#ecfeff" },
  { key: "reels", label: "Reels", icon: Film, color: "#8b5cf6", bg: "#ede9fe" },
  { key: "media", label: "Media", icon: Mic, color: "#f43f5e", bg: "#fff1f2" },
  { key: "tweets", label: "Tweets", icon: MessageCircle, color: "#0ea5e9", bg: "#f0f9ff" },
];

const DAY_TASKS = { Monday:"Blog", Tuesday:"App/Web", Wednesday:"Carousel", Thursday:"Reel", Friday:"YouTube/Podcast", Saturday:"Campaign/Brand", Sunday:"Review & Plan" };
const DAY_COLORS = { Monday:"#6366f1", Tuesday:"#06b6d4", Wednesday:"#8b5cf6", Thursday:"#f43f5e", Friday:"#f59e0b", Saturday:"#10b981", Sunday:"#64748b" };

function useColData(col) {
  const [d, setD] = useState({ total:0, pending:0, done:0 });
  useEffect(() => {
    return onSnapshot(collection(db, col), snap => {
      const docs = snap.docs.map(x => x.data());
      setD({ total: docs.length, pending: docs.filter(x => x.status==="pending").length, done: docs.filter(x => x.status==="published"||x.status==="completed").length });
    });
  }, [col]);
  return d;
}

function MiniStatCard({ col }) {
  const d = useColData(col.key);
  const Icon = col.icon;
  const pct = d.total ? Math.round((d.done/d.total)*100) : 0;
  return (
    <div className="stat-card" style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: col.color, borderRadius: "var(--radius-lg) var(--radius-lg) 0 0" }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: col.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={col.color} />
        </div>
        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444", background: pct >= 70 ? "#d1fae5" : pct >= 40 ? "#fef3c7" : "#fee2e2", padding: "2px 6px", borderRadius: 99 }}>
          {pct}%
        </span>
      </div>
      <div className="stat-value" style={{ fontSize: "1.7rem" }}>{d.total}</div>
      <div className="stat-label">{col.label}</div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <span style={{ fontSize: "0.68rem", color: "#ef4444", fontWeight: 600 }}>{d.pending} pending</span>
        <span style={{ color: "var(--border)", fontSize: "0.68rem" }}>·</span>
        <span style={{ fontSize: "0.68rem", color: "#10b981", fontWeight: 600 }}>{d.done} done</span>
      </div>
      <div className="score-bar" style={{ marginTop: 8 }}>
        <div className="score-fill" style={{ width: `${pct}%`, background: col.color }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const today = format(new Date(), "EEEE");
  const todayTask = DAY_TASKS[today] || "Rest";
  const todayColor = DAY_COLORS[today] || "#6366f1";
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [totalAll, setTotalAll] = useState({ total:0, pending:0, done:0, inprogress:0 });

  useEffect(() => {
    return onSnapshot(query(collection(db, "blogs"), orderBy("createdAt","desc"), limit(4)),
      snap => setRecentBlogs(snap.docs.map(d => ({ id:d.id, ...d.data() }))));
  }, []);

  useEffect(() => {
    const temp = {}; const unsubs = [];
    COLS.forEach(({ key, label }) => {
      const unsub = onSnapshot(collection(db, key), snap => {
        const docs = snap.docs.map(d => d.data());
        temp[label] = { count: docs.length, pending: docs.filter(x=>x.status==="pending").length, done: docs.filter(x=>x.status==="published"||x.status==="completed").length };
        const all = Object.values(temp);
        setChartData(Object.entries(temp).map(([name,v])=>({ name, count:v.count, pending:v.pending, done:v.done })));
        setTotalAll({ total: all.reduce((s,x)=>s+x.count,0), pending: all.reduce((s,x)=>s+x.pending,0), done: all.reduce((s,x)=>s+x.done,0), inprogress: all.reduce((s,x)=>s+(x.count-x.pending-x.done),0) });
      });
      unsubs.push(unsub);
    });
    return () => unsubs.forEach(u=>u());
  }, []);

  const PIE = [
    { name:"Published", value: totalAll.done, color:"#10b981" },
    { name:"Pending", value: totalAll.pending, color:"#ef4444" },
    { name:"In Progress", value: totalAll.inprogress, color:"#f59e0b" },
  ].filter(x=>x.value>0);

  const CustomTooltip = ({ active, payload }) => {
    if (!active||!payload?.length) return null;
    return (
      <div style={{ background:"#fff", border:"1px solid var(--border-light)", borderRadius:8, padding:"8px 12px", fontSize:"0.8rem", boxShadow:"var(--shadow)" }}>
        <div style={{ fontWeight:700, marginBottom:4 }}>{payload[0]?.payload?.name}</div>
        {payload.map(p => <div key={p.name} style={{ color:p.fill||p.color }}>{p.name}: <strong>{p.value}</strong></div>)}
      </div>
    );
  };

  return (
    <div className="fade-in">
      {/* Top banner */}
      <div style={{
        background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
        borderRadius: "var(--radius-lg)", padding: "20px 24px", marginBottom: 22,
        display: "flex", alignItems: "center", gap: 16, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,0.06)" }} />
        <div style={{ position:"absolute", bottom:-60, right:60, width:140, height:140, borderRadius:"50%", background:"rgba(255,255,255,0.04)" }} />
        <div style={{ flex:1, position:"relative", zIndex:1 }}>
          <div style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.7)", fontWeight:600, marginBottom:4 }}>
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </div>
          <h1 style={{ color:"#fff", fontFamily:"var(--font-display)", fontSize:"1.5rem", marginBottom:6 }}>
            {new Date().getHours()<12?"Good Morning":new Date().getHours()<17?"Good Afternoon":"Good Evening"} 👋
          </h1>
          <p style={{ color:"rgba(255,255,255,0.75)", fontSize:"0.875rem" }}>
            Today's focus: <strong style={{ color:"#fff" }}>{todayTask}</strong>
          </p>
        </div>
        <div style={{ textAlign:"right", position:"relative", zIndex:1 }}>
          <div style={{ fontSize:"0.68rem", color:"rgba(255,255,255,0.6)", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.05em" }}>Scheduled Task</div>
          <div style={{ background:"rgba(255,255,255,0.15)", backdropFilter:"blur(8px)", borderRadius:10, padding:"8px 16px" }}>
            <div style={{ color:"#fff", fontWeight:800, fontSize:"1rem", fontFamily:"var(--font-display)" }}>{todayTask}</div>
            <div style={{ color:"rgba(255,255,255,0.65)", fontSize:"0.72rem" }}>{today}</div>
          </div>
        </div>
      </div>

      {/* Global KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
        {[
          { label:"Total Content", value:totalAll.total, icon:TrendingUp, color:"#6366f1", bg:"#eef2ff" },
          { label:"Published", value:totalAll.done, icon:CheckCircle, color:"#10b981", bg:"#d1fae5" },
          { label:"In Progress", value:totalAll.inprogress, icon:Clock, color:"#f59e0b", bg:"#fef3c7" },
          { label:"Pending", value:totalAll.pending, icon:AlertCircle, color:"#ef4444", bg:"#fee2e2" },
        ].map(({ label,value,icon:Icon,color,bg }) => (
          <div key={label} style={{ background:"var(--white)", borderRadius:"var(--radius-lg)", padding:"16px 18px", border:"1px solid var(--border-light)", boxShadow:"var(--shadow-xs)", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize:"1.6rem", fontWeight:800, fontFamily:"var(--font-display)", lineHeight:1 }}>{value}</div>
              <div style={{ fontSize:"0.72rem", color:"var(--text-3)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.04em", marginTop:3 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Per-collection cards */}
      <div className="grid-5" style={{ marginBottom:22 }}>
        {COLS.map(col => <MiniStatCard key={col.key} col={col} />)}
      </div>

      {/* Charts row */}
      <div className="grid-2" style={{ marginBottom:22 }}>
        <div className="card">
          <div style={{ marginBottom:14 }}>
            <h3>Content by Type</h3>
            <p style={{ fontSize:"0.8rem", color:"var(--text-3)", marginTop:2 }}>Published vs Pending breakdown</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ left:-20, right:0, top:0, bottom:0 }}>
              <XAxis dataKey="name" tick={{ fontSize:11, fill:"var(--text-3)" }} />
              <YAxis tick={{ fontSize:11, fill:"var(--text-3)" }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="done" fill="#10b981" radius={[4,4,0,0]} name="Done" stackId="a" />
              <Bar dataKey="pending" fill="#ef4444" radius={[4,4,0,0]} name="Pending" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div style={{ marginBottom:14 }}>
            <h3>Status Overview</h3>
            <p style={{ fontSize:"0.8rem", color:"var(--text-3)", marginTop:2 }}>Overall content status</p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={PIE} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={72} innerRadius={36} strokeWidth={3} stroke="#fff">
                  {PIE.map((d,i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize:12, borderRadius:8, border:"1px solid var(--border-light)", boxShadow:"var(--shadow)" }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display:"flex", flexDirection:"column", gap:8, minWidth:100 }}>
              {PIE.map(d => (
                <div key={d.name} style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:9, height:9, borderRadius:2, background:d.color, flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:"0.72rem", color:"var(--text-3)" }}>{d.name}</div>
                    <div style={{ fontWeight:800, fontSize:"0.95rem" }}>{d.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent + Schedule */}
      <div className="grid-2">
        <div className="card">
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <h3>Recent Blogs</h3>
            <a href="/blogs" style={{ fontSize:"0.78rem", color:"var(--primary)", fontWeight:600, display:"flex", alignItems:"center", gap:3 }}>
              View all <ArrowUpRight size={12} />
            </a>
          </div>
          {recentBlogs.length===0 ? (
            <div className="empty-state" style={{ padding:32 }}>
              <div className="empty-icon"><FileText size={20} /></div>
              <p style={{ fontSize:"0.85rem" }}>No blogs yet</p>
            </div>
          ) : recentBlogs.map(b => (
            <div key={b.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", background:"var(--bg)", borderRadius:8, marginBottom:6 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:"#eef2ff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <FileText size={14} color="#6366f1" />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:600, fontSize:"0.84rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{b.title||"Untitled"}</div>
                <div style={{ fontSize:"0.72rem", color:"var(--text-3)", marginTop:1 }}>{b.date||"—"}</div>
              </div>
              <span className={`badge ${b.status==="published"?"badge-green":b.status==="pending"?"badge-red":"badge-amber"}`}>{b.status||"pending"}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ marginBottom:14 }}>Weekly Schedule</h3>
          {Object.entries(DAY_TASKS).map(([day, task]) => (
            <div key={day} style={{
              display:"flex", alignItems:"center", gap:10, padding:"8px 12px",
              borderRadius:8, marginBottom:4,
              background: day===today ? "#eef2ff" : "transparent",
              border: day===today ? "1.5px solid #c7d2fe" : "1.5px solid transparent",
            }}>
              <div style={{ width:8, height:8, borderRadius:2, background:DAY_COLORS[day], flexShrink:0 }} />
              <span style={{ fontWeight: day===today?700:500, color: day===today?"#4338ca":"var(--text-2)", fontSize:"0.84rem", width:80 }}>{day}</span>
              <span style={{ color:"var(--text-3)", fontSize:"0.82rem" }}>{task}</span>
              {day===today && <span className="badge badge-indigo" style={{ marginLeft:"auto" }}>Today</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
