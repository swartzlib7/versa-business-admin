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

/** One small aurora patch (150–450 × 120–250 css px), faded on every side.
 *  Modelled on real northern lights: a bright green fold that ripples with one
 *  long slow wave, with soft vertical rays fanning up from it and fading into a
 *  teal haze toward the top. Painted to its own layer and blurred so it reads
 *  as one gradual body with no hard lines. */
type Aurora = {
  x: number;
  y: number;
  width: number;
  height: number;
  life: number;
  maxLife: number;
  phase: number;
  waves: number;
  speed: number;
  rippleAmp: number;
  driftX: number;
  driftY: number;
  palette: AuroraPalette;
  rays: AuroraRay[];
  layer: HTMLCanvasElement | null;
};

/** One vertical ray rising from the fold. `u` is its position along the patch. */
type AuroraRay = {
  u: number;
  width: number;
  height: number;
  gain: number;
  shimmer: number;
  shimmerPhase: number;
  lean: number;
};

/** Oxygen green dominates. `top` tints the upper haze (teal / blue-green); `tip`
 *  is the faint high-altitude colour at the very top of the tallest rays. */
type AuroraPalette = {
  id: "green" | "emerald" | "teal" | "pink-fringe" | "violet-top";
  body: Rgb;
  top: Rgb;
  tip: Rgb;
  tipGain: number;
  /** Optional nitrogen pink/magenta lower edge under the fold (high-activity look). */
  fringe?: Rgb;
};

/** Realistic variants; consecutive auroras never repeat the same one. */
const AURORA_PALETTES: AuroraPalette[] = [
  { id: "green", body: [96, 255, 140], top: [80, 230, 190], tip: [120, 170, 255], tipGain: 0.28 },
  { id: "emerald", body: [70, 240, 120], top: [90, 250, 170], tip: [170, 120, 255], tipGain: 0.22 },
  { id: "teal", body: [84, 250, 165], top: [60, 215, 215], tip: [200, 110, 240], tipGain: 0.24 },
  {
    id: "pink-fringe",
    body: [110, 255, 150],
    top: [90, 220, 200],
    tip: [190, 120, 255],
    tipGain: 0.26,
    fringe: [255, 110, 170],
  },
  {
    id: "violet-top",
    body: [90, 245, 140],
    top: [130, 160, 255],
    tip: [200, 110, 255],
    tipGain: 0.42,
  },
];
let auroraPaletteCursor = -1;
function nextAuroraPalette(): AuroraPalette {
  const n = AURORA_PALETTES.length;
  const step = 1 + Math.floor(Math.random() * (n - 1));
  auroraPaletteCursor = auroraPaletteCursor < 0 ? Math.floor(Math.random() * n) : (auroraPaletteCursor + step) % n;
  return AURORA_PALETTES[auroraPaletteCursor];
}

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

/** One aurora at a time, toward the upper and outer half of the sky. */
function spawnAurora(w: number, h: number): Aurora {
  const width = rand(150, 450);
  const height = Math.min(rand(120, 250), width * 0.72);
  const left = Math.random() < 0.5;
  const marginX = (width * 0.5 + 24) / Math.max(w, 1);
  const marginY = (height * 0.5 + 16) / Math.max(h, 1);
  const xr = left ? rand(0.06, 0.34) : rand(0.66, 0.94);
  const yr = rand(0.05, 0.4);
  const rayCount = Math.round(Math.min(72, Math.max(28, width / 6)));
  const rays: AuroraRay[] = [];
  for (let i = 0; i < rayCount; i++) {
    const u = (i + rand(0.15, 0.85)) / rayCount;
    rays.push({
      u,
      width: rand(0.012, 0.042),
      height: rand(0.4, 1) * rand(0.7, 1),
      gain: Math.random() < 0.3 ? rand(0.75, 1) : rand(0.2, 0.6),
      shimmer: rand(0.5, 1.5),
      shimmerPhase: rand(0, Math.PI * 2),
      lean: (u - 0.5) * rand(0.1, 0.26) + rand(-0.03, 0.03),
    });
  }
  return {
    x: Math.min(1 - marginX, Math.max(marginX, xr)),
    y: Math.min(0.6, Math.max(marginY, yr)),
    width,
    height,
    life: 0,
    maxLife: rand(14, 22),
    phase: rand(0, Math.PI * 2),
    waves: rand(0.9, 1.45),
    speed: rand(0.4, 0.8),
    rippleAmp: rand(0.07, 0.13),
    driftX: rand(-5, 5),
    driftY: rand(-2.5, 2.5),
    palette: nextAuroraPalette(),
    rays,
    layer: null,
  };
}

/** Slow bell: the light eases on over ~45% of life, peaks briefly, eases off.
 *  Squared sine so the start and end are very gradual. */
function auroraEnvelope(t: number): number {
  const s = Math.sin(Math.min(1, Math.max(0, t)) * Math.PI);
  return s * s;
}

/** Paint the patch onto its own layer: upper haze, vertical rays, then the bright
 *  rippling fold they rise from; finish with a horizontal fade and an elliptical
 *  fade so every side is soft. */
function paintAuroraLayer(a: Aurora, pw: number, ph: number, pad: number, dpr: number) {
  const lw = Math.ceil((pw + pad * 2) * dpr);
  const lh = Math.ceil((ph + pad * 2) * dpr);
  if (!a.layer) a.layer = document.createElement("canvas");
  const layer = a.layer;
  if (layer.width !== lw || layer.height !== lh) {
    layer.width = lw;
    layer.height = lh;
  }
  const lc = layer.getContext("2d");
  if (!lc) return null;
  lc.setTransform(dpr, 0, 0, dpr, 0, 0);
  lc.clearRect(0, 0, pw + pad * 2, ph + pad * 2);
  lc.globalCompositeOperation = "lighter";

  const x0 = pad;
  const y0 = pad;
  const pal = a.palette;
  const foldBase = y0 + ph * 0.68;
  const foldY = (u: number, lag = 0) =>
    foldBase +
    Math.sin(u * Math.PI * 2 * a.waves + a.life * a.speed + a.phase + lag) * a.rippleAmp * ph;
  const breathe = 0.85 + 0.15 * Math.sin(a.life * 1.1 + a.phase);

  // Upper haze: soft green→teal glow filling the space above the fold.
  const haze = lc.createLinearGradient(0, foldBase, 0, y0);
  haze.addColorStop(0, rgba(pal.body, 0.13 * breathe));
  haze.addColorStop(0.45, rgba(pal.top, 0.07 * breathe));
  haze.addColorStop(1, rgba(pal.top, 0));
  lc.fillStyle = haze;
  lc.fillRect(x0, y0, pw, foldBase - y0 + ph * 0.1);

  // Rays: rise from the fold, lean outward, shimmer independently.
  for (const r of a.rays) {
    const shine = 0.6 + 0.4 * Math.sin(a.life * r.shimmer + r.shimmerPhase);
    const alpha = 0.42 * r.gain * shine * breathe;
    const bx = x0 + r.u * pw;
    const by = foldY(r.u) + ph * 0.04;
    const rh = r.height * (foldBase - y0);
    const tx = bx + r.lean * pw;
    const ty = by - rh;
    const wb = r.width * pw;
    const wt = wb * 0.55;
    const g = lc.createLinearGradient(bx, by, tx, ty);
    g.addColorStop(0, rgba(pal.body, alpha * 0.55));
    g.addColorStop(0.18, rgba(pal.body, alpha));
    g.addColorStop(0.55, rgba(pal.top, alpha * 0.62));
    g.addColorStop(0.85, rgba(pal.tip, alpha * pal.tipGain));
    g.addColorStop(1, rgba(pal.tip, 0));
    lc.fillStyle = g;
    lc.beginPath();
    lc.moveTo(bx - wb * 0.5, by);
    lc.lineTo(bx + wb * 0.5, by);
    lc.lineTo(tx + wt * 0.5, ty);
    lc.lineTo(tx - wt * 0.5, ty);
    lc.closePath();
    lc.fill();
  }

  // The fold: a bright green band, sharp-ish below, glowing upward.
  const segs = 36;
  const foldUp = ph * 0.26;
  const foldDown = ph * 0.14;
  const fg = lc.createLinearGradient(0, foldBase - foldUp, 0, foldBase + foldDown);
  fg.addColorStop(0, rgba(pal.body, 0));
  fg.addColorStop(0.55, rgba(pal.body, 0.34 * breathe));
  fg.addColorStop(0.72, rgba(pal.body, 0.5 * breathe));
  const fringe = pal.fringe ?? pal.body;
  fg.addColorStop(0.84, rgba(fringe, (pal.fringe ? 0.3 : 0.22) * breathe));
  fg.addColorStop(1, rgba(fringe, 0));
  lc.fillStyle = fg;
  lc.beginPath();
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const py = foldY(u) - foldUp;
    if (i === 0) lc.moveTo(x0 + u * pw, py);
    else lc.lineTo(x0 + u * pw, py);
  }
  for (let i = segs; i >= 0; i--) {
    const u = i / segs;
    lc.lineTo(x0 + u * pw, foldY(u, 0.3) + foldDown);
  }
  lc.closePath();
  lc.fill();

  // Fade the left and right ends.
  lc.globalCompositeOperation = "destination-in";
  const hx = lc.createLinearGradient(x0, 0, x0 + pw, 0);
  hx.addColorStop(0, "rgba(0,0,0,0)");
  hx.addColorStop(0.12, "rgba(0,0,0,0.22)");
  hx.addColorStop(0.3, "rgba(0,0,0,0.75)");
  hx.addColorStop(0.5, "rgba(0,0,0,1)");
  hx.addColorStop(0.7, "rgba(0,0,0,0.75)");
  hx.addColorStop(0.88, "rgba(0,0,0,0.22)");
  hx.addColorStop(1, "rgba(0,0,0,0)");
  lc.fillStyle = hx;
  lc.fillRect(0, 0, pw + pad * 2, ph + pad * 2);

  // Soften the whole outline into an ellipse.
  lc.save();
  lc.translate(x0 + pw * 0.5, y0 + ph * 0.5);
  lc.scale(pw * 0.5 + pad, ph * 0.5 + pad);
  const el = lc.createRadialGradient(0, 0, 0, 0, 0, 1);
  el.addColorStop(0, "rgba(0,0,0,1)");
  el.addColorStop(0.5, "rgba(0,0,0,1)");
  el.addColorStop(0.82, "rgba(0,0,0,0.35)");
  el.addColorStop(1, "rgba(0,0,0,0)");
  lc.fillStyle = el;
  lc.fillRect(-1, -1, 2, 2);
  lc.restore();
  lc.globalCompositeOperation = "source-over";
  return layer;
}

function drawAurora(
  ctx: CanvasRenderingContext2D,
  a: Aurora,
  w: number,
  h: number,
  driftX: number,
  driftY: number,
  scale: number,
  dpr: number,
) {
  const t = a.life / a.maxLife;
  const fade = auroraEnvelope(Math.min(1, t));
  if (fade < 0.01) return;
  // Expand in and out with the light: ~60% size when faint, full at peak.
  const grow = 0.6 + 0.4 * fade;
  const pw = a.width * scale * grow;
  const ph = a.height * scale * grow;
  const pad = Math.max(12, ph * 0.18);
  const layer = paintAuroraLayer(a, pw, ph, pad, dpr);
  if (!layer) return;
  const cx = a.x * w + a.driftX * a.life + driftX * 0.05;
  const cy = a.y * h + a.driftY * a.life + driftY * 0.04;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = fade;
  if ("filter" in ctx)
    ctx.filter = `blur(${(Math.max(1.5, ph * 0.016) * (1 + (1 - fade) * 1.4)).toFixed(1)}px)`;
  ctx.drawImage(
    layer,
    cx - pw * 0.5 - pad,
    cy - ph * 0.5 - pad,
    pw + pad * 2,
    ph + pad * 2,
  );
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
    // Live sky: first aurora after a fixed 90s (at 1×), then 90–360s gaps.
    let auroraSpawnIn = preview
      ? gap(0.4, 1.2, fxRef.current.auroraF)
      : gap(90, 90, fxRef.current.auroraF);
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
            if (auroraSpawnIn <= 0 && auroras.length === 0) {
              auroras.push(spawnAurora(ew, eh));
              auroraSpawnIn = 1e9;
            }
            const az = fx.auroraZ;
            for (let i = auroras.length - 1; i >= 0; i--) {
              const a = auroras[i];
              a.life += dt;
              drawAurora(ctx, a, ew, eh, driftX, driftY, az, dpr);
              if (a.life >= a.maxLife) auroras.splice(i, 1);
            }
            if (auroras.length === 0 && auroraSpawnIn > 1000) {
              auroraSpawnIn = preview
                ? gap(1.2, 3.5, fx.auroraF)
                : gap(90, 360, fx.auroraF);
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
