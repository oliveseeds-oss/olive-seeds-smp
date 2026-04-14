import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from "lucide-react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth,
  isToday, startOfWeek, endOfWeek, addMonths, subMonths
} from "date-fns";
import { db } from "../firebase/config";
import { collection, onSnapshot } from "firebase/firestore";

const DAY_TASKS = {
  Monday: { task: "Blog", color: "#6b7c2c" },
  Tuesday: { task: "App/Web", color: "#0ea5e9" },
  Wednesday: { task: "Carousel", color: "#3b82f6" },
  Thursday: { task: "Reel", color: "#8b5cf6" },
  Friday: { task: "YouTube/Podcast", color: "#ec4899" },
  Saturday: { task: "Campaign/Brand", color: "#f59e0b" },
  Sunday: { task: "Review & Plan", color: "#6b7280" },
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const [current, setCurrent] = useState(new Date());
  const [allRecords, setAllRecords] = useState([]);

  // Fetch all records with dates
  useEffect(() => {
    const colls = ["blogs", "carousels", "reels", "media"];
    const unsubs = [];
    const tempAll = {};
    colls.forEach((col) => {
      const unsub = onSnapshot(collection(db, col), (snap) => {
        tempAll[col] = snap.docs.map(d => ({ ...d.data(), _collection: col }));
        setAllRecords(Object.values(tempAll).flat());
      });
      unsubs.push(unsub);
    });
    return () => unsubs.forEach(u => u());
  }, []);

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const getRecordsForDay = (day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    return allRecords.filter(r => r.date === dateStr);
  };

  const COL_COLORS = {
    blogs: "#6b7c2c",
    carousels: "#3b82f6",
    reels: "#8b5cf6",
    media: "#ec4899",
  };

  return (
    <div className="fade-in">
      <div className="section-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="stat-icon" style={{ background: "#6b7c2c20", color: "#6b7c2c", marginBottom: 0 }}>
            <CalIcon size={20} />
          </div>
          <h2 className="section-title">Content Calendar</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setCurrent(subMonths(current, 1))}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, minWidth: 160, textAlign: "center", fontSize: "1.05rem" }}>
            {format(current, "MMMM yyyy")}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={() => setCurrent(addMonths(current, 1))}>
            <ChevronRight size={16} />
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setCurrent(new Date())}>
            Today
          </button>
        </div>
      </div>

      {/* Day-task legend */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {Object.entries(DAY_TASKS).map(([day, { task, color }]) => (
          <div key={day} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", background: "#fff", borderRadius: 99, border: "1px solid var(--parchment)", fontSize: "0.75rem" }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
            <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>{day.slice(0,3)}</span>
            <span style={{ color: "var(--text-dark)", fontWeight: 600 }}>{task}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: "1px solid var(--parchment)" }}>
          {WEEKDAYS.map((d) => (
            <div key={d} style={{
              padding: "10px",
              textAlign: "center",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              background: "var(--sand)",
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
          {days.map((day, i) => {
            const dayName = format(day, "EEEE");
            const dayTask = DAY_TASKS[dayName];
            const records = getRecordsForDay(day);
            const inMonth = isSameMonth(day, current);
            const today = isToday(day);

            return (
              <div key={i} style={{
                minHeight: 100,
                padding: "8px",
                borderRight: (i + 1) % 7 !== 0 ? "1px solid var(--olive-100)" : "none",
                borderBottom: "1px solid var(--olive-100)",
                background: today ? "var(--olive-50)" : inMonth ? "#fff" : "var(--sand)",
                opacity: inMonth ? 1 : 0.5,
              }}>
                {/* Date number */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 4,
                }}>
                  <span style={{
                    width: 26, height: 26,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: "50%",
                    fontSize: "0.82rem",
                    fontWeight: today ? 700 : 400,
                    background: today ? "var(--olive-600)" : "transparent",
                    color: today ? "#fff" : "var(--text-dark)",
                  }}>
                    {format(day, "d")}
                  </span>
                  {dayTask && inMonth && (
                    <div style={{
                      width: 6, height: 6, borderRadius: 2,
                      background: dayTask.color,
                    }} />
                  )}
                </div>

                {/* Task type label */}
                {dayTask && inMonth && (
                  <div style={{
                    fontSize: "0.65rem",
                    fontWeight: 600,
                    color: dayTask.color,
                    background: dayTask.color + "15",
                    borderRadius: 4,
                    padding: "1px 5px",
                    marginBottom: 4,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {dayTask.task}
                  </div>
                )}

                {/* Records */}
                {records.slice(0, 2).map((rec, j) => (
                  <div key={j} style={{
                    fontSize: "0.65rem",
                    background: COL_COLORS[rec._collection] + "20",
                    color: COL_COLORS[rec._collection],
                    borderRadius: 4,
                    padding: "2px 5px",
                    marginBottom: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontWeight: 500,
                  }}>
                    {rec.title || rec.tweet || "—"}
                  </div>
                ))}
                {records.length > 2 && (
                  <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", padding: "1px 5px" }}>
                    +{records.length - 2} more
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
