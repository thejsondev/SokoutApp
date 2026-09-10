"use client";

import { useEffect, useState } from "react";
import { PhotoPicker } from "@/components/tickets/PhotoPicker";
import { apiForm, ApiError, unwrapData } from "@/lib/api";
import type { ApiProject, ApiTicket } from "@/lib/types";

export function CreateTicketModal({
  open,
  projectId,
  projects,
  onClose,
  onCreated,
}: {
  open: boolean;
  projectId?: number;
  projects?: ApiProject[];
  onClose: () => void;
  onCreated: (ticket: ApiTicket) => void;
}) {
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const needsProject = projectId == null;
  const resolvedProjectId = projectId ?? (typeof selectedProjectId === "number" ? selectedProjectId : null);

  useEffect(() => {
    if (!open) return;
    setBody("");
    setPhotos([]);
    setError(null);
    setSelectedProjectId("");
  }, [open]);

  if (!open) return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!resolvedProjectId) {
      setError("Bitte ein Projekt wählen.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("body", body.trim());
      photos.forEach((file) => form.append("files[]", file));
      const created = await apiForm<{ data: ApiTicket }>(
        `/projects/${resolvedProjectId}/tickets`,
        form,
      );
      onCreated(unwrapData(created));
      setBody("");
      setPhotos([]);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.firstError() : "Ticket konnte nicht erstellt werden.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 md:items-center">
      <form
        onSubmit={submit}
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-[32px] bg-white p-6 shadow-2xl dark:bg-neutral-900"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Neues Ticket</h2>
          <button type="button" onClick={onClose} className="text-sm text-neutral-500">
            Schließen
          </button>
        </div>
        {error && (
          <p className="mb-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </p>
        )}
        {needsProject && (
          <label className="mb-3 block text-xs font-medium text-neutral-500">
            Projekt
            <select
              required
              value={selectedProjectId}
              onChange={(event) =>
                setSelectedProjectId(event.target.value ? Number(event.target.value) : "")
              }
              className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#3CB346] dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
            >
              <option value="">Projekt wählen</option>
              {(projects ?? []).map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </label>
        )}
        <textarea
          required
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Was ist das Problem?"
          rows={5}
          className="w-full resize-none rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-900 outline-none focus:border-[#3CB346] dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
        />
        <PhotoPicker files={photos} onChange={setPhotos} />
        <button
          type="submit"
          disabled={pending || !body.trim() || !resolvedProjectId}
          className="mt-4 w-full rounded-full bg-[#3CB346] py-3.5 font-medium text-white disabled:opacity-60"
        >
          {pending ? "Senden..." : "Ticket erstellen"}
        </button>
      </form>
    </div>
  );
}
