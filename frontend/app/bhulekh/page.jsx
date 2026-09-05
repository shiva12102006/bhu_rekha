"use client";

/**
 * /bhulekh
 * --------
 * Public "Bhulekh" citizen search portal. Anyone can search verified land
 * records by district/tehsil/village + Khasra number and view/print an
 * official-looking Digital Land Ownership Certificate.
 */

import { useState } from "react";
import { Search, Landmark, Printer, ShieldCheck, Loader2, MapPin } from "lucide-react";
import GovSeal from "@/components/GovSeal";
import { api } from "@/lib/api";

const DISTRICTS = ["Prayagraj", "Varanasi", "Lucknow", "Kanpur Nagar", "Ayodhya"];
const TEHSILS = ["Sadar", "Karchhana", "Soraon", "Phoolpur"];
const VILLAGES = ["Bahrampur", "Rampur Kalan", "Devipur", "Madhopur"];

export default function BhulekhPortalPage() {
  const [filters, setFilters] = useState({ district: "", tehsil: "", village: "", khasra_no: "" });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSelected(null);
    try {
      const data = await api.bhulekhSearch(filters);
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-forest-900 text-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-5">
          <Landmark size={26} className="text-forest-200" />
          <div>
            <h1 className="font-display text-xl">Bhulekh — Digital Land Record Portal</h1>
            <p className="text-xs text-forest-200">Ministry of Rural Development, Government of India</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Search Card */}
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-card sm:grid-cols-2 lg:grid-cols-4"
        >
          <SelectField label="District" value={filters.district} options={DISTRICTS} onChange={(v) => updateFilter("district", v)} />
          <SelectField label="Tehsil" value={filters.tehsil} options={TEHSILS} onChange={(v) => updateFilter("tehsil", v)} />
          <SelectField label="Village" value={filters.village} options={VILLAGES} onChange={(v) => updateFilter("village", v)} />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-600">Khasra Number</label>
            <input
              value={filters.khasra_no}
              onChange={(e) => updateFilter("khasra_no", e.target.value)}
              placeholder="e.g. 145/2"
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest-200"
            />
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-600 sm:col-span-2 lg:col-span-4"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Search Land Records
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Results List */}
        {results && !selected && (
          <div className="mt-6 space-y-3">
            {results.length === 0 && (
              <p className="rounded-lg border border-slate-200 bg-white py-8 text-center text-sm text-slate-400">
                No verified record found for the given filters.
              </p>
            )}
            {results.map((r) => (
              <button
                key={r.record_uid}
                onClick={() => setSelected(r)}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm shadow-card hover:border-forest-300"
              >
                <div>
                  <p className="font-medium text-slate-700">{r.owner_name}</p>
                  <p className="flex items-center gap-1 text-xs text-slate-400">
                    <MapPin size={11} /> {r.village}, {r.tehsil}, {r.district} &middot; Khasra {r.khasra_no}
                  </p>
                </div>
                <ShieldCheck size={16} className="text-forest-600" />
              </button>
            ))}
          </div>
        )}

        {/* Certificate View */}
        {selected && <LandCertificate record={selected} onBack={() => setSelected(null)} />}
      </main>
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-600">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-forest-200"
      >
        <option value="">All</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function LandCertificate({ record, onBack }) {
  return (
    <div className="mt-6">
      <button onClick={onBack} className="mb-3 text-sm text-slate-500 hover:text-slate-700">
        &larr; Back to results
      </button>

      <div
        id="certificate"
        className="rounded-xl border-2 border-forest-700/30 bg-white p-8 shadow-card"
      >
        <div className="flex items-start justify-between border-b-2 border-dashed border-forest-200 pb-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Government of India</p>
            <h2 className="font-display text-2xl text-forest-800">
              Digital Land Ownership Certificate
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Certificate ID: {record.record_uid} &middot; Issued via Bhulekh Digital Registry
            </p>
          </div>
          <GovSeal size={88} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <CertRow label="Owner Name" value={record.owner_name} />
          <CertRow label="Status" value="Verified" highlight />
          <CertRow label="Khasra No." value={record.khasra_no} />
          <CertRow label="Khata No." value={record.khata_no} />
          <CertRow label="Survey No." value={record.survey_no} />
          <CertRow label="Plot Area" value={record.plot_area} />
          <CertRow label="Village" value={record.village} />
          <CertRow label="Tehsil" value={record.tehsil} />
          <CertRow label="District" value={record.district} />
          <CertRow label="Land Classification" value={record.land_classification} />
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-4 text-xs text-slate-400">
          <span>
            This is a digitally verified extract. Last updated:{" "}
            {new Date(record.updated_at).toLocaleDateString()}
          </span>
          <span>Bhu-Rekha Portal &middot; Not valid without registry seal verification</span>
        </div>
      </div>

      <button
        onClick={() => window.print()}
        className="mt-4 flex items-center gap-2 rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-600 print:hidden"
      >
        <Printer size={16} /> Download / Print Certificate
      </button>
    </div>
  );
}

function CertRow({ label, value, highlight = false }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`font-medium ${highlight ? "text-forest-700" : "text-slate-800"}`}>
        {value || "—"}
      </p>
    </div>
  );
}
