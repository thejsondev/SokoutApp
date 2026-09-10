"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { ConfirmDoneModal, sendTicketRespond } from "@/components/tickets/HausmeisterHeaderActions";
import type { ApiTicket } from "@/lib/types";

type Action = "appointment" | "refer" | "qa" | "done";

const ACTIONS: { id: Action; label: string; hint: string }[] = [
  { id: "appointment", label: "Termin vergeben", hint: "Problem annehmen und einen Termin setzen" },
  { id: "refer", label: "An HV weiterleiten", hint: "Passt nicht zum Hausmeister, E-Mail an die Hausverwaltung" },
  { id: "qa", label: "Rückfrage stellen", hint: "Ticket wird zum Chat mit den Bewohnern" },
  { id: "done", label: "Als erledigt markieren", hint: "Anfrage abschließen" },
];

export function HausmeisterRespond({
  ticket,
  onUpdated,
}: {
  ticket: ApiTicket;
  onUpdated: (ticket: ApiTicket) => void;
}) {
  const [action, setAction] = useState<Action | null>(null);
  const [confirmDone, setConfirmDone] = useState(false);
  const [body, setBody] = useState("");
  const [appointmentAt, setAppointmentAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const hasHv = Boolean(ticket.project?.hausverwaltung);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!action || action === "done") return;

    setPending(true);
    setError(null);
    try {
      const payload: Record<string, string> = { action };
      if (action === "appointment") {
        payload.appointment_at = new Date(appointmentAt).toISOString();
      }
      if (body.trim()) payload.body = body.trim();
      if (action === "refer" || action === "qa") payload.body = body.trim();

      onUpdated(await sendTicketRespond(ticket.id, payload));
    } catch (err) {
      setError(err instanceof ApiError ? err.firstError() : "Antwort konnte nicht gesendet werden.");
    } finally {
      setPending(false);
    }
  }

  if (!action) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Bitte wählen</p>
        {ACTIONS.map((item) => {
          const disabled = item.id === "refer" && !hasHv;
          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (item.id === "done") {
                  setConfirmDone(true);
                  setError(null);
                  return;
                }
                setAction(item.id);
                setError(null);
                setBody("");
              }}
              className="w-full rounded-[24px] border border-neutral-100 bg-white px-4 py-3 text-left dark:border-neutral-800 dark:bg-neutral-900 disabled:opacity-50"
            >
              <p className="text-sm font-medium text-neutral-900 dark:text-white">{item.label}</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {disabled ? "Dieses Projekt hat keine Hausverwaltung." : item.hint}
              </p>
            </button>
          );
        })}
        {confirmDone && (
          <ConfirmDoneModal
            ticketId={ticket.id}
            onUpdated={onUpdated}
            onClose={() => setConfirmDone(false)}
          />
        )}
      </div>
    );
  }

  const current = ACTIONS.find((item) => item.id === action);

  return (
    <form onSubmit={submit} className="rounded-[24px] border border-neutral-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-neutral-900 dark:text-white">{current?.label}</p>
        <button
          type="button"
          onClick={() => setAction(null)}
          className="text-xs text-neutral-500"
        >
          Zurück
        </button>
      </div>
      {error && (
        <p className="mb-3 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </p>
      )}
      {action === "appointment" && (
        <label className="mb-3 block text-xs font-medium text-neutral-500">
          Termin
          <input
            type="datetime-local"
            required
            value={appointmentAt}
            onChange={(event) => setAppointmentAt(event.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#3CB346] dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
          />
        </label>
      )}
      <textarea
        required={action === "refer" || action === "qa"}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={action === "appointment" ? 3 : 5}
        placeholder={
          action === "refer"
            ? "Text für die E-Mail an die Hausverwaltung"
            : action === "qa"
              ? "Deine Frage an die Bewohner"
              : "Optionale Nachricht"
        }
        className="w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#3CB346] dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
      />
      <button
        type="submit"
        disabled={
          pending ||
          (action === "appointment" && !appointmentAt) ||
          ((action === "refer" || action === "qa") && !body.trim())
        }
        className="mt-3 w-full rounded-full bg-[#3CB346] py-3 font-medium text-white disabled:opacity-60"
      >
        {pending ? "Senden..." : "Senden"}
      </button>
    </form>
  );
}
