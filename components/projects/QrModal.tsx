"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

type Tab = "bewohner" | "hausverwaltung";

export function QrModal({
  open,
  title,
  bewohnerUrl,
  hausverwaltungUrl,
  onClose,
}: {
  open: boolean;
  title: string;
  bewohnerUrl: string;
  hausverwaltungUrl?: string;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("bewohner");
  const [copied, setCopied] = useState(false);
  const hasHvTab = Boolean(hausverwaltungUrl);
  const activeUrl = tab === "hausverwaltung" && hausverwaltungUrl ? hausverwaltungUrl : bewohnerUrl;

  useEffect(() => {
    if (open) {
      setTab("bewohner");
      setCopied(false);
    }
  }, [open]);

  useEffect(() => {
    setCopied(false);
  }, [tab]);

  if (!open) return null;

  async function copyLink() {
    if (!activeUrl) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(activeUrl);
      } else {
        throw new Error("clipboard unavailable");
      }
      setCopied(true);
    } catch {
      const input = document.createElement("textarea");
      input.value = activeUrl;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.left = "-9999px";
      document.body.appendChild(input);
      input.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(input);
      if (!ok) return;
      setCopied(true);
    }

    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-5">
      <div className="w-full max-w-sm rounded-[32px] bg-white p-6 text-center shadow-2xl dark:bg-neutral-900">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</h2>
        {hasHvTab && (
          <div className="mt-4 grid grid-cols-2 gap-1 rounded-full bg-neutral-100 p-1 dark:bg-neutral-800">
            <button
              type="button"
              onClick={() => setTab("bewohner")}
              className={`rounded-full py-2 text-sm font-medium ${
                tab === "bewohner"
                  ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-950 dark:text-white"
                  : "text-neutral-500"
              }`}
            >
              Bewohner
            </button>
            <button
              type="button"
              onClick={() => setTab("hausverwaltung")}
              className={`rounded-full py-2 text-sm font-medium ${
                tab === "hausverwaltung"
                  ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-950 dark:text-white"
                  : "text-neutral-500"
              }`}
            >
              Hausverwaltung
            </button>
          </div>
        )}
        <p className="mt-3 text-sm text-neutral-500">
          {tab === "hausverwaltung"
            ? "QR scannen, um als Hausverwaltung beizutreten."
            : "QR scannen, um als Bewohner beizutreten."}
        </p>
        <div className="mx-auto mt-5 flex justify-center rounded-3xl bg-neutral-50 p-5 dark:bg-white">
          {activeUrl ? <QRCodeSVG value={activeUrl} size={220} /> : null}
        </div>
        <button
          type="button"
          onClick={() => void copyLink()}
          disabled={!activeUrl}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-neutral-200 py-3 text-sm font-medium text-neutral-800 dark:border-neutral-700 dark:text-neutral-100"
        >
          {copied ? <Check className="h-4 w-4 text-[#3CB346]" /> : <Copy className="h-4 w-4" />}
          {copied ? "Link kopiert" : "Link kopieren"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-full bg-neutral-900 py-3 font-medium text-white dark:bg-white dark:text-neutral-950"
        >
          Schließen
        </button>
      </div>
    </div>
  );
}
