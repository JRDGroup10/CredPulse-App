import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPublicVerification, PublicVerification, STATUS_STYLES } from "../lib/store";

const CREDENTIAL_TYPE_LABEL: Record<string, string> = {
  certification: "Certification",
  license: "License",
  training: "Training"
};

// Public, unauthenticated page — reached via the link/QR code a user
// generates from Settings (see the "Shareable verification link" card
// there). Deliberately shows only what's needed to confirm someone's
// credentials are current: no file attachments, notes, emails, or renewal
// links. See supabase/functions/public-verify for what actually enforces
// that boundary server-side — this page just renders whatever it returns.
//
// token comes in as a prop (extracted via a regex match in App.tsx) rather
// than useParams(), matching how this app's other public pages with a
// dynamic URL segment work (see Guide.tsx) — there's no nested <Route> for
// pre-auth pages here, just pathname checks in App.tsx's Routed().
export default function VerifyPublic({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PublicVerification | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setLoading(false);
      return;
    }
    fetchPublicVerification(token).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-4 z-10 px-3">
        <div className="max-w-2xl mx-auto rounded-[19px] border border-hairline/70 dark:border-hairline/10 bg-panel/80 backdrop-blur-md shadow-subtle">
          <div className="px-4 py-3 flex items-center justify-between">
            <Link to="/home" className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-ui bg-brand-500 text-white flex items-center justify-center font-medium text-sm">
                CP
              </span>
              <span className="font-medium text-ink">CredPulse</span>
            </Link>
            <span className="text-caption font-medium text-ink-muted">Credential Verification</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        {loading && (
          <div className="py-24 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && !data && (
          <div className="card p-8 text-center">
            <h1 className="text-heading-sm font-medium text-ink mb-2">Link not found</h1>
            <p className="text-body text-ink-muted">
              This verification link is invalid, or the person who shared it has since turned it off.
            </p>
          </div>
        )}

        {!loading && data && (
          <div className="space-y-6">
            <div className="card p-6">
              <div className="text-caption text-ink-faint uppercase tracking-wide mb-1">Verified profile</div>
              <h1 className="text-heading-sm font-medium text-ink">{data.name}</h1>
              <p className="text-body text-ink-muted mt-0.5">{data.role}</p>
            </div>

            <div>
              <div className="text-caption font-medium text-ink-faint uppercase tracking-wide mb-2">
                Certifications on file ({data.certificates.length})
              </div>
              {data.certificates.length === 0 ? (
                <div className="card p-6 text-center text-body text-ink-muted">
                  No certifications have been added yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {data.certificates.map((c, i) => {
                    const style = STATUS_STYLES[c.status];
                    return (
                      <div key={i} className="card p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-ink truncate">{c.name}</div>
                          <div className="text-caption text-ink-muted truncate">
                            {c.issuer} · {CREDENTIAL_TYPE_LABEL[c.credentialType] ?? c.credentialType}
                          </div>
                          {c.officiallyVerified && (
                            <div className="text-caption text-emerald-700 dark:text-emerald-400 mt-0.5">
                              ✓ Independently verified against the issuing body
                            </div>
                          )}
                        </div>
                        <span
                          className={`flex-shrink-0 text-caption font-medium px-2.5 py-1 rounded-pill ${style.bg} ${style.text}`}
                        >
                          {style.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <p className="text-caption text-ink-faint text-center pt-2">
              Generated {new Date(data.generatedAt).toLocaleString()} · Certification details are
              self-reported by the credential holder unless marked independently verified.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
