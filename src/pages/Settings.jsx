import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Save, Lock, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import { db, auth } from "../firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { format, startOfMonth } from "date-fns";

const DEFAULT_DAY_TASKS = {
  Monday: "Blog",
  Tuesday: "App/Web",
  Wednesday: "Carousel",
  Thursday: "Reel",
  Friday: "YouTube/Podcast",
  Saturday: "Campaign/Brand",
  Sunday: "Review & Plan",
};

const TASK_OPTIONS = [
  "Blog", "Carousel", "Reel", "YouTube/Podcast", "Tweet",
  "Campaign/Brand", "App/Web", "Review & Plan", "Rest", "Custom"
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [dayTasks, setDayTasks] = useState({ ...DEFAULT_DAY_TASKS });
  const [lastChanged, setLastChanged] = useState(null);
  const [savingDay, setSavingDay] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "settings", "dayMapping")).then((d) => {
      if (d.exists()) {
        const data = d.data();
        setDayTasks(data.tasks || DEFAULT_DAY_TASKS);
        setLastChanged(data.lastChanged || null);
      }
    });
  }, []);

  const canChangeMapping = () => {
    if (!lastChanged) return true;
    const last = new Date(lastChanged);
    const thisMonth = format(startOfMonth(new Date()), "yyyy-MM");
    const lastMonth = format(startOfMonth(last), "yyyy-MM");
    return thisMonth !== lastMonth;
  };

  const saveDayMapping = async () => {
    if (!canChangeMapping()) {
      toast.error("Day mapping can only be changed once per month");
      return;
    }
    setSavingDay(true);
    try {
      await setDoc(doc(db, "settings", "dayMapping"), {
        tasks: dayTasks,
        lastChanged: new Date().toISOString(),
        updatedBy: user?.email,
      });
      setLastChanged(new Date().toISOString());
      toast.success("Day mapping saved!");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSavingDay(false);
    }
  };

  const changePassword = async () => {
    if (!oldPw || !newPw || !confirmPw) return toast.error("Fill all fields");
    if (newPw !== confirmPw) return toast.error("Passwords don't match");
    if (newPw.length < 6) return toast.error("Password must be at least 6 characters");
    setSavingPw(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, oldPw);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, newPw);
      toast.success("Password updated!");
      setOldPw(""); setNewPw(""); setConfirmPw("");
    } catch (e) {
      toast.error(e.message?.replace("Firebase: ", "") || "Failed to update password");
    } finally {
      setSavingPw(false);
    }
  };

  const canChange = canChangeMapping();

  return (
    <div className="fade-in">
      <div className="section-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="stat-icon" style={{ background: "#6b7c2c20", color: "#6b7c2c", marginBottom: 0 }}>
            <SettingsIcon size={20} />
          </div>
          <h2 className="section-title">Settings</h2>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        {/* Day Mapping */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <Calendar size={20} color="var(--olive-600)" />
            <h3 style={{ fontFamily: "var(--font-display)" }}>Day-Task Mapping</h3>
          </div>

          {!canChange && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", background: "#fef3c7", borderRadius: "var(--radius-sm)",
              marginBottom: 16, border: "1px solid #fde68a",
            }}>
              <AlertTriangle size={16} color="#d97706" />
              <div style={{ fontSize: "0.82rem", color: "#92400e" }}>
                <strong>Locked until next month.</strong> You already changed the mapping this month.
                Last changed: {lastChanged ? format(new Date(lastChanged), "MMM d, yyyy") : "—"}
              </div>
            </div>
          )}

          {canChange && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", background: "#dcfce7", borderRadius: "var(--radius-sm)",
              marginBottom: 16, border: "1px solid #bbf7d0",
            }}>
              <CheckCircle size={16} color="#16a34a" />
              <span style={{ fontSize: "0.82rem", color: "#15803d" }}>
                You can change the mapping once this month.
              </span>
            </div>
          )}

          {Object.entries(dayTasks).map(([day, task]) => (
            <div key={day} className="form-group" style={{ marginBottom: 10 }}>
              <label className="form-label">{day}</label>
              <select
                className="form-input form-select"
                value={task}
                disabled={!canChange}
                onChange={(e) => setDayTasks(prev => ({ ...prev, [day]: e.target.value }))}
              >
                {TASK_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}

          <button
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
            onClick={saveDayMapping}
            disabled={savingDay || !canChange}
          >
            {savingDay ? <span className="spinner" /> : <><Save size={15} /> Save Mapping</>}
          </button>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Change Password */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <Lock size={20} color="var(--olive-600)" />
              <h3 style={{ fontFamily: "var(--font-display)" }}>Change Password</h3>
            </div>

            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-input"
                value={oldPw}
                onChange={e => setOldPw(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="Min. 6 characters"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-input"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={changePassword}
              disabled={savingPw}
            >
              {savingPw ? <span className="spinner" /> : <><Lock size={15} /> Update Password</>}
            </button>
          </div>

          {/* Account Info */}
          <div className="card">
            <h3 style={{ fontFamily: "var(--font-display)", marginBottom: 16 }}>Account Info</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: "var(--sand)", borderRadius: "var(--radius-sm)", padding: "12px 16px" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                  Signed in as
                </div>
                <div style={{ fontWeight: 600, color: "var(--text-dark)" }}>{user?.email}</div>
              </div>
              <div style={{ background: "var(--sand)", borderRadius: "var(--radius-sm)", padding: "12px 16px" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                  Application
                </div>
                <div style={{ fontWeight: 600, color: "var(--text-dark)" }}>Olive Seeds Social Media Planner</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>v1.0.0</div>
              </div>
            </div>
          </div>

          {/* Firebase Setup Guide */}
          <div className="card" style={{ border: "1.5px dashed var(--olive-300)" }}>
            <h3 style={{ fontFamily: "var(--font-display)", marginBottom: 12, color: "var(--olive-700)" }}>🔥 Firebase Setup</h3>
            <div style={{ fontSize: "0.82rem", color: "var(--text-mid)", lineHeight: 1.7 }}>
              <p style={{ marginBottom: 8 }}>To connect your Firebase project:</p>
              <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
                <li>Go to <strong>console.firebase.google.com</strong></li>
                <li>Create a project &amp; add a Web App</li>
                <li>Enable <strong>Firestore, Auth (Email/Password)</strong></li>
                <li>Copy config to <code style={{ background: "var(--sand)", padding: "1px 5px", borderRadius: 4 }}>src/firebase/config.js</code></li>
                <li>Set Firestore rules to allow authenticated reads/writes</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
