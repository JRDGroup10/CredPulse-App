import { Certificate, Region } from "./types";
import { ChecklistItem, getRecommendedCertifications } from "./roleChecklist";

export interface OnboardingProgress {
  recommended: ChecklistItem[];
  missing: ChecklistItem[];
  completedCount: number;
  totalCount: number;
}

/**
 * Diffs a person's actual certificates against what their role recommends
 * (see roleChecklist.ts) — the one comparison the whole onboarding-kit
 * feature is built on. This used to live inline in RoleChecklistCard.tsx as
 * a self-only check (the signed-in user against their own certificates);
 * factored out here so Team.tsx's admin-facing view can run the exact same
 * check against every member's role/region/certificates, not just the
 * signed-in user's.
 */
export function getOnboardingProgress(role: string, region: Region, certificates: Certificate[]): OnboardingProgress {
  const recommended = getRecommendedCertifications(role, region);
  const missing = recommended.filter((item) => !certificates.some((c) => item.match.test(c.name)));
  return {
    recommended,
    missing,
    completedCount: recommended.length - missing.length,
    totalCount: recommended.length
  };
}
