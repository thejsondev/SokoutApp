"use client";

import { ArrowLeft, CircleCheck, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { HausmeisterHeaderActions } from "@/components/tickets/HausmeisterHeaderActions";
import { HausmeisterRespond } from "@/components/tickets/HausmeisterRespond";
import { PhotoPicker } from "@/components/tickets/PhotoPicker";
import { TicketFileGallery } from "@/components/tickets/TicketFileGallery";
import { AppointmentMessageCard } from "@/components/tickets/AppointmentMessageCard";
import { TicketRatingForm } from "@/components/tickets/TicketRatingForm";
import { TicketDetailSkeleton } from "@/components/ui/skeletons";
import { useAuth } from "@/components/providers/AuthProvider";
import { api, apiForm, ApiError, unwrapData } from "@/lib/api";
import { isAppointmentMessage, isDoneMessage } from "@/lib/calendar";
import { isHausmeister, ROLE_LABELS } from "@/lib/roles";
import { TICKET_STATUS } from "@/lib/tickets";
import type { ApiTicket, ApiTicketMessage } from "@/lib/types";

function ticketFingerprint(ticket: ApiTicket | null): string {
  if (!ticket) return "";
  const messages = ticket.messages ?? [];
  return [ticket.status, ticket.appointment_at ?? "", ...messages.map((message) => message.id)].join(":");
}

export function TicketDetail({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<ApiTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);
  sendingRef.current = sending;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void api<{ data: ApiTicket }>(`/tickets/${id}`)
      .then((payload) => {
        if (!cancelled) setTicket(unwrapData(payload));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.firstError() : "Ticket nicht gefunden.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const refresh = async () => {
      if (cancelled || sendingRef.current) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;

      try {
        const payload = await api<{ data: ApiTicket }>(`/tickets/${id}`);
        if (cancelled) return;
        const next = unwrapData(payload);
        setTicket((current) => (ticketFingerprint(current) === ticketFingerprint(next) ? current : next));
      } catch {
        // Keep the open thread if a background refresh fails.
      }
    };

    const timer = window.setInterval(() => {
      void refresh();
    }, 2000);

    document.addEventListener("visibilitychange", refresh);

    const onPush = (event: MessageEvent) => {
      if (event.data?.type === "sokout-push") void refresh();
    };
    navigator.serviceWorker?.addEventListener("message", onPush);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      navigator.serviceWorker?.removeEventListener("message", onPush);
    };
  }, [id]);

  useEffect(() => {
    const node = threadRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [ticket?.messages?.length]);

  if (loading || !user) return <TicketDetailSkeleton />;

  if (!ticket) {
    return (
      <div>
        <button type="button" onClick={() => router.back()} className="text-sm text-neutral-500">
          Zurück
        </button>
        <p className="mt-4 text-sm text-red-600">{error ?? "Ticket nicht gefunden."}</p>
      </div>
    );
  }

  const status = TICKET_STATUS[ticket.status] ?? TICKET_STATUS.open;
  const hm = isHausmeister(user.role);
  const canChat = ticket.status === "qa";
  const canSend = Boolean(body.trim() || photos.length);
  const ticketId = ticket.id;
  const doneNote = (ticket.messages ?? []).find((message) => isDoneMessage(message.body, message.kind));
  const doneNoteText =
    doneNote && doneNote.body && doneNote.body !== "Als erledigt markiert." ? doneNote.body : "";

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!canChat || !canSend) return;

    setSending(true);
    setError(null);
    try {
      const form = new FormData();
      if (body.trim()) form.append("body", body.trim());
      photos.forEach((file) => form.append("files[]", file));
      const created = await apiForm<{ data: ApiTicketMessage }>(`/tickets/${ticketId}/messages`, form);
      const message = unwrapData(created);
      setTicket((current) =>
        current
          ? { ...current, messages: [...(current.messages ?? []), message] }
          : current,
      );
      setBody("");
      setPhotos([]);
    } catch (err) {
      setError(err instanceof ApiError ? err.firstError() : "Nachricht konnte nicht gesendet werden.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-start gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-0.5 rounded-full bg-neutral-100 p-2 dark:bg-neutral-800"
          aria-label="Zurück"
        >
          <ArrowLeft className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-neutral-900 dark:text-white">
                {ticket.project?.title ?? "Ticket"}
              </h1>
              <p className="mt-0.5 text-xs text-neutral-500">
                {ticket.user
                  ? `${ticket.user.first_name} ${ticket.user.last_name}`
                  : "Anfrage"}
                {" · "}
                {new Date(ticket.created_at).toLocaleDateString("de-DE")}
              </p>
              <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${status.className}`}>
                {status.label}
              </span>
            </div>
            {hm && <HausmeisterHeaderActions ticket={ticket} onUpdated={setTicket} />}
          </div>
        </div>
      </div>

      {ticket.status === "referred" && (
        <p className="mt-3 shrink-0 rounded-[20px] bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          An die Hausverwaltung
          {ticket.project?.hausverwaltung
            ? ` (${ticket.project.hausverwaltung.first_name} ${ticket.project.hausverwaltung.last_name})`
            : ""}{" "}
          weitergeleitet.
        </p>
      )}

      <div ref={threadRef} className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pb-2">
        {(ticket.messages ?? []).map((message) => {
          if (isDoneMessage(message.body, message.kind)) return null;

          if (isAppointmentMessage(message.body, message.kind)) {
            return (
              <AppointmentMessageCard key={message.id} ticket={ticket} message={message} />
            );
          }

          const mine = message.user?.id === user.id;
          const name = message.user
            ? `${message.user.first_name} ${message.user.last_name}`
            : "Unbekannt";
          const roleLabel = message.user ? ROLE_LABELS[message.user.role] : null;

          return (
            <article
              key={message.id}
              className={`max-w-[90%] rounded-[24px] px-4 py-3 ${
                mine
                  ? "ml-auto bg-[#3CB346] text-white"
                  : "bg-neutral-100 text-neutral-900 dark:bg-neutral-900 dark:text-white"
              }`}
            >
              <p className={`text-[11px] font-medium ${mine ? "text-white/80" : "text-neutral-500"}`}>
                {name}
                {roleLabel ? ` · ${roleLabel}` : ""}
              </p>
              {message.body && (
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>
              )}
              {message.files && message.files.length > 0 && <TicketFileGallery files={message.files} />}
              <p className={`mt-1.5 text-[10px] ${mine ? "text-white/70" : "text-neutral-400"}`}>
                {new Date(message.created_at).toLocaleString("de-DE", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
            </article>
          );
        })}

        {ticket.status === "done" && (
          <div className="flex flex-col items-center px-4 pt-4 pb-2">
            <div className="h-px w-full bg-neutral-200 dark:bg-neutral-800" />
            <span className="mt-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#3CB346] text-white shadow-[0_8px_20px_rgba(60,179,70,0.28)]">
              <CircleCheck className="h-6 w-6" />
            </span>
            <p className="mt-2 text-[11px] text-neutral-400">Erfolgreich erledigt</p>
            {doneNoteText && (
              <p className="mt-1 max-w-xs text-center text-[11px] leading-relaxed text-neutral-400">
                {doneNoteText}
              </p>
            )}
            {ticket.can_rate && (
              <TicketRatingForm
                ticketId={ticket.id}
                onSubmitted={() =>
                  setTicket((current) =>
                    current ? { ...current, can_rate: false, rated: true } : current,
                  )
                }
              />
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 shrink-0 rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="mt-3 shrink-0">
        {hm && ticket.status === "open" && (
          <HausmeisterRespond ticket={ticket} onUpdated={setTicket} />
        )}

        {!hm && ticket.status === "open" && (
          <p className="rounded-[20px] bg-neutral-50 px-4 py-3 text-sm text-neutral-500 dark:bg-neutral-900">
            Deine Anfrage ist eingegangen. Der Hausmeister antwortet in Kürze.
          </p>
        )}

        {canChat && (
          <form onSubmit={sendMessage}>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Nachricht schreiben..."
              rows={2}
              className="w-full resize-none rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#3CB346] dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
            />
            <PhotoPicker files={photos} onChange={setPhotos} compact />
            <button
              type="submit"
              disabled={sending || !canSend}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#3CB346] py-3 font-medium text-white disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {sending ? "Senden..." : "Senden"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
