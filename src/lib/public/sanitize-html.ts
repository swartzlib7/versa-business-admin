const BLOCK =
  /<(script|iframe|object|embed)[\s\S]*?<\/\1>|<\/?(script|iframe|object|embed)[^>]*>/gi;

/** Full-page canvas HTML. Styles stay. Scripts, frames, and inline handlers do not. */
export function sanitizeCanvasHtml(raw: string): string {
  return raw
    .replace(BLOCK, "")
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi, "");
}
