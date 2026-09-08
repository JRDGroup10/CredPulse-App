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

export const GUIDE_LIST: Guide[] = Object.values(GUIDES);
