
import { useState, useEffect, useMemo } from "react";
import { FileBarChart, Download, Filter, Star, TrendingUp, Activity } from "lucide-react";
import { db } from "../firebase/config";
import { collection, onSnapshot } from "firebase/firestore";
import { format, parseISO, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LineChart, Line, CartesianGrid } from "recharts";
import jsPDF from "jspdf";
import toast from "react-hot-toast";

const COLLECTIONS = [
  { key:"blogs", label:"Blogs", color:"#6366f1", platforms:["wix","linkedin","facebook","twitter","threads","pinterest","youtube"] },
  { key:"carousels", label:"Carousels", color:"#06b6d4", platforms:["instagram","facebook","linkedin","youtube"] },
  { key:"reels", label:"Reels", color:"#8b5cf6", platforms:["instagram","facebook","linkedin","youtube","pinterest"] },
  { key:"media", label:"Podcast/YouTube", color:"#f43f5e", platforms:["youtube","podcast","socialCaption","linkedin","twitter","threads"] },
  { key:"tweets", label:"Tweets", color:"#0ea5e9", platforms:["response"] },
];

const PERIODS = [
  { key:"daily", label:"Today" },
  { key:"weekly", label:"This Week" },
  { key:"monthly", label:"This Month" },
  { key:"last3", label:"Last 3 Months" },
  { key:"all", label:"All Time" },
];

function inPeriod(dateStr, period) {
  if(!dateStr||period==="all") return true;
  try {
    const d = parseISO(dateStr);
    const now = new Date();
    if(period==="daily") return format(d,"yyyy-MM-dd")===format(now,"yyyy-MM-dd");
    if(period==="weekly") return isWithinInterval(d,{start:startOfWeek(now),end:endOfWeek(now)});
    if(period==="monthly") return isWithinInterval(d,{start:startOfMonth(now),end:endOfMonth(now)});
    if(period==="last3") return isWithinInterval(d,{start:startOfMonth(subMonths(now,2)),end:endOfMonth(now)});
  } catch { return false; }
  return false;
}

const scoreColor = v => v>=70?"#10b981":v>=40?"#f59e0b":"#ef4444";
const scoreBg = v => v>=70?"#d1fae5":v>=40?"#fef3c7":"#fee2e2";

const CustomTooltip = ({ active, payload, label }) => {
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:"var(--white)",border:"1px solid var(--border-light)",borderRadius:10,padding:"10px 14px",boxShadow:"var(--shadow)",fontSize:"0.82rem"}}>
      {label&&<div style={{fontWeight:700,marginBottom:6}}>{label}</div>}
      {payload.map(p=>(
        <div key={p.name} style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
          <div style={{width:8,height:8,borderRadius:2,background:p.color||p.fill,flexShrink:0}}/>
          <span style={{color:"var(--text-3)"}}>{p.name}:</span><strong>{p.value}{p.name==="Score"?"/100":""}</strong>
        </div>
      ))}
    </div>
  );
};

export default function Reports() {
  const [rawData, setRawData] = useState({});
  const [period, setPeriod] = useState("monthly");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    const temp={}; const unsubs=[]; let loaded=0;
    COLLECTIONS.forEach(({key})=>{
      const unsub=onSnapshot(collection(db,key),snap=>{
        temp[key]=snap.docs.map(d=>({id:d.id,...d.data()}));
        loaded++;
        if(loaded>=COLLECTIONS.length){setRawData({...temp});setLoading(false);}
      });
      unsubs.push(unsub);
    });
    return ()=>unsubs.forEach(u=>u());
  },[]);

  const filtered = useMemo(()=>{
    const out={};
    COLLECTIONS.forEach(({key})=>{
      const recs=(rawData[key]||[]).filter(r=>inPeriod(r.date||r.createdAt?.slice(0,10),period));
      out[key]=categoryFilter==="all"||categoryFilter===key?recs:[];
    });
    return out;
  },[rawData,period,categoryFilter]);

  const allFiltered = Object.values(filtered).flat();

  // ---- WORK REPORT (status-based) ----
  const workReport = useMemo(()=>{
    return COLLECTIONS.map(({key,label,color})=>{
      const recs=filtered[key]||[];
      const total=recs.length;
      const pub=recs.filter(r=>r.status==="published").length;
      const comp=recs.filter(r=>r.status==="completed").length;
      const inprog=recs.filter(r=>r.status==="in-progress").length;
      const pend=recs.filter(r=>r.status==="pending").length;
      const pct=total?Math.round(((pub+comp)/total)*100):0;
      return {name:label,color,total,published:pub,completed:comp,inprogress:inprog,pending:pend,pct};
    }).filter(x=>x.total>0);
  },[filtered]);

  // ---- RESPONSE REPORT (score-based) ----
  const responseReport = useMemo(()=>{
    const platformMap={};
    COLLECTIONS.forEach(({key})=>{
      (filtered[key]||[]).forEach(r=>{
        if(!r.response) return;
        Object.entries(r.response).forEach(([p,v])=>{
          const n=Number(v);
          if(!isNaN(n)&&v!==""){
            if(!platformMap[p]) platformMap[p]={sum:0,count:0,records:[]};
            platformMap[p].sum+=n; platformMap[p].count++;
            platformMap[p].records.push({...r,_platform:p,_score:n});
          }
        });
      });
    });
    return Object.entries(platformMap).map(([p,{sum,count,records}])=>({
      platform:p.charAt(0).toUpperCase()+p.slice(1),
      raw:p,
      avg:Math.round(sum/count),
      count,
      records:records.sort((a,b)=>b._score-a._score),
    })).sort((a,b)=>b.avg-a.avg);
  },[filtered]);

  // Per-content-item avg score
  const topContent = useMemo(()=>{
    const items=[];
    COLLECTIONS.forEach(({key,label,color})=>{
      (filtered[key]||[]).forEach(r=>{
        if(!r.response) return;
        const scores=Object.values(r.response).map(v=>Number(v)).filter(v=>!isNaN(v)&&v>0);
        if(scores.length>0){
          const avg=Math.round(scores.reduce((s,x)=>s+x,0)/scores.length);
          items.push({...r,_col:label,_color:color,_avg:avg,_count:scores.length});
        }
      });
    });
    return items.sort((a,b)=>b._avg-a._avg).slice(0,10);
  },[filtered]);

  // Monthly platform trend
  const platformTrend = useMemo(()=>{
    const months=Array.from({length:4},(_,i)=>subMonths(new Date(),3-i));
    return months.map(mo=>{
      const moStr=format(mo,"yyyy-MM");
      const row={name:format(mo,"MMM")};
      responseReport.slice(0,4).forEach(({raw,platform})=>{
        const scores=[];
        COLLECTIONS.forEach(({key})=>{
          (rawData[key]||[]).forEach(r=>{
            const ds=r.date||r.createdAt?.slice(0,10);
            if(!ds) return;
            try{ if(format(parseISO(ds),"yyyy-MM")===moStr&&r.response?.[raw]!==undefined){const n=Number(r.response[raw]);if(!isNaN(n)&&n>0)scores.push(n);} }catch{}
          });
        });
        row[platform]=scores.length?Math.round(scores.reduce((s,x)=>s+x,0)/scores.length):0;
      });
      return row;
    });
  },[responseReport,rawData]);

  const TREND_COLORS=["#6366f1","#06b6d4","#8b5cf6","#f43f5e"];

  const exportPDF = ()=>{
    const doc=new jsPDF();
    doc.setFont("helvetica","bold"); doc.setFontSize(18);
    doc.text("Olive Seeds — Full Report",20,20);
    doc.setFont("helvetica","normal"); doc.setFontSize(11);
    doc.text(`Period: ${PERIODS.find(p=>p.key===period)?.label} | ${format(new Date(),"dd MMM yyyy")}`,20,30);
    doc.line(20,36,190,36);
    let y=46;

    doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.text("WORK REPORT — Content Status",20,y); y+=9;
    doc.setFont("helvetica","normal"); doc.setFontSize(10);
    workReport.forEach(d=>{
      doc.text(`${d.name}: ${d.total} total | Published:${d.published} Completed:${d.completed} InProgress:${d.inprogress} Pending:${d.pending} (${d.pct}% done)`,20,y); y+=7;
    });

    if(responseReport.length){
      y+=5; doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.text("RESPONSE REPORT — Platform Scores",20,y); y+=9;
      doc.setFont("helvetica","normal"); doc.setFontSize(10);
      responseReport.forEach(p=>{ doc.text(`${p.platform}: Avg ${p.avg}/100 from ${p.count} responses`,20,y); y+=7; });
    }

    if(topContent.length){
      y+=5; doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.text("TOP PERFORMING CONTENT",20,y); y+=9;
      doc.setFont("helvetica","normal"); doc.setFontSize(10);
      topContent.slice(0,5).forEach((c,i)=>{ doc.text(`${i+1}. [${c._col}] ${(c.title||c.tweet||"Untitled").slice(0,50)} — Avg: ${c._avg}/100`,20,y); y+=7; });
    }

    doc.save(`olive-seeds-report-${period}.pdf`);
    toast.success("Report exported!");
  };

  if(loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:300}}><span className="spinner-primary spinner"/></div>;

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="section-header">
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:9,background:"#fef3c7",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <FileBarChart size={18} color="#d97706"/>
          </div>
          <div>
            <h2 className="section-title" style={{marginBottom:0}}>Reports</h2>
            <p style={{fontSize:"0.75rem",color:"var(--text-3)",marginTop:1}}>Work report + Platform response score analysis</p>
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={exportPDF}><Download size={13}/> Export Full Report</button>
      </div>

      {/* Filters */}
      <div style={{display:"flex",gap:10,marginBottom:22,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <Filter size={14} color="var(--text-3)"/>
          <span style={{fontSize:"0.8rem",fontWeight:600,color:"var(--text-3)"}}>Period:</span>
        </div>
        <div className="pill-nav">
          {PERIODS.map(p=><button key={p.key} className={period===p.key?"active":""} onClick={()=>setPeriod(p.key)}>{p.label}</button>)}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,marginLeft:8}}>
          <span style={{fontSize:"0.8rem",fontWeight:600,color:"var(--text-3)"}}>Category:</span>
          <select className="form-input form-select" value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} style={{padding:"5px 28px 5px 10px",fontSize:"0.82rem",height:34,width:"auto",minWidth:120}}>
            <option value="all">All Types</option>
            {COLLECTIONS.map(c=><option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {/* ===== SECTION 1: WORK REPORT ===== */}
      <div style={{marginBottom:24}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <Activity size={16} color="#6366f1"/>
          <h3 style={{color:"var(--text-1)"}}>Work Report</h3>
          <span className="badge badge-indigo">{PERIODS.find(p=>p.key===period)?.label}</span>
        </div>

        {workReport.length===0 ? (
          <div className="card"><div className="empty-state" style={{padding:40}}><p style={{fontWeight:600}}>No records in this period</p></div></div>
        ) : (
          <div className="grid-2" style={{marginBottom:18}}>
            {/* Work status bar */}
            <div className="card">
              <h4 style={{marginBottom:14}}>Content Created by Type</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={workReport} margin={{left:-20,right:0}}>
                  <XAxis dataKey="name" tick={{fontSize:10}}/>
                  <YAxis tick={{fontSize:10}}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Bar dataKey="published" fill="#10b981" stackId="a" name="Published"/>
                  <Bar dataKey="completed" fill="#3b82f6" stackId="a" name="Completed"/>
                  <Bar dataKey="inprogress" fill="#f59e0b" stackId="a" name="In Progress"/>
                  <Bar dataKey="pending" fill="#ef4444" stackId="a" radius={[4,4,0,0]} name="Pending"/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Work table */}
            <div className="card" style={{padding:0,overflow:"hidden"}}>
              <div style={{padding:"14px 16px",borderBottom:"1px solid var(--border-light)"}}>
                <h4>Completion Rates</h4>
              </div>
              <table className="data-table">
                <thead><tr><th>Type</th><th>Total</th><th>Done</th><th>Pending</th><th>Rate</th></tr></thead>
                <tbody>
                  {workReport.map(d=>(
                    <tr key={d.name}>
                      <td><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:2,background:d.color}}/><strong style={{fontSize:"0.82rem"}}>{d.name}</strong></div></td>
                      <td><strong>{d.total}</strong></td>
                      <td><span className="badge badge-green">{d.published+d.completed}</span></td>
                      <td><span className="badge badge-red">{d.pending}</span></td>
                      <td>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <div className="score-bar" style={{flex:1,maxWidth:50}}>
                            <div className="score-fill" style={{width:`${d.pct}%`,background:d.pct>=70?"#10b981":d.pct>=40?"#f59e0b":"#ef4444"}}/>
                          </div>
                          <span style={{fontWeight:800,fontSize:"0.82rem",color:d.pct>=70?"#10b981":d.pct>=40?"#f59e0b":"#ef4444"}}>{d.pct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ===== SECTION 2: RESPONSE REPORT ===== */}
      <div style={{marginBottom:24}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <Star size={16} color="#f59e0b"/>
          <h3>Response Report</h3>
          <span className="badge badge-amber">Platform Scores 1–100</span>
        </div>

        {responseReport.length===0 ? (
          <div className="card">
            <div className="empty-state" style={{padding:40}}>
              <div className="empty-icon"><Star size={20}/></div>
              <p style={{fontWeight:600}}>No response scores yet</p>
              <p style={{fontSize:"0.82rem",marginTop:4}}>Enter numeric values (1–100) in the Response fields when editing records.<br/>These scores track how well each platform performed.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Platform score cards */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12,marginBottom:18}}>
              {responseReport.map(p=>(
                <div key={p.raw} style={{background:"var(--white)",borderRadius:"var(--radius-lg)",padding:"14px 16px",border:`2px solid ${scoreColor(p.avg)}30`,boxShadow:"var(--shadow-xs)"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                    <div style={{fontWeight:700,fontSize:"0.84rem",textTransform:"capitalize",color:"var(--text-1)"}}>{p.platform}</div>
                    <div style={{fontWeight:900,fontSize:"1.1rem",color:scoreColor(p.avg),fontFamily:"var(--font-display)"}}>{p.avg}</div>
                  </div>
                  <div className="score-bar">
                    <div className="score-fill" style={{width:`${p.avg}%`,background:scoreColor(p.avg)}}/>
                  </div>
                  <div style={{fontSize:"0.68rem",color:"var(--text-3)",marginTop:6,display:"flex",justifyContent:"space-between"}}>
                    <span>{p.count} entry{p.count!==1?"s":""}</span>
                    <span style={{fontWeight:700,color:scoreColor(p.avg)}}>{p.avg>=70?"High":p.avg>=40?"Mid":"Low"}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid-2" style={{marginBottom:18}}>
              {/* Bar chart */}
              <div className="card">
                <h4 style={{marginBottom:14}}>Platform Score Comparison</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={responseReport} margin={{left:-20,right:0}}>
                    <XAxis dataKey="platform" tick={{fontSize:10}}/>
                    <YAxis tick={{fontSize:10}} domain={[0,100]}/>
                    <Tooltip content={<CustomTooltip/>} formatter={v=>[`${v}/100`,"Score"]}/>
                    <Bar dataKey="avg" radius={[5,5,0,0]} name="Score">
                      {responseReport.map((p,i)=><Cell key={i} fill={scoreColor(p.avg)}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Line trend */}
              <div className="card">
                <h4 style={{marginBottom:14}}>Score Trend (Last 4 Months)</h4>
                {platformTrend.some(mo=>responseReport.slice(0,4).some(p=>mo[p.platform]>0)) ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={platformTrend} margin={{left:-20,right:10}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)"/>
                      <XAxis dataKey="name" tick={{fontSize:10}}/>
                      <YAxis tick={{fontSize:10}} domain={[0,100]}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      {responseReport.slice(0,4).map((p,i)=>(
                        <Line key={p.raw} type="monotone" dataKey={p.platform} stroke={TREND_COLORS[i]} strokeWidth={2} dot={{r:3}} name={p.platform}/>
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state" style={{padding:40,fontSize:"0.82rem"}}>Not enough monthly data yet</div>
                )}
              </div>
            </div>

            {/* Detailed scores table */}
            <div className="card" style={{marginBottom:18}}>
              <h4 style={{marginBottom:14}}>Response Scores — Full Detail</h4>
              <div style={{overflowX:"auto"}}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Platform</th><th>Avg Score</th><th>Responses</th><th>Highest</th><th>Lowest</th><th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responseReport.map(p=>{
                      const scores=p.records.map(r=>r._score);
                      const hi=Math.max(...scores); const lo=Math.min(...scores);
                      const grade=p.avg>=80?"A":p.avg>=70?"B":p.avg>=55?"C":p.avg>=40?"D":"F";
                      return (
                        <tr key={p.raw}>
                          <td><strong style={{textTransform:"capitalize"}}>{p.platform}</strong></td>
                          <td>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <div className="score-bar" style={{flex:1,maxWidth:60}}>
                                <div className="score-fill" style={{width:`${p.avg}%`,background:scoreColor(p.avg)}}/>
                              </div>
                              <strong style={{color:scoreColor(p.avg)}}>{p.avg}</strong>
                            </div>
                          </td>
                          <td>{p.count}</td>
                          <td><span style={{fontWeight:700,color:"#10b981"}}>{hi}</span></td>
                          <td><span style={{fontWeight:700,color:"#ef4444"}}>{lo}</span></td>
                          <td>
                            <span style={{fontWeight:900,fontSize:"1rem",color:scoreColor(p.avg),background:scoreBg(p.avg),padding:"2px 10px",borderRadius:6,fontFamily:"var(--font-display)"}}>{grade}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top content */}
            {topContent.length>0 && (
              <div className="card">
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                  <TrendingUp size={15} color="#10b981"/>
                  <h4>Top Performing Content (by avg response score)</h4>
                </div>
                {topContent.map((c,i)=>(
                  <div key={c.id||i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:"var(--bg)",borderRadius:9,marginBottom:6,border:`1px solid ${c._color}20`}}>
                    <div style={{width:26,height:26,borderRadius:6,background:c._color+"20",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:"var(--font-display)",fontWeight:800,fontSize:"0.75rem",color:c._color}}>
                      {i+1}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:"0.84rem",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.title||c.tweet||"Untitled"}</div>
                      <div style={{fontSize:"0.72rem",color:"var(--text-3)",marginTop:1}}>{c._col} · {c.date||"—"} · {c._count} platform score{c._count!==1?"s":""}</div>
                    </div>
                    <div style={{fontWeight:900,fontSize:"1.1rem",color:scoreColor(c._avg),fontFamily:"var(--font-display)",padding:"4px 10px",borderRadius:8,background:scoreBg(c._avg)}}>
                      {c._avg}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
