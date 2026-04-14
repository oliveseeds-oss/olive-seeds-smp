import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Save, Lock, Calendar, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import { db, auth } from "../firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { format } from "date-fns";
import Modal from "../components/ui/Modal";

const DEFAULT_DAY_TASKS = {
  Monday:"Blog", Tuesday:"App/Web", Wednesday:"Carousel",
  Thursday:"Reel", Friday:"YouTube/Podcast", Saturday:"Campaign/Brand", Sunday:"Review & Plan"
};
const TASK_OPTIONS = ["Blog","Carousel","Reel","YouTube/Podcast","Tweet","Campaign/Brand","App/Web","Review & Plan","Rest","Custom"];

export default function SettingsPage() {
  const { user } = useAuth();
  const [dayTasks, setDayTasks] = useState({...DEFAULT_DAY_TASKS});
  const [savedTasks, setSavedTasks] = useState({...DEFAULT_DAY_TASKS});
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [lastChanged, setLastChanged] = useState(null);

  useEffect(()=>{
    getDoc(doc(db,"settings","dayMapping")).then(d=>{
      if(d.exists()){
        const data=d.data();
        setDayTasks(data.tasks||DEFAULT_DAY_TASKS);
        setSavedTasks(data.tasks||DEFAULT_DAY_TASKS);
        setLastChanged(data.lastChanged||null);
      }
    });
  },[]);

  const hasChanges = JSON.stringify(dayTasks)!==JSON.stringify(savedTasks);

  const saveDayMapping = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db,"settings","dayMapping"),{
        tasks:dayTasks,
        lastChanged:new Date().toISOString(),
        updatedBy:user?.email,
      });
      setSavedTasks({...dayTasks});
      setLastChanged(new Date().toISOString());
      setShowConfirm(false);
      toast.success("Day mapping saved!");
    } catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if(!oldPw||!newPw||!confirmPw) return toast.error("Fill all fields");
    if(newPw!==confirmPw) return toast.error("Passwords don't match");
    if(newPw.length<6) return toast.error("Min 6 characters");
    setSavingPw(true);
    try {
      const cred=EmailAuthProvider.credential(user.email,oldPw);
      await reauthenticateWithCredential(auth.currentUser,cred);
      await updatePassword(auth.currentUser,newPw);
      toast.success("Password updated!");
      setOldPw(""); setNewPw(""); setConfirmPw("");
    } catch(e){ toast.error(e.message?.replace("Firebase: ","")||"Failed"); }
    finally { setSavingPw(false); }
  };

  const DAY_COLORS = { Monday:"#6366f1",Tuesday:"#06b6d4",Wednesday:"#8b5cf6",Thursday:"#f43f5e",Friday:"#f59e0b",Saturday:"#10b981",Sunday:"#64748b" };

  return (
    <div className="fade-in">
      <div className="section-header">
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:9,background:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <SettingsIcon size={18} color="#64748b"/>
          </div>
          <h2 className="section-title">Settings</h2>
        </div>
      </div>

      <div className="grid-2" style={{alignItems:"start"}}>
        {/* Day Mapping */}
        <div>
          <div className="card" style={{marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <Calendar size={17} color="#6366f1"/>
              <h3>Day-Task Mapping</h3>
            </div>
            <p style={{fontSize:"0.78rem",color:"var(--text-3)",marginBottom:16}}>
              Assign a default content type to each day of the week. A confirmation step protects accidental changes.
            </p>

            {lastChanged && (
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"var(--primary-bg)",borderRadius:8,marginBottom:14,border:"1px solid #c7d2fe"}}>
                <CheckCircle size={14} color="#6366f1"/>
                <span style={{fontSize:"0.78rem",color:"#4338ca",fontWeight:500}}>Last saved: {format(new Date(lastChanged),"MMM d, yyyy 'at' h:mm a")}</span>
              </div>
            )}

            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {Object.entries(dayTasks).map(([day,task])=>{
                const changed=task!==savedTasks[day];
                return (
                  <div key={day} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:changed?"#fffbeb":"var(--bg)",borderRadius:9,border:changed?"1.5px solid #fde68a":"1.5px solid var(--border-light)"}}>
                    <div style={{width:8,height:8,borderRadius:2,background:DAY_COLORS[day],flexShrink:0}}/>
                    <span style={{fontWeight:700,fontSize:"0.84rem",width:82,color:"var(--text-1)"}}>{day}</span>
                    <select className="form-input form-select" value={task} onChange={e=>setDayTasks(p=>({...p,[day]:e.target.value}))}
                      style={{padding:"6px 28px 6px 10px",fontSize:"0.82rem",height:34,flex:1}}>
                      {TASK_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}
                    </select>
                    {changed && <span style={{fontSize:"0.65rem",fontWeight:700,color:"#d97706",background:"#fef3c7",padding:"2px 6px",borderRadius:99,flexShrink:0}}>changed</span>}
                  </div>
                );
              })}
            </div>

            <div style={{display:"flex",gap:8,marginTop:14}}>
              <button className="btn btn-secondary btn-sm" onClick={()=>setDayTasks({...savedTasks})} disabled={!hasChanges}>
                Reset
              </button>
              <button className="btn btn-primary" style={{flex:1,justifyContent:"center"}} onClick={()=>setShowConfirm(true)} disabled={!hasChanges}>
                <Save size={14}/> Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {/* Password */}
          <div className="card">
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <Lock size={17} color="#6366f1"/>
              <h3>Change Password</h3>
            </div>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input type="password" className="form-input" value={oldPw} onChange={e=>setOldPw(e.target.value)} placeholder="••••••••"/>
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" className="form-input" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Min 6 characters"/>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input type="password" className="form-input" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} placeholder="Re-enter password"/>
            </div>
            <button className="btn btn-primary" style={{width:"100%",justifyContent:"center"}} onClick={changePassword} disabled={savingPw}>
              {savingPw?<span className="spinner"/>:<><Lock size={14}/> Update Password</>}
            </button>
          </div>

          {/* Account */}
          <div className="card">
            <h3 style={{marginBottom:12}}>Account</h3>
            <div style={{background:"var(--bg)",borderRadius:9,padding:"12px 14px",marginBottom:8}}>
              <div style={{fontSize:"0.7rem",fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:3}}>Email</div>
              <div style={{fontWeight:600}}>{user?.email}</div>
            </div>
            <div style={{background:"var(--bg)",borderRadius:9,padding:"12px 14px"}}>
              <div style={{fontSize:"0.7rem",fontWeight:700,color:"var(--text-3)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:3}}>App Version</div>
              <div style={{fontWeight:600}}>Olive Seeds SMP v1.1.0</div>
            </div>
          </div>

          {/* Firebase guide */}
          <div className="card" style={{borderStyle:"dashed",borderColor:"var(--primary)"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <div style={{fontSize:"1.1rem"}}>🔥</div>
              <h4 style={{color:"var(--primary)"}}>Firebase Setup</h4>
            </div>
            <ol style={{paddingLeft:18,display:"flex",flexDirection:"column",gap:5,fontSize:"0.8rem",color:"var(--text-2)",lineHeight:1.6}}>
              <li>Go to <strong>console.firebase.google.com</strong></li>
              <li>Create project → Add Web App</li>
              <li>Enable <strong>Auth (Email/Password)</strong> + <strong>Firestore</strong></li>
              <li>Paste config into <code style={{background:"var(--bg)",padding:"1px 5px",borderRadius:4,fontSize:"0.75rem"}}>src/firebase/config.js</code></li>
              <li>Set Firestore rules: allow read, write if authenticated</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <Modal open={showConfirm} onClose={()=>setShowConfirm(false)} title="Confirm Day Mapping Change" size="sm"
        footer={<>
          <button className="btn btn-secondary" onClick={()=>setShowConfirm(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={saveDayMapping} disabled={saving}>
            {saving?<span className="spinner"/>:<><Save size={14}/> Yes, Save</>}
          </button>
        </>}>
        <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
          <div style={{width:40,height:40,borderRadius:"50%",background:"#fef3c7",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <ShieldAlert size={20} color="#d97706"/>
          </div>
          <div>
            <p style={{fontWeight:600,marginBottom:8,color:"var(--text-1)"}}>Review your changes before saving</p>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {Object.entries(dayTasks).filter(([d,t])=>t!==savedTasks[d]).map(([day,task])=>(
                <div key={day} style={{fontSize:"0.82rem",display:"flex",alignItems:"center",gap:8}}>
                  <strong style={{width:82,color:"var(--text-1)"}}>{day}</strong>
                  <span style={{color:"var(--danger)",textDecoration:"line-through"}}>{savedTasks[day]}</span>
                  <span style={{color:"var(--text-3)"}}>→</span>
                  <span style={{color:"var(--success)",fontWeight:600}}>{task}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
