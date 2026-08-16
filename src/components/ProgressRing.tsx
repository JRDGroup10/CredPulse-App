import type { CSSProperties } from "react";

export default function ProgressRing({
  pct,
  color,
  size = 56,
  stroke = 6,
  trackClassName = "text-slate-100 dark:text-slate-800"
}: {
  pct: number; // 0-100
  color: string;
  size?: number;
  stroke?: number;
  trackClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        fill="none"
        className={trackClassName}
        stroke="currentColor"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference}
        style={
          {
            "--ring-circumference": circumference,
            "--ring-offset": offset,
            animation: "ringFill 1s ease-out forwards"
          } as CSSProperties
        }
      />
    </svg>
  );
}
