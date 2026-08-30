import { Region } from "./types";

export interface RoleGroup {
  label: string;
  roles: string[];
}

// Roles common to both regions, spanning admin/support staff through physicians —
// matches the tiers in healthcare-role-certifications.md. Where terminology genuinely
// differs by region (not just spelling), the region-specific title is appended below
// instead of listed here (e.g. Physiotherapist/Physical Therapist, RPN/LPN, PCP-ACP/EMT-AEMT).
const COMMON_HEALTHCARE_ROLES = [
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
  "Sterile Processing Technician"
];

/**
 * Role lists differ slightly by region: "Chiropodist" is a regulated title
 * specific to Ontario (foot care within a limited scope); everywhere else in
 * Canada and in the US, "Podiatrist" is the equivalent title. The same pattern
 * applies to a handful of other titles below, where the underlying job is the
 * same but the regulated/common title genuinely differs by country.
 */
function healthcareRolesForRegion(region: Region): string[] {
  if (region === "CA") {
    return [
      ...COMMON_HEALTHCARE_ROLES,
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
    ...COMMON_HEALTHCARE_ROLES,
    "Licensed Practical Nurse",
    "Certified Nursing Assistant",
    "EMT-Basic",
    "AEMT",
    "Physical Therapist",
    "Podiatrist",
    "Other healthcare worker"
  ];
}

// Non-healthcare roles — CredPulse tracks any hard-expiry certification, not
// just clinical ones, so these share the same signup flow and the same
// underlying cert-tracking backend as the healthcare group above. See the
// /industries page and mockExtract.ts's construction/education/policing
// certification templates.
const CONSTRUCTION_ROLES = [
  "Construction Worker / Site Supervisor",
  "Crane / Heavy Equipment Operator",
  "Other construction worker"
];

const EDUCATION_ROLES = [
  "Teacher / Education Staff",
  "School Support Staff (EA, Custodial, Cafeteria)",
  "Other education staff"
];

const POLICING_ROLES = [
  "Police Officer",
  "Police Support / Dispatch",
  "Other public safety worker"
];

/** All role groups for a region, healthcare first. Used to render a grouped
 * <optgroup> dropdown — see orderedRoleGroups() below for putting a
 * different group first based on which side of the homepage split-screen
 * chooser someone came from. */
export function roleGroupsForRegion(region: Region): RoleGroup[] {
  return [
    { label: "Healthcare", roles: healthcareRolesForRegion(region) },
    { label: "Construction", roles: CONSTRUCTION_ROLES },
    { label: "Education", roles: EDUCATION_ROLES },
    { label: "Policing & public safety", roles: POLICING_ROLES }
  ];
}

/** Same groups, reordered so the group matching the visitor's remembered
 * industry (see lib/industryPref.ts) appears first — that's the group whose
 * first role becomes the dropdown's default selection. Everything is still
 * present either way; nobody is limited to only their industry's roles. */
export function orderedRoleGroups(region: Region, preferOther: boolean): RoleGroup[] {
  const groups = roleGroupsForRegion(region);
  if (!preferOther) return groups;
  const [healthcare, ...rest] = groups;
  return [...rest, healthcare];
}

/** Flat list of every role for a region, healthcare first — kept for any
 * caller that just needs "is this a valid role" rather than the grouped
 * structure (e.g. validation). */
export function rolesForRegion(region: Region): string[] {
  return roleGroupsForRegion(region).flatMap((g) => g.roles);
}
