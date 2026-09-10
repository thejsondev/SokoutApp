"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  enablePushFromGesture,
  prefetchVapidKey,
  pushPromptKind,
  syncPushSubscription,
  type PushPromptKind,
} from "@/lib/push";

type PushToast = {
  title: string;
  body: string;
  url: string;
};

export function PushNotifications() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [kind, setKind] = useState<PushPromptKind>("none");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<PushToast | null>(null);
  const vapidKey = useRef<string | null>(null);

  const refresh = useCallback(() => {
    if (!user) {
      setKind("none");
      return;
    }
    setKind(pushPromptKind());
  }, [user]);

  useEffect(() => {
    if (loading || !user) {
      setKind("none");
      vapidKey.current = null;
      return;
    }

    refresh();
    void prefetchVapidKey().then((key) => {
      vapidKey.current = key;
    });

    if (pushPromptKind() === "none") {
      void syncPushSubscription().catch(() => false);
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener("appinstalled", refresh);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener("appinstalled", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loading, user, refresh]);

  useEffect(() => {
    const onPush = (event: MessageEvent) => {
      if (event.data?.type !== "sokout-push") return;
      setToast({
        title: String(event.data.title || "Sokout"),
        body: String(event.data.body || "Neue Nachricht"),
        url: String(event.data.url || "/"),
      });
    };

    navigator.serviceWorker?.addEventListener("message", onPush);
    return () => navigator.serviceWorker?.removeEventListener("message", onPush);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 8000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <>
      {toast && (
        <button
          type="button"
          onClick={() => {
            const path = toast.url;
            setToast(null);
            router.push(path);
          }}
          className="fixed inset-x-4 top-4 z-[90] rounded-[24px] bg-white p-4 text-left shadow-2xl dark:bg-neutral-900 md:inset-x-auto md:right-4 md:w-96"
        >
          <p className="text-sm font-semibold text-neutral-900 dark:text-white">{toast.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-neutral-500">{toast.body}</p>
        </button>
      )}

      {kind !== "none" && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 md:items-center">
          <div className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-2xl dark:bg-neutral-900">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{COPY[kind].title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">{COPY[kind].body}</p>
            {error && (
              <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
                {error}
              </p>
            )}
            {kind === "ask" && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  void enablePushFromGesture(vapidKey.current).then((result) => {
                    if (result.ok) setKind("none");
                    else setError(result.error ?? "Mitteilungen konnten nicht aktiviert werden.");
                  });
                }}
                className="mt-5 w-full rounded-full bg-[#3CB346] py-3.5 font-medium text-white"
              >
                Erlauben
              </button>
            )}
            <button
              type="button"
              onClick={() => setKind("none")}
              className="mt-3 w-full py-2 text-sm text-neutral-400"
            >
              Später
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const COPY: Record<Exclude<PushPromptKind, "none">, { title: string; body: string }> = {
  ask: {
    title: "Mitteilungen erlauben",
    body: "Sokout schickt dir neue Tickets und Nachrichten, auch wenn die App geschlossen ist.",
  },
  ios: {
    title: "Zuerst zum Home-Bildschirm",
    body: "Auf dem iPhone nur Safari (nicht Chrome/Brave). Teilen → Zum Home-Bildschirm, dann Sokout von dem neuen Icon öffnen. Erst dort kannst du Mitteilungen erlauben.",
  },
  denied: {
    title: "Mitteilungen blockiert",
    body: "Die Erlaubnis wurde im Browser deaktiviert. In den Einstellungen von Safari/Chrome Mitteilungen für Sokout wieder erlauben.",
  },
};
