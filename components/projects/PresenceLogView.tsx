"use client";

import { ArrowLeft, Home, LogIn, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { api, ApiError } from "@/lib/api";
import type { ApiPresenceLog, ApiProjectPresence, ApiUser } from "@/lib/types";

function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dayKey(iso: string): string {
  return localDayKey(new Date(iso));
}

function dayLabel(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (localDayKey(today) === key) return "Heute";
  if (localDayKey(yesterday) === key) return "Gestern";

  return date.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function personName(user?: ApiUser | null): string {
  if (!user) return "Hausmeister";
  return `${user.first_name} ${user.last_name}`;
}

export function PresenceLogView({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [presence, setPresence] = useState<ApiProjectPresence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void api<{ data: ApiProjectPresence }>(`/projects/${projectId}/presence`)
      .then((payload) => {
        if (!cancelled) setPresence(payload.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.firstError() : "Logbuch nicht verfügbar.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const groups = useMemo(() => {
    const logs = presence?.logs ?? [];
    const map = new Map<string, ApiPresenceLog[]>();
    for (const log of logs) {
      const key = dayKey(log.created_at);
      const list = map.get(key) ?? [];
      list.push(log);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [presence?.logs]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-40 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-900" />
        <div className="h-28 animate-pulse rounded-[28px] bg-neutral-100 dark:bg-neutral-900" />
        <div className="h-40 animate-pulse rounded-[28px] bg-neutral-100 dark:bg-neutral-900" />
      </div>
    );
  }

  if (error || !presence) {
    return (
      <div>
        <button type="button" onClick={() => router.back()} className="text-sm text-neutral-500">
          Zurück
        </button>
        <p className="mt-4 text-sm text-red-600">{error ?? "Logbuch nicht verfügbar."}</p>
      </div>
    );
  }

  const present = presence.present_users ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => router.push(`/projects/${projectId}`)}
          className="mt-0.5 rounded-full bg-neutral-100 p-2 dark:bg-neutral-800"
          aria-label="Zurück"
        >
          <ArrowLeft className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
            Kommen & Gehen
          </h1>
          <p className="mt-1 text-sm text-neutral-500">Anwesenheit des Hausmeisters</p>
        </div>
      </div>

      <section
        className={`rounded-[28px] px-5 py-5 ${
          presence.anyone_present
            ? "bg-[#3CB346]/12 text-[#1f7a2a] dark:bg-[#3CB346]/15 dark:text-emerald-200"
            : "bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              presence.anyone_present ? "bg-[#3CB346] text-white" : "bg-white text-neutral-400 dark:bg-neutral-800"
            }`}
          >
            <Home className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <p className="text-lg font-semibold">
              {presence.anyone_present ? "Hausmeister ist im Haus" : "Hausmeister ist weg"}
            </p>
            <p className="mt-0.5 text-sm opacity-80">
              {present.length > 0
                ? present.map((user) => personName(user)).join(", ")
                : "Aktuell niemand vor Ort"}
            </p>
          </div>
        </div>
      </section>

      {groups.length === 0 ? (
        <EmptyState
          icon={Home}
          title="Noch keine Einträge"
          hint="Sobald der Hausmeister kommt oder geht, erscheint es hier."
        />
      ) : (
        <div className="space-y-6">
          {groups.map(([key, logs]) => (
            <section key={key}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                {dayLabel(key)}
              </h2>
              <div className="relative space-y-3 pl-4 before:absolute before:bottom-3 before:left-[11px] before:top-3 before:w-px before:bg-neutral-200 dark:before:bg-neutral-800">
                {logs.map((log) => {
                  const arrive = log.event === "arrive";
                  return (
                    <article
                      key={log.id}
                      className="relative rounded-[24px] border border-neutral-100 bg-neutral-50 px-4 py-3.5 dark:border-neutral-800 dark:bg-neutral-900"
                    >
                      <span
                        className={`absolute -left-4 top-4 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white dark:ring-neutral-950 ${
                          arrive ? "bg-[#3CB346] text-white" : "bg-neutral-400 text-white"
                        }`}
                      >
                        {arrive ? <LogIn className="h-3.5 w-3.5" /> : <LogOut className="h-3.5 w-3.5" />}
                      </span>
                      <div className="flex items-start justify-between gap-3 pl-4">
                        <div className="min-w-0">
                          <p className="font-medium text-neutral-900 dark:text-white">
                            {arrive ? "Gekommen" : "Gegangen"}
                          </p>
                          <p className="mt-0.5 text-sm text-neutral-500">{personName(log.user)}</p>
                        </div>
                        <time className="shrink-0 text-sm font-medium text-neutral-500">
                          {new Date(log.created_at).toLocaleTimeString("de-DE", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
