"use client";

/**
 * /dashboard/verify/[id]
 * -----------------------
 * Side-by-side Human-in-the-Loop verification panel.
 * Left: scanned document viewer. Right: editable extracted-field form
 * with low-confidence highlighting. Approving submits corrected data
 * to PUT /api/v1/land/verify/{id}.
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FileImage,
  ZoomIn,
  ZoomOut,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  ChevronLeft,
} from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import ConfidenceField from "@/components/ConfidenceField";
import { api, API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

const FIELD_DEFS = [
  { name: "owner_name", label: "Owner Name" },
  { name: "survey_no", label: "Survey No." },
  { name: "khasra_no", label: "Khasra No." },
  { name: "khata_no", label: "Khata No." },
  { name: "plot_area", label: "Plot Area" },
  { name: "village", label: "Village" },
  { name: "tehsil", label: "Tehsil" },
  { name: "district", label: "District" },
  { name: "land_classification", label: "Land Classification" },
];

export default function VerifyRecordPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [record, setRecord] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getRecord(id);
        setRecord(data);
        setFormData(
          Object.fromEntries(FIELD_DEFS.map(({ name }) => [name, data[name] || ""]))
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function handleFieldChange(name, value) {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleApprove() {
    setSaving(true);
    setError(null);
    try {
      await api.verifyRecord(id, { ...formData, verified_by_user_id: user?.id || 1 });
      setSaved(true);
      setTimeout(() => router.push("/dashboard"), 1400);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex h-96 items-center justify-center text-slate-400">
          <Loader2 className="mr-2 animate-spin" size={18} /> Loading record…
        </div>
      </DashboardShell>
    );
  }

  if (error && !record) {
    return (
      <DashboardShell>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Failed to load record #{id}: {error}
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ChevronLeft size={15} /> Back to queue
      </button>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-slate-900">Record Verification</h1>
          <p className="text-sm text-slate-500">
            Document: <span className="font-medium text-slate-700">{record.file_name}</span> &middot;{" "}
            Overall confidence:{" "}
            <span
              className={record.confidence_score < 70 ? "font-medium text-amber-600" : "font-medium text-forest-600"}
            >
              {record.confidence_score.toFixed(1)}%
            </span>
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          Status: {record.status.replace("_", " ")}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* LEFT PANEL: Document Viewer (50%) */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <FileImage size={16} /> Scanned Document
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <ZoomOut size={15} />
              </button>
              <span className="w-10 text-center text-xs text-slate-400">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <ZoomIn size={15} />
              </button>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center overflow-auto bg-slate-100 p-6">
            {/* If a real scanned image exists, render it; else show a mock document container */}
            {record.file_url ? (
              <img
                src={`${API_BASE_URL}${record.file_url}`}
                alt="Scanned land record"
                style={{ transform: `scale(${zoom})` }}
                className="max-w-none rounded-md border border-slate-200 bg-white shadow-md transition-transform"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <MockDocumentPreview text={record.extracted_text} zoom={zoom} />
            )}
          </div>

          <div className="border-t border-slate-100 px-4 py-3">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">
              Raw OCR Extract
            </p>
            <pre className="max-h-28 overflow-auto whitespace-pre-wrap rounded-md bg-slate-50 p-2 text-xs text-slate-500">
              {record.extracted_text}
            </pre>
          </div>
        </div>

        {/* RIGHT PANEL: Editable Verification Form (50%) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="mb-4 font-display text-lg text-slate-900">Extracted Land Record Details</h2>

          {record.verification_warnings && (
            <div className="mb-6 rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-amber-500 text-lg">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">
                    Cross-Database Verification Failed
                  </h3>
                  <div className="mt-2 text-sm text-amber-700">
                    <ul className="list-disc pl-5 space-y-1">
                      {JSON.parse(record.verification_warnings).map((warning, idx) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FIELD_DEFS.map(({ name, label }) => (
              <div key={name} className={name === "owner_name" ? "sm:col-span-2" : ""}>
                <ConfidenceField
                  label={label}
                  name={name}
                  value={formData[name]}
                  confidence={record.field_confidence?.[name] ?? 0}
                  onChange={handleFieldChange}
                />
              </div>
            ))}
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          )}

          <button
            onClick={handleApprove}
            disabled={saving || saved}
            className={`mt-6 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors ${
              saved
                ? "bg-forest-500"
                : "bg-forest-700 hover:bg-forest-600 disabled:cursor-not-allowed disabled:opacity-70"
            }`}
          >
            {saved ? (
              <>
                <CheckCircle2 size={17} /> Saved to National Registry
              </>
            ) : saving ? (
              <>
                <Loader2 size={17} className="animate-spin" /> Saving…
              </>
            ) : (
              <>
                <ShieldCheck size={17} /> Approve &amp; Save to National Registry
              </>
            )}
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}

/** Fallback mock "PDF page" container when no real scanned image is available. */
function MockDocumentPreview({ text, zoom }) {
  return (
    <div
      style={{ transform: `scale(${zoom})` }}
      className="aspect-[3/4] w-full max-w-sm rounded-md border border-slate-300 bg-white p-6 shadow-md transition-transform"
    >
      <div className="mb-4 border-b border-slate-200 pb-2 text-center">
        <p className="font-display text-sm text-slate-700">भूमि अभिलेख / Land Record Register</p>
        <p className="text-[10px] text-slate-400">Revenue Department — Specimen Scan</p>
      </div>
      <pre className="whitespace-pre-wrap font-serif text-[11px] leading-relaxed text-slate-600">
        {text}
      </pre>
    </div>
  );
}
