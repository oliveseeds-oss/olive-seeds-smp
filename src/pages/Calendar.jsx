import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalIcon, X, FileText, Images, Film, Mic, MessageCircle, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";
import { db } from "../firebase/config";
import { collection, onSnapshot } from "firebase/firestore";

const DAY_TASKS = {
  Monday:{ task:"Blog", color:"#6366f1" },
  Tuesday:{ task:"App/Web", color:"#06b6d4" },
  Wednesday:{ task:"Carousel", color:"#8b5cf6" },
  Thursday:{ task:"Reel", color:"#f43f5e" },
  Friday:{ task:"YouTube/Podcast", color:"#f59e0b" },
  Saturday:{ task:"Campaign/Brand", color:"#10b981" },
  Sunday:{ task:"Review & Plan", color:"#64748b" },
};

const COL_META = {
  blogs:{ label:"Blog", color:"#6366f1", bg:"#eef2ff", icon:FileText },
  carousels:{ label:"Carousel", color:"#06b6d4", bg:"#ecfeff", icon:Images },
  reels:{ label:"Reel", color:"#8b5cf6", bg:"#ede9fe", icon:Film },
  media:{ label:"Media", color:"#f43f5e", bg:"#fff1f2", icon:Mic },
  tweets:{ label:"Tweet", color:"#0ea5e9", bg:"#f0f9ff", icon:MessageCircle },
};

const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function CalendarPage() {
  const [current, setCurrent] = useState(new Date());
  const [allRecords, setAllRecords] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayRecords, setDayRecords] = useState([]);

  useEffect(() => {
    const unsubs = [];
    const temp = {};
    Object.keys(COL_META).forEach(col => {
      const unsub = onSnapshot(collection(db, col), snap => {
        temp[col] = snap.docs.map(d => ({ id:d.id, _col:col, ...d.data() }));
        setAllRecords(Object.values(temp).flat());
      });
      unsubs.push(unsub);
    });
    return () => unsubs.forEach(u=>u());
  }, []);

  const monthStart = startOfMonth(current);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(endOfMonth(current));
  const days = eachDayOfInterval({ start:gridStart, end:gridEnd });

  const getForDay = day => {
    const ds = format(day,"yyyy-MM-dd");
    return allRecords.filter(r => r.date === ds);
  };

  const openDay = day => {
    setSelectedDay(day);
    setDayRecords(getForDay(day));
  };

  const statusColor = s => s==="published"?"#10b981":s==="completed"?"#3b82f6":s==="in-progress"?"#f59e0b":"#ef4444";
  const statusBg = s => s==="published"?"#d1fae5":s==="completed"?"#dbeafe":s==="in-progress"?"#fef3c7":"#fee2e2";

  return (
    <div className="fade-in" style={{ display:"flex", gap:18, height:"calc(100vh - 120px)", minHeight:500 }}>
      {/* Main calendar */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:9, background:"#eef2ff", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <CalIcon size={18} color="#6366f1" />
            </div>
            <div>
              <h2 className="section-title" style={{ marginBottom:0 }}>Calendar</h2>
              <p style={{ fontSize:"0.75rem", color:"var(--text-3)", marginTop:1 }}>Click any day to see tasks</p>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <button className="btn btn-secondary btn-sm" onClick={()=>setCurrent(subMonths(current,1))}><ChevronLeft size={14}/></button>
            <span style={{ fontFamily:"var(--font-display)", fontWeight:700, minWidth:150, textAlign:"center", fontSize:"1rem" }}>
              {format(current,"MMMM yyyy")}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={()=>setCurrent(addMonths(current,1))}><ChevronRight size={14}/></button>
            <button className="btn btn-primary btn-sm" onClick={()=>setCurrent(new Date())}>Today</button>
          </div>
        </div>

        {/* Day-task legend */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
          {Object.entries(DAY_TASKS).map(([day,{task,color}])=>(
            <div key={day} style={{ display:"flex", alignItems:"center", gap:5, padding:"2px 8px", background:"var(--white)", borderRadius:99, border:"1px solid var(--border-light)", fontSize:"0.68rem" }}>
              <div style={{ width:7, height:7, borderRadius:2, background:color }} />
              <span style={{ color:"var(--text-3)", fontWeight:600 }}>{day.slice(0,3)}</span>
              <span style={{ color:"var(--text-1)", fontWeight:700 }}>{task}</span>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="card" style={{ padding:0, overflow:"hidden", flex:1 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:"1px solid var(--border-light)" }}>
            {WEEKDAYS.map(d => (
              <div key={d} style={{ padding:"9px 6px", textAlign:"center", fontSize:"0.68rem", fontWeight:700, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.06em", background:"var(--bg)" }}>{d}</div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>
            {days.map((day,i) => {
              const dayName = format(day,"EEEE");
              const dt = DAY_TASKS[dayName];
              const inMonth = isSameMonth(day,current);
              const today = isToday(day);
              const recs = getForDay(day);
              const isSelected = selectedDay && format(selectedDay,"yyyy-MM-dd")===format(day,"yyyy-MM-dd");
              return (
                <div key={i} onClick={()=>openDay(day)}
                  style={{
                    minHeight:80, padding:"6px 5px",
                    borderRight:(i+1)%7!==0?"1px solid var(--border-light)":"none",
                    borderBottom:"1px solid var(--border-light)",
                    background: isSelected ? "#eef2ff" : today ? "#fafbff" : inMonth ? "var(--white)" : "var(--bg)",
                    opacity: inMonth ? 1 : 0.45,
                    cursor:"pointer",
                    transition:"background 0.12s",
                    outline: isSelected ? "2px solid #6366f1" : today ? "2px solid #c7d2fe" : "none",
                    outlineOffset:"-2px",
                    position:"relative",
                  }}
                  onMouseEnter={e=>{ if(!isSelected) e.currentTarget.style.background="#f8faff"; }}
                  onMouseLeave={e=>{ if(!isSelected) e.currentTarget.style.background=today?"#fafbff":inMonth?"var(--white)":"var(--bg)"; }}
                >
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:3 }}>
                    <span style={{ width:22, height:22, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:"50%", fontSize:"0.78rem", fontWeight: today?800:400, background: today?"#6366f1":"transparent", color: today?"#fff":"var(--text-1)" }}>
                      {format(day,"d")}
                    </span>
                    {recs.length>0 && <span style={{ fontSize:"0.58rem", fontWeight:700, color:"var(--text-3)", background:"var(--surface2)", borderRadius:99, padding:"0 4px" }}>{recs.length}</span>}
                  </div>
                  {dt && inMonth && (
                    <div style={{ fontSize:"0.6rem", fontWeight:700, color:dt.color, background:dt.color+"18", borderRadius:4, padding:"1px 4px", marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {dt.task}
                    </div>
                  )}
                  {recs.slice(0,2).map((r,j) => {
                    const m = COL_META[r._col];
                    return (
                      <div key={j} style={{ fontSize:"0.58rem", background:m.bg, color:m.color, borderRadius:4, padding:"1px 4px", marginBottom:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight:600 }}>
                        {r.title||r.tweet||"—"}
                      </div>
                    );
                  })}
                  {recs.length>2 && <div style={{ fontSize:"0.55rem", color:"var(--text-3)", padding:"0 4px" }}>+{recs.length-2}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day Panel */}
      <div style={{
        width: selectedDay ? 300 : 0,
        minWidth: selectedDay ? 300 : 0,
        overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}>
        {selectedDay && (
          <div className="card" style={{ height:"100%", overflowY:"auto", padding:0, display:"flex", flexDirection:"column" }}>
            {/* Panel header */}
            <div style={{ padding:"16px", borderBottom:"1px solid var(--border-light)", position:"sticky", top:0, background:"var(--white)", zIndex:1 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:"1.1rem" }}>{format(selectedDay,"d MMM")}</div>
                  <div style={{ fontSize:"0.75rem", color:"var(--text-3)", marginTop:2 }}>{format(selectedDay,"EEEE, yyyy")}</div>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={()=>setSelectedDay(null)}><X size={16}/></button>
              </div>
              {/* Today's scheduled task */}
              {DAY_TASKS[format(selectedDay,"EEEE")] && (
                <div style={{ marginTop:10, padding:"8px 10px", borderRadius:8, background:DAY_TASKS[format(selectedDay,"EEEE")].color+"15", border:`1px solid ${DAY_TASKS[format(selectedDay,"EEEE")].color}30` }}>
                  <div style={{ fontSize:"0.65rem", fontWeight:700, color:"var(--text-3)", marginBottom:2, textTransform:"uppercase" }}>Scheduled Task</div>
                  <div style={{ fontWeight:700, color:DAY_TASKS[format(selectedDay,"EEEE")].color, fontSize:"0.9rem" }}>
                    {DAY_TASKS[format(selectedDay,"EEEE")].task}
                  </div>
                </div>
              )}
            </div>

            {/* Records */}
            <div style={{ padding:"12px", flex:1 }}>
              {dayRecords.length===0 ? (
                <div style={{ textAlign:"center", padding:"40px 16px", color:"var(--text-3)" }}>
                  <Clock size={32} style={{ opacity:0.3, margin:"0 auto 10px" }} />
                  <p style={{ fontSize:"0.85rem", fontWeight:600 }}>No tasks scheduled</p>
                  <p style={{ fontSize:"0.75rem", marginTop:4 }}>Add content with this date to see it here</p>
                </div>
              ) : (
                <>
                  <div style={{ fontSize:"0.72rem", fontWeight:700, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>
                    {dayRecords.length} task{dayRecords.length!==1?"s":""} on this day
                  </div>
                  {dayRecords.map(r => {
                    const m = COL_META[r._col];
                    const Icon = m.icon;
                    return (
                      <div key={r.id} style={{ background:"var(--bg)", borderRadius:10, padding:"12px", marginBottom:8, border:`1px solid ${m.color}25` }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                          <div style={{ width:28, height:28, borderRadius:7, background:m.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                            <Icon size={13} color={m.color} />
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:"0.68rem", fontWeight:700, color:m.color, textTransform:"uppercase" }}>{m.label}</div>
                            <div style={{ fontWeight:700, fontSize:"0.84rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.title||r.tweet||"Untitled"}</div>
                          </div>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                          <span style={{ fontSize:"0.7rem", fontWeight:700, padding:"2px 8px", borderRadius:99, background:statusBg(r.status), color:statusColor(r.status) }}>
                            {r.status||"pending"}
                          </span>
                          {r.tags && <span style={{ fontSize:"0.68rem", color:"var(--text-3)" }}>{String(r.tags).slice(0,24)}</span>}
                        </div>
                        {r.caption && <p style={{ fontSize:"0.75rem", color:"var(--text-3)", marginTop:8, lineHeight:1.5, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{r.caption}</p>}
                        {/* Platform scores */}
                        {r.response && Object.entries(r.response).filter(([,v])=>v&&!isNaN(Number(v))).length>0 && (
                          <div style={{ marginTop:8, display:"flex", flexWrap:"wrap", gap:4 }}>
                            {Object.entries(r.response).filter(([,v])=>v&&!isNaN(Number(v))).map(([p,v])=>(
                              <div key={p} style={{ display:"flex", alignItems:"center", gap:3, padding:"2px 6px", background:"var(--white)", borderRadius:99, border:"1px solid var(--border-light)" }}>
                                <span style={{ fontSize:"0.6rem", fontWeight:700, color:"var(--text-3)", textTransform:"uppercase" }}>{p.slice(0,3)}</span>
                                <span style={{ fontSize:"0.68rem", fontWeight:800, color:Number(v)>=70?"#10b981":Number(v)>=40?"#f59e0b":"#ef4444" }}>{v}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
