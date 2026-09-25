import { sanitizeCanvasHtml } from "@/lib/public/sanitize-html";

const STYLE = /<style[^>]*>[\s\S]*?<\/style>/gi;
const SHEET = /<link\b[^>]*rel=["']?stylesheet["']?[^>]*>/gi;

/** Page-level selectors become the shadow host, so the page's own background and font apply. */
function hostCss(block: string): string {
  return block
    .replace(/:root\b/g, ":host")
    .replace(/\bhtml\s*,\s*body\b/g, ":host")
    .replace(/(^|[\s,}])(html|body)(?=\s*[{,])/g, "$1:host");
}

export type CanvasHtmlParts = { css: string; sheets: string; body: string };

/** Split a Full page record into its styles, stylesheet links, and body markup. */
export function canvasHtmlParts(raw: string): CanvasHtmlParts {
  const safe = sanitizeCanvasHtml(raw);
  const head = /<head[^>]*>([\s\S]*?)<\/head>/i.exec(safe)?.[1] ?? "";
  const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(safe);
  const source = bodyMatch ? bodyMatch[1] : safe;
  const css = [...head.matchAll(STYLE), ...source.matchAll(STYLE)].map((m) => hostCss(m[0])).join("");
  const sheets = [...head.matchAll(SHEET), ...source.matchAll(SHEET)].map((m) => m[0]).join("");
  const body = source
    .replace(STYLE, "")
    .replace(SHEET, "")
    .replace(/<!doctype[^>]*>|<\/?(html|head|body)\b[^>]*>|<meta\b[^>]*>|<title>[\s\S]*?<\/title>/gi, "");
  return { css, sheets, body };
}

/** Shadow-root markup for a Full page body, with optional canvas stylesheet styles first. */
export function canvasHtmlMarkup(html: string, stylesheet?: string): { root: string; sheets: string } {
  const page = canvasHtmlParts(html);
  const shared = stylesheet ? canvasHtmlParts(stylesheet) : { css: "", sheets: "", body: "" };
  const sheets = shared.sheets + page.sheets;
  return {
    root: `<style>:host{display:block}</style>${sheets}${shared.css}${page.css}${page.body}`,
    sheets,
  };
}
