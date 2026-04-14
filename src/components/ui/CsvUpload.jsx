import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, XCircle } from "lucide-react";
import Papa from "papaparse";
import toast from "react-hot-toast";
import { db } from "../../firebase/config";
import { collection, addDoc } from "firebase/firestore";

// Map CSV headers to Firestore fields per collection
const SCHEMA_MAP = {
  blogs: {
    required: ["title"],
    fields: ["sno","date","title","prompt","imagePrompt","caption","tags","adsCaption","status"],
    platforms: ["wix","linkedin","facebook","twitter","threads","pinterest","youtube"],
  },
  carousels: {
    required: ["title"],
    fields: ["sno","date","title","prompt","caption","tags","status"],
    platforms: ["instagram","facebook","linkedin","youtube"],
  },
  reels: {
    required: ["title"],
    fields: ["sno","date","title","imagePrompt1","imagePrompt2","imagePrompt3","imagePrompt4","videoPrompt","captionTags","status"],
    platforms: ["instagram","facebook","linkedin","youtube","pinterest"],
  },
  media: {
    required: ["title"],
    fields: ["sno","title","promptImage","captionTitleTags","description","status"],
    platforms: ["youtube","podcast","socialCaption","linkedin","twitter","threads"],
  },
  tweets: {
    required: ["tweet"],
    fields: ["sno","date","tweet","tags","status"],
    platforms: ["response"],
  },
};

export default function CsvUpload({ collectionName, onDone }) {
  const [dragging, setDragging] = useState(false);
  const [results, setResults] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const schema = SCHEMA_MAP[collectionName];

  const processFile = (file) => {
    if (!file || !file.name.endsWith(".csv")) {
      toast.error("Please upload a .csv file");
      return;
    }
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setResults(result.data);
        toast.success(`Parsed ${result.data.length} rows`);
      },
      error: () => toast.error("Failed to parse CSV"),
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleImport = async () => {
    if (!results || results.length === 0) return;
    setUploading(true);
    let success = 0, fail = 0;
    try {
      for (const row of results) {
        try {
          const doc = {};
          schema.fields.forEach((f) => { doc[f] = row[f] || ""; });
          doc.response = {};
          schema.platforms.forEach((p) => { doc.response[p] = row[p] || ""; });
          doc.createdAt = new Date().toISOString();
          doc.status = row.status || "pending";
          await addDoc(collection(db, collectionName), doc);
          success++;
        } catch { fail++; }
      }
      toast.success(`Imported ${success} records${fail > 0 ? `, ${fail} failed` : ""}`);
      setResults(null);
      onDone?.();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current.click()}
        style={{
          border: `2px dashed ${dragging ? "var(--olive-500)" : "var(--parchment)"}`,
          borderRadius: "var(--radius)",
          padding: "32px",
          textAlign: "center",
          cursor: "pointer",
          background: dragging ? "var(--olive-50)" : "var(--sand)",
          transition: "all var(--transition)",
        }}
      >
        <Upload size={32} color="var(--olive-400)" style={{ margin: "0 auto 10px" }} />
        <p style={{ fontWeight: 500, color: "var(--text-mid)" }}>
          Drop CSV file here or click to browse
        </p>
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>
          Supported columns: {schema.fields.join(", ")}
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          style={{ display: "none" }}
          onChange={(e) => processFile(e.target.files[0])}
        />
      </div>

      {results && (
        <div style={{ marginTop: 16 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px", background: "#dcfce7", borderRadius: "var(--radius-sm)",
            marginBottom: 12,
          }}>
            <CheckCircle size={18} color="#15803d" />
            <span style={{ fontSize: "0.875rem", color: "#15803d", fontWeight: 500 }}>
              {results.length} rows ready to import
            </span>
          </div>

          {/* Preview table */}
          <div style={{ overflowX: "auto", borderRadius: "var(--radius-sm)", border: "1px solid var(--parchment)" }}>
            <table className="data-table">
              <thead>
                <tr>
                  {Object.keys(results[0] || {}).slice(0, 6).map((k) => (
                    <th key={k}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).slice(0, 6).map((v, j) => (
                      <td key={j}>{String(v).slice(0, 40)}{String(v).length > 40 ? "…" : ""}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {results.length > 5 && (
              <p style={{ padding: "8px 14px", fontSize: "0.8rem", color: "var(--text-muted)", background: "var(--sand)" }}>
                + {results.length - 5} more rows
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 14, justifyContent: "flex-end" }}>
            <button className="btn btn-secondary" onClick={() => setResults(null)}>
              <XCircle size={15} /> Cancel
            </button>
            <button className="btn btn-primary" onClick={handleImport} disabled={uploading}>
              {uploading ? <span className="spinner" /> : <><FileText size={15} /> Import {results.length} Records</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
