import Link from "next/link";
import { ShieldCheck, Menu } from "lucide-react";

export default function GovHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <ShieldCheck size={32} className="text-forest-700" />
          <div className="flex flex-col">
            <span className="font-display text-lg font-bold leading-none text-slate-900">Bhu-Rekha</span>
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Govt. of India
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/" className="text-sm font-medium text-slate-600 transition-colors hover:text-forest-700">
            Home
          </Link>
          <Link href="/bhulekh" className="text-sm font-medium text-slate-600 transition-colors hover:text-forest-700">
            Public Search
          </Link>
          <Link href="/dashboard" className="text-sm font-medium text-slate-600 transition-colors hover:text-forest-700">
            Official Dashboard
          </Link>
          
          <div className="h-6 w-px bg-slate-200"></div>

          <Link
            href="/login"
            className="rounded-full bg-forest-700 px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-forest-800 hover:shadow-md"
          >
            Officer Login
          </Link>
        </nav>

        {/* Mobile Menu Toggle */}
        <button className="flex items-center text-slate-600 md:hidden">
          <Menu size={24} />
        </button>
      </div>
    </header>
  );
}
