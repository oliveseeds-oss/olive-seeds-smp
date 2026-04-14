import { useState, useEffect } from "react";
import { Menu, Plus, ExternalLink, Trash2, X, Link2 } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { collection, addDoc, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";
import ConfirmModal from "../ui/ConfirmModal";

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth();
  const [now, setNow] = useState(new Date());
  const [urls, setUrls] = useState([]);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [delTarget, setDelTarget] = useState(null);
  const [urlForm, setUrlForm] = useState({ label: "", url: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "urls"), snap => {
      setUrls(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const addUrl = async () => {
    if (!urlForm.label || !urlForm.url) return toast.error("Fill all fields");
    let href = urlForm.url;
    if (!href.startsWith("http")) href = "https://" + href;
    setSaving(true);
    try {
      await addDoc(collection(db, "urls"), { label: urlForm.label, url: href });
      setUrlForm({ label: "", url: "" });
      setShowUrlModal(false);
      toast.success("URL added");
    } catch { toast.error("Failed"); }
    finally { setSaving(false); }
  };

  const deleteUrl = async () => {
    if (!delTarget) return;
    await deleteDoc(doc(db, "urls", delTarget.id));
    setDelTarget(null);
    toast.success("Removed");
  };

  return (
    <>
      <header style={{
        position: "fixed", top: 0, left: "var(--sidebar-w)", right: 0,
        height: "var(--topbar-h)",
        background: "rgba(248,250,252,0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border-light)",
        display: "flex", alignItems: "center",
        padding: "0 20px", gap: 12, zIndex: 90,
      }}>
        <button className="btn btn-ghost btn-icon" onClick={onMenuClick} id="topbar-menu">
          <Menu size={18} />
        </button>

        {/* Live clock */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "5px 12px",
          background: "linear-gradient(135deg, #6366f1, #06b6d4)",
          borderRadius: 8,
        }}>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
              {format(now, "EEE, MMM d")}
            </div>
            <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.65)", fontVariantNumeric: "tabular-nums" }}>
              {format(now, "hh:mm:ss a")}
            </div>
          </div>
        </div>

        {/* URL Quick Access */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, flex: 1, flexWrap: "wrap" }}>
          {urls.slice(0, 6).map(u => (
            <div key={u.id} style={{ display: "flex", alignItems: "center" }}>
              <a href={u.url} target="_blank" rel="noreferrer" style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "3px 8px 3px 8px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "6px 0 0 6px",
                fontSize: "0.75rem", fontWeight: 600, color: "var(--text-2)",
                textDecoration: "none", transition: "all 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.color = "#6366f1"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-2)"; }}
              >
                <ExternalLink size={10} />{u.label}
              </a>
              <button onClick={() => setDelTarget(u)} style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 22, height: 22,
                background: "var(--surface2)", border: "1px solid var(--border)",
                borderLeft: "none", borderRadius: "0 6px 6px 0",
                cursor: "pointer", color: "var(--text-4)", fontSize: 10,
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#dc2626"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "var(--surface2)"; e.currentTarget.style.color = "var(--text-4)"; }}
              >
                <X size={9} />
              </button>
            </div>
          ))}
          <button className="btn btn-sm" onClick={() => setShowUrlModal(true)} style={{
            background: "transparent", color: "var(--primary)",
            border: "1.5px dashed var(--primary)", borderRadius: 6,
            fontSize: "0.72rem", padding: "2px 8px", gap: 3,
          }}>
            <Plus size={10} /> URL
          </button>
        </div>

        {/* User avatar */}
        <div style={{
          width: 30, height: 30, borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #06b6d4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0,
          boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
        }}>
          {user?.email?.[0]?.toUpperCase() || "U"}
        </div>
      </header>

      <Modal open={showUrlModal} onClose={() => setShowUrlModal(false)} title="Add Quick URL" size="sm"
        footer={<>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowUrlModal(false)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={addUrl} disabled={saving}>
            {saving ? <span className="spinner" /> : <><Plus size={13} /> Add</>}
          </button>
        </>}>
        <div className="form-group">
          <label className="form-label">Label</label>
          <input className="form-input" placeholder="Facebook" value={urlForm.label} onChange={e => setUrlForm(p => ({ ...p, label: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">URL</label>
          <input className="form-input" placeholder="https://..." value={urlForm.url} onChange={e => setUrlForm(p => ({ ...p, url: e.target.value }))} />
        </div>
      </Modal>

      <ConfirmModal open={!!delTarget} onClose={() => setDelTarget(null)} onConfirm={deleteUrl}
        title="Remove URL" message={`Remove "${delTarget?.label}" from quick access?`} />

      <style>{`
        @media (max-width: 768px) { header { left: 0 !important; } #topbar-menu { display: flex !important; } }
        @media (min-width: 769px) { #topbar-menu { display: none; } }
      `}</style>
    </>
  );
}
