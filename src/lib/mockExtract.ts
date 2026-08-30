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

export interface Template {
  match: RegExp;
  ca: RegionVariant;
  us: RegionVariant;
}

// Exported so other features (e.g. the role-based signup checklist in
// roleChecklist.ts) can reuse the exact same name/region matching instead of
// duplicating this list and risking it drifting out of sync.
export const KNOWN_TEMPLATES: Template[] = [
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
  },
  {
    match: /nrp|neonatal.resuscitation/i,
    ca: {
      name: "Neonatal Resuscitation Program (NRP)",
      issuer: "Heart and Stroke Foundation",
      credentialType: "certification",
      tip: "Required for most L&D/NICU roles — book through your hospital's education department.",
      renewalUrl: "https://www.heartandstroke.ca/cpr/find-a-course"
    },
    us: {
      name: "Neonatal Resuscitation Program (NRP)",
      issuer: "American Heart Association",
      credentialType: "certification",
      tip: "Required for most L&D/NICU roles — book through your hospital's education department.",
      renewalUrl: "https://www.heart.org/en/cpr/nrp"
    }
  },
  {
    match: /phtls|prehospital.trauma/i,
    ca: {
      name: "Prehospital Trauma Life Support (PHTLS)",
      issuer: "NAEMT",
      credentialType: "certification",
      tip: "Valid for 4 years — the refresher course is shorter than the full provider course, book that instead.",
      renewalUrl: "https://www.naemt.org/education/phtls"
    },
    us: {
      name: "Prehospital Trauma Life Support (PHTLS)",
      issuer: "NAEMT",
      credentialType: "certification",
      tip: "Valid for 4 years — the refresher course is shorter than the full provider course, book that instead.",
      renewalUrl: "https://www.naemt.org/education/phtls"
    }
  },
  {
    match: /atls|advanced.trauma/i,
    ca: {
      name: "Advanced Trauma Life Support (ATLS)",
      issuer: "American College of Surgeons",
      credentialType: "certification",
      tip: "Valid for 4 years — you can start the refresher course up to 6 months before it expires.",
      renewalUrl: "https://www.facs.org/quality-programs/trauma/education/advanced-trauma-life-support/"
    },
    us: {
      name: "Advanced Trauma Life Support (ATLS)",
      issuer: "American College of Surgeons",
      credentialType: "certification",
      tip: "Valid for 4 years — you can start the refresher course up to 6 months before it expires.",
      renewalUrl: "https://www.facs.org/quality-programs/trauma/education/advanced-trauma-life-support/"
    }
  },
  {
    match: /tb.(skin.)?test|tuberculosis.screen/i,
    ca: {
      name: "TB Skin Test / Screening",
      issuer: "Occupational Health",
      credentialType: "training",
      tip: "Usually renews annually through your employer's occupational health department.",
      renewalUrl: "https://www.canada.ca/en/public-health/services/diseases/tuberculosis.html"
    },
    us: {
      name: "TB Skin Test / Screening",
      issuer: "Occupational Health",
      credentialType: "training",
      tip: "Usually renews annually through your employer's occupational health department.",
      renewalUrl: "https://www.cdc.gov/tb/index.html"
    }
  },
  {
    match: /influenza|flu.(shot|vaccin)/i,
    ca: {
      name: "Influenza Vaccination",
      issuer: "Public Health",
      credentialType: "training",
      tip: "Seasonal — most employers require proof each fall before flu season starts.",
      renewalUrl: "https://www.canada.ca/en/public-health/services/immunization/vaccines/influenza-flu.html"
    },
    us: {
      name: "Influenza Vaccination",
      issuer: "Public Health",
      credentialType: "training",
      tip: "Seasonal — most employers require proof each fall before flu season starts.",
      renewalUrl: "https://www.cdc.gov/flu/index.htm"
    }
  },
  {
    match: /bloodborne/i,
    ca: {
      name: "Bloodborne Pathogens Training",
      issuer: "Provincial Occupational Health & Safety",
      credentialType: "training",
      tip: "Often bundled with your employer's annual WHMIS refresher.",
      renewalUrl: "https://www.ccohs.ca/oshanswers/diseases/bbp.html"
    },
    us: {
      name: "Bloodborne Pathogens Training",
      issuer: "OSHA",
      credentialType: "training",
      tip: "Legally required annually under OSHA — usually a short online module through your employer.",
      renewalUrl: "https://www.osha.gov/bloodborne-pathogens"
    }
  },
  {
    match: /first.aid/i,
    ca: {
      name: "First Aid",
      issuer: "Canadian Red Cross",
      credentialType: "certification",
      tip: "Many employers reimburse this course — check before you pay out of pocket.",
      renewalUrl: "https://www.redcross.ca/training-and-certification"
    },
    us: {
      name: "First Aid",
      issuer: "American Red Cross",
      credentialType: "certification",
      tip: "Many employers reimburse this course — check before you pay out of pocket.",
      renewalUrl: "https://www.redcross.org/take-a-class"
    }
  },
  {
    match: /radiation.safety/i,
    ca: {
      name: "Radiation Safety Certification",
      issuer: "Canadian Nuclear Safety Commission",
      credentialType: "certification",
      tip: "Check with your facility's radiation safety officer for the exact renewal window.",
      renewalUrl: "https://nuclearsafety.gc.ca/eng/"
    },
    us: {
      name: "Radiation Safety Certification",
      issuer: "State Radiation Control Program",
      credentialType: "certification",
      tip: "Renewal requirements vary by state — check with your facility's radiation safety officer.",
      renewalUrl: "https://www.nrc.gov/"
    }
  },
  {
    match: /infection.control/i,
    ca: {
      name: "Infection Control Certification",
      issuer: "Public Health Agency of Canada",
      credentialType: "training",
      tip: "Often an annual online module through your employer's education portal.",
      renewalUrl: "https://www.canada.ca/en/public-health.html"
    },
    us: {
      name: "Infection Control Certification",
      issuer: "CDC",
      credentialType: "training",
      tip: "Often an annual online module through your employer's education portal.",
      renewalUrl: "https://www.cdc.gov/infectioncontrol/index.html"
    }
  },
  {
    match: /coding.certif|cpc|medical.billing/i,
    ca: {
      name: "Medical Coding Certification",
      issuer: "AAPC",
      credentialType: "certification",
      tip: "Renews annually — log your CEUs throughout the year so you're not scrambling at renewal time.",
      renewalUrl: "https://www.aapc.com/certification/"
    },
    us: {
      name: "Medical Coding Certification",
      issuer: "AAPC",
      credentialType: "certification",
      tip: "Renews annually — log your CEUs throughout the year so you're not scrambling at renewal time.",
      renewalUrl: "https://www.aapc.com/certification/"
    }
  },
  {
    match: /crcst|sterile.processing/i,
    ca: {
      name: "Sterile Processing Certification (CRCST)",
      issuer: "HSPA",
      credentialType: "certification",
      tip: "Renews annually — requires logged continuing education credits.",
      renewalUrl: "https://myhspa.org/certification/"
    },
    us: {
      name: "Sterile Processing Certification (CRCST)",
      issuer: "HSPA",
      credentialType: "certification",
      tip: "Renews annually — requires logged continuing education credits.",
      renewalUrl: "https://myhspa.org/certification/"
    }
  },
  {
    match: /pance|nccpa|physician.assistant.certif/i,
    ca: {
      name: "Physician Assistant Certification",
      issuer: "Canadian Association of Physician Assistants",
      credentialType: "certification",
      tip: "Check current recertification requirements — the PA credentialing process differs by province.",
      renewalUrl: "https://capa-acam.ca/"
    },
    us: {
      name: "Physician Assistant Certification (PANCE)",
      issuer: "NCCPA",
      credentialType: "certification",
      tip: "Certification maintenance runs on a multi-year cycle — log your CME annually so you're not scrambling.",
      renewalUrl: "https://www.nccpa.net/"
    }
  },

  // --- Construction, education, and public-safety certifications ---
  // Added so CredPulse works out of the box for the non-healthcare
  // industries offered on the /industries page, not just healthcare.
  {
    match: /working.at.heights|fall.protection/i,
    ca: {
      name: "Working at Heights Training",
      issuer: "Ontario Chief Prevention Officer-Approved Provider",
      credentialType: "training",
      tip: "Valid for 3 years in Ontario — must be retaken with an approved provider before it lapses.",
      renewalUrl: "https://www.ontario.ca/page/working-heights-training-program-requirements"
    },
    us: {
      name: "Fall Protection Training",
      issuer: "OSHA",
      credentialType: "training",
      tip: "OSHA doesn't set a fixed renewal interval, but most employers require an annual refresher — check your program.",
      renewalUrl: "https://www.osha.gov/fall-protection"
    }
  },
  {
    match: /confined.space/i,
    ca: {
      name: "Confined Space Entry Training",
      issuer: "CSA-Compliant Training Provider",
      credentialType: "training",
      tip: "Renewal intervals vary by employer and provincial regulator — usually every 1-3 years.",
      renewalUrl: "https://www.ccohs.ca/oshanswers/hsprograms/confinedspace/"
    },
    us: {
      name: "Confined Space Entry Training",
      issuer: "OSHA",
      credentialType: "training",
      tip: "Renewal intervals vary by employer — usually annually for permit-required confined spaces.",
      renewalUrl: "https://www.osha.gov/confined-spaces"
    }
  },
  {
    match: /forklift|lift.truck|powered.industrial.truck/i,
    ca: {
      name: "Forklift Operator Certification",
      issuer: "CSA-Compliant Training Provider",
      credentialType: "certification",
      tip: "Most provinces expect recertification every 3 years, or sooner after an incident — check locally.",
      renewalUrl: "https://www.ccohs.ca/oshanswers/safety_haz/powered_lift_trucks.html"
    },
    us: {
      name: "Powered Industrial Truck (Forklift) Certification",
      issuer: "OSHA",
      credentialType: "certification",
      tip: "OSHA requires recertification every 3 years, or sooner after a near-miss or accident.",
      renewalUrl: "https://www.osha.gov/powered-industrial-trucks"
    }
  },
  {
    match: /crane.operator/i,
    ca: {
      name: "Crane Operator Certification",
      issuer: "Provincial Certifying Body (e.g. IUOE)",
      credentialType: "certification",
      tip: "Renewal requirements vary by province and crane class — confirm with your certifying body.",
      renewalUrl: "https://www.ccohs.ca/oshanswers/safety_haz/cranes/"
    },
    us: {
      name: "Crane Operator Certification (NCCCO)",
      issuer: "NCCCO",
      credentialType: "certification",
      tip: "Valid for 5 years — start the renewal exam process a few months ahead of expiry.",
      renewalUrl: "https://www.nccco.org/nccco/certification-programs/recertification"
    }
  },
  {
    match: /food.handler|food.safety.certif/i,
    ca: {
      name: "Food Handler Certification",
      issuer: "Local Public Health Unit",
      credentialType: "certification",
      tip: "Usually a one-time online course, but some health units require periodic renewal — check locally.",
      renewalUrl: "https://www.canada.ca/en/public-health/services/food-safety.html"
    },
    us: {
      name: "Food Handler Certification",
      issuer: "ServSafe / State Health Department",
      credentialType: "certification",
      tip: "Renewal interval depends on your state — many require recertification every 2-5 years.",
      renewalUrl: "https://www.servsafe.com/"
    }
  },
  {
    match: /mental.health.first.aid/i,
    ca: {
      name: "Mental Health First Aid",
      issuer: "Mental Health Commission of Canada",
      credentialType: "training",
      tip: "No fixed expiry, but many employers ask for a refresher every 3 years — check your policy.",
      renewalUrl: "https://www.mhfa.ca/"
    },
    us: {
      name: "Mental Health First Aid",
      issuer: "National Council for Mental Wellbeing",
      credentialType: "training",
      tip: "No fixed expiry, but many employers ask for a refresher every 3 years — check your policy.",
      renewalUrl: "https://www.mentalhealthfirstaid.org/"
    }
  },
  {
    match: /use.of.force/i,
    ca: {
      name: "Use of Force Recertification",
      issuer: "Provincial Police College",
      credentialType: "certification",
      tip: "Typically required annually — confirm your service's exact cycle.",
      renewalUrl: "https://www.iadlest.org/"
    },
    us: {
      name: "Use of Force Recertification",
      issuer: "State POST (Peace Officer Standards and Training)",
      credentialType: "certification",
      tip: "Typically required annually — requirements are set by your state's POST commission.",
      renewalUrl: "https://www.iadlest.org/"
    }
  },
  {
    match: /firearms.qualif/i,
    ca: {
      name: "Firearms Qualification",
      issuer: "Police Service / Canadian Firearms Program",
      credentialType: "license",
      tip: "Usually required annually or semi-annually — confirm your service's schedule.",
      renewalUrl: "https://www.rcmp-grc.gc.ca/en/firearms"
    },
    us: {
      name: "Firearms Qualification",
      issuer: "Police Department / State POST",
      credentialType: "license",
      tip: "Usually required annually or semi-annually — confirm your department's schedule.",
      renewalUrl: "https://www.iadlest.org/"
    }
  },
  {
    match: /crisis.intervention/i,
    ca: {
      name: "Crisis Intervention Training (CIT)",
      issuer: "Canadian Association of Chiefs of Police",
      credentialType: "training",
      tip: "Renewal intervals vary by service — check your department's training calendar.",
      renewalUrl: "https://cacp.ca/"
    },
    us: {
      name: "Crisis Intervention Training (CIT)",
      issuer: "CIT International",
      credentialType: "training",
      tip: "Renewal intervals vary by department — check your department's training calendar.",
      renewalUrl: "https://www.citinternational.org/"
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
