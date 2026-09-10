"use client";

import { CalendarPlus, CircleCheck, MapPin } from "lucide-react";
import {
  appointmentNoteFromBody,
  downloadAppointmentIcs,
} from "@/lib/calendar";
import type { ApiTicket, ApiTicketMessage } from "@/lib/types";

export function AppointmentMessageCard({
  ticket,
  message,
}: {
  ticket: ApiTicket;
  message: ApiTicketMessage;
}) {
  const start = ticket.appointment_at ? new Date(ticket.appointment_at) : null;
  const note = appointmentNoteFromBody(message.body);
  const location = ticket.project?.address ?? "";
  const title = ticket.project?.title
    ? `Hausmeistertermin · ${ticket.project.title}`
    : "Hausmeistertermin";

  function addToCalendar() {
    if (!start) return;
    downloadAppointmentIcs({
      start,
      title,
      description: note || "Der Hausmeister kommt vorbei und kümmert sich um dein Anliegen.",
      location,
      uid: `sokout-ticket-${ticket.id}@sokout.app`,
    });
  }

  return (
    <article className="rounded-[28px] bg-neutral-50 px-5 py-5 dark:bg-neutral-900">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#3CB346] text-white">
          <CircleCheck className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="text-base font-semibold text-neutral-900 dark:text-white">Termin bestätigt</p>
          <p className="mt-0.5 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            Dein Anliegen ist angenommen — wir kommen vorbei und kümmern uns darum.
          </p>
        </div>
      </div>

      {start && (
        <div className="mt-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
            Wann
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
            {start.toLocaleDateString("de-DE", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <p className="mt-0.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {start.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
          </p>
          {ticket.project && (
            <p className="mt-2 flex items-start gap-1.5 text-sm text-neutral-500">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {ticket.project.title}
                {location ? ` · ${location}` : ""}
              </span>
            </p>
          )}
        </div>
      )}

      {note && (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          {note}
        </p>
      )}

      <button
        type="button"
        onClick={addToCalendar}
        disabled={!start}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#3CB346] py-3 text-sm font-medium text-white disabled:opacity-50"
      >
        <CalendarPlus className="h-4 w-4" />
        Zum Kalender hinzufügen
      </button>
    </article>
  );
}
