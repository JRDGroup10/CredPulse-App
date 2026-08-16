import { createClient } from "@supabase/supabase-js";

// Trim whitespace and strip accidental surrounding quotes — a very common
// copy-paste mistake when filling in .env.local by hand.
function clean(v: string | undefined): string {
  return (v ?? "").trim().replace(/^["']|["']$/g, "");
}

const url = clean(import.meta.env.VITE_SUPABASE_URL);
const anonKey = clean(import.meta.env.VITE_SUPABASE_ANON_KEY);

function isValidSupabaseUrl(u: string): boolean {
  if (!u) return false;
  try {
    const parsed = new URL(u);
    return parsed.protocol === "https:" && u !== "https://your-project-ref.supabase.co";
  } catch {
    return false;
  }
}

export const supabaseConfigured = isValidSupabaseUrl(url) && Boolean(anonKey) && anonKey !== "your-anon-public-key";

if (!supabaseConfigured) {
  // Doesn't throw — the app still boots and shows a clear setup message
  // instead of a blank white screen if .env.local is missing or malformed.
  console.warn(
    "[CredPulse] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing or don't look right. " +
      "Copy .env.example to .env.local and fill in your real Supabase project's values (no quotes, no extra spaces). See README.md."
  );
}

// createClient() itself can throw on a genuinely malformed URL — never let
// that crash the whole app before the "not configured" screen gets a chance
// to explain what's wrong.
export const supabase = supabaseConfigured
  ? createClient(url, anonKey)
  : createClient("https://placeholder.supabase.co", "placeholder-key");
