"use client";

import { useEffect, useState } from "react";

const SIZE = 512;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that picture."));
    img.src = src;
  });
}

/** Scale so the shorter side is 512. Both sides stay at least 512. */
function scaleToCropSource(img: HTMLImageElement): HTMLCanvasElement {
  const scale = SIZE / Math.min(img.naturalWidth, img.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(SIZE, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(SIZE, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare the picture.");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function ProfilePictureField({
  label,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (next: string) => void;
  readOnly?: boolean;
}) {
  const [error, setError] = useState("");
  const [scaledUrl, setScaledUrl] = useState("");
  const [scaledSize, setScaledSize] = useState({ w: SIZE, h: SIZE });
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    return () => {
      if (scaledUrl.startsWith("blob:")) URL.revokeObjectURL(scaledUrl);
    };
  }, [scaledUrl]);

  const wide = scaledSize.w >= scaledSize.h;
  const travel = wide ? scaledSize.w - SIZE : scaledSize.h - SIZE;

  const onFile = async (file: File) => {
    setError("");
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      if (img.naturalWidth < SIZE || img.naturalHeight < SIZE) {
        setError("Picture must be at least 512×512 pixels.");
        return;
      }
      const scaled = scaleToCropSource(img);
      setScaledSize({ w: scaled.width, h: scaled.height });
      setOffset(0);
      setScaledUrl(scaled.toDataURL("image/jpeg", 0.92));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that picture.");
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const confirm = async () => {
    if (!scaledUrl) return;
    const img = await loadImage(scaledUrl);
    const out = document.createElement("canvas");
    out.width = SIZE;
    out.height = SIZE;
    const ctx = out.getContext("2d");
    if (!ctx) return;
    const sx = wide ? offset : 0;
    const sy = wide ? 0 : offset;
    ctx.drawImage(img, sx, sy, SIZE, SIZE, 0, 0, SIZE, SIZE);
    onChange?.(out.toDataURL("image/jpeg", 0.9));
    setScaledUrl("");
  };

  const previewShift = wide ? -offset * (160 / SIZE) : 0;
  const previewShiftY = wide ? 0 : -offset * (160 / SIZE);

  return (
    <div className="flex flex-col gap-1.5 sm:col-span-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {value && !scaledUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-16 w-16 rounded-md border border-border object-cover" />
      ) : null}
      {scaledUrl ? (
        <div className="space-y-2">
          <div className="h-40 w-40 overflow-hidden rounded-md border border-border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={scaledUrl}
              alt=""
              className="max-w-none"
              style={{
                width: (scaledSize.w * 160) / SIZE,
                height: (scaledSize.h * 160) / SIZE,
                marginLeft: previewShift,
                marginTop: previewShiftY,
              }}
            />
          </div>
          {travel > 0 ? (
            <input
              type="range"
              min={0}
              max={travel}
              value={offset}
              onChange={(e) => setOffset(Number(e.target.value))}
              aria-label="Crop position"
            />
          ) : null}
          <div className="flex gap-2">
            <button type="button" className="rounded-md border border-border px-3 py-1.5 text-xs" onClick={confirm}>
              Use this crop
            </button>
            <button type="button" className="rounded-md px-3 py-1.5 text-xs text-muted-foreground" onClick={() => setScaledUrl("")}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
      {!readOnly && !scaledUrl ? (
        <input
          type="file"
          accept="image/*"
          className="text-sm"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void onFile(file);
          }}
        />
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <p className="text-[11px] text-muted-foreground">
        At least 512×512. Larger pictures scale down in proportion, then you crop the 512×512 square that is stored.
      </p>
    </div>
  );
}
