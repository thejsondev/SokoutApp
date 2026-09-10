"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { apiBlob } from "@/lib/api";
import type { ApiTicketFile } from "@/lib/types";

function useAuthObjectUrl(file: ApiTicketFile | null) {
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

    void apiBlob(`/ticket-files/${file.id}`)
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

async function downloadFile(file: ApiTicketFile) {
  const blob = await apiBlob(`/ticket-files/${file.id}?download=1`);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.original_name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function Thumb({
  file,
  onOpen,
}: {
  file: ApiTicketFile;
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

export function TicketFileGallery({ files }: { files: ApiTicketFile[] }) {
  const [active, setActive] = useState<ApiTicketFile | null>(null);
  const { src } = useAuthObjectUrl(active);

  if (files.length === 0) return null;

  return (
    <>
      <div className="mt-2 flex flex-wrap gap-2">
        {files.map((file) => (
          <Thumb key={file.id} file={file} onOpen={() => setActive(file)} />
        ))}
      </div>
      {active && (
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
