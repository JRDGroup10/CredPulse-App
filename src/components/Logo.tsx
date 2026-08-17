// CredPulse brand mark + wordmark, matching the approved design (navy shield + pulse line,
// light-blue accent dot, "Cred"/"Pulse" two-tone wordmark). Colors are fixed brand colors and
// intentionally don't shift with dark mode — the mark's own palette IS the brand.

export function LogoMark({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M30,8 L70,8 L88,38 L50,92 L12,38 Z" fill="#0B2A4A" />
      <path
        d="M22,46 L38,46 L44,30 L56,62 L62,46 L76,46"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="76" cy="46" r="3.5" fill="#4FB6E8" />
    </svg>
  );
}

// themeAware: whether "Cred" should flip to white when the app's dark-mode class is active.
// Only pages that actually render a dark background (the logged-in app, via Layout.tsx) should
// use themeAware. The public Landing page has no dark background, so it should stay navy always.
export function LogoWordmark({
  className = "text-base",
  light = false,
  themeAware = true
}: {
  className?: string;
  light?: boolean;
  themeAware?: boolean;
}) {
  const credClass = light ? "text-white" : themeAware ? "text-[#0B2A4A] dark:text-white" : "text-[#0B2A4A]";
  return (
    <span className={`font-extrabold tracking-tight ${className}`}>
      <span className={credClass}>Cred</span>
      <span className="text-[#4FB6E8]">Pulse</span>
    </span>
  );
}

export default function Logo({
  markClassName = "w-8 h-8",
  textClassName = "text-base",
  light = false,
  themeAware = true
}: {
  markClassName?: string;
  textClassName?: string;
  light?: boolean;
  themeAware?: boolean;
}) {
  return (
    <span className="flex items-center gap-2">
      <LogoMark className={markClassName} />
      <LogoWordmark className={textClassName} light={light} themeAware={themeAware} />
    </span>
  );
}
