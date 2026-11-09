const pad = (n: number) => String(n).padStart(2, "0");
const stamp = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

/** Download a weekly-repeating .ics invite for the Sunday group call. */
export function downloadCallInvite(first: Date, minutes = 60) {
  const end = new Date(first.getTime() + minutes * 60_000);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FORGE//Member app//EN",
    "BEGIN:VEVENT",
    `UID:forge-weekly-call-${first.getTime()}@forge`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(first)}`,
    `DTEND:${stamp(end)}`,
    "RRULE:FREQ=WEEKLY;BYDAY=SU",
    "SUMMARY:FORGE weekly group call",
    "DESCRIPTION:Sunday reflection\\, all journeys together.",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "forge-weekly-call.ics";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
