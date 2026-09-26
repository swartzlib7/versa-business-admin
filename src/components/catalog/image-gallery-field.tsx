"use client";

import { useEffect, useState } from "react";
import { FileField } from "@/components/ui/file-field";
import {
  RECORD_IMAGE_MAX,
  parseRecordImages,
  type RecordImageRef,
} from "@/lib/records/record-image-refs";

function imageSrc(id: string): string {
  return `/api/records/images/${id}`;
}

/** Thumbnails for an image_gallery field, with a preview that steps through the set. */
export function ImageGalleryField({
  label,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
}) {
  const images = parseRecordImages(value);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<number | null>(null);

  const write = (next: RecordImageRef[]) => onChange?.(JSON.stringify(next));

  useEffect(() => {
    if (open == null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
      if (event.key === "ArrowRight") setOpen((index) => (index == null ? index : (index + 1) % images.length));
      if (event.key === "ArrowLeft") {
        setOpen((index) => (index == null ? index : (index - 1 + images.length) % images.length));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length]);

  const upload = async (file: File | null) => {
    if (!file || !onChange) return;
    if (images.length >= RECORD_IMAGE_MAX) {
      setError(`A post holds up to ${RECORD_IMAGE_MAX} images.`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/records/images", { method: "POST", body, credentials: "include" });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error?.message ?? "Could not upload the image.");
        return;
      }
      write([...images, json.data as RecordImageRef]);
    } catch {
      setError("Could not upload the image.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (image: RecordImageRef) => {
    setError("");
    await fetch(`/api/records/images/${image.id}`, { method: "DELETE", credentials: "include" }).catch(() => null);
    const next = images.filter((item) => item.id !== image.id);
    write(next);
    setOpen(null);
  };

  const current = open != null ? images[open] : null;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {images.length ? (
        <div className="flex flex-wrap gap-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              className="h-16 w-16 overflow-hidden rounded-md border border-border bg-muted/30"
              onClick={() => setOpen(index)}
              aria-label={`Preview ${image.name}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- staff preview of an uploaded record image */}
              <img src={imageSrc(image.id)} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No images</p>
      )}
      {readOnly ? null : (
        <FileField
          accept="image/png,image/jpeg,image/webp,image/gif"
          filename=""
          emptyLabel={busy ? "Uploading…" : images.length ? `${images.length} of ${RECORD_IMAGE_MAX}` : "No image chosen"}
          chooseLabel="Add image"
          removeLabel="Clear"
          hint="PNG, JPEG, WebP, or GIF. Up to 10. 2 MB each."
          onFile={(file) => void upload(file)}
        />
      )}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {current ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
          role="presentation"
          onClick={() => setOpen(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={current.name}
            className="flex max-h-[90vh] w-full max-w-3xl flex-col gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- staff preview of an uploaded record image */}
            <img
              src={imageSrc(current.id)}
              alt={current.name}
              className="max-h-[75vh] w-full rounded-md bg-black object-contain"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-white">
              <span>
                {open! + 1} of {images.length} · {current.name}
              </span>
              <span className="flex gap-2">
                <button type="button" className="rounded-md border border-white/30 px-3 py-1" onClick={() => setOpen((open! - 1 + images.length) % images.length)}>
                  Previous
                </button>
                <button type="button" className="rounded-md border border-white/30 px-3 py-1" onClick={() => setOpen((open! + 1) % images.length)}>
                  Next
                </button>
                {readOnly ? null : (
                  <button type="button" className="rounded-md border border-white/30 px-3 py-1" onClick={() => void remove(current)}>
                    Remove
                  </button>
                )}
                <button type="button" className="rounded-md border border-white/30 px-3 py-1" onClick={() => setOpen(null)}>
                  Close
                </button>
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
