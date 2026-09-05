import Link from "next/link";
import { ShieldCheck, Landmark, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6">
      <ShieldCheck size={40} className="mb-4 text-forest-700" />
      <h1 className="font-display text-3xl text-slate-900">Bhu-Rekha</h1>
      <p className="mt-2 max-w-md text-center text-sm text-slate-500">
        Intelligent Land Record Digitization and Validation System — AI-assisted OCR
        extraction with human-in-the-loop verification, built for the Ministry of
        Rural Development.
      </p>

      <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard"
          className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-card hover:border-forest-300"
        >
          <div>
            <p className="font-medium text-slate-800">Patwari Dashboard</p>
            <p className="text-xs text-slate-400">Upload, verify &amp; track digitization</p>
          </div>
          <ArrowRight size={16} className="text-slate-300 group-hover:text-forest-600" />
        </Link>

        <Link
          href="/bhulekh"
          className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-card hover:border-forest-300"
        >
          <div>
            <p className="font-medium text-slate-800">Bhulekh Public Portal</p>
            <p className="text-xs text-slate-400">Citizen land record search &amp; certificate</p>
          </div>
          <Landmark size={16} className="text-slate-300 group-hover:text-forest-600" />
        </Link>
      </div>
    </div>
  );
}
