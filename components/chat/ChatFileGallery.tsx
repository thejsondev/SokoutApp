"use client";

import { Download, Mic, X } from "lucide-react";
import { useEffect, useState } from "react";
import { apiBlob } from "@/lib/api";
import type { ApiChatFile } from "@/lib/types";

function useAuthObjectUrl(file: ApiChatFile | null) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!file) {
      setSrc(null);
      setFailed(false);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    void apiBlob(`/chat-files/${file.id}`)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file?.id]);

  return { src, failed };
}

async function downloadFile(file: ApiChatFile) {
  const blob = await apiBlob(`/chat-files/${file.id}?download=1`);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.original_name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function isAudio(file: ApiChatFile): boolean {
  return Boolean(file.is_audio || file.mime_type?.startsWith("audio/"));
}

function isImage(file: ApiChatFile): boolean {
  return Boolean(file.is_image || file.mime_type?.startsWith("image/"));
}

function AudioPlayer({ file }: { file: ApiChatFile }) {
  const { src, failed } = useAuthObjectUrl(file);

  return (
    <div className="mt-2 flex min-w-[220px] items-center gap-2 rounded-2xl bg-black/10 px-3 py-2">
      <Mic className="h-4 w-4 shrink-0 opacity-80" />
      {src ? (
        <audio controls preload="metadata" src={src} className="h-8 w-full max-w-[220px]" />
      ) : (
        <span className="text-xs opacity-70">{failed ? "Audio nicht verfügbar" : "Laden..."}</span>
      )}
    </div>
  );
}

function Thumb({
  file,
  onOpen,
}: {
  file: ApiChatFile;
  onOpen: () => void;
}) {
  const { src, failed } = useAuthObjectUrl(file);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="h-20 w-20 overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800"
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={file.original_name} className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full items-center justify-center px-1 text-center text-[10px] text-neutral-400">
          {failed ? file.original_name : "…"}
        </span>
      )}
    </button>
  );
}

export function ChatFileGallery({ files }: { files: ApiChatFile[] }) {
  const [active, setActive] = useState<ApiChatFile | null>(null);
  const { src } = useAuthObjectUrl(active && isImage(active) ? active : null);

  if (files.length === 0) return null;

  const images = files.filter(isImage);
  const audios = files.filter(isAudio);

  return (
    <>
      {audios.map((file) => (
        <AudioPlayer key={file.id} file={file} />
      ))}
      {images.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {images.map((file) => (
            <Thumb key={file.id} file={file} onOpen={() => setActive(file)} />
          ))}
        </div>
      )}
      {active && isImage(active) && (
        <div className="fixed inset-0 z-[90] flex flex-col bg-black/90">
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <p className="truncate pr-4 text-sm">{active.original_name}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void downloadFile(active)}
                className="rounded-full bg-white/15 p-2"
                aria-label="Download"
              >
                <Download className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="rounded-full bg-white/15 p-2"
                aria-label="Schließen"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center p-4">
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={active.original_name} className="max-h-full max-w-full object-contain" />
            ) : (
              <p className="text-sm text-white/70">Laden...</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
