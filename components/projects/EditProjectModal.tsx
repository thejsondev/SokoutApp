"use client";

import { FileText, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api, apiForm, ApiError, unwrapData } from "@/lib/api";
import type { ApiProject } from "@/lib/types";

export function EditProjectModal({
  open,
  project,
  canManageContract = false,
  onClose,
  onUpdated,
  onDeleted,
}: {
  open: boolean;
  project: ApiProject;
  canManageContract?: boolean;
  onClose: () => void;
  onUpdated: (project: ApiProject) => void;
  onDeleted: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(project.title);
  const [address, setAddress] = useState(project.address);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [removeContract, setRemoveContract] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(project.title);
    setAddress(project.address);
    setContractFile(null);
    setRemoveContract(false);
    setConfirmDelete(false);
    setError(null);
    setPending(false);
    if (fileRef.current) fileRef.current.value = "";
  }, [open, project.address, project.title, project.id]);

  if (!open) return null;

  const existingContract = !removeContract && project.has_contract ? project.contract : null;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      let updated = unwrapData(
        await api<{ data: ApiProject }>(`/projects/${project.id}`, {
          method: "PATCH",
          body: { title: title.trim(), address: address.trim() },
        }),
      );

      if (canManageContract && removeContract && project.has_contract && !contractFile) {
        await api(`/projects/${project.id}/contract`, { method: "DELETE" });
        updated = {
          ...updated,
          has_contract: false,
          contract: null,
        };
      }

      if (canManageContract && contractFile) {
        const form = new FormData();
        form.append("contract", contractFile);
        updated = unwrapData(
          await apiForm<{ data: ApiProject }>(`/projects/${project.id}/contract`, form),
        );
      }

      onUpdated(updated);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.firstError() : "Projekt konnte nicht gespeichert werden.");
    } finally {
      setPending(false);
    }
  }

  async function deleteProject() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setPending(true);
    setError(null);
    try {
      await api(`/projects/${project.id}`, { method: "DELETE" });
      onDeleted();
    } catch (err) {
      setError(err instanceof ApiError ? err.firstError() : "Projekt konnte nicht gelöscht werden.");
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

          {canManageContract && (
            <div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Vertrag (PDF)</p>
              {existingContract && !contractFile && (
                <div className="mt-1.5 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-950">
                  <FileText className="h-5 w-5 shrink-0 text-[#3CB346]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                      {existingContract.original_name || "Vertrag.pdf"}
                    </p>
                    <p className="text-xs text-neutral-500">Aktueller Vertrag</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRemoveContract(true)}
                    className="rounded-full bg-white p-2 text-neutral-500 dark:bg-neutral-900"
                    aria-label="Vertrag entfernen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}

              {contractFile && (
                <div className="mt-1.5 flex items-center gap-3 rounded-2xl border border-[#3CB346]/30 bg-[#3CB346]/10 px-4 py-3">
                  <FileText className="h-5 w-5 shrink-0 text-[#2e9a38]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                      {contractFile.name}
                    </p>
                    <p className="text-xs text-neutral-500">Wird beim Speichern hochgeladen</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setContractFile(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="rounded-full bg-white p-2 text-neutral-500 dark:bg-neutral-900"
                    aria-label="Auswahl entfernen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              >
                <Upload className="h-4 w-4" />
                {existingContract || contractFile ? "Vertrag wechseln" : "PDF hochladen"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  if (!file) return;
                  if (
                    file.type &&
                    file.type !== "application/pdf" &&
                    !file.name.toLowerCase().endsWith(".pdf")
                  ) {
                    setError("Nur PDF-Dateien sind erlaubt.");
                    event.target.value = "";
                    return;
                  }
                  setError(null);
                  setRemoveContract(false);
                  setContractFile(file);
                }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={pending || !title.trim() || !address.trim()}
            className="w-full rounded-full bg-[#3CB346] py-3.5 text-base font-medium text-white disabled:opacity-60"
          >
            {pending ? "Speichern..." : "Speichern"}
          </button>

          <div className="border-t border-neutral-100 pt-4 dark:border-neutral-800">
            {confirmDelete && (
              <p className="mb-3 text-sm text-red-600 dark:text-red-400">
                Wirklich löschen? Tickets und Dateien dieses Projekts werden entfernt.
              </p>
            )}
            <button
              type="button"
              onClick={() => void deleteProject()}
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 py-3.5 text-base font-medium text-red-600 disabled:opacity-60 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
              {pending && confirmDelete
                ? "Löschen..."
                : confirmDelete
                  ? "Endgültig löschen"
                  : "Projekt löschen"}
            </button>
            {confirmDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={pending}
                className="mt-2 w-full py-2 text-sm text-neutral-500"
              >
                Abbrechen
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
