"use client";

/**
 * DashboardShell
 * ---------------
 * Persistent left-navigation frame for the Patwari/Admin dashboard.
 * Wraps page content so every dashboard route shares consistent chrome.
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileCheck2,
  Landmark,
  ShieldCheck,
  Menu,
  Upload,
  LogOut,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Upload Record", href: "/dashboard/upload", icon: Upload },
  { label: "Verification Queue", href: "/dashboard?tab=queue", icon: FileCheck2 },
  { label: "GIS Map", href: "/dashboard/map", icon: Landmark },
  { label: "Bhulekh Portal", href: "/bhulekh", icon: Landmark },
];

export default function DashboardShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50"><p>Loading...</p></div>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? "w-[76px]" : "w-64"
        } shrink-0 border-r border-slate-200 bg-forest-900 text-slate-100 transition-all duration-200`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-forest-800 px-4">
          <ShieldCheck className="h-7 w-7 shrink-0 text-forest-300" />
          {!collapsed && (
            <div className="leading-tight">
              <p className="font-display text-lg text-white">Bhu-Rekha</p>
              <p className="text-[11px] text-forest-300">Ministry of Rural Development</p>
            </div>
          )}
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = pathname === href.split("?")[0];
            return (
              <Link
                key={label}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-forest-700 text-white"
                    : "text-forest-200 hover:bg-forest-800 hover:text-white"
                }`}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" size={18} />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Toggle sidebar"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-700 capitalize">{user.role} — {user.username}</p>
              <p className="text-xs text-slate-400">Session active</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-100 font-medium uppercase text-forest-700">
              {user.username.substring(0, 2)}
            </div>
            <button
              onClick={logout}
              className="ml-2 rounded-md p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
