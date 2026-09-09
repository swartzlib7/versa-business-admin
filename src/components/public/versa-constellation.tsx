"use client";

import { useEffect, useRef } from "react";
import {
  SKY_DENSITY_DEFAULT,
  SKY_DENSITY_LEVEL_DEFAULT,
  SKY_FREQ_MIN,
  clampSkyFrequency,
  clampSkyZoom,
  resolveSkyEffects,
  skyDensityLevel,
  type SkyEffects,
} from "@/lib/brand-display";

export type ConstellationVariant = "classic" | "realistic";

type Star = {
  x: number;
  y: number;
  r: number;
  phase: number;
  twinkle: number;
  bright: number;
  depth: number;
  tone: 0 | 1 | 2;
  flicker: boolean;
  jitter: number;
  tint?: Rgb;
  glint?: boolean;
};

type Meteor = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  length: number;
};

type Satellite = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
  panels: boolean;
};

type RockVert = { x: number; y: number };
type RockFacet = { pts: RockVert[]; shade: number };

type AsteroidTint = {
  id: "gold" | "ice" | "emerald" | "royal" | "silver";
  rock: Rgb;
  facetWarm: Rgb;
  facetCool: Rgb;
  lit0: Rgb;
  lit1: Rgb;
  lit2: Rgb;
  lit3: Rgb;
  stroke: Rgb;
  gleam: Rgb;
};

const ASTEROID_TINTS: AsteroidTint[] = [
  {
    id: "gold",
    rock: [58, 50, 46],
    facetWarm: [92, 72, 58],
    facetCool: [38, 34, 32],
    lit0: [255, 252, 240],
    lit1: [255, 228, 178],
    lit2: [255, 176, 98],
    lit3: [120, 78, 48],
    stroke: [220, 190, 150],
    gleam: [255, 255, 250],
  },
  {
    id: "ice",
    rock: [46, 58, 72],
    facetWarm: [88, 130, 168],
    facetCool: [28, 42, 58],
    lit0: [240, 252, 255],
    lit1: [176, 220, 255],
    lit2: [98, 176, 255],
    lit3: [48, 88, 140],
    stroke: [170, 210, 240],
    gleam: [250, 255, 255],
  },
  {
    id: "emerald",
    rock: [36, 52, 42],
    facetWarm: [48, 140, 92],
    facetCool: [22, 40, 32],
    lit0: [236, 255, 244],
    lit1: [140, 230, 180],
    lit2: [40, 176, 110],
    lit3: [24, 88, 56],
    stroke: [140, 210, 170],
    gleam: [250, 255, 248],
  },
  {
    id: "royal",
    rock: [62, 32, 36],
    facetWarm: [168, 48, 62],
    facetCool: [48, 22, 28],
    lit0: [255, 240, 242],
    lit1: [255, 140, 150],
    lit2: [196, 36, 58],
    lit3: [110, 24, 40],
    stroke: [230, 160, 168],
    gleam: [255, 250, 250],
  },
  {
    id: "silver",
    rock: [52, 54, 58],
    facetWarm: [140, 146, 154],
    facetCool: [36, 38, 42],
    lit0: [255, 255, 255],
    lit1: [220, 226, 232],
    lit2: [168, 176, 186],
    lit3: [88, 92, 100],
    stroke: [210, 214, 220],
    gleam: [255, 255, 255],
  },
];

/** Real-sky comet looks, cycled like asteroid tints.
 *  dust: sunlight on dust (pale yellow / off-white)
 *  ion: CO⁺ plasma tail (blue)
 *  coma: C₂ / CN green head (larger coma, quieter tail)
 *  sodium: Hale–Bopp / McNaught orange-yellow
 */
type CometPalette = {
  id: "dust" | "ion" | "coma" | "sodium";
  nucleus: Rgb;
  comaInner: Rgb;
  comaOuter: Rgb;
  path: Rgb;
  trail: Rgb;
  comaR: number;
  pathGain: number;
  pathWidth: number;
};

const COMET_PALETTES: CometPalette[] = [
  {
    id: "dust",
    nucleus: [255, 255, 248],
    comaInner: [255, 248, 220],
    comaOuter: [255, 226, 168],
    path: [255, 244, 210],
    trail: [255, 236, 186],
    comaR: 10,
    pathGain: 1,
    pathWidth: 1.22,
  },
  {
    id: "ion",
    nucleus: [245, 252, 255],
    comaInner: [186, 220, 255],
    comaOuter: [64, 148, 255],
    path: [118, 188, 255],
    trail: [86, 168, 255],
    comaR: 9,
    pathGain: 1.12,
    pathWidth: 0.82,
  },
  {
    id: "coma",
    nucleus: [250, 255, 246],
    comaInner: [158, 255, 138],
    comaOuter: [36, 196, 72],
    path: [210, 255, 220],
    trail: [168, 240, 176],
    comaR: 15,
    pathGain: 0.48,
    pathWidth: 0.9,
  },
  {
    id: "sodium",
    nucleus: [255, 250, 230],
    comaInner: [255, 210, 118],
    comaOuter: [255, 138, 36],
    path: [255, 188, 64],
    trail: [255, 164, 42],
    comaR: 10,
    pathGain: 1,
    pathWidth: 1.05,
  },
];

type Asteroid = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  t: number;
  speed: number;
  sx: number;
  sy: number;
  cx: number;
  cy: number;
  ex: number;
  ey: number;
  born: number;
  size: number;
  phase: number;
  flicker: number;
  spin: number;
  spinSpeed: number;
  rock: RockVert[];
  facets: RockFacet[];
  tint: AsteroidTint;
};

type AsteroidDust = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  r: number;
  color: Rgb;
  spark: boolean;
  phase: number;
  twinkle: number;
};

type CometTrail = {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  r: number;
  color: Rgb;
};

type TrueComet = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  t: number;
  speed: number;
  sx: number;
  sy: number;
  cx: number;
  cy: number;
  ex: number;
  ey: number;
  born: number;
  size: number;
  phase: number;
  path: { x: number; y: number }[];
  palette: CometPalette;
};

type Rgb = [number, number, number];

type AuroraRay = {
  u: number;
  phase: number;
  length: number;
  width: number;
  bright: number;
};

type AuroraSheet = {
  phase: number;
  foldAmp: number;
  foldFreq: number;
  height: number;
  tilt: number;
};

type Aurora = {
  side: 1 | -1;
  life: number;
  maxLife: number;
  originX: number;
  originY: number;
  sheets: AuroraSheet[];
  rays: AuroraRay[];
};

const AURORA_VIOLET: Rgb = [168, 118, 255];
const AURORA_CYAN: Rgb = [56, 230, 236];
const AURORA_GREEN: Rgb = [72, 255, 156];
const AURORA_LIME: Rgb = [186, 255, 140];
const AURORA_MAGENTA: Rgb = [255, 92, 168];

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function gauss() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * v);
}

function readVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function resolveRgb(value: string, fallback: Rgb): Rgb {
  const probe = document.createElement("span");
  probe.style.color = value;
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();
  const m = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return fallback;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function rgba(rgb: Rgb, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;
}

function readTheme() {
  const fg = resolveRgb(readVar("--foreground") || "oklch(0.93 0 0)", [240, 240, 240]);
  const primary = resolveRgb(readVar("--primary") || "oklch(0.5 0 0)", [99, 102, 241]);
  const destructive = resolveRgb(readVar("--destructive") || "oklch(0.58 0.2 25)", [225, 29, 46]);
  return { fg, primary, destructive };
}

function bandAnchor(t: number, w: number, h: number) {
  return {
    x: -0.06 * w + t * 1.12 * w,
    y: 0.82 * h - t * 0.68 * h,
  };
}

function placeInBand(w: number, h: number): { x: number; y: number } {
  const t = Math.random();
  const anchor = bandAnchor(t, w, h);
  const spread = (0.035 + Math.sin(t * Math.PI) * 0.055) * h;
  const nx = -0.68;
  const ny = -1.12;
  const mag = Math.hypot(nx, ny) || 1;
  const off = gauss() * spread;
  const along = gauss() * 10;
  return {
    x: anchor.x + (nx / mag) * off + (ny / mag) * along,
    y: anchor.y + (ny / mag) * off - (nx / mag) * along,
  };
}

// Natural star colors for the realistic sky: white through blue-white to
// warm amber, weighted toward white so the field reads like a real night sky.
const NATURAL_TINTS: { c: Rgb; w: number }[] = [
  { c: [255, 255, 255], w: 0.42 },
  { c: [214, 226, 255], w: 0.24 },
  { c: [255, 244, 214], w: 0.18 },
  { c: [255, 214, 170], w: 0.09 },
  { c: [201, 218, 255], w: 0.07 },
];

function naturalTint(): Rgb {
  let roll = Math.random();
  for (const t of NATURAL_TINTS) {
    roll -= t.w;
    if (roll <= 0) return t.c;
  }
  return NATURAL_TINTS[0].c;
}

function drawGlint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: Rgb,
  alpha: number,
  jitter: number,
) {
  const rot = ((jitter % 1) - 0.5) * 0.22;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const bloomR = r * 3.4;
  const bloom = ctx.createRadialGradient(0, 0, 0, 0, 0, bloomR);
  bloom.addColorStop(0, rgba(color, alpha * 0.5));
  bloom.addColorStop(0.4, rgba(color, alpha * 0.12));
  bloom.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = bloom;
  ctx.beginPath();
  ctx.arc(0, 0, bloomR, 0, Math.PI * 2);
  ctx.fill();

  const spike = (angle: number, length: number, width: number, peak: number) => {
    ctx.save();
    ctx.rotate(angle);
    const g = ctx.createLinearGradient(0, -length, 0, length);
    g.addColorStop(0, rgba(color, 0));
    g.addColorStop(0.42, rgba(color, alpha * 0.08));
    g.addColorStop(0.5, rgba(color, alpha * peak));
    g.addColorStop(0.58, rgba(color, alpha * 0.08));
    g.addColorStop(1, rgba(color, 0));
    ctx.strokeStyle = g;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, -length);
    ctx.lineTo(0, length);
    ctx.stroke();
    ctx.restore();
  };
  spike(0, r * 7.6, 0.55, 0.78);
  spike(Math.PI / 2, r * 5.2, 0.42, 0.55);
  if (r > 1.7) {
    spike(Math.PI / 4, r * 3.1, 0.28, 0.28);
    spike(-Math.PI / 4, r * 3.1, 0.28, 0.28);
  }
  ctx.restore();
}

function bezier1(t: number, a: number, b: number, c: number): number {
  const u = 1 - t;
  return u * u * a + 2 * u * t * b + t * t * c;
}

function bezier1d(t: number, a: number, b: number, c: number): number {
  return 2 * (1 - t) * (b - a) + 2 * t * (c - b);
}

function makeAsteroidRock(): { rock: RockVert[]; facets: RockFacet[] } {
  const n = 20;
  const rock: RockVert[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rand(-0.07, 0.07);
    const r = 0.92 + Math.random() * 0.72;
    const squash = 0.86 + Math.random() * 0.08;
    rock.push({ x: Math.cos(a) * r, y: Math.sin(a) * r * squash });
  }
  const facets: RockFacet[] = [];
  for (let k = 0; k < 9; k++) {
    const i = (k * 3 + Math.floor(Math.random() * 2)) % n;
    const j = (i + 1 + Math.floor(Math.random() * 2)) % n;
    const m = (j + 1 + Math.floor(Math.random() * 3)) % n;
    const inward = 0.18 + Math.random() * 0.38;
    const cx = (rock[i].x + rock[j].x + rock[m].x) * (inward / 3);
    const cy = (rock[i].y + rock[j].y + rock[m].y) * (inward / 3);
    facets.push({
      pts: [rock[i], rock[j], { x: cx, y: cy }],
      shade: rand(0.12, 0.62),
    });
  }
  for (let k = 0; k < 4; k++) {
    const i = Math.floor(Math.random() * n);
    const j = (i + 4 + Math.floor(Math.random() * 4)) % n;
    const m = (i + 8 + Math.floor(Math.random() * 4)) % n;
    facets.push({
      pts: [rock[i], rock[j], rock[m]],
      shade: rand(0.08, 0.4),
    });
  }
  return { rock, facets };
}

function drawAsteroidHead(
  ctx: CanvasRenderingContext2D,
  c: Asteroid,
  driftX: number,
  driftY: number,
  scale: number,
) {
  const x = c.x + driftX * 0.1;
  const y = c.y + driftY * 0.1;
  const appear = Math.min(1, c.born / 0.28);
  const glow =
    appear *
    (0.78 + 0.22 * (0.5 + 0.5 * Math.sin(c.phase)) * (Math.sin(c.phase * 2.7) > 0.82 ? 0.55 : 1));
  const heading = Math.atan2(c.vy, c.vx);
  const tint = c.tint;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(heading);
  ctx.rotate(c.spin);
  ctx.scale(scale * c.size, scale * c.size);

  ctx.beginPath();
  ctx.moveTo(c.rock[0].x, c.rock[0].y);
  for (let i = 1; i < c.rock.length; i++) ctx.lineTo(c.rock[i].x, c.rock[i].y);
  ctx.closePath();
  ctx.fillStyle = rgba(tint.rock, 0.96 * appear);
  ctx.fill();

  ctx.save();
  ctx.clip();
  for (const f of c.facets) {
    ctx.beginPath();
    ctx.moveTo(f.pts[0].x, f.pts[0].y);
    for (let i = 1; i < f.pts.length; i++) ctx.lineTo(f.pts[i].x, f.pts[i].y);
    ctx.closePath();
    const cool = f.shade < 0.28;
    ctx.fillStyle = cool
      ? rgba(tint.facetCool, (0.35 + f.shade) * appear)
      : rgba(tint.facetWarm, (0.22 + f.shade * 0.55) * appear);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(c.rock[0].x, c.rock[0].y);
  for (let i = 1; i < c.rock.length; i++) ctx.lineTo(c.rock[i].x, c.rock[i].y);
  ctx.closePath();
  const ca = Math.cos(-c.spin);
  const sa = Math.sin(-c.spin);
  const lit = ctx.createLinearGradient(ca * 1.4, sa * 1.4, ca * -1.1, sa * -1.1);
  lit.addColorStop(0, rgba(tint.lit0, 0.92 * glow));
  lit.addColorStop(0.1, rgba(tint.lit1, 0.72 * glow));
  lit.addColorStop(0.28, rgba(tint.lit2, 0.42 * glow));
  lit.addColorStop(0.58, rgba(tint.lit3, 0.12 * glow));
  lit.addColorStop(1, rgba([24, 20, 18], 0));
  ctx.fillStyle = lit;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(ca * 0.62, sa * 0.62, 0.32, 0.16, Math.atan2(sa, ca), 0, Math.PI * 2);
  ctx.fillStyle = rgba(tint.gleam, 0.7 * glow);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = rgba(tint.stroke, 0.72 * glow);
  ctx.lineWidth = 0.08;
  ctx.lineJoin = "miter";
  ctx.stroke();
  ctx.restore();
}

function drawAsteroidDust(
  ctx: CanvasRenderingContext2D,
  p: AsteroidDust,
  driftX: number,
  driftY: number,
  scale: number,
) {
  const fade = Math.max(0, 1 - p.life / p.maxLife);
  if (fade <= 0.01) return;
  const x = p.x + driftX * 0.1;
  const y = p.y + driftY * 0.1;
  const flicker = 0.18 + 0.82 * (0.5 + 0.5 * Math.sin(p.phase));
  const wink = Math.sin(p.phase * 3.2) > 0.72 ? 1.35 : 0.55;
  const spark = p.spark ? wink : 1;
  const alpha = fade * flicker * spark * (p.spark ? 0.95 : 0.42);
  const color: Rgb = p.spark ? [255, 255, 255] : p.color;
  const r = Math.max(0.15, p.r * scale * (0.65 + 0.35 * flicker));
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = rgba(color, alpha);
  ctx.fill();
  if (p.spark && flicker > 0.62 && fade > 0.2) {
    const spike = r * 3.4;
    ctx.strokeStyle = rgba(p.color, alpha * 0.85);
    ctx.lineWidth = 0.35 * scale;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - spike, y);
    ctx.lineTo(x + spike, y);
    ctx.moveTo(x, y - spike);
    ctx.lineTo(x, y + spike);
    ctx.stroke();
  }
}

function drawCometPath(
  ctx: CanvasRenderingContext2D,
  c: TrueComet,
  driftX: number,
  driftY: number,
  scale: number,
) {
  const pts = c.path;
  if (pts.length < 2) return;
  const appear = Math.min(1, c.born / 1.8);
  const n = pts.length - 1;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 1; i < pts.length; i++) {
    const t = i / n;
    const a = appear * t * t * 0.7;
    if (a < 0.02) continue;
    ctx.strokeStyle = rgba(c.palette.path, a * c.palette.pathGain);
    ctx.lineWidth = (0.45 + 1.65 * t) * scale * c.size * c.palette.pathWidth;
    ctx.beginPath();
    ctx.moveTo(pts[i - 1].x + driftX * 0.08, pts[i - 1].y + driftY * 0.08);
    ctx.lineTo(pts[i].x + driftX * 0.08, pts[i].y + driftY * 0.08);
    ctx.stroke();
  }
}

function drawCometTrail(
  ctx: CanvasRenderingContext2D,
  p: CometTrail,
  driftX: number,
  driftY: number,
  scale: number,
) {
  const fade = Math.max(0, 1 - p.life / p.maxLife);
  if (fade <= 0.02) return;
  const x = p.x + driftX * 0.08;
  const y = p.y + driftY * 0.08;
  const alpha = fade * fade * 0.72;
  const r = Math.max(0.35, p.r * scale * (0.45 + 0.55 * fade));
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = rgba(p.color, alpha);
  ctx.fill();
}

function drawTrueComet(
  ctx: CanvasRenderingContext2D,
  c: TrueComet,
  driftX: number,
  driftY: number,
  scale: number,
) {
  const x = c.x + driftX * 0.08;
  const y = c.y + driftY * 0.08;
  const appear = Math.min(1, c.born / 1.8);
  if (appear <= 0.02) return;
  const s = scale * c.size;
  const pulse = 0.85 + 0.15 * Math.sin(c.phase);
  const pal = c.palette;
  const comaR = pal.comaR * s;
  const comaInnerA = pal.id === "coma" ? 0.48 : 0.28;

  ctx.save();
  ctx.translate(x, y);

  const coma = ctx.createRadialGradient(0, 0, 0, 0, 0, comaR);
  coma.addColorStop(0, rgba(pal.nucleus, 0.9 * appear * pulse));
  coma.addColorStop(0.35, rgba(pal.comaInner, comaInnerA * appear));
  coma.addColorStop(1, rgba(pal.comaOuter, 0));
  ctx.fillStyle = coma;
  ctx.beginPath();
  ctx.arc(0, 0, comaR, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = rgba(pal.nucleus, 0.95 * appear);
  ctx.beginPath();
  ctx.ellipse(0, 0, 2.1 * s, 1.55 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function spawnAurora(): Aurora {
  const side: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
  const rayCount = 56;
  const rays: AuroraRay[] = [];
  for (let i = 0; i < rayCount; i++) {
    rays.push({
      u: (i + 0.35 * Math.random()) / (rayCount - 1),
      phase: rand(0, Math.PI * 2),
      length: rand(0.72, 1.08),
      width: rand(1.15, 2.35),
      bright: rand(0.55, 1),
    });
  }
  const sheets: AuroraSheet[] = [];
  const nSheets = 3;
  for (let i = 0; i < nSheets; i++) {
    sheets.push({
      phase: rand(0, Math.PI * 2),
      foldAmp: rand(0.7, 1.15),
      foldFreq: rand(1.6, 2.6),
      height: rand(0.78, 1.12),
      tilt: rand(-0.18, 0.18),
    });
  }
  return {
    side,
    life: 0,
    maxLife: rand(3, 8),
    originX: side === 1 ? rand(0.02, 0.16) : rand(0.84, 0.98),
    originY: rand(0.03, 0.16),
    sheets,
    rays,
  };
}

function auroraEnvelope(t: number): number {
  if (t < 0.16) return t / 0.16;
  if (t > 0.72) return Math.max(0, (1 - t) / 0.28);
  return 1;
}

function drawAurora(
  ctx: CanvasRenderingContext2D,
  a: Aurora,
  w: number,
  h: number,
  driftX: number,
  driftY: number,
  scale: number,
) {
  const t = a.life / a.maxLife;
  const fade = auroraEnvelope(t);
  if (fade < 0.01) return;
  const ease = 0.5 - 0.5 * Math.cos(Math.min(1, t) * Math.PI);
  const fromLeft = a.side === 1;
  const travel = (fromLeft ? 1 : -1) * w * (0.08 + ease * 0.38);
  const cx = a.originX * w + travel + driftX * 0.045;
  const cy = a.originY * h - ease * h * 0.07 + driftY * 0.03;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);

  for (let s = 0; s < a.sheets.length; s++) {
    const sheet = a.sheets[s];
    const span = w * (0.34 + sheet.height * 0.1);
    const left = fromLeft ? cx : cx - span;
    const sheetShift = (s - 1) * w * 0.035;
    const veil = ctx.createLinearGradient(left, cy, left, cy + h * 0.42 * sheet.height);
    const veilA = fade * (0.18 + 0.06 * s);
    veil.addColorStop(0, rgba(AURORA_CYAN, 0));
    veil.addColorStop(0.18, rgba(AURORA_GREEN, veilA * 0.55));
    veil.addColorStop(0.55, rgba(AURORA_GREEN, veilA * 0.22));
    veil.addColorStop(0.86, rgba(AURORA_MAGENTA, veilA * 0.2));
    veil.addColorStop(1, rgba(AURORA_MAGENTA, 0));
    ctx.fillStyle = veil;
    ctx.beginPath();
    const vSteps = 18;
    for (let i = 0; i <= vSteps; i++) {
      const u = i / vSteps;
      const fold = Math.sin(u * sheet.foldFreq * Math.PI * 2 + a.life * 1.05 + sheet.phase) * sheet.foldAmp;
      const px = left + sheetShift + u * span + fold * w * 0.055;
      const py = cy + Math.sin(u * Math.PI * 1.4 + sheet.phase) * h * 0.028;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    for (let i = vSteps; i >= 0; i--) {
      const u = i / vSteps;
      const fold = Math.sin(u * sheet.foldFreq * Math.PI * 2 + a.life * 1.05 + sheet.phase) * sheet.foldAmp;
      const px = left + sheetShift + u * span + fold * w * 0.04;
      const drop = h * (0.28 + 0.16 * Math.sin(u * Math.PI)) * sheet.height;
      ctx.lineTo(px + sheet.tilt * drop, cy + drop);
    }
    ctx.closePath();
    ctx.fill();

    ctx.lineCap = "round";
    for (const ray of a.rays) {
      const u = ray.u;
      const foldPhase = u * sheet.foldFreq * Math.PI * 2 + a.life * 1.15 + sheet.phase;
      const fold = Math.sin(foldPhase) * sheet.foldAmp;
      const edge = Math.pow(Math.abs(Math.cos(foldPhase)), 2.4);
      const shimmer = 0.62 + 0.38 * Math.sin(a.life * 3.6 + ray.phase);
      const climb = Math.sin(u * Math.PI);
      const px = left + sheetShift + u * span + fold * w * 0.07;
      const top = cy + Math.sin(u * Math.PI * 1.6 + sheet.phase + a.life * 0.55) * h * 0.03;
      const len = h * ray.length * sheet.height * (0.34 + 0.3 * climb) * shimmer;
      const bot = top + len;
      const gain = fade * ray.bright * shimmer * (0.72 + 0.55 * edge);
      const g = ctx.createLinearGradient(px, top, px + sheet.tilt * len, bot);
      g.addColorStop(0, rgba(AURORA_VIOLET, 0));
      g.addColorStop(0.08, rgba(AURORA_CYAN, 0.42 * gain));
      g.addColorStop(0.28, rgba(AURORA_GREEN, 0.82 * gain));
      g.addColorStop(0.52, rgba(AURORA_LIME, 0.5 * gain));
      g.addColorStop(0.78, rgba(AURORA_GREEN, 0.22 * gain));
      g.addColorStop(0.9, rgba(AURORA_MAGENTA, 0.4 * gain));
      g.addColorStop(1, rgba(AURORA_MAGENTA, 0));
      ctx.strokeStyle = g;
      ctx.lineWidth = ray.width * (1 + edge * 0.65);
      const midX =
        px +
        sheet.tilt * len * 0.45 +
        Math.sin(a.life * 2.1 + ray.phase) * w * 0.01 +
        fold * w * 0.012;
      ctx.beginPath();
      ctx.moveTo(px, top);
      ctx.quadraticCurveTo(midX, (top + bot) * 0.5, px + sheet.tilt * len, bot);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/**
 * Fixed starry field (full viewport). Gentle parallax with the cursor.
 * Two star variants:
 *  - classic: dense diagonal band, brand-tinted stars (original look).
 *  - realistic: natural star distribution with subtle color temperature
 *    variation and diffraction glints on the brightest stars.
 * Shooting stars, satellites, asteroids, comets, and aurora are separate layers with their own
 * On/Off and zoom — they do not inherit the star-field zoom.
 * Density (0–1) is a shared 1–10 control. Classic level 5 is the original
 * band; Realistic 1×–10× still scales the natural field and packs into the
 * band at the high end. Colors resolve from the active theme as rgba().
 */
export function VersaConstellation({
  variant = "classic",
  density = SKY_DENSITY_DEFAULT,
  zoom = 1,
  effects,
  preview = false,
}: {
  variant?: ConstellationVariant;
  density?: number;
  zoom?: number;
  effects?: SkyEffects;
  preview?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const densityClamped = Math.max(0, Math.min(1, density));
  const zoomClamped = clampSkyZoom(zoom);
  const skyFx = resolveSkyEffects(effects);
  const meteorZ = clampSkyZoom(skyFx.meteors.zoom);
  const satZ = clampSkyZoom(skyFx.satellites.zoom);
  const asteroidZ = clampSkyZoom(skyFx.asteroids.zoom);
  const cometZ = clampSkyZoom(skyFx.comets.zoom);
  const auroraZ = clampSkyZoom(skyFx.aurora.zoom);
  const meteorF = clampSkyFrequency(skyFx.meteors.frequency);
  const satF = clampSkyFrequency(skyFx.satellites.frequency);
  const asteroidF = clampSkyFrequency(skyFx.asteroids.frequency);
  const cometF = clampSkyFrequency(skyFx.comets.frequency);
  const auroraF = clampSkyFrequency(skyFx.aurora.frequency);
  const meteorsOn = skyFx.meteors.enabled;
  const satsOn = skyFx.satellites.enabled;
  const asteroidsOn = skyFx.asteroids.enabled;
  const cometsOn = skyFx.comets.enabled;
  const auroraOn = skyFx.aurora.enabled;
  const fxRef = useRef({
    meteorZ,
    satZ,
    asteroidZ,
    cometZ,
    auroraZ,
    meteorF,
    satF,
    asteroidF,
    cometF,
    auroraF,
    meteorsOn,
    satsOn,
    asteroidsOn,
    cometsOn,
    auroraOn,
  });
  useEffect(() => {
    fxRef.current = {
      meteorZ,
      satZ,
      asteroidZ,
      cometZ,
      auroraZ,
      meteorF,
      satF,
      asteroidF,
      cometF,
      auroraF,
      meteorsOn,
      satsOn,
      asteroidsOn,
      cometsOn,
      auroraOn,
    };
  }, [
    meteorZ,
    satZ,
    asteroidZ,
    cometZ,
    auroraZ,
    meteorF,
    satF,
    asteroidF,
    cometF,
    auroraF,
    meteorsOn,
    satsOn,
    asteroidsOn,
    cometsOn,
    auroraOn,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const realistic = variant === "realistic";

    let stars: Star[] = [];
    const meteors: Meteor[] = [];
    const satellites: Satellite[] = [];
    const asteroids: Asteroid[] = [];
    const asteroidDust: AsteroidDust[] = [];
    const trueComets: TrueComet[] = [];
    const cometTrail: CometTrail[] = [];
    const auroras: Aurora[] = [];
    const gap = (lo: number, hi: number, freq: number) =>
      rand(lo, hi) / Math.max(freq, SKY_FREQ_MIN);
    let raf = 0;
    let paused = document.hidden;
    let last = performance.now();
    let spawnIn = gap(5.4, 12.6, fxRef.current.meteorF);
    let satelliteSpawnIn = gap(6, 14, fxRef.current.satF);
    let asteroidSpawnIn = gap(4, 10, fxRef.current.asteroidF);
    let trueCometSpawnIn = gap(8, 18, fxRef.current.cometF);
    let auroraSpawnIn = preview
      ? gap(0.35, 1.1, fxRef.current.auroraF)
      : gap(90, 360, fxRef.current.auroraF);
    let dustAcc = 0;
    let cometTrailAcc = 0;
    let asteroidTintSeq = 0;
    let cometTintSeq = 0;
    let dpr = 1;
    const mouse = { tx: 0, ty: 0, x: 0, y: 0 };
    let palette = readTheme();
    let running = true;

    const measure = () => {
      const host = preview ? canvas.parentElement : null;
      const w = host ? host.clientWidth : window.innerWidth;
      const h = host ? host.clientHeight : window.innerHeight;
      return { w: Math.max(1, w), h: Math.max(1, h) };
    };

    const seedStars = (w: number, h: number) => {
      const next: Star[] = [];

      if (realistic) {
        const base = Math.round(Math.min(w, h) * 0.22);
        const fieldCount = Math.max(8, Math.round(base * (1 + densityClamped * 9)));
        for (let i = 0; i < fieldCount; i++) {
          const inBand = Math.random() < densityClamped * 0.94;
          const pos = inBand
            ? placeInBand(w, h)
            : { x: Math.random() * w, y: Math.random() * h };
          const isBright = Math.random() < (inBand ? 0.06 : 0.04);
          next.push({
            x: pos.x,
            y: pos.y,
            r: isBright ? rand(1.45, 2.2) : rand(0.32, 1.28),
            phase: Math.random() * Math.PI * 2,
            twinkle: rand(0.4, 1.4),
            bright: isBright ? rand(0.75, 0.95) : rand(0.2, 0.62),
            depth: rand(0.2, 0.6),
            tone: 0,
            flicker: Math.random() < 0.3,
            jitter: Math.random(),
            tint: naturalTint(),
            glint: isBright,
          });
        }
      } else {
        const classicScale =
          skyDensityLevel(densityClamped) / SKY_DENSITY_LEVEL_DEFAULT;
        const fieldCount = Math.max(
          4,
          Math.round(Math.min(w, h) * 0.14 * classicScale),
        );
        const bandCount = Math.max(
          8,
          Math.round(Math.min(w, h) * 0.42 * classicScale),
        );

        for (let i = 0; i < fieldCount; i++) {
          next.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: rand(0.38, 1.22),
            phase: Math.random() * Math.PI * 2,
            twinkle: rand(0.5, 1.5),
            bright: rand(0.22, 0.55),
            depth: rand(0.2, 0.55),
            tone: (i % 5 === 0 ? 1 : 0) as 0 | 1 | 2,
            flicker: Math.random() < 0.4,
            jitter: Math.random(),
          });
        }

        for (let i = 0; i < bandCount; i++) {
          const pos = placeInBand(w, h);
          const brightCore = i % 19 === 0;
          next.push({
            x: pos.x,
            y: pos.y,
            r: brightCore ? rand(2.0, 3.1) : rand(0.54, 1.7),
            phase: Math.random() * Math.PI * 2,
            twinkle: rand(0.7, 2.0),
            bright: brightCore ? 0.98 : rand(0.45, 0.88),
            depth: 0.55 + Math.random() * 0.55,
            tone: (i % 7 === 0 ? 2 : i % 4 === 0 ? 1 : 0) as 0 | 1 | 2,
            flicker: Math.random() < 0.48,
            jitter: Math.random(),
          });
        }
      }
      stars = next;
    };

    const resize = () => {
      const { w, h } = measure();
      const vw = w / zoomClamped;
      const vh = h / zoomClamped;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr * zoomClamped, 0, 0, dpr * zoomClamped, 0, 0);
      seedStars(vw, vh);
    };
    // Mobile pull-down at the top fires a burst of resize events (browser
    // chrome shifts) - each one used to reseed every star, which read as the
    // constellation rapidly regenerating with stutter. Debounce so only the
    // settled size reseeds; the canvas keeps drawing throughout.
    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 180);
    };
    resize();
    window.addEventListener("resize", onResize);
    const ro =
      preview && canvas.parentElement
        ? new ResizeObserver(onResize)
        : null;
    if (ro && canvas.parentElement) ro.observe(canvas.parentElement);

    const onMove = (e: PointerEvent | MouseEvent) => {
      const { w, h } = measure();
      mouse.tx = (e.clientX / w - 0.5) * 2;
      mouse.ty = (e.clientY / h - 0.5) * 2;
    };
    if (!preview) {
      window.addEventListener("pointermove", onMove, { passive: true });
    }

    const themeObserver = new MutationObserver(() => {
      palette = readTheme();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    const spawnMeteor = (w: number, h: number) => {
      const fromLeft = Math.random() > 0.35;
      meteors.push({
        x: fromLeft ? rand(-40, w * 0.45) : rand(w * 0.35, w + 40),
        y: rand(-20, h * 0.35),
        vx: fromLeft ? rand(220, 380) : rand(-380, -220),
        vy: rand(90, 180),
        life: 0,
        maxLife: rand(0.7, 1.25),
        length: rand(46, 88),
      });
    };

    // Satellites: craft-like points that cross the entire viewport on a
    // shallow track. Intermittent - long quiet gaps - never more than 3.
    const spawnSatellite = (w: number, h: number) => {
      const fromLeft = Math.random() > 0.5;
      const speed = rand(28, 78);
      const y = rand(h * 0.04, h * 0.96);
      const vx = (fromLeft ? 1 : -1) * speed;
      const vy = rand(-0.12, 0.12) * speed;
      satellites.push({
        x: fromLeft ? -36 : w + 36,
        y,
        vx,
        vy,
        r: rand(1.35, 2.15),
        phase: Math.random() * Math.PI * 2,
        panels: Math.random() > 0.35,
      });
    };

    const arcPath = (w: number, h: number) => {
      const roll = Math.random();
      if (roll < 0.34) {
        return {
          sx: -80,
          sy: rand(h * 0.38, h * 0.88),
          cx: w * rand(0.32, 0.52),
          cy: h * rand(-0.04, 0.16),
          ex: w + 80,
          ey: -80,
        };
      }
      if (roll < 0.68) {
        return {
          sx: w + 80,
          sy: rand(h * 0.38, h * 0.88),
          cx: w * rand(0.48, 0.68),
          cy: h * rand(-0.04, 0.16),
          ex: -80,
          ey: -80,
        };
      }
      const leftish = Math.random() > 0.5;
      return {
        sx: leftish ? rand(w * 0.06, w * 0.42) : rand(w * 0.58, w * 0.94),
        sy: h + 80,
        cx: w * (leftish ? rand(0.18, 0.4) : rand(0.6, 0.82)),
        cy: h * rand(0.28, 0.52),
        ex: leftish ? w + 80 : -80,
        ey: -80,
      };
    };

    const spawnAsteroid = (w: number, h: number) => {
      if (asteroids.length >= 1) return;
      const path = arcPath(w, h);
      const duration = rand(42, 68);
      const mesh = makeAsteroidRock();
      const tint = ASTEROID_TINTS[asteroidTintSeq % ASTEROID_TINTS.length];
      asteroidTintSeq += 1;
      asteroids.push({
        x: path.sx,
        y: path.sy,
        vx: bezier1d(0, path.sx, path.cx, path.ex),
        vy: bezier1d(0, path.sy, path.cy, path.ey),
        t: 0,
        speed: 1 / duration,
        ...path,
        born: 0,
        size: rand(4.05, 6.15),
        phase: Math.random() * Math.PI * 2,
        flicker: rand(2.4, 4.8),
        spin: Math.random() * Math.PI * 2,
        spinSpeed: rand(0.36, 0.84) * (Math.random() > 0.5 ? 1 : -1),
        rock: mesh.rock,
        facets: mesh.facets,
        tint,
      });
    };

    const spawnTrueComet = (w: number, h: number) => {
      if (trueComets.length >= 1) return;
      const path = arcPath(w, h);
      const duration = rand(110, 180);
      const palette = COMET_PALETTES[cometTintSeq % COMET_PALETTES.length];
      cometTintSeq += 1;
      trueComets.push({
        x: path.sx,
        y: path.sy,
        vx: bezier1d(0, path.sx, path.cx, path.ex),
        vy: bezier1d(0, path.sy, path.cy, path.ey),
        t: 0,
        speed: 1 / duration,
        ...path,
        born: 0,
        size: rand(0.85, 1.25),
        phase: Math.random() * Math.PI * 2,
        path: [{ x: path.sx, y: path.sy }],
        palette,
      });
    };

    const emitCometTrail = (c: TrueComet) => {
      const mag = Math.hypot(c.vx, c.vy) || 1;
      const ux = c.vx / mag;
      const uy = c.vy / mag;
      const px = -uy;
      const py = ux;
      const n = Math.random() < 0.55 ? 3 : 2;
      for (let i = 0; i < n; i++) {
        if (cometTrail.length >= 520) break;
        const along = rand(c.size * 0.4, c.size * 6);
        const side = gauss() * c.size * 1.1;
        cometTrail.push({
          x: c.x - ux * along + px * side,
          y: c.y - uy * along + py * side,
          life: 0,
          maxLife: rand(9, 16),
          r: rand(0.55, 1.35),
          color: c.palette.trail,
        });
      }
    };

    const emitAsteroidDust = (c: Asteroid) => {
      const mag = Math.hypot(c.vx, c.vy) || 1;
      const ux = c.vx / mag;
      const uy = c.vy / mag;
      const px = -uy;
      const py = ux;
      const n = Math.random() < 0.5 ? 4 : 3;
      for (let i = 0; i < n; i++) {
        if (asteroidDust.length >= 360) break;
        const along = rand(c.size * 0.2, c.size * 1.5);
        const side = gauss() * c.size * 0.35;
        const spark = Math.random() < 0.34;
        const dustColor: Rgb =
          Math.random() < 0.45 ? c.tint.lit1 : Math.random() < 0.5 ? c.tint.lit2 : c.tint.stroke;
        asteroidDust.push({
          x: c.x - ux * along + px * side,
          y: c.y - uy * along + py * side,
          vx: gauss() * 1.6,
          vy: gauss() * 1.6,
          life: 0,
          maxLife: rand(5.2, 9.2),
          r: spark ? rand(0.1, 0.26) : rand(0.12, 0.38),
          color: dustColor,
          spark,
          phase: Math.random() * Math.PI * 2,
          twinkle: rand(4.5, 11),
        });
      }
    };

    const starColor = (s: Star): Rgb => {
      if (s.tint) return s.tint;
      if (s.tone === 1) return palette.primary;
      if (s.tone === 2) return palette.destructive;
      return palette.fg;
    };

    const draw = (now: number) => {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const { w: cssW, h: cssH } = measure();
      const w = cssW / zoomClamped;
      const h = cssH / zoomClamped;

      try {
        if (!reduceMotion) {
          mouse.x += (mouse.tx - mouse.x) * 0.08;
          mouse.y += (mouse.ty - mouse.y) * 0.08;
        }

        ctx.clearRect(0, 0, w, h);

        const driftX = mouse.x * 28;
        const driftY = mouse.y * 18;

        for (const s of stars) {
          if (!reduceMotion) s.phase += s.twinkle * dt;
          let pulse = 0.88 + 0.12 * (0.5 + 0.5 * Math.sin(s.phase * 0.35));
          if (s.flicker && !reduceMotion) {
            const slow = 0.5 + 0.5 * Math.sin(s.phase);
            const fast = 0.5 + 0.5 * Math.sin(s.phase * 3.1 + s.jitter);
            const wink = Math.sin(s.phase * 6.4 + s.jitter) > 0.88 ? 0.12 : 1;
            pulse = 0.12 + 0.88 * slow * fast * wink;
          }
          const x = s.x + driftX * s.depth;
          const y = s.y + driftY * s.depth;
          const color = starColor(s);
          const alpha = s.bright * pulse;
          if (alpha < 0.02 && !s.glint) continue;
          if (s.glint) {
            drawGlint(ctx, x, y, s.r, color, alpha, s.jitter);
          }
          ctx.beginPath();
          ctx.arc(x, y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = rgba(color, alpha);
          ctx.fill();
        }

        if (!reduceMotion) {
          const fx = fxRef.current;
          ctx.save();
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          const ew = cssW;
          const eh = cssH;

          if (!fx.meteorsOn) {
            meteors.length = 0;
          } else {
            spawnIn -= dt;
            if (spawnIn <= 0 && meteors.length < 2) {
              spawnMeteor(ew, eh);
              spawnIn = gap(7.2, 16.5, fx.meteorF);
            }
            const mz = fx.meteorZ;
            for (let i = meteors.length - 1; i >= 0; i--) {
              const m = meteors[i];
              m.life += dt;
              m.x += m.vx * dt;
              m.y += m.vy * dt;
              const speed = Math.hypot(m.vx, m.vy) || 1;
              const ux = m.vx / speed;
              const uy = m.vy / speed;
              const hx = m.x + driftX;
              const hy = m.y + driftY;
              if (![hx, hy].every(Number.isFinite)) {
                meteors.splice(i, 1);
                continue;
              }
              const fadeLife = Math.max(0, 1 - m.life / m.maxLife);
              ctx.save();
              ctx.translate(hx, hy);
              ctx.scale(mz, mz);
              const g = ctx.createLinearGradient(-ux * m.length, -uy * m.length, 0, 0);
              g.addColorStop(0, rgba(palette.primary, 0));
              g.addColorStop(0.65, rgba(palette.primary, 0.45 * fadeLife));
              g.addColorStop(1, rgba(palette.fg, 0.95 * fadeLife));
              ctx.strokeStyle = g;
              ctx.lineWidth = 1.4;
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(-ux * m.length, -uy * m.length);
              ctx.lineTo(0, 0);
              ctx.stroke();
              ctx.beginPath();
              ctx.arc(0, 0, 1.6, 0, Math.PI * 2);
              ctx.fillStyle = rgba(palette.fg, 0.95 * fadeLife);
              ctx.fill();
              ctx.restore();
              if (m.life >= m.maxLife || m.x < -120 || m.x > ew + 120 || m.y > eh + 80) {
                meteors.splice(i, 1);
              }
            }
          }

          if (!fx.satsOn) {
            satellites.length = 0;
          } else {
            satelliteSpawnIn -= dt;
            if (satelliteSpawnIn <= 0 && satellites.length < 3) {
              spawnSatellite(ew, eh);
              satelliteSpawnIn = gap(9, 22, fx.satF);
            }
            const sz = fx.satZ;
            for (let i = satellites.length - 1; i >= 0; i--) {
              const sat = satellites[i];
              sat.x += sat.vx * dt;
              sat.y += sat.vy * dt;
              sat.phase += dt * 2.4;
              const edge = 48;
              const fadeIn = Math.min(
                1,
                (sat.vx > 0 ? sat.x + 36 : ew + 36 - sat.x) / 70,
              );
              const fadeOut = Math.min(
                1,
                (sat.vx > 0 ? ew + 36 - sat.x : sat.x + 36) / 70,
              );
              const alpha = 0.9 * Math.max(0, Math.min(fadeIn, fadeOut));
              if (alpha > 0.01) {
                const sx = sat.x + driftX * 0.18;
                const sy = sat.y + driftY * 0.18;
                const mag = Math.hypot(sat.vx, sat.vy) || 1;
                const ux = sat.vx / mag;
                const uy = sat.vy / mag;
                const trail = 26 + sat.r * 10;
                ctx.save();
                ctx.translate(sx, sy);
                ctx.scale(sz, sz);
                const g = ctx.createLinearGradient(-ux * trail, -uy * trail, 0, 0);
                g.addColorStop(0, rgba(palette.fg, 0));
                g.addColorStop(0.7, rgba(palette.primary, alpha * 0.22));
                g.addColorStop(1, rgba(palette.fg, alpha * 0.7));
                ctx.strokeStyle = g;
                ctx.lineWidth = sat.r * 0.85;
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.moveTo(-ux * trail, -uy * trail);
                ctx.lineTo(0, 0);
                ctx.stroke();

                ctx.rotate(Math.atan2(sat.vy, sat.vx));
                if (sat.panels) {
                  ctx.fillStyle = rgba(palette.primary, alpha * 0.55);
                  ctx.fillRect(-sat.r * 0.4, -sat.r * 3.1, sat.r * 0.8, sat.r * 2.1);
                  ctx.fillRect(-sat.r * 0.4, sat.r * 1.0, sat.r * 0.8, sat.r * 2.1);
                }
                ctx.fillStyle = rgba(palette.fg, alpha);
                ctx.beginPath();
                ctx.ellipse(0, 0, sat.r * 1.7, sat.r * 0.75, 0, 0, Math.PI * 2);
                ctx.fill();
                const blink = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(sat.phase * 3.1));
                ctx.fillStyle = rgba([255, 210, 160], alpha * blink);
                ctx.beginPath();
                ctx.arc(sat.r * 1.15, 0, sat.r * 0.35, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
              }
              if (
                sat.x < -edge * 2 ||
                sat.x > ew + edge * 2 ||
                sat.y < -edge * 2 ||
                sat.y > eh + edge * 2
              ) {
                satellites.splice(i, 1);
              }
            }
          }

          if (!fx.asteroidsOn) {
            const waiting = asteroidSpawnIn > 1000;
            asteroids.length = 0;
            asteroidDust.length = 0;
            dustAcc = 0;
            if (waiting) asteroidSpawnIn = gap(4, 10, fx.asteroidF);
          } else {
            const az = fx.asteroidZ;
            asteroidSpawnIn -= dt;
            if (asteroidSpawnIn <= 0 && asteroids.length < 1) {
              spawnAsteroid(ew, eh);
              asteroidSpawnIn = 1e9;
            }

            for (let i = asteroids.length - 1; i >= 0; i--) {
              const c = asteroids[i];
              c.born += dt;
              c.phase += c.flicker * dt;
              c.spin += c.spinSpeed * dt;
              c.t += c.speed * dt;
              const t = Math.min(1, c.t);
              c.x = bezier1(t, c.sx, c.cx, c.ex);
              c.y = bezier1(t, c.sy, c.cy, c.ey);
              c.vx = bezier1d(t, c.sx, c.cx, c.ex);
              c.vy = bezier1d(t, c.sy, c.cy, c.ey);
              dustAcc += dt;
              while (dustAcc >= 1 / 72) {
                emitAsteroidDust(c);
                dustAcc -= 1 / 72;
              }
              if (c.t >= 1) {
                asteroids.splice(i, 1);
                asteroidSpawnIn = gap(15, 60, fx.asteroidF);
              }
            }

            for (let i = asteroidDust.length - 1; i >= 0; i--) {
              const p = asteroidDust[i];
              p.life += dt;
              p.phase += p.twinkle * dt;
              p.x += p.vx * dt;
              p.y += p.vy * dt;
              if (p.life >= p.maxLife) {
                asteroidDust.splice(i, 1);
              }
            }

            for (const p of asteroidDust) {
              drawAsteroidDust(ctx, p, driftX, driftY, az);
            }
            for (const c of asteroids) {
              drawAsteroidHead(ctx, c, driftX, driftY, az);
            }
          }

          if (!fx.cometsOn) {
            const waiting = trueCometSpawnIn > 1000;
            trueComets.length = 0;
            cometTrail.length = 0;
            cometTrailAcc = 0;
            if (waiting) trueCometSpawnIn = gap(8, 18, fx.cometF);
          } else {
            const cz = fx.cometZ;
            trueCometSpawnIn -= dt;
            if (trueCometSpawnIn <= 0 && trueComets.length < 1) {
              spawnTrueComet(ew, eh);
              trueCometSpawnIn = 1e9;
            }
            for (let i = trueComets.length - 1; i >= 0; i--) {
              const c = trueComets[i];
              c.born += dt;
              c.phase += dt * 1.6;
              c.t += c.speed * dt;
              const t = Math.min(1, c.t);
              c.x = bezier1(t, c.sx, c.cx, c.ex);
              c.y = bezier1(t, c.sy, c.cy, c.ey);
              c.vx = bezier1d(t, c.sx, c.cx, c.ex);
              c.vy = bezier1d(t, c.sy, c.cy, c.ey);
              c.path.push({ x: c.x, y: c.y });
              if (c.path.length > 960) c.path.splice(0, c.path.length - 960);
              cometTrailAcc += dt;
              while (cometTrailAcc >= 1 / 48) {
                emitCometTrail(c);
                cometTrailAcc -= 1 / 48;
              }
              if (c.t >= 1) {
                trueComets.splice(i, 1);
                trueCometSpawnIn = gap(20, 80, fx.cometF);
              }
            }
            for (let i = cometTrail.length - 1; i >= 0; i--) {
              const p = cometTrail[i];
              p.life += dt;
              if (p.life >= p.maxLife) cometTrail.splice(i, 1);
            }
            for (const p of cometTrail) {
              drawCometTrail(ctx, p, driftX, driftY, cz);
            }
            for (const c of trueComets) {
              drawCometPath(ctx, c, driftX, driftY, cz);
              drawTrueComet(ctx, c, driftX, driftY, cz);
            }
          }

          if (!fx.auroraOn) {
            auroras.length = 0;
          } else {
            auroraSpawnIn -= dt;
            if (auroraSpawnIn <= 0 && auroras.length < 1) {
              auroras.push(spawnAurora());
              auroraSpawnIn = 1e9;
            }
            const az = fx.auroraZ;
            for (let i = auroras.length - 1; i >= 0; i--) {
              const a = auroras[i];
              a.life += dt;
              drawAurora(ctx, a, ew, eh, driftX, driftY, az);
              if (a.life >= a.maxLife) {
                auroras.splice(i, 1);
                auroraSpawnIn = preview
                  ? gap(1.6, 4.2, fx.auroraF)
                  : gap(90, 360, fx.auroraF);
              }
            }
          }
          ctx.restore();
        }
      } catch {
        /* keep the loop alive if a frame fails */
      }

      if (!reduceMotion && running && !paused) {
        raf = requestAnimationFrame(draw);
      }
    };

    const kick = () => {
      last = performance.now();
      raf = requestAnimationFrame(draw);
    };

    const onVis = () => {
      if (document.hidden) {
        paused = true;
        cancelAnimationFrame(raf);
      } else {
        paused = false;
        if (!reduceMotion && running) kick();
      }
    };
    document.addEventListener("visibilitychange", onVis);

    if (!paused) draw(performance.now());

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
      ro?.disconnect();
      themeObserver.disconnect();
    };
  }, [variant, densityClamped, zoomClamped, preview]);

  return (
    <canvas
      ref={canvasRef}
      className={
        preview
          ? "pointer-events-none absolute inset-0 h-full w-full"
          : "pointer-events-none fixed inset-0 z-0 h-svh w-full"
      }
      aria-hidden
    />
  );
}
