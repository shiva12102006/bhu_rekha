"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";

/**
 * ConfidenceField
 * ---------------
 * A labeled text input for the human-in-the-loop verification form.
 * Any field with confidence < 70 is highlighted amber/red with an alert
 * icon so the Patwari's eye is drawn to fields that most likely need
 * manual correction — the core "trust calibration" UX of the system.
 */
const LOW_CONFIDENCE_THRESHOLD = 70;

export default function ConfidenceField({ label, name, value, confidence = 0, onChange }) {
  const isLowConfidence = confidence < LOW_CONFIDENCE_THRESHOLD;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={name} className="text-sm font-medium text-slate-600">
          {label}
        </label>
        <span
          className={`flex items-center gap-1 text-xs font-medium ${
            isLowConfidence ? "text-amber-600" : "text-forest-600"
          }`}
        >
          {isLowConfidence ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
          {confidence.toFixed(0)}% confidence
        </span>
      </div>

      <input
        id={name}
        name={name}
        value={value ?? ""}
        onChange={(e) => onChange(name, e.target.value)}
        className={`w-full rounded-lg border px-3 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:ring-2 ${
          isLowConfidence
            ? "border-amber-300 bg-amber-50 focus:ring-amber-200"
            : "border-slate-200 bg-white focus:ring-forest-200"
        }`}
        placeholder={isLowConfidence ? "Uncertain — please verify against document" : ""}
      />

      {isLowConfidence && (
        <p className="flex items-center gap-1 text-xs text-amber-600">
          <AlertTriangle size={12} />
          Low OCR confidence — cross-check against the scanned document before approving.
        </p>
      )}
    </div>
  );
}
