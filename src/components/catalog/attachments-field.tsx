"use client";

/**
 * Attachments field (1.0.14): any allowed file type, up to 10 per field.
 * Images show as thumbnails; other files show an icon with name and size.
 * Click a file to open it (PDFs and pictures open in the browser, others
 * download). Removing a file only drops it from this record; the stored file
 * is kept, so cancelling an edit never loses a document.
 */
import { useEffect, useRef, useState } from "react";
import { Download, File, FileArchive, FileSpreadsheet, FileText, Paperclip, X } from "lucide-react";
import {
  RECORD_FILE_MAX,
  formatFileSize,
  isImageMime,
  parseRecordFiles,
  type RecordFileRef,
} from "@/lib/records/record-file-refs";

function FileIcon({ mime }: { mime: string }) {
  const cls = "h-6 w-6 text-muted-foreground";
  if (mime.includes("spreadsheet") || mime.includes("excel") || mime === "text/csv") {
    return <FileSpreadsheet className={cls} aria-hidden />;
  }
  if (mime.includes("zip")) return <FileArchive className={cls} aria-hidden />;
  if (mime === "application/pdf" || mime.startsWith("text/") || mime.includes("word")) {
    return <FileText className={cls} aria-hidden />;
  }
  return <File className={cls} aria-hidden />;
}

type Limits = { types: Array<{ mime: string; label: string }>; max_bytes: number };

export function AttachmentsField({
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
  const files = parseRecordFiles(value);
  const editable = !readOnly && !!onChange;
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [limits, setLimits] = useState<Limits | null>(null);
  const picker = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editable) return;
    const controller = new AbortController();
    void fetch("/api/records/files", { credentials: "include", signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setLimits((json?.data as Limits) ?? null))
      .catch(() => undefined);
    return () => controller.abort();
  }, [editable]);

  const upload = async (picked: FileList | null) => {
    if (!picked?.length || !onChange) return;
    setError("");
    let current = files;
    const list = [...picked];
    for (let i = 0; i < list.length; i++) {
      if (current.length >= RECORD_FILE_MAX) {
        setError(`A field holds up to ${RECORD_FILE_MAX} files.`);
        break;
      }
      setBusy(list.length > 1 ? `Uploading ${i + 1} of ${list.length}…` : "Uploading…");
      try {
        const body = new FormData();
        body.set("file", list[i]);
        const res = await fetch("/api/records/files", { method: "POST", body, credentials: "include" });
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          setError(`${list[i].name}: ${json?.error?.message ?? "Could not upload the file."}`);
          continue;
        }
        current = [...current, json.data as RecordFileRef];
        onChange(JSON.stringify(current));
      } catch {
        setError(`${list[i].name}: Could not upload the file.`);
      }
    }
    setBusy("");
    if (picker.current) picker.current.value = "";
  };

  const remove = (id: string) => {
    onChange?.(JSON.stringify(files.filter((file) => file.id !== id)));
  };

  const accept = limits?.types.map((t) => t.mime).join(",") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {files.length ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {files.map((file) => {
            const href = `/api/records/files/${file.id}`;
            return (
              <li
                key={file.id}
                className="flex min-w-0 items-center gap-3 rounded-md border border-border bg-card/40 p-2"
              >
                <a href={href} target="_blank" rel="noopener noreferrer" className="shrink-0" title={`Open ${file.name}`}>
                  {isImageMime(file.mime) ? (
                    // eslint-disable-next-line @next/next/no-img-element -- authenticated file route, not a static asset
                    <img src={href} alt="" className="h-12 w-12 rounded object-cover" loading="lazy" />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded bg-muted/50">
                      <FileIcon mime={file.mime} />
                    </span>
                  )}
                </a>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1 hover:underline"
                  title={file.name}
                >
                  <span className="block truncate text-sm">{file.name}</span>
                  <span className="block text-[11px] text-muted-foreground">{formatFileSize(file.size)}</span>
                </a>
                <a
                  href={`${href}?download=1`}
                  className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={`Download ${file.name}`}
                  title="Download"
                >
                  <Download className="h-4 w-4" aria-hidden />
                </a>
                {editable ? (
                  <button
                    type="button"
                    onClick={() => remove(file.id)}
                    className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Remove ${file.name}`}
                    title="Remove from this record"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{editable ? "No files yet." : "—"}</p>
      )}
      {editable ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={picker}
            type="file"
            multiple
            accept={accept}
            className="hidden"
            onChange={(e) => void upload(e.target.files)}
          />
          <button
            type="button"
            disabled={!!busy || files.length >= RECORD_FILE_MAX}
            onClick={() => picker.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
          >
            <Paperclip className="h-3.5 w-3.5" aria-hidden />
            Add files
          </button>
          <span className="text-[11px] text-muted-foreground">
            {busy ||
              `${files.length} of ${RECORD_FILE_MAX}` +
                (limits ? ` · up to ${Math.round(limits.max_bytes / (1024 * 1024))} MB each` : "")}
          </span>
        </div>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
