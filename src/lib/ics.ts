import { Certificate } from "./types";

/** Escapes the characters RFC 5545 requires escaping inside TEXT properties
 * (SUMMARY, DESCRIPTION, etc.) — backslashes, commas, semicolons, and
 * newlines. Order matters: backslashes must be escaped first, or the
 * backslashes just added for the other characters would get re-escaped. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
}

/** RFC 5545 asks that lines longer than 75 octets be "folded" by inserting
 * a CRLF followed by a space before the 76th octet, repeated as needed.
 * Most calendar apps tolerate long lines fine, but folding costs nothing
 * and keeps the file spec-correct for stricter importers (some corporate
 * Outlook/Exchange setups included). */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  let result = line.slice(0, 75);
  let rest = line.slice(75);
  while (rest.length > 0) {
    result += "\r\n " + rest.slice(0, 74);
    rest = rest.slice(74);
  }
  return result;
}

function toICSDate(isoDate: string): string {
  return isoDate.replace(/-/g, "");
}

function addOneDay(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00");
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function utcStamp(): string {
  return new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/** Builds the lines for one VEVENT block (no VCALENDAR wrapper) — an
 * all-day event on the certificate's expiry date, with a reminder VALARM
 * for each of the given reminder-days-before-expiry. Shared by
 * buildCertificateICS (one cert, one file) and buildCombinedICS (every
 * cert, one file) so both stay in sync. */
function buildVEventLines(cert: Certificate, reminderDays: number[]): string[] {
  const dtStart = toICSDate(cert.expiryDate);
  const dtEnd = toICSDate(addOneDay(cert.expiryDate));
  const summary = escapeText(`Renew: ${cert.name}`);
  const descriptionParts = [
    cert.issuer ? `Issued by ${cert.issuer}.` : "",
    "Tracked in CredPulse — https://credpulse.app"
  ].filter(Boolean);
  const description = escapeText(descriptionParts.join("\n"));

  const alarms = [...new Set(reminderDays)]
    .filter((d) => d > 0)
    .sort((a, b) => a - b)
    .map((days) =>
      [
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        foldLine(`DESCRIPTION:${escapeText(`${cert.name} expires soon — renew before it lapses.`)}`),
        `TRIGGER:-P${days}D`,
        "END:VALARM"
      ].join("\r\n")
    );

  return [
    "BEGIN:VEVENT",
    `UID:${cert.id}@credpulse.app`,
    `DTSTAMP:${utcStamp()}`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    foldLine(`SUMMARY:${summary}`),
    foldLine(`DESCRIPTION:${description}`),
    ...alarms,
    "END:VEVENT"
  ];
}

/**
 * Builds a .ics calendar file for a single certificate's renewal — an
 * all-day event on the expiry date itself, with a reminder alarm for each
 * of the user's configured reminder-days-before-expiry (see
 * profile.reminderDays, the same numbers the email/push reminders use, so
 * "add to calendar" nudges on the same schedule someone already expects).
 * Uses the certificate's own id as the UID so re-downloading/re-importing
 * updates the same calendar event instead of creating a duplicate.
 */
export function buildCertificateICS(cert: Certificate, reminderDays: number[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CredPulse//Certificate Reminder//EN",
    "CALSCALE:GREGORIAN",
    ...buildVEventLines(cert, reminderDays),
    "END:VCALENDAR"
  ];
  return lines.join("\r\n") + "\r\n";
}

/**
 * Builds one .ics file containing every certificate's renewal event at
 * once — used by the "Download all as calendar" action on the Notifications
 * page, for someone who'd rather import their whole list in one go instead
 * of one file per certificate.
 */
export function buildCombinedICS(certs: Certificate[], reminderDays: number[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CredPulse//Certificate Reminder//EN",
    "CALSCALE:GREGORIAN",
    ...certs.flatMap((cert) => buildVEventLines(cert, reminderDays)),
    "END:VCALENDAR"
  ];
  return lines.join("\r\n") + "\r\n";
}

/** Triggers a browser download of the given .ics content — no server round
 * trip needed, it's just a Blob + a throwaway <a download> click. */
export function downloadICS(filename: string, icsContent: string): void {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
