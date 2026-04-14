import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Eye, Upload, Download } from "lucide-react";
import { db } from "../../firebase/config";
import {
  collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, orderBy, query
} from "firebase/firestore";
import toast from "react-hot-toast";
import Modal from "./Modal";
import ConfirmModal from "./ConfirmModal";
import CsvUpload from "./CsvUpload";

const STATUS_OPTS = ["pending", "in-progress", "completed", "published"];

function StatusBadge({ status }) {
  const map = {
    pending: "badge-red",
    "in-progress": "badge-amber",
    completed: "badge-blue",
    published: "badge-green",
  };
  return <span className={`badge ${map[status] || "badge-gray"}`}>{status || "—"}</span>;
}

export default function CollectionPage({
  collectionName,
  title,
  icon: Icon,
  fields = [],       // [{key, label, type, span}]
  platforms = [],    // platform response keys
  tableColumns = [], // subset of fields to show in table
  color = "var(--olive-500)",
}) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [delTarget, setDelTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [showCsv, setShowCsv] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    const q = query(collection(db, collectionName), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [collectionName]);

  const emptyForm = () => {
    const f = {};
    fields.forEach((field) => { f[field.key] = ""; });
    f.response = {};
    platforms.forEach((p) => { f.response[p] = ""; });
    f.status = "pending";
    return f;
  };

  const openAdd = () => {
    setForm(emptyForm());
    setEditTarget(null);
    setShowForm(true);
  };

  const openEdit = (rec) => {
    setForm({ ...emptyForm(), ...rec });
    setEditTarget(rec);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { ...form, updatedAt: new Date().toISOString() };
      if (!data.createdAt) data.createdAt = new Date().toISOString();
      if (editTarget) {
        await updateDoc(doc(db, collectionName, editTarget.id), data);
        toast.success("Record updated");
      } else {
        await addDoc(collection(db, collectionName), data);
        toast.success("Record added");
      }
      setShowForm(false);
    } catch (e) {
      toast.error("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!delTarget) return;
    await deleteDoc(doc(db, collectionName, delTarget.id));
    toast.success("Record deleted");
  };

  const exportCsv = () => {
    const headers = [...fields.map(f => f.key), ...platforms.map(p => `response_${p}`)];
    const rows = records.map((r) => [
      ...fields.map(f => `"${(r[f.key] || "").toString().replace(/"/g, '""')}"`),
      ...platforms.map(p => `"${(r.response?.[p] || "").toString().replace(/"/g, '""')}"`),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${collectionName}_export.csv`;
    a.click();
    toast.success("Exported!");
  };

  const filtered = records.filter((r) => {
    const s = search.toLowerCase();
    return !s || fields.some(f => (r[f.key] || "").toString().toLowerCase().includes(s));
  });

  const setField = (key, val) => setForm((p) => ({ ...p, [key]: val }));
  const setResponse = (key, val) => setForm((p) => ({ ...p, response: { ...p.response, [key]: val } }));

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="section-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="stat-icon" style={{ background: color + "20", color, marginBottom: 0 }}>
            <Icon size={20} />
          </div>
          <h2 className="section-title">{title}</h2>
          <span className="badge badge-gray">{records.length}</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowCsv(true)}>
            <Upload size={14} /> Import CSV
          </button>
          <button className="btn btn-secondary btn-sm" onClick={exportCsv}>
            <Download size={14} /> Export
          </button>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Add Record
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 20, maxWidth: 320 }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input
          className="form-input"
          placeholder="Search records…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 36 }}
        />
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <span className="spinner-olive spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Icon size={24} /></div>
            <p style={{ fontWeight: 500 }}>No records found</p>
            <p style={{ fontSize: "0.85rem" }}>Add your first record or import a CSV</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  {tableColumns.map((col) => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rec, i) => (
                  <tr key={rec.id} style={{ cursor: "pointer" }}>
                    <td style={{ color: "var(--text-muted)", fontWeight: 600 }}>{i + 1}</td>
                    {tableColumns.map((col) => (
                      <td key={col.key} title={rec[col.key]}>
                        {String(rec[col.key] || "—").slice(0, 60)}
                        {String(rec[col.key] || "").length > 60 ? "…" : ""}
                      </td>
                    ))}
                    <td><StatusBadge status={rec.status} /></td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" title="View" onClick={() => setShowDetail(rec)}>
                          <Eye size={15} color="var(--olive-600)" />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => openEdit(rec)}>
                          <Edit size={15} color="var(--accent-amber)" />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Delete" onClick={() => setDelTarget(rec)}>
                          <Trash2 size={15} color="var(--accent-red)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editTarget ? `Edit ${title}` : `Add ${title}`}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner" /> : (editTarget ? "Update" : "Save Record")}
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          {fields.map((field) => (
            <div
              key={field.key}
              className="form-group"
              style={{ gridColumn: field.span === 2 ? "1 / -1" : undefined }}
            >
              <label className="form-label">{field.label}</label>
              {field.type === "textarea" ? (
                <textarea
                  className="form-input form-textarea"
                  value={form[field.key] || ""}
                  onChange={e => setField(field.key, e.target.value)}
                />
              ) : field.type === "select" ? (
                <select
                  className="form-input form-select"
                  value={form[field.key] || "pending"}
                  onChange={e => setField(field.key, e.target.value)}
                >
                  {STATUS_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type={field.type || "text"}
                  className="form-input"
                  value={form[field.key] || ""}
                  onChange={e => setField(field.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>

        {platforms.length > 0 && (
          <>
            <div className="divider" />
            <h4 style={{ marginBottom: 12, color: "var(--text-mid)", fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Platform Responses
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              {platforms.map((p) => (
                <div key={p} className="form-group">
                  <label className="form-label">{p.charAt(0).toUpperCase() + p.slice(1)}</label>
                  <textarea
                    className="form-input form-textarea"
                    style={{ minHeight: 60 }}
                    value={form.response?.[p] || ""}
                    onChange={e => setResponse(p, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </Modal>

      {/* Detail View */}
      <Modal
        open={!!showDetail}
        onClose={() => setShowDetail(null)}
        title="Record Details"
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowDetail(null)}>Close</button>
            <button className="btn btn-secondary" onClick={() => { openEdit(showDetail); setShowDetail(null); }}>
              <Edit size={15} /> Edit
            </button>
            <button className="btn btn-danger" onClick={() => { setDelTarget(showDetail); setShowDetail(null); }}>
              <Trash2 size={15} /> Delete
            </button>
          </>
        }
      >
        {showDetail && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <StatusBadge status={showDetail.status} />
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {showDetail.date || ""}
              </span>
            </div>
            {fields.map((field) => showDetail[field.key] ? (
              <div key={field.key} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                  {field.label}
                </div>
                <div style={{ fontSize: "0.9rem", color: "var(--text-dark)", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                  {showDetail[field.key]}
                </div>
              </div>
            ) : null)}

            {platforms.length > 0 && showDetail.response && (
              <>
                <div className="divider" />
                <h4 style={{ marginBottom: 12, fontSize: "0.875rem", fontWeight: 600, color: "var(--text-mid)" }}>
                  Platform Responses
                </h4>
                <div className="grid-2">
                  {platforms.map((p) => showDetail.response[p] ? (
                    <div key={p} style={{ background: "var(--sand)", borderRadius: "var(--radius-sm)", padding: 12 }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--olive-600)", marginBottom: 6, textTransform: "uppercase" }}>
                        {p}
                      </div>
                      <p style={{ fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>{showDetail.response[p]}</p>
                    </div>
                  ) : null)}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* CSV Modal */}
      <Modal open={showCsv} onClose={() => setShowCsv(false)} title="Import CSV" size="lg">
        <CsvUpload collectionName={collectionName} onDone={() => setShowCsv(false)} />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={handleDelete}
        title="Delete Record"
      />
    </div>
  );
}
