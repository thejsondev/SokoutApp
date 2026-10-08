"use client";

import { ArrowLeft, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChatFileGallery } from "@/components/chat/ChatFileGallery";
import { VoiceRecorder } from "@/components/chat/VoiceRecorder";
import { PhotoPicker } from "@/components/tickets/PhotoPicker";
import { useAuth } from "@/components/providers/AuthProvider";
import { api, apiForm, ApiError, unwrapData } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/roles";
import type { ApiChatMessage, ApiConversation } from "@/lib/types";

function conversationFingerprint(conversation: ApiConversation | null): string {
  if (!conversation) return "";
  const messages = conversation.messages ?? [];
  return messages.map((message) => message.id).join(":");
}

export function ChatThread({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [conversation, setConversation] = useState<ApiConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [voice, setVoice] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);
  sendingRef.current = sending;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void api<{ data: ApiConversation }>(`/chats/${id}`)
      .then((payload) => {
        if (!cancelled) setConversation(unwrapData(payload));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.firstError() : "Chat nicht gefunden.");
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
        const payload = await api<{ data: ApiConversation }>(`/chats/${id}`);
        if (cancelled) return;
        const next = unwrapData(payload);
        setConversation((current) =>
          conversationFingerprint(current) === conversationFingerprint(next) ? current : next,
        );
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
  }, [conversation?.messages?.length]);

  if (loading || !user) {
    return (
      <div className="space-y-3">
        <div className="h-12 w-48 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-900" />
        <div className="h-40 animate-pulse rounded-[28px] bg-neutral-100 dark:bg-neutral-900" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div>
        <button type="button" onClick={() => router.push("/chats")} className="text-sm text-neutral-500">
          Zurück
        </button>
        <p className="mt-4 text-sm text-red-600">{error ?? "Chat nicht gefunden."}</p>
      </div>
    );
  }

  const peer = conversation.peer;
  const peerName = peer ? `${peer.first_name} ${peer.last_name}` : "Chat";
  const canSend = Boolean(body.trim() || photos.length || voice);
  const conversationId = conversation.id;

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!canSend) return;

    setSending(true);
    setError(null);
    try {
      const form = new FormData();
      if (body.trim()) form.append("body", body.trim());
      photos.forEach((file) => form.append("files[]", file));
      if (voice) form.append("files[]", voice);

      const created = await apiForm<{ data: ApiChatMessage }>(
        `/chats/${conversationId}/messages`,
        form,
      );
      const message = unwrapData(created);
      setConversation((current) =>
        current
          ? {
              ...current,
              messages: [...(current.messages ?? []), message],
              last_message: message,
              last_message_at: message.created_at,
            }
          : current,
      );
      setBody("");
      setPhotos([]);
      setVoice(null);
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
          onClick={() => router.push("/chats")}
          className="mt-0.5 rounded-full bg-neutral-100 p-2 dark:bg-neutral-800"
          aria-label="Zurück"
        >
          <ArrowLeft className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-neutral-900 dark:text-white">
            {peerName}
          </h1>
          {peer && (
            <p className="mt-0.5 text-xs text-neutral-500">{ROLE_LABELS[peer.role]}</p>
          )}
        </div>
      </div>

      <div ref={threadRef} className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pb-2">
        {(conversation.messages ?? []).map((message) => {
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
              {message.files && message.files.length > 0 && (
                <ChatFileGallery files={message.files} />
              )}
              <p className={`mt-1.5 text-[10px] ${mine ? "text-white/70" : "text-neutral-400"}`}>
                {new Date(message.created_at).toLocaleString("de-DE", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
            </article>
          );
        })}
      </div>

      {error && (
        <p className="mt-2 shrink-0 rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </p>
      )}

      <form onSubmit={sendMessage} className="mt-3 shrink-0">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Nachricht schreiben..."
          rows={2}
          className="w-full resize-none rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#3CB346] dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
        />
        <PhotoPicker files={photos} onChange={setPhotos} compact />
        <VoiceRecorder file={voice} onChange={setVoice} disabled={sending} />
        <button
          type="submit"
          disabled={sending || !canSend}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#3CB346] py-3 font-medium text-white disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {sending ? "Senden..." : "Senden"}
        </button>
      </form>
    </div>
  );
}
