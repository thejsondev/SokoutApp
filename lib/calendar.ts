function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toIcsUtc(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

function escapeIcs(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll("\n", "\\n");
}

export function downloadAppointmentIcs({
  start,
  title,
  description,
  location,
  uid,
}: {
  start: Date;
  title: string;
  description: string;
  location: string;
  uid: string;
}): void {
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sokout//Termin//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${escapeIcs(title)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    `LOCATION:${escapeIcs(location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "sokout-termin.ics";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function isAppointmentMessage(body: string, kind?: string): boolean {
  return kind === "appointment" || body.startsWith("Termin vereinbart:");
}

export function appointmentNoteFromBody(body: string): string {
  if (!body.startsWith("Termin vereinbart:")) return body.trim();
  const index = body.indexOf("\n\n");
  return index === -1 ? "" : body.slice(index + 2).trim();
}

export function isDoneMessage(body: string, kind?: string): boolean {
  return kind === "done" || body === "Als erledigt markiert.";
}
