"use client";

import { useState } from "react";
import { FileField } from "@/components/ui/file-field";
import { LOGO_MAX_BYTES } from "@/lib/brand-display";

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml,image/gif";

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read the image."));
    };
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.readAsDataURL(file);
  });
}

function fileLabel(value: string): string {
  if (!value) return "";
  if (value.startsWith("data:image/")) return "Uploaded image";
  try {
    return new URL(value).hostname;
  } catch {
    return "Image";
  }
}

export function ImageUrlField({
  label,
  value,
  onChange,
  required,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  required?: boolean;
  readOnly?: boolean;
}) {
  const [error, setError] = useState("");
  const preview = value.trim();

  if (readOnly) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
          {required ? " *" : ""}
        </span>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- operator preview of uploaded/data URL
          <img src={preview} alt="" className="h-16 w-16 rounded-md border border-border object-contain bg-muted/30" />
        ) : (
          <p className="text-sm">—</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element -- operator preview of uploaded/data URL
        <img src={preview} alt="" className="h-16 w-16 rounded-md border border-border object-contain bg-muted/30" />
      ) : null}
      <FileField
        accept={ACCEPT}
        filename={fileLabel(preview)}
        emptyLabel="No image chosen"
        chooseLabel="Upload image"
        removeLabel="Remove"
        hint="PNG, JPG, SVG, WebP, or GIF. Max 500 KB."
        onFile={async (file) => {
          if (!file.type.startsWith("image/")) {
            setError("Choose an image file.");
            return;
          }
          if (file.size > LOGO_MAX_BYTES) {
            setError("Image must be 500 KB or smaller.");
            return;
          }
          try {
            const data = await readDataUrl(file);
            setError("");
            onChange?.(data);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not read the image.");
          }
        }}
        onRemove={preview ? () => onChange?.("") : undefined}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
