"use client";

import { useEffect, useState, type ReactNode } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sanitizeCanvasHtml } from "@/lib/public/sanitize-html";
import {
  Bold,
  Code2,
  FileCode,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Type,
  Underline as UnderlineIcon,
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
  format?: PageBodyFormat | "page";
  onFormatChange?: (format: PageBodyFormat) => void;
  readOnly?: boolean;
}) {
  const mode = normalizePageBodyFormat(format);
  const [source, setSource] = useState(false);
  const visual = mode === "html" && !source && !readOnly;

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editable: visual,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: "Write the page…" }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "px-3 py-2.5 text-sm",
        "aria-label": label,
      },
    },
    onUpdate: ({ editor: current }) => {
      onChange?.(sanitizePublicHtml(current.getHTML()));
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(visual);
  }, [editor, visual]);

  useEffect(() => {
    if (!editor || editor.isFocused || source) return;
    const next = value || "";
    if (editor.getHTML() === next) return;
    editor.commands.setContent(next, { emitUpdate: false });
  }, [editor, value, source]);

  if (format === "page") {
    return (
      <label className="flex flex-col gap-1.5">
        {label ? <span className="text-xs font-medium text-muted-foreground">{label}</span> : null}
        <textarea
          className="min-h-[280px] w-full resize-y rounded-md border border-border bg-background px-3 py-2.5 font-mono text-[13px] leading-relaxed focus:outline-none"
          value={value}
          readOnly={readOnly}
          placeholder="<style>…</style><h1>Page</h1>"
          onChange={(e) => onChange?.(sanitizeCanvasHtml(e.target.value))}
        />
      </label>
    );
  }

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

  const mark = (name: string, run: () => void, Icon: typeof Bold, on: boolean) => (
    <Button
      key={name}
      type="button"
      variant={on ? "secondary" : "ghost"}
      size="icon-xs"
      title={name}
      onMouseDown={(e) => {
        e.preventDefault();
        run();
      }}
    >
      <Icon />
    </Button>
  );

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
          <Segment active={mode === "html"} onClick={() => onFormatChange?.("html")}>
            <FileCode className="size-3.5" />
            HTML
          </Segment>
        </div>
      </div>

      {visual && editor ? (
        <div className="flex flex-wrap gap-1 border-b border-border px-2 py-1.5">
          {mark("Bold", () => editor.chain().focus().toggleBold().run(), Bold, editor.isActive("bold"))}
          {mark("Italic", () => editor.chain().focus().toggleItalic().run(), Italic, editor.isActive("italic"))}
          {mark("Underline", () => editor.chain().focus().toggleUnderline().run(), UnderlineIcon, editor.isActive("underline"))}
          {mark("Heading", () => editor.chain().focus().toggleHeading({ level: 2 }).run(), Heading2, editor.isActive("heading", { level: 2 }))}
          {mark("Subheading", () => editor.chain().focus().toggleHeading({ level: 3 }).run(), Heading3, editor.isActive("heading", { level: 3 }))}
          {mark("List", () => editor.chain().focus().toggleBulletList().run(), List, editor.isActive("bulletList"))}
          {mark("Numbered list", () => editor.chain().focus().toggleOrderedList().run(), ListOrdered, editor.isActive("orderedList"))}
          {mark("Quote", () => editor.chain().focus().toggleBlockquote().run(), Quote, editor.isActive("blockquote"))}
          {mark(
            "Link",
            () => {
              const previous = editor.getAttributes("link").href as string | undefined;
              const url = window.prompt("Link URL", previous ?? "https://");
              if (url === null) return;
              if (!url.trim()) {
                editor.chain().focus().unsetLink().run();
                return;
              }
              editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
            },
            LinkIcon,
            editor.isActive("link"),
          )}
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
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setSource(false)}>
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
        <div className="page-html">
          <EditorContent editor={editor} />
        </div>
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
      <div className={className ?? "max-w-full whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground"}>
        {html}
      </div>
    );
  }
  return (
    <div
      className={className ?? "page-html max-w-full whitespace-normal break-words text-sm leading-relaxed text-foreground"}
      dangerouslySetInnerHTML={{ __html: sanitizePublicHtml(html) }}
    />
  );
}
