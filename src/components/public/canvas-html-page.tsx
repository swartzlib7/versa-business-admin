import { ShadowHtml } from "@/components/public/shadow-html";
import { canvasHtmlMarkup } from "@/lib/public/canvas-html";
import { cn } from "@/lib/utils";

/** A full HTML page, isolated from the site stylesheet, still readable by search engines. */
export function CanvasHtmlPage({
  html,
  stylesheet,
  belowHeader = true,
}: {
  html: string;
  stylesheet?: string;
  belowHeader?: boolean;
}) {
  const { root, sheets } = canvasHtmlMarkup(html, stylesheet);
  return (
    <ShadowHtml
      root={root}
      sheets={sheets}
      className={cn("canvas-html-host min-h-[70vh] w-full", belowHeader && "pt-28")}
    />
  );
}
