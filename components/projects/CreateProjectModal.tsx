"use client";

import { useEffect, useState } from "react";
import { api, ApiError, unwrapData } from "@/lib/api";
import type { ApiProject, ApiUser } from "@/lib/types";

type Mode = "choose" | "hv" | "form";
type Kind = "privat" | "hausverwaltung";

export function CreateProjectModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (project: ApiProject) => void;
}) {
  const [mode, setMode] = useState<Mode>("choose");
  const [kind, setKind] = useState<Kind>("privat");
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [hvs, setHvs] = useState<ApiUser[]>([]);
  const [selectedHvId, setSelectedHvId] = useState<number | "new" | null>(null);
  const [hvFirstName, setHvFirstName] = useState("");
  const [hvLastName, setHvLastName] = useState("");
  const [hvEmail, setHvEmail] = useState("");
  const [hvAddress, setHvAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode("choose");
    setKind("privat");
    setTitle("");
    setAddress("");
    setSelectedHvId(null);
    setHvFirstName("");
    setHvLastName("");
    setHvEmail("");
    setHvAddress("");
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!open || mode !== "hv") return;
    void api<{ data: ApiUser[] }>("/users?role=hausverwaltung")
      .then((payload) => setHvs(payload.data))
      .catch(() => setHvs([]));
  }, [open, mode]);

  if (!open) return null;

  async function createProject(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      let hausverwaltungUserId: number | null = null;

      if (kind === "hausverwaltung") {
        if (selectedHvId === "new") {
          const created = await api<{ data: ApiUser }>("/users", {
            method: "POST",
            body: {
              first_name: hvFirstName,
              last_name: hvLastName,
              email: hvEmail,
              address: hvAddress,
              role: "hausverwaltung",
            },
          });
          hausverwaltungUserId = unwrapData(created).id;
        } else if (typeof selectedHvId === "number") {
          hausverwaltungUserId = selectedHvId;
        } else {
          setError("Bitte eine Hausverwaltung wählen.");
          setPending(false);
          return;
        }
      }

      const created = await api<{ data: ApiProject }>("/projects", {
        method: "POST",
        body: {
          title,
          address,
          hausverwaltung_user_id: hausverwaltungUserId,
        },
      });

      onCreated(unwrapData(created));
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.firstError() : "Projekt konnte nicht angelegt werden.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 md:items-center">
      <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-[32px] bg-white p-6 shadow-2xl dark:bg-neutral-900">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Neues Projekt</h2>
          <button type="button" onClick={onClose} className="text-sm text-neutral-500">
            Schließen
          </button>
        </div>

        {error && <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{error}</p>}

        {mode === "choose" && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                setKind("privat");
                setMode("form");
              }}
              className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-5 py-4 text-left dark:border-neutral-700 dark:bg-neutral-950"
            >
              <p className="font-medium text-neutral-900 dark:text-white">Privat</p>
              <p className="mt-1 text-sm text-neutral-500">Ohne Hausverwaltung, Bewohner per QR.</p>
            </button>
            <button
              type="button"
              onClick={() => {
                setKind("hausverwaltung");
                setMode("hv");
              }}
              className="w-full rounded-3xl border border-neutral-200 bg-neutral-50 px-5 py-4 text-left dark:border-neutral-700 dark:bg-neutral-950"
            >
              <p className="font-medium text-neutral-900 dark:text-white">Mit Hausverwaltung</p>
              <p className="mt-1 text-sm text-neutral-500">Bestehende HV wählen oder neu anlegen.</p>
            </button>
          </div>
        )}

        {mode === "hv" && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setSelectedHvId("new")}
              className={`w-full rounded-3xl border px-5 py-4 text-left ${
                selectedHvId === "new"
                  ? "border-[#3CB346] bg-[#3CB346]/10"
                  : "border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950"
              }`}
            >
              <p className="font-medium text-neutral-900 dark:text-white">+ Neu</p>
              <p className="mt-1 text-sm text-neutral-500">Hausverwaltung zum ersten Mal anlegen.</p>
            </button>
            {hvs.map((hv) => (
              <button
                key={hv.id}
                type="button"
                onClick={() => setSelectedHvId(hv.id)}
                className={`w-full rounded-3xl border px-5 py-4 text-left ${
                  selectedHvId === hv.id
                    ? "border-[#3CB346] bg-[#3CB346]/10"
                    : "border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950"
                }`}
              >
                <p className="font-medium text-neutral-900 dark:text-white">
                  {hv.first_name} {hv.last_name}
                </p>
                <p className="mt-1 text-sm text-neutral-500">{hv.email}</p>
              </button>
            ))}
            <button
              type="button"
              disabled={selectedHvId === null}
              onClick={() => setMode("form")}
              className="w-full rounded-full bg-[#3CB346] py-3.5 font-medium text-white disabled:opacity-50"
            >
              Weiter
            </button>
          </div>
        )}

        {mode === "form" && (
          <form onSubmit={createProject} className="space-y-3">
            {selectedHvId === "new" && kind === "hausverwaltung" && (
              <div className="space-y-3 rounded-3xl bg-neutral-50 p-4 dark:bg-neutral-950">
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Neue Hausverwaltung</p>
                <input
                  required
                  value={hvFirstName}
                  onChange={(event) => setHvFirstName(event.target.value)}
                  placeholder="Vorname"
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                />
                <input
                  required
                  value={hvLastName}
                  onChange={(event) => setHvLastName(event.target.value)}
                  placeholder="Name"
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                />
                <input
                  required
                  type="email"
                  value={hvEmail}
                  onChange={(event) => setHvEmail(event.target.value)}
                  placeholder="E-Mail"
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                />
                <input
                  required
                  value={hvAddress}
                  onChange={(event) => setHvAddress(event.target.value)}
                  placeholder="Adresse"
                  className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                />
              </div>
            )}
            <input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Projekttitel"
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
            />
            <input
              required
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Adresse"
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
            />
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-full bg-[#3CB346] py-3.5 font-medium text-white disabled:opacity-60"
            >
              {pending ? "Speichern..." : "Projekt erstellen"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
