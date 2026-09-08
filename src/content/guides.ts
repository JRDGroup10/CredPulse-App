// Content-marketing guides — the third "widen the market" lever after the
// SEO foundation fix and the per-vertical landing pages. These are genuinely
// useful, evergreen reference articles targeting real search queries people
// actually type (e.g. "how long is BLS certification valid"), each one
// linking back into the matching vertical/healthcare landing page. See
// src/pages/Guide.tsx (renders one by slug) and GuidesHub.tsx (lists all).
//
// Deliberately general/hedged on jurisdiction-specific specifics (renewal
// cadences vary by province/state/employer policy) rather than citing a
// single authority as universal — same tone as the vertical landing pages
// (IndustryVertical.tsx), which already hedge the same way.
import { VerticalSlug } from "../pages/IndustryVertical";

export type GuideVertical = VerticalSlug | "healthcare";

export interface GuideSection {
  heading: string;
  paragraphs: string[];
  list?: string[];
}

export interface GuideFAQ {
  q: string;
  a: string;
}

export interface Guide {
  slug: string;
  vertical: GuideVertical;
  category: string; // small eyebrow label
  title: string; // <h1> and SEO title base
  description: string; // meta description
  excerpt: string; // shown on the hub page
  publishedDate: string; // ISO date
  updatedDate: string; // ISO date
  intro: string[];
  sections: GuideSection[];
  faqs: GuideFAQ[];
  ctaHeadline: string;
  ctaBody: string;
  ctaLinkPath: string;
  ctaLinkLabel: string;
}

export const GUIDES: Record<string, Guide> = {
  "bls-certification-renewal-guide": {
    slug: "bls-certification-renewal-guide",
    vertical: "healthcare",
    category: "HEALTHCARE CREDENTIALS",
    title: "BLS Certification Renewal: How Long It Lasts and How to Never Miss It",
    description:
      "How long BLS certification is valid, what happens if it lapses, and a simple system for tracking renewal so it never sneaks up on you.",
    excerpt: "How long a BLS card actually lasts, what happens if it lapses, and how to stop tracking it from memory.",
    publishedDate: "2026-09-08",
    updatedDate: "2026-09-08",
    intro: [
      "Basic Life Support (BLS) certification is one of the most common hard-expiry requirements in healthcare — nurses, medical assistants, techs, and plenty of non-clinical staff need a current card to stay eligible to work. It's also one of the easiest things to lose track of, because the renewal window is short relative to how infrequently you think about it.",
      "This guide covers how long BLS certification typically lasts, what actually happens if it lapses, and the tracking habits that keep it from becoming a last-minute scramble."
    ],
    sections: [
      {
        heading: "How long does BLS certification last?",
        paragraphs: [
          "Most BLS certifications issued through the American Heart Association or the Red Cross are valid for two years from the completion date. That's shorter than many other healthcare certifications (first aid alone is often valid for three years), which is part of why it's easy to lose track of — two years is long enough to forget the exact date, but short enough that it comes around again fast.",
          "The exact expiry date is printed on the card itself, usually in month/year format, and it's the completion date plus two years — not the start of the calendar year you took the course, and not tied to your employment anniversary or any other date you might mentally associate it with."
        ]
      },
      {
        heading: "What happens if your BLS certification lapses?",
        paragraphs: [
          "In most healthcare workplaces, a lapsed BLS card means you're not permitted to work clinical shifts until it's renewed — this isn't usually discretionary on the employer's side, since it's often tied to accreditation and liability requirements, not just internal policy.",
          "Practically, that means either being pulled from the schedule, having to complete a renewal course on short notice (sometimes at a premium price for expedited scheduling), or in some cases having to retake the full initial certification course rather than a shorter renewal course if the lapse goes on long enough — providers vary in how long a grace period they allow before requiring the full course again."
        ]
      },
      {
        heading: "Why 'I'll remember' doesn't work for a two-year cycle",
        paragraphs: [
          "A two-year renewal cycle is long enough that a wall calendar reminder or a mental note reliably fails — by the time it's actually due, most people have long since stopped thinking about it. And unlike a monthly bill, there's no automatic notification system reminding you it's coming.",
          "The most reliable pattern isn't remembering harder — it's removing the need to remember at all, by tracking the actual expiry date somewhere that reminds you automatically with enough lead time to book a renewal course before it's urgent."
        ]
      },
      {
        heading: "A simple system that actually works",
        paragraphs: ["A workable system for BLS (and any other hard-expiry certification) needs three things:"],
        list: [
          "The actual expiry date on file somewhere that isn't just your memory",
          "A reminder well before the deadline — 60-90 days out gives enough time to book a course, not just react to one",
          "One place to check it, rather than several apps, a photo in your camera roll, and a sticky note"
        ]
      }
    ],
    faqs: [
      {
        q: "Is BLS certification the same as CPR certification?",
        a: "They overlap but aren't identical. BLS certification (Basic Life Support) is a more comprehensive healthcare-provider-level course that includes CPR alongside AED use, team resuscitation, and airway management — it's typically what employers require for clinical staff. A standalone CPR card, without the BLS designation, is usually a shorter course aimed at the general public and may not satisfy a healthcare employer's requirement even though it covers some of the same material."
      },
      {
        q: "Can I renew BLS certification online?",
        a: "Many providers offer a blended format — an online knowledge portion followed by an in-person skills check — but a fully online course without any in-person or virtual skills verification typically isn't accepted by healthcare employers, since BLS certification requires demonstrating hands-on skills, not just passing a written test."
      },
      {
        q: "How far in advance can I renew before my BLS card expires?",
        a: "Most providers let you renew up to 30-90 days before the current card's expiry date and still get a new two-year cycle starting from the new completion date (rather than losing time by renewing too early). Check your specific card issuer's policy, but building in that window is exactly the kind of lead time a 60-90 day reminder is meant to protect."
      }
    ],
    ctaHeadline: "Stop tracking BLS renewal from memory",
    ctaBody:
      "CredPulse reads the expiry date straight off a photo of your card and reminds you with real lead time — no spreadsheet, no sticky note.",
    ctaLinkPath: "/home",
    ctaLinkLabel: "See how CredPulse tracks it"
  },

  "working-at-heights-renewal-by-province": {
    slug: "working-at-heights-renewal-by-province",
    vertical: "construction",
    category: "CONSTRUCTION SAFETY",
    title: "Working at Heights Certification Renewal: What Construction Crews Need to Know",
    description:
      "How often Working at Heights / fall protection training needs to be renewed, why the requirement exists, and how crews actually keep track of it across a whole site.",
    excerpt: "How often fall protection training actually needs renewing, and what happens on site if it lapses.",
    publishedDate: "2026-09-08",
    updatedDate: "2026-09-08",
    intro: [
      "Working at Heights (often called fall protection or fall arrest training, depending on the region) is one of the most tightly enforced certifications on a construction site — and one of the most common causes of a stop-work order when it's found to have lapsed during an inspection.",
      "Here's what typically drives the renewal timeline, why it's treated so strictly, and how crews with more than a couple of workers actually stay on top of it without a wall calendar."
    ],
    sections: [
      {
        heading: "How often does Working at Heights training need renewal?",
        paragraphs: [
          "In most Canadian provinces, Working at Heights training is valid for three years from completion, though the exact cycle and the specific standard (some provinces have their own approved training standard, distinct from a generic 'fall protection' course) vary by jurisdiction. In the US, OSHA doesn't mandate a fixed renewal interval for general fall-protection training the same way, but many employers and site-specific safety programs still set their own 1-3 year refresh policy, and any change in equipment, role, or a near-miss incident can trigger a required retrain regardless of when the card technically expires.",
          "Because the requirement isn't identical everywhere, the practical takeaway is: check what your specific site, employer, or provincial regulator requires — but plan around the fact that it will need renewing on a fixed cycle rather than being a one-time course."
        ]
      },
      {
        heading: "Why this one gets enforced so strictly",
        paragraphs: [
          "Falls from height are consistently among the leading causes of serious injury and fatality on construction sites, which is exactly why regulators treat this certification differently from a lot of other paperwork — a site safety officer or inspector finding an expired card isn't a formality, it's treated as a genuine site-safety failure.",
          "That's also why the consequence is usually immediate: a worker with an expired Working at Heights card typically can't be on any elevated work platform, scaffold, or ladder above the threshold height defined by that jurisdiction until it's renewed — not a warning, an actual stop to that part of the job."
        ]
      },
      {
        heading: "Tracking it across a whole crew, not just yourself",
        paragraphs: [
          "For a solo contractor, tracking one expiry date is manageable with almost any system. For a site supervisor responsible for a dozen or fifty workers, each with their own completion date from whichever course they happened to take, doing this from memory or a shared spreadsheet becomes a real liability — someone always falls through the cracks eventually, usually the newest hire or someone who transferred sites recently.",
          "The pattern that scales is the same one that works for an individual, just with a manager view layered on top: every worker's actual expiry date on file, automatic reminders before it's due, and one dashboard the site supervisor can check before assigning that day's crew — rather than relying on each worker to self-report that they're still current."
        ]
      }
    ],
    faqs: [
      {
        q: "Does Working at Heights training transfer between provinces?",
        a: "Not always automatically. Some provinces have their own approved training standard and provider list, so a card valid in one province may not satisfy the requirement in another even if the content substantially overlaps. Workers moving between jurisdictions for a job should confirm the receiving province's specific requirement rather than assuming a card is universally valid."
      },
      {
        q: "What's the difference between Working at Heights and fall protection training?",
        a: "The terms are often used interchangeably, but in some jurisdictions 'Working at Heights' refers to a specific provincially-approved training standard, while 'fall protection' can refer more broadly to any employer-provided training on fall hazards, harness use, and rescue procedures. Check which specific standard your site or employer requires — the two aren't always interchangeable for compliance purposes even though they cover similar material."
      },
      {
        q: "Can a supervisor track this for an entire crew instead of each worker tracking their own?",
        a: "Yes — a team/clinic-style dashboard (the same pattern CredPulse uses for healthcare teams) works just as well for a construction crew: each worker's certifications roll up into one view a site supervisor can check before assigning work, without needing every worker to separately remember their own dates."
      }
    ],
    ctaHeadline: "Track Working at Heights across your whole crew",
    ctaBody:
      "CredPulse gives every worker their own tracked certifications and gives a site supervisor one dashboard to see who's covered and who isn't.",
    ctaLinkPath: "/industries/construction",
    ctaLinkLabel: "See it for construction crews"
  },

  "vulnerable-sector-check-school-staff": {
    slug: "vulnerable-sector-check-school-staff",
    vertical: "education",
    category: "SCHOOL BOARD COMPLIANCE",
    title: "Vulnerable Sector Checks for School Staff: How Often Do They Need Renewing?",
    description:
      "How often vulnerable sector checks typically need to be redone for school staff and volunteers, why boards set their own renewal policy, and how to track it across an entire staff.",
    excerpt: "Why there's no single fixed renewal date for vulnerable sector checks — and how boards track it anyway.",
    publishedDate: "2026-09-08",
    updatedDate: "2026-09-08",
    intro: [
      "A vulnerable sector check (sometimes called an enhanced police information check, depending on the jurisdiction) is one of the few credentials a school board has to manage for nearly everyone on staff — teachers, educational assistants, cafeteria staff, custodians, and volunteers alike. Unlike a lot of certifications, there isn't always a single, universally fixed expiry date, which is exactly what makes it easy to lose track of at scale.",
      "This guide covers why the renewal cadence isn't standardized the same way as, say, a first aid card, and what a workable tracking approach looks like across an entire staff roster."
    ],
    sections: [
      {
        heading: "Is there a fixed expiry date for a vulnerable sector check?",
        paragraphs: [
          "Unlike a certification with a printed expiry date, a vulnerable sector check doesn't technically 'expire' the way a course completion does — it's a point-in-time record check. What creates a renewal requirement is board or employer policy, which commonly requires a fresh check every 3-5 years to make sure the record on file reflects anything that's happened since the last one.",
          "Because that policy varies board to board (and sometimes changes over time as governing bodies update their own requirements), there's no single number that applies everywhere — which is exactly why treating it as a fixed, trackable date on a per-person basis matters more here than for a certification with a standardized cycle."
        ]
      },
      {
        heading: "Why this is harder to track than a typical certification",
        paragraphs: [
          "Most staff certifications (first aid, food handler training) have a clean completion date and a fixed validity period printed right on the certificate. A vulnerable sector check often doesn't come with the same clear artifact — it might be a letter, a stamped form, or just a processed date recorded in an HR system — which makes it easy for the 'when is this actually due again' question to fall on whoever happens to remember, rather than being self-evident from the document itself.",
          "Add substitute teachers, seasonal staff, and volunteers who aren't in the same HR system as full-time employees, and the tracking problem compounds — a check due for renewal on a substitute who only works occasional shifts is exactly the kind of thing that gets missed until it becomes a compliance gap during an audit."
        ]
      },
      {
        heading: "What a workable tracking system looks like for a whole staff",
        paragraphs: ["The same core pattern that works for any hard-to-track credential applies here, just scaled to cover every staff category a board is responsible for:"],
        list: [
          "One record per person with the actual date their check was completed or last renewed",
          "A reminder well before the board's own renewal policy window closes — not after",
          "Coverage for every category of person the board is responsible for, not just full-time staff — substitutes and volunteers included",
          "A single admin view showing who's due soon, rather than cross-referencing individual personnel files"
        ]
      }
    ],
    faqs: [
      {
        q: "Do substitute teachers need the same vulnerable sector check as full-time staff?",
        a: "In most jurisdictions, yes — anyone with unsupervised access to students, regardless of employment status, is typically expected to have a current check on file. The tracking challenge is usually less about whether it's required and more about substitutes not being managed through the same systems as full-time staff, making it easier for their renewal date to fall through the cracks."
      },
      {
        q: "Who sets the renewal cycle for vulnerable sector checks — the province or the school board?",
        a: "It's typically a mix: the check itself is issued by a police service or record-check provider, but how often it needs to be redone is usually set by the school board's own policy (sometimes informed by provincial guidelines for the education sector), which is why the exact cadence isn't identical from board to board."
      },
      {
        q: "How do new hires each September get added to a tracking system?",
        a: "New staff and substitutes can be invited by email to add their own record, or an admin can add them directly. If a board already manages staff in an HRIS, that system can also sync new hires in automatically via an API integration rather than requiring manual entry for every new hire each term."
      }
    ],
    ctaHeadline: "Track vulnerable sector checks across your whole staff",
    ctaBody:
      "CredPulse gives every staff member and volunteer their own tracked record, with one dashboard for HR to see who's due for renewal this term.",
    ctaLinkPath: "/industries/education",
    ctaLinkLabel: "See it for school boards"
  },

  "police-use-of-force-recertification": {
    slug: "police-use-of-force-recertification",
    vertical: "policing",
    category: "PUBLIC SAFETY REQUALIFICATION",
    title: "Use-of-Force Recertification for Police Officers: What the Annual Cycle Looks Like",
    description:
      "How often police officers typically need to requalify for use of force and firearms, why the cadence is stricter than most professional certifications, and how training coordinators track it across a unit.",
    excerpt: "Why use-of-force recertification runs on a tighter cycle than almost any other professional credential.",
    publishedDate: "2026-09-08",
    updatedDate: "2026-09-08",
    intro: [
      "Use-of-force recertification is one of the most time-sensitive requalifications a police officer carries — and unlike most professional certifications, the consequence of letting it lapse isn't just an administrative problem, it can mean an officer isn't deployable at all until it's current again.",
      "This guide covers why the cycle is typically shorter than other certifications, what's actually being reverified, and how training coordinators track it across an entire service."
    ],
    sections: [
      {
        heading: "How often does use-of-force recertification happen?",
        paragraphs: [
          "Annual recertification is common for use-of-force and firearms qualification, mandated by the provincial or state policing standards body governing that service — though the exact interval and what's included (firearms qualification, de-escalation, defensive tactics) varies by jurisdiction and by department policy on top of the regulatory minimum.",
          "Some departments require firearms qualification more than once a year, separate from the broader use-of-force recertification cycle, which means an officer can be tracking more than one requalification date rather than a single annual event."
        ]
      },
      {
        heading: "Why this cycle is tighter than most professional credentials",
        paragraphs: [
          "Most professional certifications assume a skill, once learned, degrades slowly — a nursing license or a trade certification doesn't need annual reverification because the underlying competency doesn't disappear in a year. Use-of-force skills are treated differently by policing standards bodies precisely because they're perishable in a different way: physical proficiency, judgment under stress, and policy updates (case law, department policy changes, new de-escalation protocols) all shift meaningfully within a single year.",
          "That's also why recertification isn't just a paperwork renewal the way, say, a first aid card renewal often is — it typically involves an actual practical requalification (a range qualification, a scenario-based assessment) rather than a course completion or an online module."
        ]
      },
      {
        heading: "What happens if recertification lapses",
        paragraphs: [
          "An officer whose use-of-force or firearms qualification has lapsed is typically not permitted to carry out full operational duties requiring that qualification until it's renewed — in practice this usually means being pulled from front-line deployment, not just a note in a file. For a training coordinator or command staff, discovering this after the fact (during an incident review, for example) is a far worse outcome than catching it before a scheduled shift.",
          "That's the core reason services invest in tracking this proactively rather than relying on individual officers to self-report their own status — the cost of catching a lapse early is a rescheduled qualification session; the cost of catching it late can be a serious liability and operational problem."
        ]
      },
      {
        heading: "Tracking requalification across a unit",
        paragraphs: [
          "For a training coordinator responsible for a whole unit or service, the same principle that applies to any hard-expiry credential applies here, with higher stakes: every officer's actual requalification date on file, reminders well ahead of the deadline (not the week of), and one dashboard showing who's current, who's due soon, and who's already lapsed — checkable before assigning that day's deployment, not discovered afterward."
        ]
      }
    ],
    faqs: [
      {
        q: "Is firearms qualification the same as use-of-force recertification?",
        a: "They're related but often tracked separately. Use-of-force recertification is typically broader — covering judgment, de-escalation, and policy — while firearms qualification is specifically a range-based proficiency test. Many services require firearms qualification more frequently than the annual use-of-force cycle, meaning an officer can have two separate requalification dates to track rather than one combined date."
      },
      {
        q: "Who sets the recertification interval — the department or a provincial/state body?",
        a: "Usually both: a provincial or state policing standards body sets a regulatory minimum, and individual departments can require recertification more frequently than that minimum based on their own policy. The department's actual requirement is what matters day-to-day, even when it's stricter than the regulatory floor."
      },
      {
        q: "Can a training coordinator see requalification status for an entire unit at a glance?",
        a: "Yes — a manager-style dashboard (the same pattern CredPulse uses for healthcare and construction teams) works the same way for a policing unit: every officer's requalification status rolls up into one view a training coordinator can check before scheduling deployments, without cross-referencing individual training files."
      }
    ],
    ctaHeadline: "Track requalification status across your unit",
    ctaBody:
      "CredPulse gives every officer their own tracked requalification dates and gives a training coordinator one dashboard for the whole unit.",
    ctaLinkPath: "/industries/policing",
    ctaLinkLabel: "See it for police services"
  }
};

// ============================================================
// Batch 2 — one guide per remaining KNOWN_TEMPLATES entry (see
// mockExtract.ts) that has a genuine renewal story to tell. Deliberately
// skips a couple of entries that aren't really "certifications" with a
// renewal cycle in the same sense (annual flu shots, TB screening) — see
// the conversation that scoped this batch. CPR and First Aid are combined
// into one guide since KNOWN_TEMPLATES itself treats "CPR / First Aid" as
// one combined template distinct from standalone "First Aid".
// ============================================================

Object.assign(GUIDES, {
  "acls-certification-renewal": {
    slug: "acls-certification-renewal",
    vertical: "healthcare",
    category: "HEALTHCARE CREDENTIALS",
    title: "ACLS Certification Renewal: How Often and What's Involved",
    description:
      "How long ACLS certification lasts, what a renewal course actually covers, and how to avoid a last-minute scramble before it expires.",
    excerpt: "How long ACLS lasts, what a renewal course actually involves, and why it's easy to lose track of.",
    publishedDate: "2026-09-08",
    updatedDate: "2026-09-08",
    intro: [
      "Advanced Cardiac Life Support (ACLS) certification is a step up from BLS — required for physicians, nurses, and other providers who manage cardiac arrest and other cardiovascular emergencies. Like BLS, it runs on a fixed renewal cycle that's easy to lose track of between cycles.",
      "This guide covers how long ACLS certification typically lasts, what a renewal course involves versus the initial course, and why tracking it separately from BLS matters."
    ],
    sections: [
      {
        heading: "How long does ACLS certification last?",
        paragraphs: [
          "Most ACLS certifications issued through the American Heart Association are valid for two years from the completion date — the same cycle as BLS, which is part of why the two are easy to mentally merge into one renewal date even though they're tracked separately.",
          "The expiry date is printed on the card. Renewing before it lapses, rather than after, usually qualifies you for a shorter renewal-format course instead of the full initial certification course."
        ]
      },
      {
        heading: "What's different about a renewal course?",
        paragraphs: [
          "A renewal course is typically shorter than the initial course, assuming baseline familiarity with the algorithms and skills rather than teaching them from scratch. Most providers require the renewal to happen before the card's expiry date to qualify for this shorter format — once a card has lapsed too long, some providers require the full initial course again."
        ]
      },
      {
        heading: "Why ACLS and BLS need separate tracking",
        paragraphs: [
          "Even when renewed together, ACLS and BLS are separate certifications with separate expiry dates that don't always land on the same day — especially if they were originally completed at different times. Treating them as one combined date is exactly the kind of assumption that leads to one lapsing while the other stays current."
        ]
      }
    ],
    faqs: [
      {
        q: "Can I renew ACLS without a current BLS certification?",
        a: "Most ACLS courses require a current BLS certification as a prerequisite. If your BLS has already lapsed, you may need to renew that first, or complete both in the same combined course if your provider offers one."
      },
      {
        q: "Does ACLS certification transfer between employers or states/provinces?",
        a: "AHA-issued ACLS certification is generally recognized nationally in both the US and Canada regardless of which provider issued it, though individual employers may have their own policy on which specific training providers they accept."
      }
    ],
    ctaHeadline: "Track ACLS alongside every other credential you carry",
    ctaBody: "CredPulse tracks ACLS, BLS, and everything else you carry as separate dates with separate reminders — no assuming two certifications are synced when they aren't.",
    ctaLinkPath: "/home",
    ctaLinkLabel: "See how CredPulse tracks it"
  },

  "pals-certification-renewal": {
    slug: "pals-certification-renewal",
    vertical: "healthcare",
    category: "HEALTHCARE CREDENTIALS",
    title: "PALS Certification Renewal: How Long It Lasts and Who Needs It",
    description:
      "How often Pediatric Advanced Life Support certification needs renewing, who typically needs it, and how to track it alongside BLS and ACLS.",
    excerpt: "How often PALS needs renewing, and why it's easy to lose track of alongside BLS and ACLS.",
    publishedDate: "2026-09-08",
    updatedDate: "2026-09-08",
    intro: [
      "Pediatric Advanced Life Support (PALS) certification is required for providers who care for critically ill or injured infants and children — commonly pediatric nurses, emergency physicians, and respiratory therapists. It runs on the same general renewal pattern as BLS and ACLS, which makes it one more date to track rather than a one-time requirement.",
      "This guide covers how long PALS certification lasts, who typically needs it, and how to avoid losing track of it among your other resuscitation certifications."
    ],
    sections: [
      {
        heading: "How long does PALS certification last?",
        paragraphs: [
          "Like ACLS, most PALS certifications issued through the American Heart Association are valid for two years from the completion date. The expiry date is printed on the card, and renewing before it lapses typically qualifies you for a shorter renewal course rather than the full initial certification."
        ]
      },
      {
        heading: "Who typically needs PALS?",
        paragraphs: [
          "PALS is most commonly required for staff working in pediatric emergency departments, pediatric ICUs, and NICUs, along with some paramedics and respiratory therapists depending on their scope of practice. It's not universal across all healthcare roles the way BLS often is — check your specific role and department's requirement rather than assuming it applies."
        ]
      },
      {
        heading: "Tracking PALS alongside BLS and ACLS",
        paragraphs: [
          "For providers who carry BLS, ACLS, and PALS at the same time, the risk isn't forgetting that renewal exists — it's assuming all three are synced to the same date when they were completed at different times and run on independent clocks. Tracking each certification's actual expiry date separately, rather than by memory of 'the last time I did my resuscitation courses,' is what actually prevents one from quietly lapsing."
        ]
      }
    ],
    faqs: [
      {
        q: "Is PALS required for all nurses?",
        a: "No — PALS is typically required for staff working with pediatric patients in acute or critical care settings, not for nursing roles broadly. Whether it's required for you depends on your specific unit and employer policy."
      },
      {
        q: "Can PALS and BLS be renewed in the same course?",
        a: "Some providers offer combined renewal courses covering multiple certifications in one session, but this varies by training provider — check with whoever issued your original certifications."
      }
    ],
    ctaHeadline: "One dashboard for BLS, ACLS, PALS, and everything else",
    ctaBody: "CredPulse tracks each certification's real expiry date independently, so nothing gets assumed to be synced with something else.",
    ctaLinkPath: "/home",
    ctaLinkLabel: "See how CredPulse tracks it"
  },

  "n95-fit-test-how-often": {
    slug: "n95-fit-test-how-often",
    vertical: "healthcare",
    category: "HEALTHCARE CREDENTIALS",
    title: "N95 Fit Testing: How Often Does It Need to Be Redone?",
    description:
      "How often N95 respirator fit testing needs to be redone, what triggers an early re-test, and why it's easy to lose track of.",
    excerpt: "Why N95 fit testing is required more often than most people expect — and what triggers an early re-test.",
    publishedDate: "2026-09-08",
    updatedDate: "2026-09-08",
    intro: [
      "N95 fit testing confirms that a specific respirator model forms a proper seal on your face — it's not a one-time check, and it's not interchangeable between people or even between mask models for the same person. That combination makes it one of the more frequently repeated healthcare credentials, even though it's often thought of as a single onboarding step.",
      "This guide covers how often fit testing typically needs to be redone, what can trigger an earlier retest, and why it's worth tracking on the same system as your other certifications."
    ],
    sections: [
      {
        heading: "How often is N95 fit testing required?",
        paragraphs: [
          "OSHA requires annual fit testing in the US for any employee required to wear a respirator, and most Canadian provincial regulators and healthcare employers follow a similar annual cadence. Some employers test more frequently for high-risk units, but annual is the common baseline."
        ]
      },
      {
        heading: "What triggers an earlier retest, outside the normal schedule?",
        paragraphs: ["A fit test isn't just time-based — several changes can require a new test before the annual date comes up:"],
        list: [
          "A significant change in weight (gain or loss)",
          "Facial surgery or a change in facial structure or hair (including facial hair changes for some mask models)",
          "Switching to a different respirator make or model — a fit test is specific to one exact model, not respirators in general",
          "Dental work that changes your facial structure"
        ]
      },
      {
        heading: "Why this one is easy to lose track of",
        paragraphs: [
          "Because fit testing is often bundled into initial onboarding, it can feel like a one-time requirement rather than an annual one — until an infection control audit or a switch in mask supplier reveals it's overdue. Tracking the actual test date, the same way you'd track any other hard-expiry credential, closes that gap."
        ]
      }
    ],
    faqs: [
      {
        q: "Does N95 fit testing expire at the same time every year, or from the test date?",
        a: "It's generally from the test date, not a fixed calendar date — so unlike some certifications, your personal renewal date can drift depending on when you were last tested, which makes tracking the actual date more important than assuming an annual calendar reset."
      },
      {
        q: "Do I need a new fit test if my employer switches N95 brands?",
        a: "Yes — a fit test is specific to the exact respirator model, not respirators as a category. A brand or model change means a new fit test regardless of how recently you passed one for a different model."
      }
    ],
    ctaHeadline: "Don't let fit testing hide inside 'onboarding'",
    ctaBody: "CredPulse tracks N95 fit testing as its own dated credential with its own reminder, not a one-time box checked at hire.",
    ctaLinkPath: "/home",
    ctaLinkLabel: "See how CredPulse tracks it"
  },

  "whmis-training-renewal": {
    slug: "whmis-training-renewal",
    vertical: "healthcare",
    category: "WORKPLACE SAFETY",
    title: "WHMIS Training Renewal: How Often Do You Actually Need to Redo It?",
    description:
      "WHMIS doesn't have one universal expiry date — here's how the renewal requirement actually works, and how to track it without guessing.",
    excerpt: "WHMIS doesn't have one universal expiry date — here's how the renewal requirement actually works.",
    publishedDate: "2026-09-08",
    updatedDate: "2026-09-08",
    intro: [
      "WHMIS (Workplace Hazardous Materials Information System) training in Canada — or its US equivalent, Hazard Communication (HazCom) training — is required for almost anyone who works around hazardous materials, which covers a huge range of healthcare, laboratory, and industrial roles. Unlike a certification with a printed expiry date, WHMIS renewal is driven by employer policy rather than a fixed national standard, which makes it genuinely confusing to track.",
      "This guide covers why there's no single answer to 'how often does WHMIS expire,' and what a workable tracking approach looks like anyway."
    ],
    sections: [
      {
        heading: "Does WHMIS training actually expire?",
        paragraphs: [
          "There's no single federally mandated expiry date for WHMIS training in Canada — it's up to individual employers and provincial regulations to set a refresher policy. Many employers require refresher training every one to three years, but this genuinely varies, and some jurisdictions or employers require refreshers whenever workplace hazards change (a new chemical introduced, for example) rather than purely on a calendar schedule.",
          "US HazCom training follows a similar pattern — OSHA requires training whenever a new hazard is introduced to the workplace, plus periodic refreshers at employer discretion, rather than a single universal renewal interval."
        ]
      },
      {
        heading: "Why 'it depends on my employer' makes this harder to track",
        paragraphs: [
          "A certification with a fixed 2-year cycle is at least predictable once you know the rule. WHMIS/HazCom's employer-driven cadence means the same worker could have a completely different renewal expectation at their next job, or even after an internal policy change at their current one — which is exactly the kind of moving target that's easy to lose track of if you're relying on remembering a rule rather than tracking an actual date."
        ]
      },
      {
        heading: "What to track instead of trying to memorize a rule",
        paragraphs: [
          "Rather than trying to remember your employer's specific refresher policy, the more reliable approach is tracking the actual date you last completed WHMIS/HazCom training and setting a reminder based on your employer's stated cadence (ask HR or your safety officer if it isn't posted anywhere) — the same pattern that works for any employer-driven, non-standardized requirement."
        ]
      }
    ],
    faqs: [
      {
        q: "Is WHMIS training the same across all Canadian provinces?",
        a: "The core WHMIS 2015 content is standardized nationally (it's based on the Globally Harmonized System), but how often refresher training is required and enforced can vary by province and by individual employer policy on top of that."
      },
      {
        q: "Do I need new WHMIS training if I change employers?",
        a: "Most employers require new-hire WHMIS training even if you completed it recently elsewhere, since it often includes site-specific hazard information alongside the general WHMIS content. Check with your new employer's safety officer rather than assuming a previous certificate transfers."
      }
    ],
    ctaHeadline: "Track WHMIS on your own timeline, not a rule you have to remember",
    ctaBody: "CredPulse tracks the actual date you completed WHMIS/HazCom training and reminds you based on the cadence you set — no memorizing employer policy.",
    ctaLinkPath: "/home",
    ctaLinkLabel: "See how CredPulse tracks it"
  },

  "cpr-first-aid-certification-renewal": {
    slug: "cpr-first-aid-certification-renewal",
    vertical: "healthcare",
    category: "HEALTHCARE CREDENTIALS",
    title: "CPR and First Aid Certification: How Often Do You Need to Renew?",
    description:
      "How long CPR and standalone First Aid certifications last, why they're often tracked separately, and how to keep both current.",
    excerpt: "CPR and First Aid often get treated as one thing — but they're frequently tracked, and renewed, separately.",
    publishedDate: "2026-09-08",
    updatedDate: "2026-09-08",
    intro: [
      "CPR and First Aid certifications are some of the most widely required credentials across healthcare, education, construction, and public safety — and also some of the most inconsistently tracked, since the two are often bundled into one course but don't always run on identical expiry timelines depending on the provider and format.",
      "This guide covers how long each typically lasts, why they're sometimes tracked as separate dates, and what to watch for."
    ],
    sections: [
      {
        heading: "How long do CPR and First Aid certifications last?",
        paragraphs: [
          "CPR certification (CPR alone, without the broader BLS designation) is commonly valid for one year, reflecting how quickly hands-on resuscitation skills are considered to degrade without practice. Standalone First Aid certification is more commonly valid for three years, since it covers a broader set of knowledge-based skills rather than a single physical technique.",
          "When CPR and First Aid are taken together as a combined course, some providers issue one combined card with a single expiry date (often defaulting to the shorter CPR cycle), while others issue two separate certificates with two separate dates — check which format your provider used."
        ]
      },
      {
        heading: "Why the mismatch in cycles causes confusion",
        paragraphs: [
          "If your combined CPR/First Aid course issued two separate certificates on different cycles, it's easy to renew the one you remember (often CPR, since it comes up more often) while assuming First Aid renewed with it. A year later, First Aid is still current but CPR has quietly lapsed — or vice versa if you're only tracking whichever card you look at most."
        ]
      },
      {
        heading: "Who typically requires which one",
        paragraphs: [
          "Requirements vary widely by role and employer: some jobs require both, some only CPR, some only First Aid, and some (like many healthcare roles) require the more comprehensive BLS designation instead of standalone CPR. Confirm exactly which certification your specific role requires rather than assuming 'CPR' and 'First Aid' are interchangeable terms for the same requirement."
        ]
      }
    ],
    faqs: [
      {
        q: "Is First Aid certification the same as CPR certification?",
        a: "No — they're often taught together but cover different material and commonly run on different renewal cycles (CPR is typically annual, First Aid typically every three years). Check your specific certificate to see what it actually covers and when it expires."
      },
      {
        q: "Does BLS certification replace the need for separate CPR certification?",
        a: "For most healthcare employers, yes — BLS is a more comprehensive healthcare-provider-level certification that includes CPR. A separate standalone CPR card usually isn't needed on top of a current BLS certification, but confirm with your specific employer."
      }
    ],
    ctaHeadline: "Track CPR and First Aid as the separate dates they usually are",
    ctaBody: "CredPulse tracks each certification's actual printed expiry date independently — no assuming a combined course means a combined renewal date.",
    ctaLinkPath: "/home",
    ctaLinkLabel: "See how CredPulse tracks it"
  },

  "nrp-certification-renewal": {
    slug: "nrp-certification-renewal",
    vertical: "healthcare",
    category: "HEALTHCARE CREDENTIALS",
    title: "NRP Certification Renewal: How Often Neonatal Resuscitation Training Expires",
    description:
      "How long Neonatal Resuscitation Program (NRP) certification lasts, who needs it, and how to track it alongside other resuscitation credentials.",
    excerpt: "How long NRP certification lasts, and why it's easy to lose track of among other resuscitation credentials.",
    publishedDate: "2026-09-08",
    updatedDate: "2026-09-08",
    intro: [
      "Neonatal Resuscitation Program (NRP) certification is required for staff who may need to resuscitate a newborn — most commonly labor and delivery nurses, NICU staff, pediatricians, and some respiratory therapists. Like most resuscitation certifications, it runs on a fixed renewal cycle rather than being a one-time qualification.",
      "This guide covers how long NRP certification typically lasts and how it fits alongside the other resuscitation credentials many of the same staff carry."
    ],
    sections: [
      {
        heading: "How long does NRP certification last?",
        paragraphs: [
          "NRP certification, administered through the American Academy of Pediatrics, is commonly valid for two years from the completion date — the same general cycle as BLS, ACLS, and PALS, which is part of why staff who carry several of these at once find it easy to lose track of which one is actually due next."
        ]
      },
      {
        heading: "Who typically needs NRP certification?",
        paragraphs: [
          "NRP is generally required for anyone present at deliveries who might need to resuscitate a newborn — this commonly includes labor and delivery nurses, NICU nurses, pediatric residents, and neonatologists, though the exact requirement depends on the specific role and facility policy."
        ]
      },
      {
        heading: "Tracking NRP alongside other resuscitation certifications",
        paragraphs: [
          "Staff who carry NRP often also carry BLS and sometimes PALS or ACLS, each completed at a different time and running on its own independent clock. The practical fix isn't remembering a mental checklist of four certifications — it's having each one's actual expiry date tracked somewhere that reminds you automatically, so no single one quietly falls through."
        ]
      }
    ],
    faqs: [
      {
        q: "Is NRP required for all labor and delivery staff?",
        a: "It's commonly required, but the exact policy depends on your specific facility and role — check with your unit's education or credentialing office rather than assuming."
      },
      {
        q: "Can NRP be renewed online?",
        a: "Many providers offer a blended format with an online knowledge portion and an in-person or virtual skills verification, similar to BLS. A fully online course without any skills check typically isn't accepted, since NRP requires demonstrating hands-on resuscitation skills."
      }
    ],
    ctaHeadline: "Track NRP alongside BLS, ACLS, and PALS in one place",
    ctaBody: "CredPulse gives each resuscitation certification you carry its own tracked expiry date and its own reminder.",
    ctaLinkPath: "/home",
    ctaLinkLabel: "See how CredPulse tracks it"
  },

  "phtls-certification-renewal": {
    slug: "phtls-certification-renewal",
    vertical: "healthcare",
    category: "HEALTHCARE CREDENTIALS",
    title: "PHTLS Certification Renewal: How Long It Lasts for Paramedics and EMTs",
    description:
      "How often Prehospital Trauma Life Support certification needs renewing, and how paramedics and EMTs typically track it alongside BLS and ACLS.",
    excerpt: "PHTLS runs on a longer renewal cycle than BLS — which is exactly why it's easy to forget it's still on a cycle at all.",
    publishedDate: "2026-09-08",
    updatedDate: "2026-09-08",
    intro: [
      "Prehospital Trauma Life Support (PHTLS) certification, administered through NAEMT, is a common requirement for paramedics and EMTs who respond to trauma calls. It runs on a longer renewal cycle than BLS or ACLS, which paradoxically makes it easier to forget about — a four-year gap is long enough that the previous renewal can feel like ancient history by the time the next one comes due.",
      "This guide covers how long PHTLS certification typically lasts and why a longer cycle doesn't mean it's lower-stakes to track."
    ],
    sections: [
      {
        heading: "How long does PHTLS certification last?",
        paragraphs: [
          "PHTLS certification is commonly valid for four years from the completion date — longer than the two-year cycle typical of BLS, ACLS, and PALS. That longer window means fewer renewal cycles over a career, but also a bigger gap in which the renewal date can slip from memory entirely."
        ]
      },
      {
        heading: "Why a longer cycle is its own risk",
        paragraphs: [
          "A two-year certification comes around often enough that most providers develop some rhythm around it, even an imperfect one. A four-year certification is long enough that a job change, a move, or simply the passage of time can mean nobody — including the certificate holder — has thought about it in years, right up until it's discovered lapsed during a credentialing review."
        ]
      },
      {
        heading: "Tracking a long-cycle certification alongside short-cycle ones",
        paragraphs: [
          "For paramedics and EMTs who track PHTLS alongside BLS and ACLS (both typically two-year cycles), the mismatch in cycle length is exactly why relying on 'I renew everything around the same time' as a mental shortcut fails — PHTLS won't line up with the others most cycles, and needs its own independently tracked date."
        ]
      }
    ],
    faqs: [
      {
        q: "Is PHTLS required for all EMTs and paramedics?",
        a: "Requirement varies by employer, state/province, and scope of practice — some trauma-focused roles require it explicitly, while others accept equivalent trauma training. Check your specific employer or regulatory body's requirement."
      },
      {
        q: "What happens if PHTLS certification lapses before renewal?",
        a: "Policies vary by provider, but a significantly lapsed PHTLS certification may require retaking the full initial course rather than a shorter renewal format — similar to other resuscitation-style certifications. Renewing before the expiry date is the more reliable path."
      }
    ],
    ctaHeadline: "Don't let a 4-year cycle mean 4 years of not thinking about it",
    ctaBody: "CredPulse reminds you well before a long-cycle certification like PHTLS comes due — not just the short-cycle ones that are easier to remember.",
    ctaLinkPath: "/home",
    ctaLinkLabel: "See how CredPulse tracks it"
  },

  "atls-certification-renewal": {
    slug: "atls-certification-renewal",
    vertical: "healthcare",
    category: "HEALTHCARE CREDENTIALS",
    title: "ATLS Certification Renewal: What Surgeons and Emergency Physicians Need to Know",
    description:
      "How often Advanced Trauma Life Support certification needs renewing, and why its longer cycle makes tracking it proactively more important, not less.",
    excerpt: "ATLS runs on one of the longest renewal cycles of any resuscitation certification — which makes it easy to forget entirely.",
    publishedDate: "2026-09-08",
    updatedDate: "2026-09-08",
    intro: [
      "Advanced Trauma Life Support (ATLS) certification, administered through the American College of Surgeons, is a common requirement for emergency physicians, surgeons, and anesthesiologists managing trauma patients. Like PHTLS, it runs on a longer cycle than BLS or ACLS — which means it's due for renewal rarely enough to be genuinely easy to forget about.",
      "This guide covers how long ATLS certification typically lasts and why a multi-year cycle deserves more proactive tracking, not less."
    ],
    sections: [
      {
        heading: "How long does ATLS certification last?",
        paragraphs: [
          "ATLS certification is commonly valid for four years from the completion date, similar to PHTLS. Some hospitals and credentialing bodies require it as a condition of trauma privileges, which raises the stakes of a lapse well beyond just needing to retake a course."
        ]
      },
      {
        heading: "Why hospital credentialing raises the stakes",
        paragraphs: [
          "For physicians whose trauma privileges are tied to maintaining current ATLS certification, a lapse isn't just a personal certification gap — it can mean a suspension of specific clinical privileges until it's renewed, which has direct implications for scheduling and scope of practice. That's a materially higher-stakes outcome than most certifications carry, and a strong argument for tracking the renewal date well ahead of time rather than reactively."
        ]
      },
      {
        heading: "Renewal course format",
        paragraphs: [
          "ATLS renewal typically requires retaking the full course rather than a shortened refresher format, since it's structured as a fixed curriculum rather than a renewal-specific abbreviated version — which also means it needs to be scheduled well in advance, as courses often fill up and aren't offered continuously in every region."
        ]
      }
    ],
    faqs: [
      {
        q: "Is ATLS certification required for all surgeons?",
        a: "It's commonly required for those managing trauma patients specifically, and is often tied to hospital trauma center credentialing requirements rather than being universal across all surgical specialties. Check your hospital's specific credentialing policy."
      },
      {
        q: "How far in advance should I book an ATLS renewal course?",
        a: "Given that courses are offered less frequently than shorter-cycle certifications and don't have an abbreviated renewal format, booking several months ahead of your expiry date is a reasonable buffer against limited course availability in your region."
      }
    ],
    ctaHeadline: "Track a 4-year certification like it matters — because it does",
    ctaBody: "CredPulse reminds you with real lead time before a long-cycle, high-stakes certification like ATLS comes due.",
    ctaLinkPath: "/home",
    ctaLinkLabel: "See how CredPulse tracks it"
  },

  "bloodborne-pathogens-training-renewal": {
    slug: "bloodborne-pathogens-training-renewal",
    vertical: "healthcare",
    category: "WORKPLACE SAFETY",
    title: "Bloodborne Pathogens Training: How Often Does OSHA Require Renewal?",
    description:
      "How often bloodborne pathogens training needs to be redone under OSHA requirements, who needs it, and how to track it alongside other safety training.",
    excerpt: "OSHA requires this one more often than most people expect — here's the actual cadence.",
    publishedDate: "2026-09-08",
    updatedDate: "2026-09-08",
    intro: [
      "Bloodborne Pathogens training is required under OSHA's Bloodborne Pathogens Standard for any employee with reasonably anticipated exposure to blood or other potentially infectious materials — a category that covers a wide range of healthcare, lab, first-responder, and even some non-clinical roles.",
      "This guide covers how often it actually needs to be redone, and why the requirement is more frequent than many people assume."
    ],
    sections: [
      {
        heading: "How often is bloodborne pathogens training required?",
        paragraphs: [
          "OSHA requires annual retraining for covered employees — not a one-time onboarding requirement, even though it's often bundled into new-hire orientation the same way N95 fit testing sometimes is. The annual cadence applies regardless of whether an employee has had an actual exposure incident in that period."
        ]
      },
      {
        heading: "Who's covered by this requirement?",
        paragraphs: [
          "The standard applies to anyone with reasonably anticipated occupational exposure to blood or other potentially infectious materials, which extends well beyond obviously clinical roles — includes lab technicians, some housekeeping and custodial staff in healthcare settings, and first responders, among others."
        ]
      },
      {
        heading: "Why this one gets missed",
        paragraphs: [
          "Because it's frequently completed as an online module rather than an in-person course, and because it's bundled into initial onboarding, bloodborne pathogens training can feel like background paperwork rather than a hard-expiry annual requirement — which is exactly the profile of a requirement that quietly lapses until an OSHA audit or an actual exposure incident brings it to light."
        ]
      }
    ],
    faqs: [
      {
        q: "Can bloodborne pathogens training be completed entirely online?",
        a: "Often yes — unlike BLS or CPR, this training is typically knowledge-based rather than requiring a hands-on skills check, so a fully online annual module is commonly accepted. Confirm your specific employer's format requirement."
      },
      {
        q: "What happens if bloodborne pathogens training lapses?",
        a: "This is generally an employer compliance requirement rather than something that immediately blocks you from working the way a lapsed BLS card might, but it exposes the employer to OSHA compliance risk and is something most employers track and enforce closely regardless."
      }
    ],
    ctaHeadline: "Don't let an annual requirement hide as 'onboarding'",
    ctaBody: "CredPulse tracks bloodborne pathogens training as its own annual credential with its own reminder, separate from a one-time new-hire checklist.",
    ctaLinkPath: "/home",
    ctaLinkLabel: "See how CredPulse tracks it"
  },

  "radiation-safety-certification-renewal": {
    slug: "radiation-safety-certification-renewal",
    vertical: "healthcare",
    category: "HEALTHCARE CREDENTIALS",
    title: "Radiation Safety Certification: How Often Does It Need Renewing?",
    description:
      "How radiation safety certification renewal works for radiologic technologists and other staff working around radiation, and why the requirement varies by state/province.",
    excerpt: "Radiation safety renewal varies more by jurisdiction than most certifications — here's what actually drives the requirement.",
    publishedDate: "2026-09-08",
    updatedDate: "2026-09-08",
    intro: [
      "Radiation safety certification is required for radiologic technologists and other staff who work around ionizing radiation — but unlike a nationally standardized certification like BLS, the specific renewal requirement is often set at the state/provincial regulatory level, which means it genuinely varies more than most people expect.",
      "This guide covers what typically drives the renewal timeline and why checking your specific jurisdiction's requirement matters more here than for most other credentials."
    ],
    sections: [
      {
        heading: "Why radiation safety renewal isn't standardized nationally",
        paragraphs: [
          "In both the US and Canada, radiation safety oversight is largely handled at the state/provincial level rather than through one national body, which means the specific renewal interval — commonly somewhere between one and three years — depends on where you're licensed to practice rather than a single universal standard."
        ]
      },
      {
        heading: "What a renewal typically involves",
        paragraphs: [
          "Renewal commonly requires a combination of continuing education credits specific to radiation safety and, in some jurisdictions, a formal reattestation or exam. Some employers also require an internal radiation safety refresher independent of the regulatory renewal, which is a separate date worth tracking on its own."
        ]
      },
      {
        heading: "Why this one benefits from tracking rather than assuming",
        paragraphs: [
          "Given how much the requirement varies by jurisdiction and employer, radiation safety certification is a poor candidate for 'I'll remember the rule' — the actual expiry date on your specific certification is a much more reliable thing to track than trying to recall your jurisdiction's exact interval from memory."
        ]
      }
    ],
    faqs: [
      {
        q: "Does radiation safety certification transfer if I move to a different state or province?",
        a: "Not automatically in most cases — since the requirement is often set at the state/provincial level, moving jurisdictions commonly means confirming (and sometimes re-certifying to) the new jurisdiction's specific requirement rather than assuming your existing certification transfers."
      },
      {
        q: "Is radiation safety certification the same as general radiologic technologist licensure?",
        a: "No — they're related but distinct. Radiologic technologist licensure is typically the broader professional credential, while radiation safety certification/training is often a more specific, sometimes employer- or facility-level requirement layered on top."
      }
    ],
    ctaHeadline: "Track the actual date, not a jurisdiction's rule",
    ctaBody: "CredPulse tracks your radiation safety certification's real expiry date, whatever your specific jurisdiction's renewal interval happens to be.",
    ctaLinkPath: "/home",
    ctaLinkLabel: "See how CredPulse tracks it"
  },

  "infection-control-certification-renewal": {
    slug: "infection-control-certification-renewal",
    vertical: "healthcare",
    category: "WORKPLACE SAFETY",
    title: "Infection Control Certification: How Often Does It Need Renewing?",
    description:
      "How infection control training renewal typically works, why it's usually employer-driven rather than nationally standardized, and how to track it.",
    excerpt: "Infection control renewal is usually set by your employer, not a national standard — here's how to track it anyway.",
    publishedDate: "2026-09-08",
    updatedDate: "2026-09-08",
    intro: [
      "Infection control certification or training is common across healthcare, dental, and laboratory roles, covering practices like standard precautions, sterilization, and outbreak protocols. Like WHMIS, it's usually driven by employer or accreditation-body policy rather than a single fixed national standard, which makes the 'how often' question genuinely dependent on where you work.",
      "This guide covers the typical pattern and how to track a requirement that isn't tied to one universal cycle."
    ],
    sections: [
      {
        heading: "How often is infection control training typically required?",
        paragraphs: [
          "Many healthcare employers require annual infection control refresher training as part of their accreditation requirements (from bodies like The Joint Commission in the US or provincial health authorities in Canada), though the exact interval and content depth vary by employer and by role."
        ]
      },
      {
        heading: "Why accreditation bodies drive this more than a fixed law",
        paragraphs: [
          "Unlike BLS, which has a clear national issuing body and fixed cycle, infection control training requirements often flow from whatever accreditation standard your facility operates under, which means the specific requirement can shift if your facility's accreditation status or standards change — another reason to track the actual date rather than a remembered rule."
        ]
      },
      {
        heading: "What to actually track",
        paragraphs: [
          "The reliable approach is the same as for any employer-driven requirement: track the date you last completed infection control training and set a reminder based on your employer's stated policy, rather than assuming a fixed interval applies everywhere."
        ]
      }
    ],
    faqs: [
      {
        q: "Is infection control training the same as bloodborne pathogens training?",
        a: "They overlap in some content but are typically separate requirements — bloodborne pathogens training is specifically an OSHA-mandated annual requirement, while infection control training is broader and often driven by accreditation standards rather than a single regulatory body."
      },
      {
        q: "Does infection control certification expire the same way a course completion does?",
        a: "It depends on your employer — some treat it as an annual training requirement without a formal 'certification' artifact, while others issue a certificate with a printed expiry date. Check what your specific employer or facility requires."
      }
    ],
    ctaHeadline: "Track infection control training on your own schedule",
    ctaBody: "CredPulse tracks the actual date you completed infection control training and reminds you based on your employer's cadence.",
    ctaLinkPath: "/home",
    ctaLinkLabel: "See how CredPulse tracks it"
  },

  "medical-coding-certification-cpc-renewal": {
    slug: "medical-coding-certification-cpc-renewal",
    vertical: "healthcare",
    category: "HEALTHCARE CREDENTIALS",
    title: "Medical Coding Certification (CPC) Renewal: CEUs and What's Required",
    description:
      "How Certified Professional Coder (CPC) renewal works, how many continuing education units are required, and how to track the deadline.",
    excerpt: "CPC renewal isn't a retest — it's a continuing-education requirement that's easy to under-track.",
    publishedDate: "2026-09-08",
    updatedDate: "2026-09-08",
    intro: [
      "A Certified Professional Coder (CPC) credential, issued by AAPC, is a common requirement for medical billing and coding roles. Unlike a resuscitation certification that requires retaking a course, CPC renewal is a continuing-education-unit (CEU) requirement — which makes it a different kind of tracking problem: it's not one deadline, it's an accumulating requirement against a deadline.",
      "This guide covers how CPC renewal actually works and why treating it as 'just remember to renew' undersells what's actually required."
    ],
    sections: [
      {
        heading: "How does CPC renewal actually work?",
        paragraphs: [
          "AAPC requires CPC holders to earn a set number of continuing education units (commonly around 36 CEUs) within each two-year renewal cycle, along with paying an annual membership fee. Unlike a course-based renewal, there's no single event that renews the credential — it's the accumulation of qualifying CEU activity across the whole cycle."
        ]
      },
      {
        heading: "Why this is a different tracking problem than most certifications",
        paragraphs: [
          "Most certifications on this site's list have one clear renewal action — take a course, pass a test. CPC renewal instead requires tracking progress against a running CEU total throughout the cycle, which means the risk isn't just 'forgetting the date' — it's realizing near the deadline that not enough CEU credit has actually been earned, with too little time left to catch up."
        ]
      },
      {
        heading: "What to track",
        paragraphs: [
          "For CPC holders, the useful things to track are the renewal cycle's end date and a running sense of CEU progress against it — checking in periodically well before the deadline rather than waiting until the final months to add up what's been earned."
        ]
      }
    ],
    faqs: [
      {
        q: "What happens if I don't earn enough CEUs before my CPC renewal deadline?",
        a: "AAPC generally allows a grace period to submit outstanding CEUs, sometimes with a late fee, but letting the credential lapse entirely typically requires retaking the certification exam to reinstate it — a much bigger setback than catching a CEU shortfall early."
      },
      {
        q: "Do all AAPC certifications use the same CEU requirement as CPC?",
        a: "AAPC has multiple specialty certifications beyond CPC, and CEU requirements can vary by credential and by how many certifications you hold simultaneously. Check AAPC's current requirements for your specific credential."
      }
    ],
    ctaHeadline: "Track a CEU deadline, not just a renewal date",
    ctaBody: "CredPulse tracks your CPC renewal cycle's deadline and reminds you with enough lead time to close any CEU gap before it becomes urgent.",
    ctaLinkPath: "/home",
    ctaLinkLabel: "See how CredPulse tracks it"
  },

  "crcst-certification-renewal": {
    slug: "crcst-certification-renewal",
    vertical: "healthcare",
    category: "HEALTHCARE CREDENTIALS",
    title: "CRCST Certification Renewal: What Sterile Processing Techs Need to Know",
    description:
      "How CRCST (Certified Registered Central Service Technician) renewal works, how often it's required, and what continuing education is involved.",
    excerpt: "CRCST runs on a longer cycle than most healthcare certifications — which makes it easy to lose track of.",
    publishedDate: "2026-09-08",
    updatedDate: "2026-09-08",
    intro: [
      "Certified Registered Central Service Technician (CRCST) certification, issued through HSPA (formerly IAHCSMM), is the standard credential for sterile processing technicians responsible for cleaning, sterilizing, and preparing surgical instruments. Its renewal cycle is longer than many other healthcare certifications, which is exactly why it's easy to forget it's on a cycle at all.",
      "This guide covers how CRCST renewal works and what's required to maintain it."
    ],
    sections: [
      {
        heading: "How often does CRCST need to be renewed?",
        paragraphs: [
          "CRCST certification is commonly renewed on a five-year cycle, requiring a set number of continuing education credits earned within that window rather than a single retest — similar in structure to how CPC renewal works, though on a longer timeline."
        ]
      },
      {
        heading: "Why a 5-year cycle deserves more tracking, not less",
        paragraphs: [
          "A five-year renewal window is long enough that continuing education credits earned early in the cycle can be easy to lose track of by the time the deadline actually approaches — and unlike a certification renewed via a single course, there's no natural 'reminder event' partway through the cycle unless you're deliberately tracking progress."
        ]
      },
      {
        heading: "What sterile processing techs should track",
        paragraphs: [
          "The practical approach is the same as for any CEU-based, long-cycle credential: track the actual renewal deadline and periodically check continuing-education progress against it, rather than assuming five years is far enough away to not think about until close to the end."
        ]
      }
    ],
    faqs: [
      {
        q: "What happens if CRCST certification lapses?",
        a: "Requirements vary, but a significantly lapsed CRCST certification may require retaking the full certification exam to reinstate, rather than simply catching up on continuing education after the fact — a strong incentive to track the deadline proactively."
      },
      {
        q: "Are there other sterile processing certifications beyond CRCST?",
        a: "Yes — HSPA and other bodies offer additional specialty certifications for sterile processing (such as instrument-specific or leadership-focused credentials), each with its own renewal requirement that's worth tracking independently if you hold more than one."
      }
    ],
    ctaHeadline: "Don't let a 5-year cycle mean 5 years of not checking in",
    ctaBody: "CredPulse tracks your CRCST renewal deadline and reminds you with real lead time, whatever point you're at in the cycle.",
    ctaLinkPath: "/home",
    ctaLinkLabel: "See how CredPulse tracks it"
  },

  "pance-recertification-guide": {
    slug: "pance-recertification-guide",
    vertical: "healthcare",
    category: "HEALTHCARE CREDENTIALS",
    title: "Physician Assistant Recertification: How the NCCPA Cycle Works",
    description:
      "How physician assistant certification maintenance and recertification works through NCCPA, including CME requirements and the exam cycle.",
    excerpt: "PA certification maintenance is a multi-year, multi-step process — here's the shape of it.",
    publishedDate: "2026-09-08",
    updatedDate: "2026-09-08",
    intro: [
      "Physician assistant certification, maintained through the NCCPA (National Commission on Certification of Physician Assistants), is one of the more layered credentials to track — it combines an ongoing continuing medical education (CME) requirement with periodic recertification exams on a longer cycle, rather than a single renewal date.",
      "This guide covers the general shape of PA certification maintenance and why it benefits from tracking more than one deadline at once."
    ],
    sections: [
      {
        heading: "The two layers of PA certification maintenance",
        paragraphs: [
          "NCCPA certification maintenance generally involves two separate tracks: an ongoing CME requirement (commonly a set number of credits every two years) and a longer-cycle recertification exam or equivalent pathway (commonly every ten years, depending on which NCCPA maintenance pathway a PA is enrolled in).",
          "Because these run on different timelines simultaneously, it's possible to be current on one and behind on the other without realizing it — tracking them as a single 'PA certification' status oversimplifies what's actually two separate deadlines."
        ]
      },
      {
        heading: "Why the 10-year cycle needs early planning",
        paragraphs: [
          "The longer recertification cycle is far enough out that it's easy to deprioritize until it's uncomfortably close — but preparation (whether for an exam or an alternative pathway) benefits from starting well in advance rather than in the final year of the cycle."
        ]
      },
      {
        heading: "What to track",
        paragraphs: [
          "For PAs, the practical approach is tracking both the CME cycle deadline and the longer recertification deadline as two separate dates, rather than one combined 'certification status' — the same principle as tracking BLS and ACLS separately even when they're often completed together."
        ]
      }
    ],
    faqs: [
      {
        q: "Does NCCPA still require the PANCE exam for recertification?",
        a: "NCCPA's maintenance requirements have evolved over time and now include multiple pathways beyond a single retest format — check NCCPA's current published requirements for the specific pathway that applies to your certification cycle, since this is an area that's changed more than most other certifications on this list."
      },
      {
        q: "What happens if CME requirements aren't met within the two-year cycle?",
        a: "NCCPA generally allows a grace period with additional requirements to catch up, but an extended lapse can affect certification status — similar to other CEU-based credentials, catching a shortfall early is far less disruptive than discovering it near a deadline."
      }
    ],
    ctaHeadline: "Track both the CME cycle and the recertification cycle",
    ctaBody: "CredPulse lets you track multiple deadlines for the same overall credential — so a long-cycle recertification date doesn't get lost behind the shorter CME cycle.",
    ctaLinkPath: "/home",
    ctaLinkLabel: "See how CredPulse tracks it"
  },

  "confined-space-entry-training-renewal": {
    slug: "confined-space-entry-training-renewal",
    vertical: "construction",
    category: "CONSTRUCTION SAFETY",
    title: "Confined Space Entry Training: How Often Does It Need Renewing?",
    description:
      "How often confined space entry training needs to be redone, why the requirement is often stricter than a fixed calendar cycle, and how crews track it.",
    excerpt: "Confined space training renewal is often triggered by more than just a calendar date — here's what else matters.",
    publishedDate: "2026-09-08",
    updatedDate: "2026-09-08",
    intro: [
      "Confined space entry training is required for workers who enter tanks, silos, trenches, and other spaces with restricted entry/exit and potential atmospheric hazards. The renewal requirement is often a mix of a calendar-based refresh and event-based retraining triggers, which makes it a bit more involved to track than a straightforward fixed-cycle certification.",
      "This guide covers what typically drives the renewal timeline and what else can trigger a required retrain."
    ],
    sections: [
      {
        heading: "How often is confined space entry training required?",
        paragraphs: [
          "Requirements vary by jurisdiction and employer policy, but annual refresher training is common, particularly for workers who regularly perform confined space entries. Some employers set a longer cycle (up to three years) for less frequent entrants, layered with event-based retraining requirements described below."
        ]
      },
      {
        heading: "What else can trigger a required retrain",
        paragraphs: ["Beyond the calendar-based cycle, several things commonly require retraining regardless of when the last training happened:"],
        list: [
          "A near-miss or actual incident during a confined space entry",
          "A change in the specific confined space's hazards or configuration",
          "A change in the entry procedures or equipment used",
          "Evidence that a worker's knowledge or skills have gaps, identified during an audit or observation"
        ]
      },
      {
        heading: "Why this makes tracking more important, not less",
        paragraphs: [
          "Because the requirement isn't purely calendar-based, a site supervisor tracking confined space training across a crew needs to account for both the standard refresh cycle and any event-based triggers that might apply to a specific worker or site — a single shared expiry date assumption misses the event-based half of the requirement entirely."
        ]
      }
    ],
    faqs: [
      {
        q: "Is confined space entry training the same for every type of confined space?",
        a: "No — requirements can differ for permit-required confined spaces (those with serious hazards like toxic atmosphere or engulfment risk) versus non-permit spaces. Confirm which category applies to your specific work before assuming a single training covers everything."
      },
      {
        q: "Who needs confined space training — just entrants, or supervisors too?",
        a: "Typically both, plus attendants (workers stationed outside monitoring the entry) — each role has training requirements, though the specific content can differ by role. Check your jurisdiction's specific requirement for each role involved in a confined space entry."
      }
    ],
    ctaHeadline: "Track confined space training across your whole crew",
    ctaBody: "CredPulse tracks each worker's actual training date and gives a site supervisor one dashboard to check before assigning confined space work.",
    ctaLinkPath: "/industries/construction",
    ctaLinkLabel: "See it for construction crews"
  },

  "forklift-certification-renewal": {
    slug: "forklift-certification-renewal",
    vertical: "construction",
    category: "CONSTRUCTION SAFETY",
    title: "Forklift Certification Renewal: How Often OSHA Requires Recertification",
    description:
      "How often forklift operator certification needs renewing under OSHA, what can trigger an earlier retrain, and how crews track it.",
    excerpt: "Forklift certification renewal is partly calendar-based and partly triggered by specific events — here's both.",
    publishedDate: "2026-09-08",
    updatedDate: "2026-09-08",
    intro: [
      "Forklift operator certification (sometimes called powered industrial truck certification) is a common requirement on construction sites, warehouses, and industrial workplaces. OSHA's requirement is a mix of a fixed calendar cycle and specific triggering events, similar in structure to confined space training.",
      "This guide covers the standard renewal cycle and what else can require an earlier evaluation."
    ],
    sections: [
      {
        heading: "How often does forklift certification need renewing?",
        paragraphs: [
          "OSHA requires forklift operator evaluation at least once every three years as a baseline. This is framed as a performance evaluation rather than purely a classroom refresher, meaning it typically involves observing the operator's actual handling of the equipment, not just retaking a written test."
        ]
      },
      {
        heading: "What can trigger an earlier retrain",
        paragraphs: ["Beyond the standard three-year cycle, certain events require retraining regardless of when the last evaluation happened:"],
        list: [
          "The operator was seen operating the vehicle unsafely",
          "The operator was involved in an accident or near-miss",
          "The operator is assigned to a different type of truck than they were originally trained/certified on",
          "A workplace condition changes in a way that could affect safe operation"
        ]
      },
      {
        heading: "Why site supervisors need to track more than the 3-year date",
        paragraphs: [
          "A site supervisor tracking forklift certifications across a crew who only tracks the three-year calendar cycle is missing half the requirement — the event-based triggers apply regardless of where an operator is in their cycle, and ignoring them is a real compliance gap even if the calendar date says 'still valid.'"
        ]
      }
    ],
    faqs: [
      {
        q: "Does forklift certification transfer between different types of forklifts?",
        a: "Not automatically — OSHA's requirement is specific to the type of powered industrial truck an operator was trained and evaluated on. Moving to a different truck type (a different class of forklift, for example) typically requires additional training specific to that equipment."
      },
      {
        q: "Is forklift certification the same across the US and Canada?",
        a: "The general framework is similar, but the specific regulatory body and requirements differ — OSHA governs the US requirement, while Canadian provinces set their own equivalent requirements, which can vary province to province."
      }
    ],
    ctaHeadline: "Track both the 3-year cycle and event-based retrains",
    ctaBody: "CredPulse tracks each operator's actual evaluation date so a site supervisor can see who's covered before assigning equipment.",
    ctaLinkPath: "/industries/construction",
    ctaLinkLabel: "See it for construction crews"
  },

  "crane-operator-certification-renewal": {
    slug: "crane-operator-certification-renewal",
    vertical: "construction",
    category: "CONSTRUCTION SAFETY",
    title: "Crane Operator Certification (NCCCO) Renewal: What's Involved",
    description:
      "How often crane operator certification needs renewing through NCCCO, what the renewal exam involves, and why the long cycle deserves early planning.",
    excerpt: "NCCCO certification runs on one of the longest cycles in construction — which is exactly why it's easy to leave renewal too late.",
    publishedDate: "2026-09-08",
    updatedDate: "2026-09-08",
    intro: [
      "Crane operator certification through NCCCO (National Commission for the Certification of Crane Operators) is widely required for operating cranes on construction sites in the US, and recognized as a strong standard in Canada as well. It runs on one of the longer renewal cycles among construction certifications, which makes early planning more important than for a shorter-cycle credential.",
      "This guide covers how often renewal is required and what the process typically involves."
    ],
    sections: [
      {
        heading: "How often does NCCCO certification need renewing?",
        paragraphs: [
          "NCCCO crane operator certification is valid for five years from the date of certification. Renewal requires passing a recertification exam before the current certification expires — there isn't a shortened renewal-only format the way some shorter-cycle certifications offer."
        ]
      },
      {
        heading: "Why the recertification exam requires real preparation",
        paragraphs: [
          "Unlike a certification that renews via a brief refresher course, NCCCO recertification is a genuine exam that requires preparation, not just attendance — waiting until close to the expiry date to start studying is a common and avoidable mistake given how much lead time a five-year cycle actually provides if planned for early."
        ]
      },
      {
        heading: "What happens if it lapses",
        paragraphs: [
          "If NCCCO certification lapses before recertification, an operator generally can't be certified to operate covered equipment until requirements are met again — and depending on how long the lapse goes on, this may require retaking the full initial certification process rather than a recertification exam alone."
        ]
      }
    ],
    faqs: [
      {
        q: "Is NCCCO certification legally required, or is it a voluntary standard?",
        a: "OSHA requires crane operator certification for covered equipment, and NCCCO is one of the accepted certification bodies that satisfies this requirement — though the specific legal requirement and accepted certifying bodies can vary by jurisdiction and equipment type."
      },
      {
        q: "Does NCCCO certification cover every type of crane?",
        a: "No — NCCCO issues certifications by specific crane type/configuration (such as mobile crane, tower crane, overhead crane), and operating a different type than you're certified for typically requires a separate certification for that equipment."
      }
    ],
    ctaHeadline: "Start tracking toward a 5-year deadline now, not later",
    ctaBody: "CredPulse tracks each operator's NCCCO expiry date and reminds you with enough lead time to actually prepare for the recertification exam.",
    ctaLinkPath: "/industries/construction",
    ctaLinkLabel: "See it for construction crews"
  },

  "food-handler-certification-renewal": {
    slug: "food-handler-certification-renewal",
    vertical: "education",
    category: "FOOD SAFETY",
    title: "Food Handler Certification Renewal: How Often and Where It's Required",
    description:
      "How often food handler certification needs renewing, why the requirement varies significantly by region, and how school boards and other employers track it across staff.",
    excerpt: "Food handler certification renewal varies more by region than almost any other credential — here's why.",
    publishedDate: "2026-09-08",
    updatedDate: "2026-09-08",
    intro: [
      "Food handler certification is required for staff who prepare or serve food in settings from school cafeterias to restaurants — but the specific renewal interval and even whether it's required at all varies significantly by state, province, and sometimes municipality, making this one of the more regionally inconsistent certifications to track.",
      "This guide covers the typical range of renewal requirements and how organizations with staff across multiple roles (like school boards) track it consistently anyway."
    ],
    sections: [
      {
        heading: "How often does food handler certification need renewing?",
        paragraphs: [
          "Renewal intervals commonly range from two to five years depending on the issuing jurisdiction, with some regions requiring renewal specifically tied to a local health department's own program rather than a nationally recognized standard. This wide range is exactly why assuming a single 'standard' renewal period is unreliable — checking your specific local health authority's requirement matters more here than for most certifications."
        ]
      },
      {
        heading: "Why school boards face a more complex version of this",
        paragraphs: [
          "A school board with cafeteria staff across multiple schools, potentially in different municipalities or even provinces/states, can face genuinely different renewal requirements for different staff members depending on where they're physically located — which makes a single blanket assumption about renewal timing actively wrong for at least some of the roster."
        ]
      },
      {
        heading: "What to track instead of a single assumed interval",
        paragraphs: [
          "The reliable approach is tracking each staff member's actual certification issue date and their specific jurisdiction's requirement, rather than applying one interval board-wide — the same principle as WHMIS or infection control training, where the actual rule varies enough that a blanket assumption creates real gaps."
        ]
      }
    ],
    faqs: [
      {
        q: "Is food handler certification required for all school cafeteria staff?",
        a: "In most jurisdictions, yes, for anyone directly involved in food preparation or service, though the exact requirement and any role-based exceptions vary locally. Check your specific state/provincial and municipal health authority's requirement."
      },
      {
        q: "Does food handler certification transfer if staff move between school boards or municipalities?",
        a: "Not always — since requirements are often set at the state/provincial or municipal level, a certification valid in one jurisdiction may not automatically satisfy the requirement in another. Confirm the new location's specific requirement rather than assuming portability."
      }
    ],
    ctaHeadline: "Track food handler certification per person, not per assumption",
    ctaBody: "CredPulse tracks each staff member's actual certification date, so a board with staff across multiple jurisdictions doesn't rely on one blanket assumption.",
    ctaLinkPath: "/industries/education",
    ctaLinkLabel: "See it for school boards"
  },

  "mental-health-first-aid-renewal": {
    slug: "mental-health-first-aid-renewal",
    vertical: "education",
    category: "SCHOOL BOARD COMPLIANCE",
    title: "Does Mental Health First Aid Certification Expire?",
    description:
      "Whether Mental Health First Aid certification has a fixed expiry date, why the answer is often 'it depends on your employer,' and how to track it anyway.",
    excerpt: "Mental Health First Aid often doesn't have a hard expiry date — which creates its own tracking problem.",
    publishedDate: "2026-09-08",
    updatedDate: "2026-09-08",
    intro: [
      "Mental Health First Aid (MHFA) training, increasingly common for school staff and other roles that interact with the public, doesn't come with the same clear hard-expiry structure that BLS or Working at Heights does — which raises a genuinely different question than most certifications on this list: does it expire at all?",
      "This guide covers why the answer is usually 'it depends on your employer or board policy' and what that means for tracking it."
    ],
    sections: [
      {
        heading: "Does Mental Health First Aid certification expire?",
        paragraphs: [
          "In most regions, MHFA certification doesn't carry a fixed, universally mandated expiry date the way a resuscitation certification does — the original certifying bodies generally frame it as a completed course rather than a credential requiring periodic recertification.",
          "That said, many employers and school boards set their own internal refresh policy anyway (commonly every few years), treating it similarly to WHMIS or infection control training — driven by internal policy rather than an external mandate."
        ]
      },
      {
        heading: "Why 'no fixed expiry' still creates a tracking problem",
        paragraphs: [
          "A credential with no external expiry date can feel like something that doesn't need tracking at all — but if your employer has its own refresh policy, that internal requirement is just as real as an external one, and it's arguably easier to lose track of precisely because there's no universally recognized 'this expires' date reinforcing it from outside."
        ]
      },
      {
        heading: "What to actually track",
        paragraphs: [
          "Check whether your specific school board or employer has an internal MHFA refresh policy — if they do, track your completion date against that internal cadence the same way you would any other employer-driven requirement, rather than assuming 'no official expiry' means 'nothing to track.'"
        ]
      }
    ],
    faqs: [
      {
        q: "Is Mental Health First Aid legally required for school staff?",
        a: "Requirements vary — some school boards mandate it for certain roles as part of their own policy, while it remains optional or role-specific elsewhere. Check your specific board's policy rather than assuming it's universally required or universally optional."
      },
      {
        q: "If there's no official expiry, why would CredPulse track it as a certification?",
        a: "Because plenty of employers set their own internal refresh policy even when the certifying body doesn't require one — and an internally-required refresh you forget about is just as much a compliance gap as an externally-mandated one that lapses."
      }
    ],
    ctaHeadline: "Track it even without an official expiry date",
    ctaBody: "CredPulse lets you set your own reminder schedule for any certification — including ones without a hard external expiry, based on your employer's actual policy.",
    ctaLinkPath: "/industries/education",
    ctaLinkLabel: "See it for school boards"
  },

  "firearms-qualification-frequency": {
    slug: "firearms-qualification-frequency",
    vertical: "policing",
    category: "PUBLIC SAFETY REQUALIFICATION",
    title: "How Often Do Police Officers Need to Requalify with Firearms?",
    description:
      "How often firearms qualification is required for police officers, how it differs from broader use-of-force recertification, and how training coordinators track it.",
    excerpt: "Firearms qualification often runs on a tighter, separate schedule from the broader use-of-force recertification cycle.",
    publishedDate: "2026-09-08",
    updatedDate: "2026-09-08",
    intro: [
      "Firearms qualification is a specific, range-based proficiency requirement for police officers — related to, but distinct from, the broader use-of-force recertification most services also require. Many departments require it more frequently than the annual use-of-force cycle, which means it's often a second date to track rather than the same one.",
      "This guide covers how often firearms qualification is typically required and why treating it as identical to use-of-force recertification is a common tracking mistake."
    ],
    sections: [
      {
        heading: "How often is firearms qualification required?",
        paragraphs: [
          "Many departments require firearms qualification at least once, and often twice, per year — more frequently than the broader annual use-of-force recertification cycle many services also follow. The specific cadence is typically set by department policy on top of whatever minimum a provincial/state policing standards body requires."
        ]
      },
      {
        heading: "How it differs from use-of-force recertification",
        paragraphs: [
          "Firearms qualification is specifically a range-based proficiency test — hitting required accuracy standards under specified conditions — while use-of-force recertification is typically broader, covering judgment, de-escalation, and policy alongside physical proficiency. An officer can be current on one and due on the other, since they don't necessarily share a renewal date even when required by the same department."
        ]
      },
      {
        heading: "Why training coordinators need to track both separately",
        paragraphs: [
          "For a training coordinator managing a whole unit, treating 'requalification' as a single combined status risks missing the more frequent firearms qualification cycle while focused on the annual use-of-force date. Tracking each officer's actual firearms qualification date independently from their use-of-force date is what actually catches both on time."
        ]
      }
    ],
    faqs: [
      {
        q: "Can an officer be deployed if firearms qualification has lapsed but use-of-force recertification is current?",
        a: "Generally no for duties requiring a firearm — a lapsed firearms qualification is typically treated as its own deployment restriction regardless of the status of broader use-of-force recertification, since it's a distinct proficiency requirement."
      },
      {
        q: "Who sets the firearms qualification frequency — the department or a provincial/state body?",
        a: "Usually both: a provincial or state policing standards body sets a minimum, and individual departments can require more frequent qualification on top of that minimum. The department's actual policy is what matters day-to-day."
      }
    ],
    ctaHeadline: "Track firearms qualification separately from use-of-force recert",
    ctaBody: "CredPulse tracks each officer's actual requalification dates independently, so a more frequent firearms cycle doesn't get lost behind the annual use-of-force date.",
    ctaLinkPath: "/industries/policing",
    ctaLinkLabel: "See it for police services"
  },

  "crisis-intervention-training-renewal": {
    slug: "crisis-intervention-training-renewal",
    vertical: "policing",
    category: "PUBLIC SAFETY REQUALIFICATION",
    title: "Crisis Intervention Training (CIT) Renewal: How Often Is It Required?",
    description:
      "How often Crisis Intervention Training needs to be refreshed for police officers and support staff, and how it fits alongside other requalification requirements.",
    excerpt: "CIT refresher requirements vary by department — here's the common pattern and what to track.",
    publishedDate: "2026-09-08",
    updatedDate: "2026-09-08",
    intro: [
      "Crisis Intervention Training (CIT) equips officers and support staff to de-escalate encounters involving mental health crises — an increasingly emphasized part of police training. Like use-of-force recertification, it's commonly refreshed on a recurring cycle, though the specific interval is more department-policy-driven than a single fixed national standard.",
      "This guide covers the common refresh pattern and how CIT fits alongside an officer's other requalification requirements."
    ],
    sections: [
      {
        heading: "How often does CIT need to be refreshed?",
        paragraphs: [
          "Many departments require an annual CIT refresher, similar in cadence to broader use-of-force recertification, though the specific requirement and depth of the refresher vary by department policy — some treat it as a lighter annual touchpoint, others as a more substantial periodic recertification."
        ]
      },
      {
        heading: "Who typically needs CIT beyond patrol officers",
        paragraphs: [
          "CIT is increasingly required not just for frontline patrol officers but also for dispatch and support staff who may be the first point of contact in a crisis call — meaning a training coordinator's tracking responsibility often extends beyond sworn officers to a broader set of roles within the service."
        ]
      },
      {
        heading: "Tracking CIT alongside other requalifications",
        paragraphs: [
          "For a training coordinator managing multiple requalification requirements per officer (use-of-force, firearms, CIT), the same principle applies as elsewhere on this site: track each requirement's actual date independently rather than assuming they're synced, since they're commonly set by different policies with different cadences even within the same department."
        ]
      }
    ],
    faqs: [
      {
        q: "Is CIT the same across every police service?",
        a: "The core concept is broadly similar, but specific curricula, refresh cadence, and which roles are required to complete it vary by department and by provincial/state training standards. Check your specific service's policy."
      },
      {
        q: "Does CIT count toward use-of-force recertification requirements?",
        a: "It depends on the department — some incorporate CIT content into their broader use-of-force recertification, while others treat it as a fully separate requirement with its own schedule. Confirm how your specific department structures the two."
      }
    ],
    ctaHeadline: "Track CIT alongside every other requalification, separately",
    ctaBody: "CredPulse tracks each officer's CIT, use-of-force, and firearms qualification dates independently — no assuming they're on the same schedule.",
    ctaLinkPath: "/industries/policing",
    ctaLinkLabel: "See it for police services"
  }
} satisfies Record<string, Guide>);

export const GUIDE_LIST: Guide[] = Object.values(GUIDES);
