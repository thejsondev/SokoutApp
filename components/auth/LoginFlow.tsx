"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { AuthCardSkeleton } from "@/components/ui/skeletons";
import { api, ApiError } from "@/lib/api";
import type { ApiUser } from "@/lib/types";

type Step = "email" | "code" | "profile";

export function LoginFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession, user, loading } = useAuth();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const nextPath = searchParams.get("next") || "/";

  useEffect(() => {
    if (!loading && user) {
      router.replace(nextPath.startsWith("/") ? nextPath : "/");
    }
  }, [loading, user, nextPath, router]);

  function finish(token: string, user: ApiUser) {
    setSession(token, user);
    router.replace(nextPath.startsWith("/") ? nextPath : "/");
  }

  async function sendCode(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await api<{ message: string; debug_code?: string }>("/auth/request-code", {
        method: "POST",
        body: { email },
        auth: false,
      });
      setDebugCode(result.debug_code ?? null);
      setStep("code");
    } catch (err) {
      setError(err instanceof ApiError ? err.firstError() : "Code konnte nicht gesendet werden.");
    } finally {
      setPending(false);
    }
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await api<{
        needs_registration: boolean;
        token?: string;
        user?: ApiUser;
      }>("/auth/verify-code", {
        method: "POST",
        body: { email, code },
        auth: false,
      });

      if (result.needs_registration) {
        setStep("profile");
        return;
      }

      if (result.token && result.user) {
        finish(result.token, result.user);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.firstError() : "Code ist ungültig.");
    } finally {
      setPending(false);
    }
  }

  async function completeProfile(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await api<{ token: string; user: ApiUser }>("/auth/complete-profile", {
        method: "POST",
        body: {
          email,
          code,
          first_name: firstName,
          last_name: lastName,
          address,
          phone: phone || null,
        },
        auth: false,
      });
      finish(result.token, result.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.firstError() : "Registrierung fehlgeschlagen.");
    } finally {
      setPending(false);
    }
  }

  if (loading || user) {
    return <AuthCardSkeleton />;
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-neutral-50 px-5 py-10 dark:bg-neutral-950">
      <div className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-[0_18px_50px_rgba(0,0,0,0.08)] dark:bg-neutral-900 dark:shadow-none">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/logo.png" alt="Sokout" width={64} height={64} className="rounded-2xl" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">Sokout</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {step === "email" && "Mit E-Mail anmelden"}
            {step === "code" && "Code aus der E-Mail eingeben"}
            {step === "profile" && "Kurz dein Profil ergänzen"}
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{error}</p>
        )}

        {step === "email" && (
          <form onSubmit={sendCode} className="space-y-4">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              E-Mail
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-base text-neutral-900 outline-none focus:border-[#3CB346] dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                placeholder="you@email.de"
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-full bg-[#3CB346] py-3.5 text-base font-medium text-white disabled:opacity-60"
            >
              {pending ? "Senden..." : "Code senden"}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={verify} className="space-y-4">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Code an <span className="font-medium text-neutral-800 dark:text-neutral-200">{email}</span> gesendet.
            </p>
            {debugCode && (
              <p className="rounded-2xl bg-[#3CB346]/10 px-4 py-2 text-center text-sm text-[#2e9a38]">
                Dev-Code: {debugCode}
              </p>
            )}
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-center text-2xl tracking-[0.4em] text-neutral-900 outline-none focus:border-[#3CB346] dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
              placeholder="000000"
            />
            <button
              type="submit"
              disabled={pending || code.length !== 6}
              className="w-full rounded-full bg-[#3CB346] py-3.5 text-base font-medium text-white disabled:opacity-60"
            >
              {pending ? "Prüfen..." : "Weiter"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
              }}
              className="w-full text-sm text-neutral-500"
            >
              Andere E-Mail
            </button>
          </form>
        )}

        {step === "profile" && (
          <form onSubmit={completeProfile} className="space-y-3">
            <input
              required
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Vorname"
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-900 outline-none focus:border-[#3CB346] dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
            />
            <input
              required
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Name"
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-900 outline-none focus:border-[#3CB346] dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
            />
            <input
              required
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Adresse"
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-900 outline-none focus:border-[#3CB346] dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
            />
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Telefon (optional)"
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-900 outline-none focus:border-[#3CB346] dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
            />
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-full bg-[#3CB346] py-3.5 text-base font-medium text-white disabled:opacity-60"
            >
              {pending ? "Speichern..." : "Konto erstellen"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
