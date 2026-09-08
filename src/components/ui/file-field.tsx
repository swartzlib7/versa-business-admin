"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";

/**
 * Styled file picker. Native `<input type="file">` chrome ("Choose File" /
 * "No file chosen") is replaced with outline/ghost buttons so the control
 * matches the rest of VBA.
 */
export function FileField({
  accept,
  filename,
  emptyLabel = "No file chosen",
  chooseLabel = "Choose file",
  removeLabel = "Remove",
  hint,
  onFile,
  onRemove,
}: {
  accept?: string;
  filename?: string | null;
  emptyLabel?: string;
  chooseLabel?: string;
  removeLabel?: string;
  hint?: string;
  onFile: (file: File) => void;
  onRemove?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onFile(file);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          {chooseLabel}
        </Button>
        <span className="min-w-0 truncate text-sm text-muted-foreground">
          {filename || emptyLabel}
        </span>
        {filename && onRemove ? (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            {removeLabel}
          </Button>
        ) : null}
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
