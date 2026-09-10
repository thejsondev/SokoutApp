"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { api, ApiError, unwrapData } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/roles";
import { AccountPageSkeleton } from "@/components/ui/skeletons";
import type { ApiUser } from "@/lib/types";

export function AccountSettings() {
  const { user, setUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  if (!user) return <AccountPageSkeleton />;

  const userId = user.id;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSaved(false);

    try {
      const payload = await api<{ data: ApiUser }>(`/users/${userId}`, {
        method: "PATCH",
        body: {
          first_name: firstName,
          last_name: lastName,
          email,
          address,
          phone: phone || null,
        },
      });
      setUser(unwrapData(payload));
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.firstError() : "Speichern fehlgeschlagen.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">Konto</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{ROLE_LABELS[user.role]}</p>
      </div>

      <section className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Erscheinungsbild</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-full bg-white p-1 dark:bg-neutral-950">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`rounded-full py-2.5 text-sm font-medium ${
              theme === "light"
                ? "bg-[#3CB346] text-white"
                : "text-neutral-500 dark:text-neutral-400"
            }`}
          >
            Light
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`rounded-full py-2.5 text-sm font-medium ${
              theme === "dark"
                ? "bg-[#3CB346] text-white"
                : "text-neutral-500 dark:text-neutral-400"
            }`}
          >
            Dark
          </button>
        </div>
      </section>

      <form onSubmit={save} className="space-y-3">
        <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Profil</h2>
        {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{error}</p>}
        {saved && (
          <p className="rounded-2xl bg-[#3CB346]/10 px-4 py-3 text-sm text-[#2e9a38]">Gespeichert.</p>
        )}
        <label className="block text-xs font-medium text-neutral-500">
          Vorname
          <input
            required
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="Vorname"
            className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#3CB346] dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
          />
        </label>
        <label className="block text-xs font-medium text-neutral-500">
          Name
          <input
            required
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            placeholder="Name"
            className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#3CB346] dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
          />
        </label>
        <label className="block text-xs font-medium text-neutral-500">
          E-Mail
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="E-Mail"
            className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#3CB346] dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
          />
        </label>
        <label className="block text-xs font-medium text-neutral-500">
          Adresse
          <input
            required
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Adresse"
            className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#3CB346] dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
          />
        </label>
        <label className="block text-xs font-medium text-neutral-500">
          Telefon
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Telefon"
            className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900 outline-none focus:border-[#3CB346] dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-[#3CB346] py-3.5 font-medium text-white disabled:opacity-60"
        >
          {pending ? "Speichern..." : "Profil speichern"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => void logout()}
        className="w-full rounded-full border border-neutral-200 py-3 text-sm font-medium text-neutral-600 dark:border-neutral-800 dark:text-neutral-300"
      >
        Logout
      </button>
    </div>
  );
}
