"use client";

import { useEffect, useRef } from "react";
import { basicSetup, EditorView } from "codemirror";
import { html } from "@codemirror/lang-html";
import { EditorState } from "@codemirror/state";
import { sanitizeCanvasHtml } from "@/lib/public/sanitize-html";

const chrome = EditorView.theme({
  "&": {
    minHeight: "280px",
    maxHeight: "70vh",
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
    fontSize: "13px",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", lineHeight: "1.55" },
  ".cm-gutters": {
    backgroundColor: "var(--muted)",
    color: "var(--muted-foreground)",
    border: "none",
  },
  ".cm-activeLine": { backgroundColor: "color-mix(in oklab, var(--muted) 55%, transparent)" },
  ".cm-activeLineGutter": { backgroundColor: "transparent" },
});

export function HtmlCodeEditor({
  value,
  readOnly,
  onChange,
}: {
  value: string;
  readOnly?: boolean;
  onChange?: (html: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const parent = host.current;
    if (!parent) return;
    const view = new EditorView({
      parent,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          html(),
          chrome,
          EditorView.editable.of(!readOnly),
          EditorState.readOnly.of(Boolean(readOnly)),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged || readOnly) return;
            onChangeRef.current?.(sanitizeCanvasHtml(update.state.doc.toString()));
          }),
        ],
      }),
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Recreate only when editability changes. Value sync is the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current === value) return;
    view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
  }, [value]);

  return <div ref={host} className="min-h-[280px] overflow-hidden" />;
}
