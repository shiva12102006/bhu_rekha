/**
 * GovSeal
 * -------
 * Mock official seal used on the digital land ownership certificate.
 * Purely decorative/illustrative — not an actual government emblem.
 */
export default function GovSeal({ size = 96 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="shrink-0"
      aria-label="Official verification seal"
    >
      <circle cx="50" cy="50" r="48" fill="none" stroke="#1a4f33" strokeWidth="2" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="#1a4f33" strokeWidth="1" strokeDasharray="2 3" />
      <circle cx="50" cy="50" r="32" fill="#eef6f0" stroke="#1a4f33" strokeWidth="1.5" />
      <text
        x="50"
        y="42"
        textAnchor="middle"
        fontSize="7"
        fill="#1a4f33"
        fontFamily="serif"
        fontWeight="600"
      >
        GOVERNMENT OF INDIA
      </text>
      <path d="M35 50 L48 62 L67 40" stroke="#1a4f33" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text
        x="50"
        y="76"
        textAnchor="middle"
        fontSize="6"
        fill="#1a4f33"
        fontFamily="serif"
        letterSpacing="1"
      >
        DIGITALLY VERIFIED
      </text>
    </svg>
  );
}
