"use client";

import { useEffect, useState } from "react";
import { api, ApiError, unwrapData } from "@/lib/api";
import type { ApiProject } from "@/lib/types";

export function EditProjectModal({
  open,
  project,
  onClose,
  onUpdated,
}: {
  open: boolean;
  project: ApiProject;
  onClose: () => void;
  onUpdated: (project: ApiProject) => void;
}) {
  const [title, setTitle] = useState(project.title);
  const [address, setAddress] = useState(project.address);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(project.title);
    setAddress(project.address);
    setError(null);
    setPending(false);
  }, [open, project.address, project.title]);

  if (!open) return null;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const updated = await api<{ data: ApiProject }>(`/projects/${project.id}`, {
        method: "PATCH",
        body: { title: title.trim(), address: address.trim() },
      });
      onUpdated(unwrapData(updated));
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.firstError() : "Projekt konnte nicht gespeichert werden.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 md:items-center">
      <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-[32px] bg-white p-6 shadow-2xl dark:bg-neutral-900">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Projekt bearbeiten</h2>
          <button type="button" onClick={onClose} className="text-sm text-neutral-500">
            Schließen
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </p>
        )}

        <form onSubmit={save} className="space-y-4">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Name
            <input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base text-neutral-900 outline-none focus:border-[#3CB346] dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
              placeholder="Projekttitel"
            />
          </label>

          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Adresse
            <input
              required
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base text-neutral-900 outline-none focus:border-[#3CB346] dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
              placeholder="Straße, PLZ Ort"
            />
          </label>

          <button
            type="submit"
            disabled={pending || !title.trim() || !address.trim()}
            className="w-full rounded-full bg-[#3CB346] py-3.5 text-base font-medium text-white disabled:opacity-60"
          >
            {pending ? "Speichern..." : "Speichern"}
          </button>
        </form>
      </div>
    </div>
  );
}
