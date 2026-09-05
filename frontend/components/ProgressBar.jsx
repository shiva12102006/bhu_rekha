/**
 * ProgressBar
 * -----------
 * Slim, sleek progress indicator used in the district-wise digitization
 * matrix. Color shifts from amber (early progress) to forest (near-complete).
 */
export default function ProgressBar({ label, verified, total, percent }) {
  const barColor =
    percent >= 75 ? "bg-forest-600" : percent >= 40 ? "bg-saffron" : "bg-rose-400";

  return (
    <div className="py-2.5">
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-400">
          {verified}/{total} verified &middot; {percent.toFixed(1)}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}
