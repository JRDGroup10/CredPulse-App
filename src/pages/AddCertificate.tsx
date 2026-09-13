import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppState } from "../lib/AppContext";
import { addCertificate, canUseTipsAndLinks, certLimit, certLimitReached, extractCertificate } from "../lib/store";
import { findLikelyDuplicate } from "../lib/certSimilarity";
import { CertScope, Certificate } from "../lib/types";
import { PLANS } from "../lib/plans";

type Step = "upload" | "extracting" | "confirm";

const EMPTY_DRAFT = {
  name: "",
  issuer: "",
  credentialType: "certification" as Certificate["credentialType"],
  issuedDate: "",
  expiryDate: "",
  tip: "",
  renewalUrl: ""
};

// Separate from the main draft state deliberately — CEU tracking is opt-in
// and orthogonal to the extracted fields above (AI extraction has no way to
// know whether a given cert uses the CEU renewal model), so it gets its own
// toggle + input rather than being folded into EMPTY_DRAFT.

export default function AddCertificate() {
  const { userId, state, refresh } = useAppState();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const isOrgMember = !!state.profile.organizationId;

  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [tracksCeu, setTracksCeu] = useState(false);
  const [ceuRequired, setCeuRequired] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Team members default to 'clinic' — that's the reason most people join a
  // team in the first place — but can flip to 'personal' for anything
  // unrelated to work, which then counts against their own individual plan
  // and stays private from the clinic admin. Anyone with no organization at
  // all is always 'personal' — there's no clinic to route to.
  const [scope, setScope] = useState<CertScope>(isOrgMember ? "clinic" : "personal");

  const limitReached = certLimitReached(state, scope);
  const showTipsAndLinks = canUseTipsAndLinks(state, scope);

  // Redundant-cert detection: flags when the name being saved looks like a
  // credential the person already has on file (typo'd re-entry, or a
  // renewal that should probably replace the old record instead of piling
  // up next to it). Purely a heads-up — doesn't block saving — so it's
  // dismissible per add-attempt via dismissedDuplicate, reset whenever a
  // fresh file/manual entry starts.
  const [dismissedDuplicate, setDismissedDuplicate] = useState(false);
  const duplicate = useMemo(
    () => (dismissedDuplicate ? null : findLikelyDuplicate(draft.name, state.certificates)),
    [draft.name, state.certificates, dismissedDuplicate]
  );

  async function handleFile(file: File) {
    setFileName(file.name);
    setPendingFile(file);
    setDismissedDuplicate(false);
    setStep("extracting");
    const result = await extractCertificate(file, state.profile.region);
    setDraft({
      name: result.name,
      issuer: result.issuer,
      credentialType: result.credentialType,
      issuedDate: result.issuedDate,
      expiryDate: result.expiryDate,
      tip: result.tip,
      renewalUrl: result.renewalUrl
    });
    setConfidence(result.confidence);
    setStep("confirm");
  }

  async function handleSave() {
    // Always save the extracted tip/renewal link, even when the plan
    // wouldn't otherwise unlock them — CertCard shows a locked teaser for
    // them instead of hiding them outright, so the upgrade prompt stays
    // visible every time this certificate is viewed, not just once at
    // add-time.
    const payload = {
      ...draft,
      fileName,
      scope,
      ceuRequired: tracksCeu && Number(ceuRequired) > 0 ? Number(ceuRequired) : undefined
    };
    setSaving(true);
    setError(null);
    try {
      await addCertificate(
        userId,
        payload,
        pendingFile,
        scope === "clinic"
          ? { id: userId, name: state.profile.name, email: state.profile.email, organizationId: state.profile.organizationId }
          : undefined
      );
      await refresh();
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that certificate — try again.");
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-heading-sm font-medium text-ink mb-1">Add a certificate</h1>
      <p className="text-body text-ink-muted mb-4">
        Upload a photo or PDF — we'll pull out the details for you to confirm.
      </p>

      {isOrgMember && (
        <div className="mb-6 card p-4">
          <div className="text-caption font-medium text-ink-faint mb-2">This certificate is:</div>
          <div className="grid grid-cols-2 gap-2 max-w-sm">
            <button
              type="button"
              onClick={() => setScope("clinic")}
              className={`text-body font-medium py-2 rounded-ui border transition-all ${
                scope === "clinic"
                  ? "bg-brand-500/10 border-brand-500/40 text-brand-700 dark:text-brand-400"
                  : "bg-panel border-hairline dark:border-hairline/15 text-ink-muted hover:border-brand-500/30"
              }`}
            >
              🏥 For my clinic
            </button>
            <button
              type="button"
              onClick={() => setScope("personal")}
              className={`text-body font-medium py-2 rounded-ui border transition-all ${
                scope === "personal"
                  ? "bg-brand-500/10 border-brand-500/40 text-brand-700 dark:text-brand-400"
                  : "bg-panel border-hairline dark:border-hairline/15 text-ink-muted hover:border-brand-500/30"
              }`}
            >
              Personal
            </button>
          </div>
          <p className="text-caption text-ink-faint mt-2">
            {scope === "clinic"
              ? "Unlimited, and visible to your clinic's admin for compliance tracking."
              : "Counts against your own individual plan and stays private — your clinic admin never sees personal certificates."}
          </p>
        </div>
      )}

      {limitReached ? (
        <div className="text-center py-16 border border-dashed border-hairline dark:border-hairline/15 rounded-panel animate-fade-in-up">
          <div className="text-3xl mb-3">🔒</div>
          <h2 className="font-medium text-ink mb-1">
            You've hit your {PLANS[state.profile.plan].name} plan limit
          </h2>
          <p className="text-body text-ink-muted max-w-sm mx-auto mb-5">
            {isOrgMember
              ? `Your individual plan tracks up to ${certLimit(state)} personal certification${certLimit(state) === 1 ? "" : "s"} outside your clinic work. Upgrade to track more, or switch this one to "For my clinic" if it's work-related.`
              : `The ${PLANS[state.profile.plan].name} plan tracks up to ${certLimit(state)} certification${certLimit(state) === 1 ? "" : "s"}. Upgrade to track more, plus unlock renewal tips and direct booking links.`}
          </p>
          <Link to="/billing" className="btn-primary text-body px-4 py-2 inline-flex">
            View plans
          </Link>
        </div>
      ) : (
        <>
          {step === "upload" && (
            <div
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              className="border-2 border-dashed border-hairline dark:border-hairline/15 rounded-panel py-16 text-center cursor-pointer hover:border-brand-500/40 hover:bg-brand-500/5 transition-all animate-fade-in-up"
            >
              <div className="text-4xl mb-3">📄</div>
              <p className="font-medium text-ink">Click to upload, or drag a file here</p>
              <p className="text-caption text-ink-faint mt-1">JPG, PNG, or PDF — up to 10MB</p>
              <input
                ref={fileInput}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>
          )}

          {step === "extracting" && (
            <div className="card py-16 text-center animate-fade-in-up">
              <div className="mx-auto w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-medium text-ink">Reading {fileName}…</p>
              <p className="text-caption text-ink-faint mt-1">Extracting credential name, issuer, and expiry date</p>
            </div>
          )}

          {step === "confirm" && (
            <div className="card p-5 animate-fade-in-up">
              {confidence !== null && confidence < 0.7 && (
                <div className="mb-4 text-caption bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-ui px-3 py-2">
                  We weren't fully sure about this one — double-check the fields below before saving.
                </div>
              )}

              {duplicate && (
                <div className="mb-4 text-caption bg-brand-500/10 text-brand-700 dark:text-brand-400 border border-brand-500/20 rounded-ui px-3 py-2.5 flex items-start justify-between gap-3">
                  <span>
                    You already have <span className="font-medium">{duplicate.name}</span> on file (expires{" "}
                    {new Date(duplicate.expiryDate).toLocaleDateString(undefined, { timeZone: "UTC" })}). If this is the same certification, consider
                    deleting the old record after saving instead of keeping both.
                  </span>
                  <button
                    type="button"
                    onClick={() => setDismissedDuplicate(true)}
                    className="font-medium whitespace-nowrap flex-shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              )}
              <div className="space-y-4">
                <Field label="Certificate name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
                <Field label="Issuing body" value={draft.issuer} onChange={(v) => setDraft({ ...draft, issuer: v })} />
                <div>
                  <label htmlFor="cert-credential-type" className="block text-caption font-medium text-ink-muted mb-1">Type</label>
                  <select
                    id="cert-credential-type"
                    value={draft.credentialType}
                    onChange={(e) => setDraft({ ...draft, credentialType: e.target.value as Certificate["credentialType"] })}
                    className="w-full border border-hairline dark:border-hairline/15 bg-panel text-ink rounded-ui px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition"
                  >
                    <option value="certification">Certification</option>
                    <option value="license">License</option>
                    <option value="training">Training</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Issued date" type="date" value={draft.issuedDate} onChange={(v) => setDraft({ ...draft, issuedDate: v })} />
                  <Field label="Expiry date" type="date" value={draft.expiryDate} onChange={(v) => setDraft({ ...draft, expiryDate: v })} />
                </div>

                {showTipsAndLinks ? (
                  <>
                    <Field label="Renewal tip" value={draft.tip} onChange={(v) => setDraft({ ...draft, tip: v })} />
                    <Field label="Renewal / booking link" value={draft.renewalUrl} onChange={(v) => setDraft({ ...draft, renewalUrl: v })} />
                  </>
                ) : (
                  (draft.tip || draft.renewalUrl) && (
                    <div className="rounded-ui border border-brand-500/20 bg-brand-500/10 px-3 py-2.5 text-caption text-brand-700 dark:text-brand-400 flex items-start justify-between gap-3">
                      <span>
                        We found a renewal tip and direct booking link for this one — upgrade to Plus or Pro to unlock them.
                      </span>
                      <Link to="/billing" className="font-medium whitespace-nowrap">
                        Upgrade
                      </Link>
                    </div>
                  )
                )}

                <div className="rounded-ui border border-hairline dark:border-hairline/15 p-3">
                  <label className="flex items-center gap-2 text-body text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tracksCeu}
                      onChange={(e) => setTracksCeu(e.target.checked)}
                      className="w-4 h-4 rounded border-hairline dark:border-hairline/20 text-brand-600 focus:ring-brand-500/40"
                    />
                    This renews by earning continuing-education credits (CEUs)
                  </label>
                  <p className="text-caption text-ink-faint mt-1 ml-6">
                    For certs like CPC, CRCST, or PANCE that renew by accumulating credits over the cycle, not a single course.
                  </p>
                  {tracksCeu && (
                    <div className="mt-2 ml-6 max-w-[10rem]">
                      <label htmlFor="cert-ceu-required" className="block text-caption font-medium text-ink-muted mb-1">
                        Credits required
                      </label>
                      <input
                        id="cert-ceu-required"
                        type="number"
                        min="1"
                        step="1"
                        value={ceuRequired}
                        onChange={(e) => setCeuRequired(e.target.value)}
                        placeholder="e.g. 36"
                        className="w-full border border-hairline dark:border-hairline/15 bg-panel text-ink placeholder:text-ink-muted rounded-ui px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition"
                      />
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="mt-4 text-caption bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-ui px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex gap-2 mt-6">
                <button onClick={handleSave} disabled={!draft.name || !draft.expiryDate || saving} className="btn-primary text-body px-4 py-2 disabled:opacity-40">
                  {saving ? "Saving…" : "Save certificate"}
                </button>
                <button
                  onClick={() => {
                    setStep("upload");
                    setDraft(EMPTY_DRAFT);
                    setFileName("");
                    setPendingFile(null);
                    setError(null);
                    setDismissedDuplicate(false);
                    setTracksCeu(false);
                    setCeuRequired("");
                  }}
                  disabled={saving}
                  className="text-body text-ink-muted px-4 py-2 hover:text-ink transition-colors"
                >
                  Start over
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  // Derived from the label rather than a passed-in prop — every call site on
  // this page uses a distinct label, so this stays unique without having to
  // thread an id through every <Field> usage.
  const id = `cert-field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="block text-caption font-medium text-ink-muted mb-1">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-hairline dark:border-hairline/15 bg-panel text-ink rounded-ui px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition"
      />
    </div>
  );
}
