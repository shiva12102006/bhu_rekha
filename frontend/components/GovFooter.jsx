import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function GovFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 px-6 py-12 text-slate-300">
      <div className="container mx-auto grid grid-cols-1 gap-8 md:grid-cols-4">
        
        {/* Brand */}
        <div className="flex flex-col gap-4 md:col-span-1">
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck size={28} className="text-forest-500" />
            <span className="font-display text-xl font-bold">Bhu-Rekha</span>
          </div>
          <p className="text-sm text-slate-400">
            Intelligent Land Record Digitization & Validation System.
            Empowering Digital India.
          </p>
        </div>

        {/* Links */}
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Services</h3>
          <ul className="flex flex-col gap-2 text-sm">
            <li><Link href="/bhulekh" className="hover:text-forest-400">Citizen Portal</Link></li>
            <li><Link href="/dashboard" className="hover:text-forest-400">Patwari Dashboard</Link></li>
            <li><Link href="/dashboard/upload" className="hover:text-forest-400">Upload Records</Link></li>
          </ul>
        </div>

        {/* Govt Links */}
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Govt Links</h3>
          <ul className="flex flex-col gap-2 text-sm">
            <li><a href="#" className="hover:text-forest-400">Ministry of Rural Development</a></li>
            <li><a href="#" className="hover:text-forest-400">Digital India</a></li>
            <li><a href="#" className="hover:text-forest-400">National Informatics Centre</a></li>
          </ul>
        </div>

        {/* Helpdesk */}
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Helpdesk</h3>
          <ul className="flex flex-col gap-2 text-sm">
            <li>Toll Free: 1800-111-2222</li>
            <li>Email: support@bhurekha.gov.in</li>
            <li>Hours: Mon-Sat, 9 AM - 6 PM</li>
          </ul>
        </div>

      </div>
      
      <div className="container mx-auto mt-12 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Ministry of Rural Development, Government of India. All rights reserved.
      </div>
    </footer>
  );
}
