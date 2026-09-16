"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  Link as LinkIcon,
  Code2,
  Type,
  FileCode,
} from "lucide-react";

const SANITIZE =
  /<(script|iframe|object|embed|link|style)[\s\S]*?<\/\1>|<\/?(script|iframe|object|embed|link|style)[^>]*>/gi;

export type PageBodyFormat = "html" | "text";

export function sanitizePublicHtml(raw: string): string {
  return raw.replace(SANITIZE, "");
}

export function normalizePageBodyFormat(raw: string | undefined | null): PageBodyFormat {
  return raw === "text" ? "text" : "html";
}

function exec(cmd: string, value?: string) {
  document.execCommand(cmd, false, value);
}

function Segment({
  active,
  onClick,
  children,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      disabled={disabled}
      onClick={onClick}
      className={cn("h-7 px-2.5 text-xs", active && "pointer-events-none")}
    >
      {children}
    </Button>
  );
}

export function HtmlEditor({
  label = "Body",
  value,
  onChange,
  format = "html",
  onFormatChange,
  readOnly,
}: {
  label?: string;
  value: string;
  onChange?: (html: string) => void;
  format?: PageBodyFormat;
  onFormatChange?: (format: PageBodyFormat) => void;
  readOnly?: boolean;
}) {
  const mode = normalizePageBodyFormat(format);
  const [source, setSource] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const focused = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || focused.current || source || mode !== "html") return;
    if (el.innerHTML !== (value || "")) el.innerHTML = value || "";
  }, [value, source, mode]);

  if (readOnly) {
    return (
      <label className="flex flex-col gap-1.5">
        {label ? <span className="text-xs font-medium text-muted-foreground">{label}</span> : null}
        <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
          <HtmlBlock html={value} format={mode} />
        </div>
      </label>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-2 py-1.5">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className="flex flex-wrap items-center gap-1">
          <Segment
            active={mode === "text"}
            onClick={() => {
              setSource(false);
              onFormatChange?.("text");
            }}
          >
            <Type className="size-3.5" />
            Text
          </Segment>
          <Segment
            active={mode === "html"}
            onClick={() => onFormatChange?.("html")}
          >
            <FileCode className="size-3.5" />
            HTML
          </Segment>
        </div>
      </div>

      {mode === "html" && !source ? (
        <div className="flex flex-wrap gap-1 border-b border-border px-2 py-1.5">
          {(
            [
              ["Bold", () => exec("bold"), Bold],
              ["Italic", () => exec("italic"), Italic],
              ["Heading", () => exec("formatBlock", "h2"), Heading2],
              ["Subheading", () => exec("formatBlock", "h3"), Heading3],
              ["List", () => exec("insertUnorderedList"), List],
              [
                "Link",
                () => {
                  const url = window.prompt("Link URL");
                  if (url) exec("createLink", url);
                },
                LinkIcon,
              ],
            ] as const
          ).map(([name, fn, Icon]) => (
            <Button
              key={name}
              type="button"
              variant="ghost"
              size="icon-xs"
              title={name}
              onMouseDown={(e) => {
                e.preventDefault();
                fn();
                if (ref.current) onChange?.(sanitizePublicHtml(ref.current.innerHTML));
              }}
            >
              <Icon />
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto h-7 px-2 text-xs"
            onClick={() => setSource(true)}
          >
            <Code2 className="size-3.5" />
            Source
          </Button>
        </div>
      ) : null}

      {mode === "html" && source ? (
        <div className="flex justify-end border-b border-border px-2 py-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setSource(false)}
          >
            Visual
          </Button>
        </div>
      ) : null}

      {mode === "text" || (mode === "html" && source) ? (
        <textarea
          className={cn(
            "min-h-[280px] w-full resize-y bg-background px-3 py-2.5 text-sm focus:outline-none",
            mode === "html" && "font-mono text-[13px] leading-relaxed",
          )}
          value={value}
          placeholder={mode === "text" ? "Write the page…" : "<p>HTML…</p>"}
          onChange={(e) => onChange?.(mode === "html" ? sanitizePublicHtml(e.target.value) : e.target.value)}
        />
      ) : (
        <div
          ref={ref}
          role="textbox"
          aria-label={label}
          aria-multiline
          className="page-body-visual min-h-[280px] px-3 py-2.5 text-sm focus:outline-none prose prose-sm max-w-none dark:prose-invert"
          contentEditable
          suppressContentEditableWarning
          onFocus={() => {
            focused.current = true;
          }}
          onBlur={() => {
            focused.current = false;
            if (!ref.current) return;
            onChange?.(sanitizePublicHtml(ref.current.innerHTML));
          }}
          onInput={() => {
            if (!ref.current) return;
            onChange?.(sanitizePublicHtml(ref.current.innerHTML));
          }}
        />
      )}
    </div>
  );
}

export function HtmlBlock({
  html,
  format,
  className,
}: {
  html: string;
  format?: PageBodyFormat | string;
  className?: string;
}) {
  if (normalizePageBodyFormat(format) === "text") {
    return (
      <div className={className ?? "whitespace-pre-wrap text-sm leading-relaxed text-foreground"}>
        {html}
      </div>
    );
  }
  return (
    <div
      className={className ?? "prose prose-sm max-w-none text-foreground dark:prose-invert"}
      dangerouslySetInnerHTML={{ __html: sanitizePublicHtml(html) }}
    />
  );
}
