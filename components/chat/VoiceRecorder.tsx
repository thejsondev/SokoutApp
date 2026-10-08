"use client";

import { Mic, Square, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

function extensionFor(mime: string): string {
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

export function VoiceRecorder({
  file,
  onChange,
  disabled = false,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function start() {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Mikrofon wird nicht unterstützt.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        const audioFile = new File([blob], `voice-${Date.now()}.${extensionFor(type)}`, {
          type,
        });
        onChange(audioFile);
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      recorder.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = window.setInterval(() => {
        setSeconds((value) => value + 1);
      }, 1000);
    } catch {
      setError("Mikrofonzugriff verweigert.");
    }
  }

  function stop() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
    setRecording(false);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function clear() {
    onChange(null);
    setSeconds(0);
    setError(null);
  }

  const label = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        {!recording && !file && (
          <button
            type="button"
            onClick={() => void start()}
            disabled={disabled}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-neutral-100 px-3 py-2.5 text-sm font-medium text-neutral-700 disabled:opacity-50 dark:bg-neutral-800 dark:text-neutral-200"
          >
            <Mic className="h-4 w-4" />
            Sprache
          </button>
        )}
        {recording && (
          <button
            type="button"
            onClick={stop}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-red-500 px-3 py-2.5 text-sm font-medium text-white"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
            Stop · {label}
          </button>
        )}
        {file && !recording && (
          <>
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
              <Mic className="h-4 w-4 shrink-0" />
              <span className="truncate">Sprachnachricht bereit</span>
            </div>
            <button
              type="button"
              onClick={clear}
              className="rounded-full bg-neutral-100 p-2.5 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
              aria-label="Sprachnachricht entfernen"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
