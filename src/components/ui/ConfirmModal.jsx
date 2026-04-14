import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";

export default function ConfirmModal({ open, onClose, onConfirm, title, message }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title || "Confirm Action"}
      size="sm"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={() => { onConfirm(); onClose(); }}>
            Yes, Delete
          </button>
        </>
      }
    >
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <AlertTriangle size={20} color="#dc2626" />
        </div>
        <p style={{ paddingTop: 8, color: "var(--text-mid)", fontSize: "0.9rem" }}>
          {message || "Are you sure you want to delete this record? This action cannot be undone."}
        </p>
      </div>
    </Modal>
  );
}
