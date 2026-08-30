import { Region } from "./types";

// Roles common to both regions, spanning admin/support staff through physicians —
// matches the tiers in healthcare-role-certifications.md. Where terminology genuinely
// differs by region (not just spelling), the region-specific title is appended below
// instead of listed here (e.g. Physiotherapist/Physical Therapist, RPN/LPN, PCP-ACP/EMT-AEMT).
const COMMON_ROLES = [
  "Registered Nurse",
  "Nurse Practitioner",
  "Physician",
  "Family Physician",
  "Emergency Physician",
  "Anesthesiologist",
  "Surgeon",
  "Physician Assistant",
  "Dentist",
  "Dental Hygienist",
  "Dental Assistant",
  "Paramedic",
  "Emergency Medical Responder",
  "Respiratory Therapist",
  "Medical Laboratory Technologist",
  "Radiologic Technologist",
  "Pharmacy Technician",
  "Occupational Therapist",
  "Speech-Language Pathologist",
  "Social Worker",
  "Psychologist",
  "Counsellor / Therapist",
  "Medical Office Assistant",
  "Medical Billing & Coding Specialist",
  "Health Records Clerk",
  "Sterile Processing Technician",

  // Non-healthcare roles — CredPulse tracks any hard-expiry certification,
  // not just clinical ones, so these share the same signup flow and the
  // same underlying cert-tracking backend as everything above. See the
  // /industries page.
  "Construction Worker / Site Supervisor",
  "Crane / Heavy Equipment Operator",
  "Teacher / Education Staff",
  "School Support Staff (EA, Custodial, Cafeteria)",
  "Police Officer",
  "Police Support / Dispatch"
];

/**
 * Role lists differ slightly by region: "Chiropodist" is a regulated title
 * specific to Ontario (foot care within a limited scope); everywhere else in
 * Canada and in the US, "Podiatrist" is the equivalent title. The same pattern
 * applies to a handful of other titles below, where the underlying job is the
 * same but the regulated/common title genuinely differs by country.
 */
export function rolesForRegion(region: Region): string[] {
  if (region === "CA") {
    return [
      ...COMMON_ROLES,
      "Registered Practical Nurse",
      "Personal Support Worker",
      "Primary Care Paramedic",
      "Advanced Care Paramedic",
      "Physiotherapist",
      "Chiropodist (Ontario)",
      "Podiatrist",
      "Other healthcare worker"
    ];
  }
  return [
    ...COMMON_ROLES,
    "Licensed Practical Nurse",
    "Certified Nursing Assistant",
    "EMT-Basic",
    "AEMT",
    "Physical Therapist",
    "Podiatrist",
    "Other healthcare worker"
  ];
}
