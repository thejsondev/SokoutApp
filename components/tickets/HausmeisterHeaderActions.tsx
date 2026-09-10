"use client";

import { useState, type ReactNode } from "react";
import { CalendarClock, CircleCheck, Forward, type LucideIcon } from "lucide-react";
import { api, ApiError, unwrapData } from "@/lib/api";
import type { ApiTicket } from "@/lib/types";

export type RespondAction = "appointment" | "refer" | "qa" | "done";

export async function sendTicketRespond(
  ticketId: number,
  payload: Record<string, string>,
): Promise<ApiTicket> {
  const updated = await api<{ data: ApiTicket }>(`/tickets/${ticketId}/respond`, {
    method: "POST",
    body: payload,
  });
  return unwrapData(updated);
}

export function HausmeisterHeaderActions({
  ticket,
  onUpdated,
}: {
  ticket: ApiTicket;
  onUpdated: (ticket: ApiTicket) => void;
}) {
  const [modal, setModal] = useState<"appointment" | "refer" | "done" | null>(null);
  const inChat = ticket.status === "qa";
  const afterTermin = ticket.status === "awaiting_appointment";

  if (!inChat && !afterTermin) return null;

  return (
    <>
      <div className="flex shrink-0 items-start gap-1.5">
        {inChat && (
          <>
            <HeaderIconButton
              icon={CalendarClock}
              label="Termin"
              onClick={() => setModal("appointment")}
            />
            <HeaderIconButton
              icon={Forward}
              label="Weiterleiten"
              disabled={!ticket.project?.hausverwaltung}
              onClick={() => setModal("refer")}
            />
          </>
        )}
        <HeaderIconButton
          icon={CircleCheck}
          label="Erledigt"
          accent
          onClick={() => setModal("done")}
        />
      </div>

      {modal === "done" && (
        <ConfirmDoneModal
          ticketId={ticket.id}
          onUpdated={onUpdated}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "appointment" && (
        <AppointmentActionModal
          ticketId={ticket.id}
          onUpdated={onUpdated}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "refer" && (
        <ReferActionModal
          ticketId={ticket.id}
          onUpdated={onUpdated}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

function HeaderIconButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex w-[4.35rem] flex-col items-center gap-1 disabled:opacity-40"
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-full ${
          accent
            ? "bg-[#3CB346] text-white"
            : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-center text-[10px] font-medium leading-tight text-neutral-500">
        {label}
      </span>
    </button>
  );
}

export function ConfirmDoneModal({
  ticketId,
  onUpdated,
  onClose,
}: {
  ticketId: number;
  onUpdated: (ticket: ApiTicket) => void;
  onClose: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      onUpdated(await sendTicketRespond(ticketId, { action: "done" }));
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.firstError() : "Ticket konnte nicht geschlossen werden.");
    } finally {
      setPending(false);
    }
  }

  return (
    <ActionModal onClose={pending ? undefined : onClose}>
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Ticket schließen?</h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">
        Mit dieser Aktion wird das Ticket geschlossen. Bist du sicher, dass alle Arbeiten erledigt
        sind?
      </p>
      {error && (
        <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={onClose}
          className="flex-1 rounded-full bg-neutral-100 py-3 text-sm font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
        >
          Abbrechen
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => void confirm()}
          className="flex-1 rounded-full bg-[#3CB346] py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Schließen..." : "Ja, schließen"}
        </button>
      </div>
    </ActionModal>
  );
}

function AppointmentActionModal({
  ticketId,
  onUpdated,
  onClose,
}: {
  ticketId: number;
  onUpdated: (ticket: ApiTicket) => void;
  onClose: () => void;
}) {
  const [appointmentAt, setAppointmentAt] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const payload: Record<string, string> = {
        action: "appointment",
        appointment_at: new Date(appointmentAt).toISOString(),
      };
      if (body.trim()) payload.body = body.trim();
      onUpdated(await sendTicketRespond(ticketId, payload));
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.firstError() : "Termin konnte nicht gesetzt werden.");
    } finally {
      setPending(false);
    }
  }

  return (
    <ActionModal onClose={pending ? undefined : onClose}>
      <form onSubmit={submit}>
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Termin vergeben</h2>
        {error && (
          <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </p>
        )}
        <label className="mt-4 block text-xs font-medium text-neutral-500">
          Termin
          <input
            type="datetime-local"
            required
            value={appointmentAt}
            onChange={(event) => setAppointmentAt(event.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#3CB346] dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
          />
        </label>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={3}
          placeholder="Optionale Nachricht"
          className="mt-3 w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#3CB346] dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
        />
        <button
          type="submit"
          disabled={pending || !appointmentAt}
          className="mt-4 w-full rounded-full bg-[#3CB346] py-3 font-medium text-white disabled:opacity-60"
        >
          {pending ? "Senden..." : "Senden"}
        </button>
      </form>
    </ActionModal>
  );
}

function ReferActionModal({
  ticketId,
  onUpdated,
  onClose,
}: {
  ticketId: number;
  onUpdated: (ticket: ApiTicket) => void;
  onClose: () => void;
}) {
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      onUpdated(await sendTicketRespond(ticketId, { action: "refer", body: body.trim() }));
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.firstError() : "Weiterleitung fehlgeschlagen.");
    } finally {
      setPending(false);
    }
  }

  return (
    <ActionModal onClose={pending ? undefined : onClose}>
      <form onSubmit={submit}>
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">An HV weiterleiten</h2>
        {error && (
          <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </p>
        )}
        <textarea
          required
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={5}
          placeholder="Text für die E-Mail an die Hausverwaltung"
          className="mt-4 w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#3CB346] dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
        />
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="mt-4 w-full rounded-full bg-[#3CB346] py-3 font-medium text-white disabled:opacity-60"
        >
          {pending ? "Senden..." : "Senden"}
        </button>
      </form>
    </ActionModal>
  );
}

function ActionModal({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 md:items-center">
      <button
        type="button"
        aria-label="Schließen"
        className="absolute inset-0"
        onClick={onClose}
        disabled={!onClose}
      />
      <div className="relative w-full max-w-md rounded-[32px] bg-white p-6 shadow-2xl dark:bg-neutral-900">
        {children}
      </div>
    </div>
  );
}
