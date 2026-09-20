// CredPulse brand mark + wordmark — glossy 3D chrome badge (shield outline, white pulse
// line, green accent sphere) on a rounded dark-navy tile, matching the approved app-icon /
// social-profile badge asset. This replaced the earlier flat "Dimension system" outline mark
// so the in-app nav/header mark visually matches the app icon, favicon, and social profile
// picture. It's a raster image (the glossy/chrome rendering doesn't reduce to a clean flat
// SVG) — /credpulse-mark.png is a 256px export of the same source used for the PWA icons,
// favicon, and apple-touch-icon, so keep them in sync if the badge is ever revised.

export function LogoMark({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <img
      src="/credpulse-mark.png"
      alt=""
      aria-hidden="true"
      className={`${className} rounded-[22%] object-contain`}
    />
  );
}

// themeAware: whether "Cred" should flip to white when the app's dark-mode class is active.
// Pass themeAware={false} only on a page whose own background is guaranteed to stay light
// regardless of the dark-mode toggle — the violet wordmark would be low-contrast on a dark
// background otherwise. As of the Dimension-system redesign, dark is the default background
// almost everywhere (see Layout.tsx, Landing.tsx), so themeAware={true} (the default) is
// almost always the right call now; only pass false for a page you've deliberately kept
// light-only and haven't yet redesigned.
export function LogoWordmark({
  className = "text-base",
  light = false,
  themeAware = true
}: {
  className?: string;
  light?: boolean;
  themeAware?: boolean;
}) {
  const credClass = light ? "text-white" : themeAware ? "text-[#6B62F2] dark:text-white" : "text-[#6B62F2]";
  return (
    <span className={`font-extrabold tracking-tight ${className}`}>
      <span className={credClass}>Cred</span>
      <span className="text-[#10B981]">Pulse</span>
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
