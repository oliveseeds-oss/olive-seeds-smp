import { useState, useEffect } from "react";
import { Menu, Plus, ExternalLink, Trash2, Link2 } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import {
  collection, addDoc, deleteDoc, doc, onSnapshot
} from "firebase/firestore";
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
    const unsub = onSnapshot(collection(db, "urls"), (snap) => {
      setUrls(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
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
    } catch {
      toast.error("Failed to add URL");
    } finally {
      setSaving(false);
    }
  };

  const deleteUrl = async () => {
    if (!delTarget) return;
    await deleteDoc(doc(db, "urls", delTarget.id));
    setDelTarget(null);
    toast.success("URL removed");
  };

  return (
    <>
      <header style={{
        position: "fixed",
        top: 0,
        left: "var(--sidebar-w)",
        right: 0,
        height: "var(--topbar-h)",
        background: "rgba(253,252,247,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(139,160,84,0.15)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: 16,
        zIndex: 90,
      }}>
        {/* Hamburger */}
        <button className="btn btn-ghost btn-icon" onClick={onMenuClick} id="topbar-menu">
          <Menu size={20} />
        </button>

        {/* Date + Time */}
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--olive-600)" }}>
            {format(now, "EEEE, MMMM d, yyyy")}
          </span>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
            {format(now, "hh:mm:ss a")}
          </span>
        </div>

        {/* URL Quick Access */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8, flexWrap: "wrap", flex: 1 }}>
          {urls.slice(0, 5).map((u) => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 0 }}>
              <a
                href={u.url}
                target="_blank"
                rel="noreferrer"
                className="chip"
                style={{ borderRadius: "99px 0 0 99px", paddingRight: 6, gap: 4 }}
              >
                <ExternalLink size={11} />
                {u.label}
              </a>
              <button
                onClick={() => setDelTarget(u)}
                style={{
                  background: "var(--olive-100)", color: "var(--text-muted)",
                  border: "none", cursor: "pointer", padding: "2px 6px",
                  borderRadius: "0 99px 99px 0", fontSize: "10px",
                  display: "flex", alignItems: "center",
                }}
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowUrlModal(true)}
            style={{ borderRadius: 99, gap: 4, fontSize: "0.75rem", padding: "4px 10px" }}
          >
            <Plus size={12} /> Add URL
          </button>
        </div>

        {/* User */}
        <div style={{
          marginLeft: "auto",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <div style={{
            width: 32, height: 32,
            background: "linear-gradient(135deg, var(--olive-400), var(--olive-600))",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: "0.85rem",
          }}>
            {user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--text-mid)", display: "none" }} id="user-email">
            {user?.email}
          </span>
        </div>
      </header>

      {/* Add URL Modal */}
      <Modal
        open={showUrlModal}
        onClose={() => setShowUrlModal(false)}
        title="Add Quick URL"
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowUrlModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={addUrl} disabled={saving}>
              {saving ? <span className="spinner" /> : <><Plus size={15} /> Add URL</>}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Label</label>
          <input className="form-input" placeholder="e.g. Facebook" value={urlForm.label}
            onChange={e => setUrlForm(p => ({ ...p, label: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">URL</label>
          <input className="form-input" placeholder="https://..." value={urlForm.url}
            onChange={e => setUrlForm(p => ({ ...p, url: e.target.value }))} />
        </div>
      </Modal>

      <ConfirmModal
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={deleteUrl}
        title="Remove URL"
        message={`Remove "${delTarget?.label}" from quick access?`}
      />

      <style>{`
        @media (max-width: 768px) {
          header { left: 0 !important; }
          #topbar-menu { display: flex !important; }
          #user-email { display: none !important; }
        }
        @media (min-width: 769px) {
          #topbar-menu { display: none; }
          #user-email { display: block !important; }
        }
      `}</style>
    </>
  );
}
