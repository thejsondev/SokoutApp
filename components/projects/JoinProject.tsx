"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { api, ApiError } from "@/lib/api";
import { AuthCardSkeleton } from "@/components/ui/skeletons";
import type { ApiProject } from "@/lib/types";

export function JoinProject({ token }: { token: string }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [project, setProject] = useState<ApiProject | null>(null);
  const [joinKind, setJoinKind] = useState<"bewohner" | "hausverwaltung">("bewohner");
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    void api<{ data: ApiProject; join_kind?: "bewohner" | "hausverwaltung" }>(`/join/${token}`, {
      auth: false,
    })
      .then((payload) => {
        setProject(payload.data);
        setJoinKind(payload.join_kind === "hausverwaltung" ? "hausverwaltung" : "bewohner");
      })
      .catch(() => setError("Projekt wurde nicht gefunden."));
  }, [token]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(`/join/${token}`)}`);
    }
  }, [loading, user, router, token]);

  useEffect(() => {
    if (loading || !user || !project) return;
    if (user.role !== joinKind) return;

    let cancelled = false;
    setJoining(true);

    void api(`/join/${token}`, { method: "POST" })
      .then(() => {
        if (!cancelled) router.replace("/");
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Beitritt nicht möglich.");
          setJoining(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loading, user, project, token, router, joinKind]);

  if (loading || !user) {
    return <AuthCardSkeleton />;
  }

  const roleMismatch = user.role !== joinKind;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-neutral-50 px-5 dark:bg-neutral-950">
      <div className="w-full max-w-md rounded-[32px] bg-white p-8 text-center shadow-[0_18px_50px_rgba(0,0,0,0.08)] dark:bg-neutral-900 dark:shadow-none">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {joinKind === "hausverwaltung" ? "Als Hausverwaltung beitreten" : "Als Bewohner beitreten"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-white">
          {project?.title ?? "Sokout"}
        </h1>
        {project && <p className="mt-1 text-neutral-500">{project.address}</p>}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {roleMismatch && (
          <p className="mt-4 text-sm text-neutral-500">
            Dieser QR-Code ist für {joinKind === "hausverwaltung" ? "Hausverwaltung" : "Bewohner"}.
          </p>
        )}
        {joining && !error && (
          <div className="mt-6 space-y-2">
            <div className="skeleton-shimmer mx-auto h-3 w-32 rounded-full bg-neutral-200 dark:bg-neutral-800" />
            <p className="text-sm text-neutral-400">Beitreten...</p>
          </div>
        )}
      </div>
    </main>
  );
}
