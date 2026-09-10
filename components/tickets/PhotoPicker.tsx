"use client";

import { Camera, ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const MAX_FILES = 10;

export function PhotoPicker({
  files,
  onChange,
  compact = false,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  compact?: boolean;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list).filter(
      (file) => file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name),
    );
    onChange([...files, ...incoming].slice(0, MAX_FILES));
  }

  function removeAt(index: number) {
    onChange(files.filter((_, current) => current !== index));
  }

  return (
    <div className={compact ? "mt-2" : "mt-3"}>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={files.length >= MAX_FILES}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-neutral-100 px-3 py-2.5 text-sm font-medium text-neutral-700 disabled:opacity-50 dark:bg-neutral-800 dark:text-neutral-200"
        >
          <Camera className="h-4 w-4" />
          Foto
        </button>
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          disabled={files.length >= MAX_FILES}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-neutral-100 px-3 py-2.5 text-sm font-medium text-neutral-700 disabled:opacity-50 dark:bg-neutral-800 dark:text-neutral-200"
        >
          <ImagePlus className="h-4 w-4" />
          Galerie
        </button>
      </div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />
      {previews.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {previews.map((src, index) => (
            <div key={`${files[index]?.name}-${index}`} className="relative h-20 w-20 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-20 w-20 rounded-2xl object-cover" />
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="absolute -right-1 -top-1 rounded-full bg-black/70 p-1 text-white"
                aria-label="Foto entfernen"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
