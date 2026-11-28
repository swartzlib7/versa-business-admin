/**
 * PDF rendering (1.0.27, state_printing.md). pdfkit draws the pages; the layout is ours:
 *
 * - The body flows down the page. A block that does not fit goes to the next page; the lines
 *   table splits between rows and repeats its headings on each page.
 * - Header and footer bands take their room on each page they show on. The room a "last page
 *   only" footer needs is found at the end: if the body reaches into it, a page is added.
 *   A "last page only" header keeps its room on every page.
 * - Bands are drawn after the body, when the page count is known (Page n of N).
 */
import path from "node:path";
import PDFDocument from "pdfkit";
import {
  PAGE_SIZES,
  bandShows,
  pageSettings,
  type Align,
  type Band,
  type Block,
  type Layout,
  type LinesBlock,
  type OrganizationBlock,
} from "@/lib/print/template";
import type { PrintContext } from "@/lib/print/values";

const MM = 72 / 25.4;
const BASE = 9.5;
const GAP = 8;
const INK = "#111111";
const MUTED = "#666666";
const RULE = "#bbbbbb";
const SHADE = "#f1f1f1";

type Doc = InstanceType<typeof PDFDocument>;
type Fonts = { regular: string; bold: string; standard: boolean };

/** Characters the standard PDF fonts (WinAnsi) can show; others print as "?". */
const WIN_ANSI_EXTRA = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";
export function winAnsiSafe(s: string): string {
  let out = "";
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    out += c === 10 || (c >= 32 && c <= 126) || (c >= 160 && c <= 255) || WIN_ANSI_EXTRA.includes(ch) ? ch : "?";
  }
  return out;
}

class Pages {
  doc: Doc;
  fonts: Fonts;
  width: number;
  height: number;
  margin: number;
  page = 0;
  y = 0;
  top = 0;
  bottom = 0;

  constructor(
    private layout: Layout,
    private ctx: PrintContext,
    settings: ReturnType<typeof pageSettings>,
  ) {
    const [w, h] = PAGE_SIZES[settings.size] ?? PAGE_SIZES.letter;
    [this.width, this.height] = settings.orientation === "landscape" ? [h, w] : [w, h];
    this.margin = settings.margin_mm * MM;
    this.doc = new PDFDocument({
      size: [this.width, this.height],
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      bufferPages: true,
      autoFirstPage: false,
      info: { Title: `${ctx.typeLabel} ${ctx.record.name}`.trim(), Producer: "Versa - Business Admin" },
    });
    if (settings.font === "hack") {
      const dir = path.join(process.cwd(), "public", "fonts", "hack");
      this.doc.registerFont("Hack", path.join(dir, "hack-regular.woff2"));
      this.doc.registerFont("Hack-Bold", path.join(dir, "hack-bold.woff2"));
      this.fonts = { regular: "Hack", bold: "Hack-Bold", standard: false };
    } else if (settings.font === "times") {
      this.fonts = { regular: "Times-Roman", bold: "Times-Bold", standard: true };
    } else {
      this.fonts = { regular: "Helvetica", bold: "Helvetica-Bold", standard: true };
    }
  }

  get contentWidth() {
    return this.width - 2 * this.margin;
  }

  // ── text helpers ──
  t(s: string) {
    return this.fonts.standard ? winAnsiSafe(s) : s;
  }
  font(bold = false, size = BASE) {
    this.doc.font(bold ? this.fonts.bold : this.fonts.regular).fontSize(size);
  }
  measureText(s: string, width: number, bold = false, size = BASE) {
    if (!s) return 0;
    this.font(bold, size);
    return this.doc.heightOfString(this.t(s), { width, lineGap: 1 });
  }
  drawText(s: string, x: number, y: number, width: number, opts: { bold?: boolean; size?: number; align?: Align; color?: string } = {}) {
    if (!s) return 0;
    this.font(opts.bold, opts.size ?? BASE);
    this.doc.fillColor(opts.color ?? INK).text(this.t(s), x, y, { width, align: opts.align ?? "left", lineGap: 1 });
    return this.measureText(s, width, opts.bold, opts.size ?? BASE);
  }
  merge(s: string, page?: number, pages?: number) {
    return s.replace(/\{([a-z0-9_]+)\}/gi, (_, key: string) => {
      if (key === "page") return page ? String(page) : "";
      if (key === "pages") return pages ? String(pages) : "";
      if (key === "today") return this.ctx.today;
      return this.ctx.value(key);
    });
  }

  // ── blocks: measure and draw (page / pages only matter in bands) ──
  measure(block: Block, width: number): number {
    return this.block(block, 0, 0, width, false);
  }

  block(block: Block, x: number, y: number, width: number, draw: boolean, page?: number, pages?: number): number {
    switch (block.type) {
      case "text": {
        const s = this.merge(block.text ?? "", page ?? 1, pages ?? 1);
        const opts = { bold: block.bold, size: block.size ?? BASE, align: block.align, color: block.muted ? MUTED : INK };
        return draw ? this.drawText(s, x, y, width, opts) : this.measureText(s, width, block.bold, opts.size);
      }
      case "page_number": {
        const s = this.merge(block.format ?? "Page {page} of {pages}", page ?? 1, pages ?? 1);
        return draw ? this.drawText(s, x, y, width, { size: 8, align: block.align ?? "right", color: MUTED }) : this.measureText(s, width, false, 8);
      }
      case "spacer":
        return Math.max(0, Number(block.height ?? 4)) * MM;
      case "divider":
        if (draw) this.doc.moveTo(x, y + 3).lineTo(x + width, y + 3).lineWidth(0.6).strokeColor(RULE).stroke();
        return 6;
      case "fields":
        return this.fields(block.fields ?? [], Math.min(Math.max(Number(block.columns ?? 2), 1), 4), block.labels !== false, x, y, width, draw, block.size);
      case "organization":
        return this.organization(block, x, y, width, draw);
      case "signature":
        return this.signature(block.label, block.lines, x, y, width, draw);
      case "columns": {
        const cols = block.columns ?? [];
        if (!cols.length) return 0;
        const gap = 14;
        const weights = cols.map((_, i) => Math.max(0.1, Number(block.widths?.[i] ?? 1)));
        const total = weights.reduce((a, b) => a + b, 0);
        let cx = x;
        let tallest = 0;
        cols.forEach((col, i) => {
          const w = ((width - gap * (cols.length - 1)) * weights[i]) / total;
          let cy = y;
          col.forEach((b, j) => {
            cy += this.block(b, cx, cy, w, draw, page, pages) + (j < col.length - 1 ? 4 : 0);
          });
          tallest = Math.max(tallest, cy - y);
          cx += w + gap;
        });
        return tallest;
      }
      case "lines":
        // Measured as a whole (used only for a table inside columns or a band, which the
        // template check refuses for bands); the body flows it row by row instead.
        return this.table(block, x, y, width, draw, Infinity).height;
      default:
        return 0;
    }
  }

  fields(fields: string[], columns: number, labels: boolean, x: number, y: number, width: number, draw: boolean, size?: number) {
    const shown = fields.filter((f) => this.ctx.value(f) !== "");
    const gap = 12;
    const w = (width - gap * (columns - 1)) / columns;
    let rowY = y;
    for (let i = 0; i < shown.length; i += columns) {
      let rowH = 0;
      shown.slice(i, i + columns).forEach((f, j) => {
        const cx = x + j * (w + gap);
        let h = 0;
        if (labels) {
          h += draw ? this.drawText(this.ctx.label(f), cx, rowY, w, { size: 7.5, color: MUTED }) : this.measureText(this.ctx.label(f), w, false, 7.5);
          h += 1;
        }
        const value = this.ctx.value(f);
        h += draw ? this.drawText(value, cx, rowY + h, w, { size: size ?? BASE }) : this.measureText(value, w, false, size ?? BASE);
        rowH = Math.max(rowH, h);
      });
      rowY += rowH + 5;
    }
    return shown.length ? rowY - y - 5 : 0;
  }

  organization(block: OrganizationBlock, x: number, y: number, width: number, draw: boolean) {
    const org = this.ctx.organization(block.source, block.location);
    if (!org) return 0;
    const show = new Set(block.show ?? ["logo", "name", "address", "phone", "email"]);
    const align = block.align ?? "left";
    let h = 0;
    if (block.title) {
      h += draw ? this.drawText(block.title.toUpperCase(), x, y + h, width, { size: 7.5, bold: true, color: MUTED, align }) : this.measureText(block.title.toUpperCase(), width, true, 7.5);
      h += 2;
    }
    if (show.has("logo") && org.logo) {
      try {
        // openImage is in pdfkit, not in its type definitions.
        const img = (this.doc as unknown as { openImage: (src: Buffer) => { width: number; height: number } }).openImage(org.logo);
        const maxW = Math.min(width, 160);
        const maxH = 46;
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);
        const iw = img.width * scale;
        const ih = img.height * scale;
        if (draw) {
          const ix = align === "right" ? x + width - iw : align === "center" ? x + (width - iw) / 2 : x;
          this.doc.image(org.logo, ix, y + h, { width: iw, height: ih });
        }
        h += ih + 4;
      } catch {
        /* an unreadable logo is left out */
      }
    }
    const lines: Array<{ s: string; bold?: boolean; size?: number }> = [];
    if (show.has("name") && org.name) lines.push({ s: org.name, bold: true, size: 10.5 });
    if (show.has("address")) for (const l of org.lines) lines.push({ s: l });
    if (show.has("phone") && org.phone) lines.push({ s: org.phone });
    if (show.has("email") && org.email) lines.push({ s: org.email });
    for (const l of lines) {
      h += draw ? this.drawText(l.s, x, y + h, width, { bold: l.bold, size: l.size, align }) : this.measureText(l.s, width, l.bold, l.size);
    }
    return h;
  }

  signature(label: string | undefined, captions: string[] | undefined, x: number, y: number, width: number, draw: boolean) {
    const parts = captions?.length ? captions : ["Signature", "Printed name", "Date"];
    let h = 0;
    if (label) {
      h += draw ? this.drawText(label, x, y, width, { bold: true }) : this.measureText(label, width, true);
      h += 4;
    }
    const gap = 16;
    const w = (width - gap * (parts.length - 1)) / parts.length;
    const lineY = y + h + 22;
    if (draw) {
      parts.forEach((caption, i) => {
        const cx = x + i * (w + gap);
        this.doc.moveTo(cx, lineY).lineTo(cx + w, lineY).lineWidth(0.6).strokeColor(INK).stroke();
        this.drawText(caption, cx, lineY + 3, w, { size: 7.5, color: MUTED });
      });
    }
    return h + 22 + 3 + this.measureText("Ag", w, false, 7.5);
  }

  // ── the lines table ──
  tableColumns(block: LinesBlock, width: number) {
    const cols = (block.columns ?? []).map((c) => {
      const numeric = this.ctx.isNumeric(c.field);
      return {
        field: c.field,
        label: c.label ?? this.ctx.label(c.field),
        align: (c.align ?? (numeric ? "right" : "left")) as Align,
        weight: Math.max(0.2, Number(c.width ?? (numeric ? 1 : 2.5))),
      };
    });
    const total = cols.reduce((a, c) => a + c.weight, 0) || 1;
    return cols.map((c) => ({ ...c, w: (width * c.weight) / total }));
  }

  tableRows(block: LinesBlock) {
    const only = block.only_with;
    return this.ctx.lines(block.group).filter((l) => !only || String(l[only] ?? "").trim() !== "");
  }

  /** Draw (or measure) the table from row `from` while it fits above `limit`; returns where it stopped. */
  table(block: LinesBlock, x: number, y: number, width: number, draw: boolean, limit: number, from = 0) {
    const cols = this.tableColumns(block, width);
    const pad = 3;
    const headH = Math.max(...cols.map((c) => this.measureText(c.label, c.w - 2 * pad, true, 8))) + 2 * pad;
    const rows = this.tableRows(block);
    let cy = y;
    if (draw) {
      this.doc.rect(x, cy, width, headH).fill(SHADE);
      let cx = x;
      for (const c of cols) {
        this.drawText(c.label, cx + pad, cy + pad, c.w - 2 * pad, { bold: true, size: 8, align: c.align });
        cx += c.w;
      }
    }
    cy += headH;
    let i = from;
    for (; i < rows.length; i++) {
      const cells = cols.map((c) => this.ctx.lineValue(rows[i], c.field));
      const rowH = Math.max(...cells.map((s, k) => this.measureText(s, cols[k].w - 2 * pad, false, 9))) + 2 * pad;
      if (cy + rowH > limit && i > from) break;
      if (draw) {
        let cx = x;
        cells.forEach((s, k) => {
          this.drawText(s, cx + pad, cy + pad, cols[k].w - 2 * pad, { size: 9, align: cols[k].align });
          cx += cols[k].w;
        });
        this.doc.moveTo(x, cy + rowH).lineTo(x + width, cy + rowH).lineWidth(0.4).strokeColor(RULE).stroke();
      }
      cy += rowH;
    }
    return { height: cy - y, next: i, done: i >= rows.length };
  }

  totals(block: LinesBlock, x: number, y: number, width: number, draw: boolean) {
    const items = (block.totals ?? []).filter((t) => this.ctx.value(t.field) !== "");
    if (!items.length) return 0;
    const w = Math.min(width, 230);
    const lx = x + width - w;
    let h = 4;
    for (const t of items) {
      const bold = t.bold ?? false;
      const label = t.label ?? this.ctx.label(t.field);
      const value = this.ctx.value(t.field);
      const rowH = Math.max(this.measureText(label, w * 0.55, bold), this.measureText(value, w * 0.45, bold)) + 3;
      if (draw) {
        this.drawText(label, lx, y + h, w * 0.55, { bold, color: bold ? INK : MUTED });
        this.drawText(value, lx + w * 0.55, y + h, w * 0.45, { bold, align: "right" });
      }
      h += rowH;
    }
    return h;
  }

  // ── bands ──
  bands(area: "header" | "footer", page: number, pages: number | null, reserveLast: boolean): Band[] {
    return this.layout.bands.filter((b) => b.area === area && (bandShows(b, page, pages) || (reserveLast && b.shows_on === "last")));
  }
  bandHeight(bands: Band[]) {
    if (!bands.length) return 0;
    let h = 0;
    for (const band of bands) {
      for (const b of band.blocks ?? []) h += this.measure(b, this.contentWidth) + 4;
    }
    return h + 6;
  }

  newPage() {
    this.doc.addPage({ size: [this.width, this.height], margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    this.page += 1;
    this.top = this.margin + this.bandHeight(this.bands("header", this.page, null, true));
    this.bottom = this.height - this.margin - this.bandHeight(this.bands("footer", this.page, null, false));
    this.y = this.top;
  }

  render(): Doc {
    this.newPage();
    const width = this.contentWidth;
    const x = this.margin;
    for (const block of this.layout.body) {
      if (block.type === "lines") {
        let from = 0;
        for (let guard = 0; guard < 500; guard++) {
          const res = this.table(block, x, this.y, width, false, this.bottom, from);
          const fitsHeadingAndRow = res.next > from || this.tableRows(block).length === 0;
          if (!fitsHeadingAndRow && this.y > this.top) {
            this.newPage();
            continue;
          }
          this.table(block, x, this.y, width, true, this.bottom, from);
          this.y += res.height;
          from = res.next;
          if (res.done) break;
          this.newPage();
        }
        const th = this.totals(block, x, this.y, width, false);
        if (th) {
          if (this.y + th > this.bottom && this.y > this.top) this.newPage();
          this.totals(block, x, this.y, width, true);
          this.y += th;
        }
        this.y += GAP;
        continue;
      }
      const h = this.measure(block, width);
      if (h === 0) continue;
      if (this.y + h > this.bottom && this.y > this.top) this.newPage();
      this.block(block, x, this.y, width, true);
      this.y += h + GAP;
    }
    // A "last page only" footer needs its room on the last page.
    const lastFooter = this.bandHeight(this.bands("footer", this.page, this.page, false));
    if (this.y - GAP > this.height - this.margin - lastFooter) this.newPage();

    const pages = this.page;
    for (let p = 1; p <= pages; p++) {
      this.doc.switchToPage(p - 1);
      let hy = this.margin;
      for (const band of this.bands("header", p, pages, false)) {
        for (const b of band.blocks ?? []) hy += this.block(b, x, hy, width, true, p, pages) + 4;
      }
      const footers = this.bands("footer", p, pages, false);
      let fy = this.height - this.margin - this.bandHeight(footers) + 6;
      for (const band of footers) {
        for (const b of band.blocks ?? []) fy += this.block(b, x, fy, width, true, p, pages) + 4;
      }
    }
    return this.doc;
  }
}

/** The record printed with a template's layout and page settings, as PDF bytes. */
export function renderPdf(layout: Layout, settings: ReturnType<typeof pageSettings>, ctx: PrintContext): Promise<{ pdf: Buffer; pages: number }> {
  const pages = new Pages(layout, ctx, settings);
  const doc = pages.render();
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve({ pdf: Buffer.concat(chunks), pages: pages.page }));
    doc.on("error", reject);
    doc.end();
  });
}
