import { Region } from "./types";

const COMMON_ROLES = [
  "Registered Nurse",
  "Registered Practical Nurse",
  "Physician",
  "Paramedic",
  "Respiratory Therapist",
  "Personal Support Worker"
];

/**
 * Role lists differ slightly by region: "Chiropodist" is a regulated title
 * specific to Ontario (foot care within a limited scope); everywhere else in
 * Canada and in the US, "Podiatrist" is the equivalent title.
 */
export function rolesForRegion(region: Region): string[] {
  if (region === "CA") {
    return [...COMMON_ROLES, "Chiropodist (Ontario)", "Podiatrist", "Other healthcare worker"];
  }
  return [...COMMON_ROLES, "Podiatrist", "Other healthcare worker"];
}
