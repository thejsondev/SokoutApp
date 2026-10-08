"use client";

import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/components/providers/AuthProvider";
import { api, ApiError, unwrapData } from "@/lib/api";
import { canUseDirectChat, ROLE_LABELS } from "@/lib/roles";
import type { ApiChatContact, ApiConversation } from "@/lib/types";

function previewText(contact: ApiChatContact): string {
  const message = contact.last_message;
  if (!message) return "Noch keine Nachrichten";
  if (message.body?.trim()) return message.body.trim();
  const files = message.files ?? [];
  if (files.some((file) => file.is_audio || file.mime_type?.startsWith("audio/"))) {
    return "Sprachnachricht";
  }
  if (files.length > 0) return "Foto";
  return "Nachricht";
}

export function ChatList() {
  const router = useRouter();
  const { user } = useAuth();
  const [contacts, setContacts] = useState<ApiChatContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !canUseDirectChat(user.role)) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void api<{ data: ApiChatContact[] }>("/chats")
      .then((payload) => {
        if (!cancelled) setContacts(unwrapData(payload));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.firstError() : "Chats konnten nicht geladen werden.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  async function openChat(contact: ApiChatContact) {
    if (openingId) return;
    setOpeningId(contact.peer.id);
    setError(null);

    try {
      if (contact.conversation_id) {
        router.push(`/chats/${contact.conversation_id}`);
        return;
      }

      const created = await api<{ data: ApiConversation }>("/chats", {
        method: "POST",
        body: { peer_user_id: contact.peer.id },
      });
      const conversation = unwrapData(created);
      router.push(`/chats/${conversation.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.firstError() : "Chat konnte nicht geöffnet werden.");
      setOpeningId(null);
    }
  }

  if (!user) return null;

  if (!canUseDirectChat(user.role)) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="Kein Zugriff"
        hint="Der Direktchat ist nur für Hausmeister und Hausverwaltung verfügbar."
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">Chat</h1>
        {[1, 2, 3].map((key) => (
          <div key={key} className="h-20 animate-pulse rounded-[24px] bg-neutral-100 dark:bg-neutral-900" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">Chat</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {user.role === "hausmeister"
            ? "Hausverwaltungen deiner Projekte"
            : "Hausmeister zu deinen Projekten"}
        </p>
      </div>

      {error && (
        <p className="rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </p>
      )}

      {contacts.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="Keine Kontakte"
          hint={
            user.role === "hausmeister"
              ? "Sobald Projekte eine Hausverwaltung haben, erscheinen sie hier."
              : "Noch keine Hausmeister vorhanden."
          }
        />
      ) : (
        <div className="space-y-2">
          {contacts.map((contact) => {
            const name = `${contact.peer.first_name} ${contact.peer.last_name}`;
            const busy = openingId === contact.peer.id;
            return (
              <button
                key={contact.peer.id}
                type="button"
                onClick={() => void openChat(contact)}
                disabled={Boolean(openingId)}
                className="flex w-full items-start gap-3 rounded-[24px] border border-neutral-100 bg-neutral-50 px-4 py-3.5 text-left transition hover:border-neutral-200 disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#3CB346]/20 text-sm font-semibold text-[#2f8f38]">
                  {contact.peer.first_name.slice(0, 1)}
                  {contact.peer.last_name.slice(0, 1)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium text-neutral-900 dark:text-white">
                      {busy ? "Öffnen..." : name}
                    </span>
                    {contact.last_message_at && (
                      <span className="shrink-0 text-[11px] text-neutral-400">
                        {new Date(contact.last_message_at).toLocaleDateString("de-DE")}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-neutral-500">
                    {ROLE_LABELS[contact.peer.role]}
                    {contact.project_titles.length > 0
                      ? ` · ${contact.project_titles.slice(0, 2).join(", ")}`
                      : ""}
                  </span>
                  <span className="mt-1 block truncate text-sm text-neutral-500">
                    {previewText(contact)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
