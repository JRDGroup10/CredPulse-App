// DEMO ONLY. In production this file is replaced by a real call to an
// LLM vision endpoint (e.g. Claude with an uploaded image/PDF) that returns
// structured JSON: { name, issuer, credentialType, issuedDate, expiryDate }.
// See README.md "Going from demo to real" for the exact swap.

import { Certificate, Region } from "./types";

export interface Extracted {
  name: string;
  issuer: string;
  credentialType: Certificate["credentialType"];
  issuedDate: string;
  expiryDate: string;
  confidence: number;
  tip: string;
  renewalUrl: string;
}

type RegionVariant = Omit<Extracted, "issuedDate" | "expiryDate" | "confidence">;

interface Template {
  match: RegExp;
  ca: RegionVariant;
  us: RegionVariant;
}

const KNOWN_TEMPLATES: Template[] = [
  {
    match: /bls|basic.life/i,
    ca: {
      name: "Basic Life Support (BLS)",
      issuer: "Heart and Stroke Foundation",
      credentialType: "certification",
      tip: "Renew in person, book ahead — slots fill up.",
      renewalUrl: "https://www.heartandstroke.ca/cpr/find-a-course"
    },
    us: {
      name: "Basic Life Support (BLS)",
      issuer: "American Heart Association",
      credentialType: "certification",
      tip: "Renew in person, book ahead — slots fill up.",
      renewalUrl: "https://cpr.heart.org/en/cpr-courses-and-kits/healthcare-professional/bls"
    }
  },
  {
    match: /acls|advanced.cardiac/i,
    ca: {
      name: "Advanced Cardiac Life Support (ACLS)",
      issuer: "Heart and Stroke Foundation",
      credentialType: "certification",
      tip: "Requires a current BLS certification to enroll in the renewal course.",
      renewalUrl: "https://www.heartandstroke.ca/cpr/find-a-course"
    },
    us: {
      name: "Advanced Cardiac Life Support (ACLS)",
      issuer: "American Heart Association",
      credentialType: "certification",
      tip: "Requires a current BLS certification to enroll in the renewal course.",
      renewalUrl: "https://cpr.heart.org/en/cpr-courses-and-kits/healthcare-professional/acls"
    }
  },
  {
    match: /pals|pediatric/i,
    ca: {
      name: "Pediatric Advanced Life Support (PALS)",
      issuer: "Heart and Stroke Foundation",
      credentialType: "certification",
      tip: "Book at least a month out — pediatric course dates are limited.",
      renewalUrl: "https://www.heartandstroke.ca/cpr/find-a-course"
    },
    us: {
      name: "Pediatric Advanced Life Support (PALS)",
      issuer: "American Heart Association",
      credentialType: "certification",
      tip: "Book at least a month out — pediatric course dates are limited.",
      renewalUrl: "https://cpr.heart.org/en/cpr-courses-and-kits/healthcare-professional/pals"
    }
  },
  {
    match: /n95|fit.test/i,
    ca: {
      name: "N95 Fit Test",
      issuer: "Occupational Health & Safety",
      credentialType: "training",
      tip: "Usually booked through your employer's occupational health department — ask 2-3 weeks ahead.",
      renewalUrl: "https://www.ccohs.ca/oshanswers/prevention/ppe/fit_testing.html"
    },
    us: {
      name: "N95 Fit Test",
      issuer: "Occupational Safety and Health Administration (OSHA)",
      credentialType: "training",
      tip: "Usually booked through your employer's occupational health department — ask 2-3 weeks ahead.",
      renewalUrl: "https://www.osha.gov/respiratory-protection"
    }
  },
  {
    match: /whmis|hazcom|hazard.communication/i,
    ca: {
      name: "WHMIS 2015",
      issuer: "Workplace Safety Ontario",
      credentialType: "training",
      tip: "Often free through your employer's online training portal — check there before paying for a course.",
      renewalUrl: "https://www.worksafebc.com/en/health-safety/hazards-exposures/whmis"
    },
    us: {
      name: "Hazard Communication (HazCom) Training",
      issuer: "OSHA Hazard Communication Standard",
      credentialType: "training",
      tip: "Often free through your employer's online training portal — check there before paying for a course.",
      renewalUrl: "https://www.osha.gov/hazcom"
    }
  },
  {
    match: /vulnerable|police|background/i,
    ca: {
      name: "Vulnerable Sector Check",
      issuer: "Local Police Service",
      credentialType: "license",
      tip: "Processing can take 4-6 weeks — start this well before your renewal deadline.",
      renewalUrl:
        "https://www.canada.ca/en/royal-canadian-mounted-police/services/canadian-police-information-centre/vulnerable-sector-check.html"
    },
    us: {
      name: "Background Check",
      issuer: "State / Employer-Required Background Check",
      credentialType: "license",
      tip: "Requirements vary by state and employer — processing can take several weeks, start early.",
      renewalUrl: "https://www.fbi.gov/how-we-can-help-you/more-fbi-services-and-information/identity-history-summary-checks"
    }
  },
  {
    match: /cpr/i,
    ca: {
      name: "CPR / First Aid",
      issuer: "Canadian Red Cross",
      credentialType: "certification",
      tip: "Many employers reimburse this course — check before you pay out of pocket.",
      renewalUrl: "https://www.redcross.ca/training-and-certification"
    },
    us: {
      name: "CPR / First Aid",
      issuer: "American Red Cross",
      credentialType: "certification",
      tip: "Many employers reimburse this course — check before you pay out of pocket.",
      renewalUrl: "https://www.redcross.org/take-a-class"
    }
  }
];

/**
 * Given the core fields a real AI extraction returns (name/issuer/type/dates/
 * confidence, no tip or renewal link), try to match the name against our
 * known-template library so we can still attach a region-specific renewal tip
 * and direct booking link — the same ones the demo extractor uses. Falls back
 * to the AI's own values with no tip/link if nothing matches.
 */
export function enrichWithTemplate(
  base: Omit<Extracted, "tip" | "renewalUrl">,
  region: Region = "CA"
): Extracted {
  const template = KNOWN_TEMPLATES.find((t) => t.match.test(base.name));
  if (!template) {
    return { ...base, tip: "", renewalUrl: "" };
  }
  const variant = region === "US" ? template.us : template.ca;
  return {
    ...base,
    name: variant.name,
    issuer: base.issuer || variant.issuer,
    credentialType: base.credentialType || variant.credentialType,
    tip: variant.tip,
    renewalUrl: variant.renewalUrl
  };
}

function isoDaysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Simulates uploading a certificate and having AI extract structured fields,
 * localized to the user's region. Real version: send the file to a
 * vision-capable LLM with a prompt asking for exactly these fields as JSON,
 * then validate before saving.
 */
export async function mockExtractCertificate(file: File, region: Region = "CA"): Promise<Extracted> {
  // simulate network + model latency so the UI's loading state is real
  await new Promise((r) => setTimeout(r, 1400 + Math.random() * 600));

  const template = KNOWN_TEMPLATES.find((t) => t.match.test(file.name));

  if (template) {
    const variant = region === "US" ? template.us : template.ca;
    return {
      ...variant,
      issuedDate: isoDaysFromNow(-365),
      expiryDate: isoDaysFromNow(180 + Math.floor(Math.random() * 500)),
      confidence: 0.94
    };
  }

  // Unrecognized filename — still return a plausible extraction, lower confidence,
  // exactly like a real extractor would when the document is unusual.
  return {
    name: file.name.replace(/\.[a-zA-Z0-9]+$/, "").replace(/[_-]/g, " ") || "Unnamed Certification",
    issuer: "Unknown — please confirm",
    credentialType: "certification",
    issuedDate: isoDaysFromNow(-180),
    expiryDate: isoDaysFromNow(365),
    confidence: 0.55,
    tip: "We couldn't find a known renewal process for this one — add your own note as a reminder to yourself.",
    renewalUrl: ""
  };
}
