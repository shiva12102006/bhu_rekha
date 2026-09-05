/**
 * StatCard
 * --------
 * Displays a single executive metric with an icon accent and optional
 * trend/sub-label. Used on the Analytics Dashboard's summary grid.
 */
export default function StatCard({ label, value, icon: Icon, accent = "forest", suffix = "" }) {
  const accentClasses = {
    forest: "bg-forest-50 text-forest-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-100 text-slate-700",
    rose: "bg-rose-50 text-rose-700",
  }[accent];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {value}
            {suffix && <span className="text-lg text-slate-400">{suffix}</span>}
          </p>
        </div>
        <div className={`rounded-lg p-2.5 ${accentClasses}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
