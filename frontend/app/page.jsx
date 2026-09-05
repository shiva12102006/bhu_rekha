import Link from "next/link";
import GovHeader from "@/components/GovHeader";
import GovFooter from "@/components/GovFooter";
import { ArrowRight, ScanText, FileCheck2, Globe2, ShieldCheck, DatabaseZap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <GovHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section
          className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden py-20"
          style={{
            backgroundImage: "url('/hero-bg.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Subtle overlay to fade the background image */}
          <div className="absolute inset-0 z-0 " />

          {/* Background decoration */}
          <div className="absolute left-1/2 top-0 z-0 -ml-24 h-[1000px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-forest-100/40 to-transparent opacity-50 blur-3xl" />

          <div className="container relative z-10 mx-auto px-6 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-forest-100 text-forest-700 shadow-sm ring-1 ring-forest-200">
              <ShieldCheck size={32} />
            </div>

            <h1 className="mx-auto max-w-4xl font-display text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              Intelligent Land Record <br className="hidden md:inline" />
              <span className="text-forest-700">Digitization System</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Empowering India's rural development through AI-driven extraction,
              multilingual OCR, and secure validation of legacy land records.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-full bg-forest-700 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-forest-200 transition-all hover:-translate-y-0.5 hover:bg-forest-800 hover:shadow-xl"
              >
                Access Dashboard
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/bhulekh"
                className="flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 transition-all hover:-translate-y-0.5 hover:bg-slate-50"
              >
                Public Citizen Search
              </Link>
            </div>
          </div>
        </section>

        {/* Features / Motives Section */}
        <section className="container mx-auto px-6 py-20 sm:py-32">
          <div className="mb-16 text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Modernizing Land Administration
            </h2>
            <p className="mt-4 text-slate-500">
              Transforming physical registers and legacy PDFs into structured, verified digital assets.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">

            {/* Feature 1 */}
            <div className="group relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-forest-300 hover:shadow-xl hover:shadow-forest-100">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                <ScanText size={24} />
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold text-slate-900">AI-Powered OCR</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Automatically extract Khasra, Khatauni, and ownership details from faded or torn historical documents using advanced OCR.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-forest-300 hover:shadow-xl hover:shadow-forest-100">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition-colors group-hover:bg-orange-100">
                <Globe2 size={24} />
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold text-slate-900">Multilingual Support</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Seamlessly digitize records written in Hindi (Devanagari) and English, ensuring regional accessibility across states.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-forest-300 hover:shadow-xl hover:shadow-forest-100">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-forest-50 text-forest-600 transition-colors group-hover:bg-forest-100">
                <FileCheck2 size={24} />
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold text-slate-900">Intelligent Validation</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Cross-verify extracted fields with confidence scoring. Low-confidence flags ensure humans review only when necessary.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-forest-300 hover:shadow-xl hover:shadow-forest-100">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-100">
                <DatabaseZap size={24} />
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold text-slate-900">Seamless Integration</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Securely store structured data ready for integration with DILRMP, existing GIS platforms, and national portals.
              </p>
            </div>

          </div>
        </section>

      </main>

      <GovFooter />
    </div>
  );
}
