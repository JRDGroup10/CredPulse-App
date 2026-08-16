import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppState } from "../lib/AppContext";
import { addCertificate, canUseTipsAndLinks, certLimit, certLimitReached, extractCertificate } from "../lib/store";
import { Certificate } from "../lib/types";
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

export default function AddCertificate() {
  const { userId, state, refresh } = useAppState();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limitReached = certLimitReached(state);
  const showTipsAndLinks = canUseTipsAndLinks(state);

  async function handleFile(file: File) {
    setFileName(file.name);
    setPendingFile(file);
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
    const payload = { ...draft, fileName };
    if (!showTipsAndLinks) {
      payload.tip = "";
      payload.renewalUrl = "";
    }
    setSaving(true);
    setError(null);
    try {
      await addCertificate(userId, payload, pendingFile);
      await refresh();
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that certificate — try again.");
      setSaving(false);
    }
  }

  if (limitReached) {
    const plan = PLANS[state.profile.plan];
    return (
      <div className="text-center py-16 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl animate-fade-in-up">
        <div className="text-3xl mb-3">🔒</div>
        <h1 className="font-semibold text-slate-900 dark:text-slate-50 mb-1">You've hit your {plan.name} plan limit</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-5">
          The {plan.name} plan tracks up to {certLimit(state)} certification{certLimit(state) === 1 ? "" : "s"}.
          Upgrade to track more, plus unlock renewal tips and direct booking links.
        </p>
        <Link
          to="/billing"
          className="inline-block bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-glow transition-all hover:-translate-y-0.5"
        >
          View plans
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-1">Add a certificate</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Upload a photo or PDF — we'll pull out the details for you to confirm.
      </p>

      {step === "upload" && (
        <div
          onClick={() => fileInput.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl py-16 text-center cursor-pointer hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50/40 dark:hover:bg-brand-500/5 transition-all animate-fade-in-up"
        >
          <div className="text-4xl mb-3">📄</div>
          <p className="font-medium text-slate-700 dark:text-slate-200">Click to upload, or drag a file here</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">JPG, PNG, or PDF — try naming it "bls.pdf" or "n95.jpg" for a demo match</p>
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
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl py-16 text-center bg-white dark:bg-slate-900 shadow-card animate-fade-in-up">
          <div className="mx-auto w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-medium text-slate-700 dark:text-slate-200">Reading {fileName}…</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Extracting credential name, issuer, and expiry date</p>
        </div>
      )}

      {step === "confirm" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-card animate-fade-in-up">
          {confidence !== null && confidence < 0.7 && (
            <div className="mb-4 text-xs bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 rounded-lg px-3 py-2">
              We weren't fully sure about this one — double-check the fields below before saving.
            </div>
          )}
          <div className="space-y-4">
            <Field label="Certificate name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
            <Field label="Issuing body" value={draft.issuer} onChange={(v) => setDraft({ ...draft, issuer: v })} />
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Type</label>
              <select
                value={draft.credentialType}
                onChange={(e) => setDraft({ ...draft, credentialType: e.target.value as Certificate["credentialType"] })}
                className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition"
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
                <div className="rounded-lg border border-brand-100 dark:border-brand-900 bg-brand-50 dark:bg-brand-500/10 px-3 py-2.5 text-xs text-brand-700 dark:text-brand-300 flex items-start justify-between gap-3">
                  <span>
                    We found a renewal tip and direct booking link for this one — upgrade to Plus or Pro to save and see them.
                  </span>
                  <Link to="/billing" className="font-semibold whitespace-nowrap">
                    Upgrade
                  </Link>
                </div>
              )
            )}
          </div>

          {error && (
            <div className="mt-4 text-xs bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-2 mt-6">
            <button
              onClick={handleSave}
              disabled={!draft.name || !draft.expiryDate || saving}
              className="bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-600 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-glow transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0"
            >
              {saving ? "Saving…" : "Save certificate"}
            </button>
            <button
              onClick={() => {
                setStep("upload");
                setDraft(EMPTY_DRAFT);
                setFileName("");
                setPendingFile(null);
                setError(null);
              }}
              disabled={saving}
              className="text-sm text-slate-500 dark:text-slate-400 px-4 py-2 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              Start over
            </button>
          </div>
        </div>
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
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition"
      />
    </div>
  );
}
