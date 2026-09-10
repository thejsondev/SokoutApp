import { api, getToken } from "@/lib/api";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String.trim() + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function applicationServerKeyFromVapid(vapidPublicKey: string): ArrayBuffer {
  const bytes = urlBase64ToUint8Array(vapidPublicKey);
  const copy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return copy as ArrayBuffer;
}

async function subscribeToPush(
  registration: ServiceWorkerRegistration,
  vapidPublicKey: string,
): Promise<PushSubscription> {
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    return existing;
  }

  const applicationServerKey = applicationServerKeyFromVapid(vapidPublicKey);
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    } catch (error) {
      lastError = error;
      await sleep(500 * (attempt + 1));
    }
  }

  throw lastError;
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iPhone|iPad|iPod/i.test(ua);
  const iPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOS || iPadOs;
}

export function isIosSafari(): boolean {
  if (!isIosDevice()) return false;
  const ua = navigator.userAgent;
  return /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|Chrome/i.test(ua);
}

function iosVersion(): { major: number; minor: number } | null {
  if (typeof navigator === "undefined") return null;
  const match = navigator.userAgent.match(/OS (\d+)_(\d+)/);
  if (!match) return null;
  return { major: Number(match[1]), minor: Number(match[2]) };
}

function iosSupportsWebPush(): boolean {
  const version = iosVersion();
  if (!version) return true;
  return version.major > 16 || (version.major === 16 && version.minor >= 4);
}

export function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  const safariStandalone = Boolean(
    (navigator as Navigator & { standalone?: boolean }).standalone,
  );
  if (isIosDevice()) return safariStandalone;
  return window.matchMedia("(display-mode: standalone)").matches || safariStandalone;
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    "serviceWorker" in navigator
  );
}

export type PushPromptKind = "none" | "ask" | "ios" | "denied";

export function pushPromptKind(): PushPromptKind {
  if (typeof window === "undefined") return "none";

  if ("Notification" in window && Notification.permission === "granted") {
    return "none";
  }

  if (isIosDevice() && !isStandaloneMode()) return "ios";

  if (
    window.isSecureContext &&
    "Notification" in window &&
    Notification.permission === "denied"
  ) {
    return "denied";
  }

  return "ask";
}

export async function prefetchVapidKey(): Promise<string | null> {
  try {
    const payload = await api<{ publicKey: string }>("/push/vapid-public-key", { auth: false });
    return payload.publicKey || null;
  } catch {
    return null;
  }
}

async function saveSubscription(subscription: PushSubscription): Promise<void> {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
    throw new Error("Ungültiges Push-Abo.");
  }

  await api("/push/subscribe", {
    method: "POST",
    body: {
      endpoint: json.endpoint,
      keys: {
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      },
      content_encoding: "aes128gcm",
    },
  });
}

export async function syncPushSubscription(): Promise<boolean> {
  if (!pushSupported() || !getToken()) return false;
  if (!("Notification" in window) || Notification.permission !== "granted") return false;

  const vapid = await prefetchVapidKey();
  if (!vapid) return false;

  const result = await enablePushFromGesture(vapid);
  return result.ok;
}

export async function enablePushFromGesture(vapidPublicKey: string | null): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (typeof window === "undefined") {
    return { ok: false, error: "Nicht verfügbar." };
  }

  if (!window.isSecureContext) {
    return {
      ok: false,
      error:
        "Mitteilungen brauchen HTTPS (oder localhost). Öffne die App unter https://sokout.app.",
    };
  }

  if (isIosDevice() && !isIosSafari()) {
    return {
      ok: false,
      error:
        "Auf dem iPhone nur Safari. Chrome und Brave können dort keine Mitteilungen.",
    };
  }

  if (isIosDevice() && !iosSupportsWebPush()) {
    return {
      ok: false,
      error: "Für Mitteilungen brauchst du iOS 16.4 oder neuer.",
    };
  }

  if (isIosDevice() && !isStandaloneMode()) {
    return {
      ok: false,
      error:
        "Auf dem iPhone zuerst in Safari teilen → Zum Home-Bildschirm, dann Sokout von dort öffnen — nicht aus dem Safari-Tab.",
    };
  }

  if (!("serviceWorker" in navigator)) {
    return { ok: false, error: "Dieser Browser unterstützt keine Push-Mitteilungen." };
  }

  if (!vapidPublicKey?.trim()) {
    return { ok: false, error: "Push-Schlüssel konnte nicht geladen werden. Seite neu laden." };
  }

  const vapid = vapidPublicKey.trim();

  await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
  const registration = await navigator.serviceWorker.ready;

  if (!registration.pushManager) {
    return {
      ok: false,
      error: isIosDevice()
        ? "Auf dem iPhone Sokout vom Home-Bildschirm öffnen, nicht aus Safari."
        : "Dieser Browser unterstützt keine Push-Mitteilungen.",
    };
  }

  try {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        return {
          ok: false,
          error:
            permission === "denied"
              ? "Mitteilungen sind blockiert. In den iPhone-Einstellungen unter Safari → Sokout wieder erlauben."
              : "Ohne Erlaubnis können keine Mitteilungen gesendet werden.",
        };
      }
    }

    const subscription = await subscribeToPush(registration, vapid);

    if (getToken()) {
      await saveSubscription(subscription);
    }

    return { ok: true };
  } catch (error) {
    if (Notification.permission === "denied") {
      return {
        ok: false,
        error:
          "Mitteilungen sind blockiert. In den Browser-Einstellungen für sokout.app wieder erlauben.",
      };
    }

    const message = error instanceof Error ? error.message : "";
    if (/push service error/i.test(message)) {
      return {
        ok: false,
        error:
          "Chrome/Brave konnte den Google-Push-Dienst nicht erreichen. In Brave unter Settings „Use Google services for push messaging“ einschalten, Werbeblocker/VPN prüfen, dann nochmal Erlauben.",
      };
    }

    return {
      ok: false,
      error: message || "Mitteilungen konnten nicht aktiviert werden.",
    };
  }
}

export async function requestPushPermission(): Promise<NotificationPermission | "unsupported"> {
  const vapid = await prefetchVapidKey();
  const result = await enablePushFromGesture(vapid);
  if (!("Notification" in window)) return "unsupported";
  if (result.ok) return "granted";
  return Notification.permission;
}
