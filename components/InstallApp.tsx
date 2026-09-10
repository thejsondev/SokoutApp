"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { enablePushFromGesture, prefetchVapidKey } from "@/lib/push";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIosDevice() {
  const ua = navigator.userAgent;
  const iOS = /iPhone|iPad|iPod/i.test(ua);
  const iPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOS || iPadOs;
}

function isStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [notificationState, setNotificationState] = useState<
    NotificationPermission | "unsupported" | "idle"
  >("idle");
  const vapidKey = useRef<string | null>(null);

  useEffect(() => {
    setIos(isIosDevice());
    setInstalled(isStandaloneMode());
    if ("Notification" in window) {
      setNotificationState(Notification.permission);
    } else {
      setNotificationState("unsupported");
    }

    void prefetchVapidKey().then((key) => {
      vapidKey.current = key;
    });

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    setInstalling(true);
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setInstalling(false);

    if (choice.outcome === "accepted") {
      setInstalled(true);
    }
  }, [deferredPrompt]);

  const handleNotifications = useCallback(() => {
    void enablePushFromGesture(vapidKey.current).then((result) => {
      if (result.ok && "Notification" in window) {
        setNotificationState(Notification.permission);
      }
    });
  }, []);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 py-16">
      <Image
        src="/logo.png"
        alt="Sokout"
        width={112}
        height={112}
        className="rounded-3xl"
        priority
      />

      <h1 className="mt-8 text-center text-3xl font-semibold text-neutral-900">
        Sokout
      </h1>
      <p className="mt-3 text-center text-base text-neutral-500">
        اپ را روی گوشی یا سیستم‌ات نصب کن
      </p>

      {installed ? (
        <div className="mt-10 flex w-full max-w-sm flex-col items-center gap-4">
          <p className="rounded-full bg-neutral-100 px-5 py-2 text-sm text-neutral-600">
            اپ روی این دستگاه نصب شده
          </p>
          <EnableNotificationsButton
            state={notificationState}
            onClick={handleNotifications}
          />
        </div>
      ) : ios ? (
        <ol className="mt-10 w-full max-w-sm space-y-4 text-right text-neutral-800">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3CB346] text-sm font-medium text-white">
              ۱
            </span>
            <span>
              در Safari روی دکمه{" "}
              <span className="inline-flex translate-y-0.5 items-center">
                <IosShareIcon />
              </span>{" "}
              Share بزن
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3CB346] text-sm font-medium text-white">
              ۲
            </span>
            <span>Add to Home Screen را انتخاب کن</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3CB346] text-sm font-medium text-white">
              ۳
            </span>
            <span>روی Add بزن تا آیکون Sokout روی صفحه اصلی بیاید</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3CB346] text-sm font-medium text-white">
              ۴
            </span>
            <span>اپ را از صفحه اصلی باز کن و اعلان‌ها را اجازه بده</span>
          </li>
        </ol>
      ) : (
        <div className="mt-10 flex w-full max-w-sm flex-col items-center gap-4">
          <button
            type="button"
            onClick={handleInstall}
            disabled={!deferredPrompt || installing}
            className="w-full rounded-full bg-[#3CB346] px-6 py-3.5 text-base font-medium text-white transition enabled:hover:bg-[#349e3d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {installing ? "در حال نصب..." : "نصب اپلیکیشن"}
          </button>
          {!deferredPrompt && (
            <p className="text-center text-sm leading-relaxed text-neutral-500">
              اگر دکمه فعال نشد، از منوی مرورگر گزینه Add to Home screen یا
              Install app را بزن.
            </p>
          )}
          <EnableNotificationsButton
            state={notificationState}
            onClick={handleNotifications}
          />
        </div>
      )}
    </main>
  );
}

function EnableNotificationsButton({
  state,
  onClick,
}: {
  state: NotificationPermission | "unsupported" | "idle";
  onClick: () => void;
}) {
  if (state === "granted") {
    return (
      <p className="text-center text-sm text-[#3CB346]">اعلان‌ها فعال شد</p>
    );
  }
  if (state === "denied") {
    return (
      <p className="text-center text-sm text-neutral-500">
        اعلان‌ها در تنظیمات مرورگر مسدود شده‌اند.
      </p>
    );
  }
  if (state === "unsupported") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-full border border-black/10 bg-white px-6 py-3.5 text-base font-medium text-neutral-900"
      >
        اجازه اعلان‌ها
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-full border border-black/10 bg-white px-6 py-3.5 text-base font-medium text-neutral-900"
    >
      اجازه اعلان‌ها
    </button>
  );
}

function IosShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mx-0.5 inline-block h-5 w-5 text-neutral-900"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 16V4" />
      <path d="M8 8l4-4 4 4" />
      <path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
    </svg>
  );
}
