// Role-based signup checklist — the "instant relevance" onboarding moment.
// The moment someone picks their role at signup, we already know roughly
// which certifications they're likely to need, so we can tell them exactly
// what to upload instead of showing a blank dashboard. See RoleChecklistCard.tsx
// for where this renders.
//
// Reuses KNOWN_TEMPLATES from mockExtract.ts (rather than a separate list)
// so a recommended item's name/region-variant and the regex used to detect
// "the user already has this" always match what the AI extractor itself
// would produce — one source of truth for certification identity.

import { KNOWN_TEMPLATES } from "./mockExtract";
import { Region } from "./types";

export interface ChecklistItem {
  name: string;
  match: RegExp;
}

/** Finds the KNOWN_TEMPLATES entry whose match regex fires on this keyword,
 * and returns it as a region-aware checklist item. Throws at module-load
 * time (not silently) if a keyword typo means nothing matches — better to
 * fail loudly here than show a blank/wrong recommendation to a user. */
function item(keyword: string, region: Region): ChecklistItem {
  const template = KNOWN_TEMPLATES.find((t) => t.match.test(keyword));
  if (!template) {
    throw new Error(`roleChecklist: no KNOWN_TEMPLATES entry matches keyword "${keyword}"`);
  }
  const variant = region === "US" ? template.us : template.ca;
  return { name: variant.name, match: template.match };
}

// Keywords, not display names — each just needs to trigger the right
// KNOWN_TEMPLATES regex. Kept as a lookup by role name so it's easy to scan
// and extend without touching the rendering logic below.
const ROLE_KEYWORDS: Record<string, string[]> = {
  "Registered Nurse": ["bls", "n95", "influenza"],
  "Nurse Practitioner": ["bls", "acls", "influenza"],
  Physician: ["bls", "acls", "influenza"],
  "Family Physician": ["bls", "acls", "influenza"],
  "Emergency Physician": ["bls", "acls", "atls", "pals"],
  Anesthesiologist: ["bls", "acls", "atls"],
  Surgeon: ["bls", "acls", "atls"],
  "Physician Assistant": ["bls", "acls", "pance"],
  Dentist: ["bls", "infection control", "bloodborne"],
  "Dental Hygienist": ["bls", "infection control", "bloodborne"],
  "Dental Assistant": ["bls", "infection control", "bloodborne"],
  Paramedic: ["bls", "acls", "phtls", "vulnerable"],
  "Emergency Medical Responder": ["bls", "cpr", "phtls"],
  "Respiratory Therapist": ["bls", "acls", "n95"],
  "Medical Laboratory Technologist": ["bloodborne", "whmis", "infection control"],
  "Radiologic Technologist": ["radiation safety", "bls", "bloodborne"],
  "Pharmacy Technician": ["whmis", "bloodborne"],
  "Occupational Therapist": ["bls", "cpr", "vulnerable"],
  "Speech-Language Pathologist": ["bls", "cpr", "vulnerable"],
  "Social Worker": ["vulnerable", "cpr"],
  Psychologist: ["vulnerable"],
  "Counsellor / Therapist": ["vulnerable", "cpr"],
  "Medical Office Assistant": ["whmis", "bloodborne", "cpr"],
  "Medical Billing & Coding Specialist": ["medical billing"],
  "Health Records Clerk": ["whmis"],
  "Sterile Processing Technician": ["crcst", "whmis", "bloodborne"],
  "Registered Practical Nurse": ["bls", "n95", "influenza"],
  "Personal Support Worker": ["cpr", "whmis", "vulnerable"],
  "Primary Care Paramedic": ["bls", "acls", "phtls", "vulnerable"],
  "Advanced Care Paramedic": ["bls", "acls", "phtls", "vulnerable"],
  "Licensed Practical Nurse": ["bls", "n95", "influenza"],
  "Certified Nursing Assistant": ["bls", "n95", "influenza"],
  "EMT-Basic": ["bls", "phtls", "vulnerable"],
  AEMT: ["bls", "phtls", "vulnerable"],
  Physiotherapist: ["bls", "cpr", "vulnerable"],
  "Physical Therapist": ["bls", "cpr", "vulnerable"],
  "Chiropodist (Ontario)": ["bls", "cpr", "whmis"],
  Podiatrist: ["bls", "cpr", "bloodborne"]
};

// Fallback for "Other healthcare worker" and any role not explicitly listed
// above — every role still gets a sensible starting checklist rather than
// nothing.
const DEFAULT_KEYWORDS = ["cpr", "whmis", "influenza"];

/** Recommended certifications for this role/region, deduplicated and
 * resolved to real, region-correct display names via KNOWN_TEMPLATES. */
export function getRecommendedCertifications(role: string, region: Region): ChecklistItem[] {
  const keywords = ROLE_KEYWORDS[role] ?? DEFAULT_KEYWORDS;
  const seen = new Set<string>();
  const items: ChecklistItem[] = [];
  for (const keyword of keywords) {
    const entry = item(keyword, region);
    if (seen.has(entry.name)) continue;
    seen.add(entry.name);
    items.push(entry);
  }
  return items;
}
