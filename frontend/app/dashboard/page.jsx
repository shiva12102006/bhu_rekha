"use client";

/**
 * /dashboard
 * ----------
 * Executive Analytics Dashboard: high-level KPIs on document processing
 * throughput, OCR accuracy, pending workload, and district-wise progress —
 * plus the live verification queue for Patwaris to action.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Gauge,
  Clock,
  AlertOctagon,
  ArrowRight,
  RefreshCcw,
} from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import StatCard from "@/components/StatCard";
import ProgressBar from "@/components/ProgressBar";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [statsData, queueData] = await Promise.all([
        api.getDashboardStats(),
        api.listRecords({ status: "pending_verification" }),
      ]);
      setStats(statsData);
      setQueue(queueData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <DashboardShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-slate-900">Executive Overview</h1>
          <p className="text-sm text-slate-500">
            Real-time digitization progress across the land record modernization drive.
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Could not reach the API: {error}. Showing cached/placeholder data may not be available —
          verify the FastAPI backend is running at the configured NEXT_PUBLIC_API_URL.
        </div>
      )}

      {/* Stat Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Processed Documents"
          value={stats?.total_processed ?? "—"}
          icon={FileText}
          accent="forest"
        />
        <StatCard
          label="Average Extraction Accuracy"
          value={stats?.average_accuracy ?? "—"}
          suffix="%"
          icon={Gauge}
          accent="slate"
        />
        <StatCard
          label="Pending Verifications"
          value={stats?.pending_verifications ?? "—"}
          icon={Clock}
          accent="amber"
        />
        <StatCard
          label="Error Statistics (<50% confidence)"
          value={stats?.error_count ?? "—"}
          icon={AlertOctagon}
          accent="rose"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* District Progress Matrix */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card lg:col-span-3">
          <h2 className="mb-1 font-display text-lg text-slate-900">
            District-wise Digitization Progress
          </h2>
          <p className="mb-2 text-sm text-slate-500">
            Share of uploaded records that have completed Patwari verification.
          </p>
          <div className="divide-y divide-slate-100">
            {stats?.district_progress?.length ? (
              stats.district_progress.map((d) => (
                <ProgressBar
                  key={d.district}
                  label={d.district}
                  verified={d.verified}
                  total={d.total}
                  percent={d.progress_percent}
                />
              ))
            ) : (
              <p className="py-6 text-center text-sm text-slate-400">
                No district data yet — upload records to populate this matrix.
              </p>
            )}
          </div>
        </div>

        {/* Verification Queue */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card lg:col-span-2">
          <h2 className="mb-1 font-display text-lg text-slate-900">Verification Queue</h2>
          <p className="mb-3 text-sm text-slate-500">Records awaiting Patwari review.</p>
          <div className="flex flex-col divide-y divide-slate-100">
            {queue.length ? (
              queue.slice(0, 8).map((record) => (
                <Link
                  key={record.id}
                  href={`/dashboard/verify/${record.id}`}
                  className="group flex items-center justify-between py-3 text-sm hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-700">
                      {record.owner_name || "Unrecognized Owner"}
                    </p>
                    <p className="text-xs text-slate-400">
                      Khasra {record.khasra_no || "—"} &middot; {record.district || "Unknown district"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        record.confidence_score < 70
                          ? "bg-amber-100 text-amber-700"
                          : "bg-forest-100 text-forest-700"
                      }`}
                    >
                      {record.confidence_score.toFixed(0)}%
                    </span>
                    <ArrowRight
                      size={14}
                      className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-forest-600"
                    />
                  </div>
                </Link>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-slate-400">
                Queue is empty — all uploaded records have been verified.
              </p>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
