export default function MedicalIllustration() {
  return (
    <svg viewBox="0 0 480 420" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
      {/* backdrop */}
      <circle cx="240" cy="210" r="200" fill="#dbeafe" />
      <circle cx="240" cy="210" r="150" fill="#eaf4fb" />

      {/* clipboard */}
      <rect x="150" y="70" width="180" height="280" rx="16" fill="#ffffff" stroke="#bfdbfe" strokeWidth="2" />
      <rect x="150" y="70" width="180" height="280" rx="16" fill="none" />
      <rect x="205" y="58" width="70" height="28" rx="8" fill="#1d4ed8" />
      <rect x="218" y="66" width="44" height="12" rx="6" fill="#ffffff" />

      {/* checklist rows */}
      {[
        { y: 130, done: true },
        { y: 172, done: true },
        { y: 214, done: false },
        { y: 256, done: false }
      ].map((row, i) => (
        <g key={i}>
          <rect
            x="172"
            y={row.y}
            width="22"
            height="22"
            rx="6"
            fill={row.done ? "#10b981" : "#ffffff"}
            stroke={row.done ? "#10b981" : "#cbd5e1"}
            strokeWidth="2"
          />
          {row.done && (
            <path
              d={`M177 ${row.y + 12} l5 5 l10 -11`}
              stroke="#ffffff"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          <rect x="206" y={row.y + 5} width="94" height="12" rx="6" fill="#e2e8f0" />
        </g>
      ))}

      {/* pulse line across the bottom of the clipboard */}
      <polyline
        points="172,310 200,310 212,290 226,330 240,300 254,318 268,310 306,310"
        fill="none"
        stroke="#1d4ed8"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* medical cross badge */}
      <circle cx="352" cy="100" r="38" fill="#1d4ed8" />
      <rect x="344" y="82" width="16" height="36" rx="4" fill="#ffffff" />
      <rect x="334" y="92" width="36" height="16" rx="4" fill="#ffffff" />

      {/* small bell / reminder badge */}
      <circle cx="120" cy="320" r="30" fill="#10b981" />
      <path
        d="M120 305c-8 0-14 6-14 14v6l-5 7h38l-5-7v-6c0-8-6-14-14-14z"
        fill="#ffffff"
      />
      <circle cx="120" cy="332" r="4" fill="#ffffff" />
    </svg>
  );
}
