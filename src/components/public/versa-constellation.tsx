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

type Comet = {
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
  rock: { x: number; y: number }[];
};

type CometDust = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  r: number;
  warm: boolean;
  spark: boolean;
  phase: number;
  twinkle: number;
};

type Rgb = [number, number, number];

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

function makeCometRock(): { x: number; y: number }[] {
  const n = 7 + Math.floor(Math.random() * 3);
  const verts: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rand(-0.14, 0.14);
    const rx = 1.7 * (0.68 + Math.random() * 0.5);
    const ry = 0.78 * (0.62 + Math.random() * 0.48);
    verts.push({ x: Math.cos(a) * rx, y: Math.sin(a) * ry });
  }
  return verts;
}

function drawCometHead(
  ctx: CanvasRenderingContext2D,
  c: Comet,
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

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(heading);
  ctx.scale(scale * c.size, scale * c.size);

  ctx.beginPath();
  ctx.moveTo(c.rock[0].x, c.rock[0].y);
  for (let i = 1; i < c.rock.length; i++) ctx.lineTo(c.rock[i].x, c.rock[i].y);
  ctx.closePath();
  ctx.fillStyle = rgba([46, 42, 40], 0.92 * appear);
  ctx.fill();

  ctx.save();
  ctx.clip();
  const lit = ctx.createLinearGradient(1.8, 0, -1.1, 0.15);
  lit.addColorStop(0, rgba([255, 236, 196], 0.95 * glow));
  lit.addColorStop(0.28, rgba([255, 168, 92], 0.55 * glow));
  lit.addColorStop(0.7, rgba([120, 70, 40], 0.12 * glow));
  lit.addColorStop(1, rgba([40, 34, 32], 0));
  ctx.fillStyle = lit;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0.72, 0.08, 0.38, 0.16, 0.15, 0, Math.PI * 2);
  ctx.fillStyle = rgba([255, 252, 240], 0.7 * glow);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = rgba([255, 210, 150], 0.28 * glow);
  ctx.lineWidth = 0.12;
  ctx.stroke();
  ctx.restore();
}

function drawCometDust(
  ctx: CanvasRenderingContext2D,
  p: CometDust,
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
  const color: Rgb = p.spark
    ? [255, 255, 255]
    : p.warm
      ? [255, 226, 178]
      : [186, 220, 255];
  const r = Math.max(0.15, p.r * scale * (0.65 + 0.35 * flicker));
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = rgba(color, alpha);
  ctx.fill();
  if (p.spark && flicker > 0.62 && fade > 0.2) {
    const spike = r * 3.4;
    ctx.strokeStyle = rgba([255, 255, 255], alpha * 0.85);
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

/**
 * Fixed starry field (full viewport). Gentle parallax with the cursor.
 * Two star variants:
 *  - classic: dense diagonal band, brand-tinted stars (original look).
 *  - realistic: natural star distribution with subtle color temperature
 *    variation and diffraction glints on the brightest stars.
 * Shooting stars, satellites, and comets are separate layers with their own
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
  const cometZ = clampSkyZoom(skyFx.comets.zoom);
  const meteorF = clampSkyFrequency(skyFx.meteors.frequency);
  const satF = clampSkyFrequency(skyFx.satellites.frequency);
  const cometF = clampSkyFrequency(skyFx.comets.frequency);
  const meteorsOn = skyFx.meteors.enabled;
  const satsOn = skyFx.satellites.enabled;
  const cometsOn = skyFx.comets.enabled;
  const fxRef = useRef({
    meteorZ,
    satZ,
    cometZ,
    meteorF,
    satF,
    cometF,
    meteorsOn,
    satsOn,
    cometsOn,
  });
  useEffect(() => {
    fxRef.current = {
      meteorZ,
      satZ,
      cometZ,
      meteorF,
      satF,
      cometF,
      meteorsOn,
      satsOn,
      cometsOn,
    };
  }, [meteorZ, satZ, cometZ, meteorF, satF, cometF, meteorsOn, satsOn, cometsOn]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const realistic = variant === "realistic";

    let stars: Star[] = [];
    const meteors: Meteor[] = [];
    const satellites: Satellite[] = [];
    const comets: Comet[] = [];
    const cometDust: CometDust[] = [];
    const gap = (lo: number, hi: number, freq: number) =>
      rand(lo, hi) / Math.max(freq, SKY_FREQ_MIN);
    let raf = 0;
    let last = performance.now();
    let spawnIn = gap(5.4, 12.6, fxRef.current.meteorF);
    let satelliteSpawnIn = gap(6, 14, fxRef.current.satF);
    let cometSpawnIn = gap(4, 10, fxRef.current.cometF);
    let dustAcc = 0;
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
      window.addEventListener("mousemove", onMove, { passive: true });
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

    const spawnComet = (w: number, h: number) => {
      if (comets.length >= 1) return;
      const roll = Math.random();
      let sx: number;
      let sy: number;
      let cx: number;
      let cy: number;
      let ex: number;
      let ey: number;
      if (roll < 0.34) {
        sx = -80;
        sy = rand(h * 0.38, h * 0.88);
        cx = w * rand(0.32, 0.52);
        cy = h * rand(-0.04, 0.16);
        ex = w + 80;
        ey = -80;
      } else if (roll < 0.68) {
        sx = w + 80;
        sy = rand(h * 0.38, h * 0.88);
        cx = w * rand(0.48, 0.68);
        cy = h * rand(-0.04, 0.16);
        ex = -80;
        ey = -80;
      } else {
        const leftish = Math.random() > 0.5;
        sx = leftish ? rand(w * 0.06, w * 0.42) : rand(w * 0.58, w * 0.94);
        sy = h + 80;
        cx = w * (leftish ? rand(0.18, 0.4) : rand(0.6, 0.82));
        cy = h * rand(0.28, 0.52);
        ex = leftish ? w + 80 : -80;
        ey = -80;
      }
      const duration = rand(42, 68);
      comets.push({
        x: sx,
        y: sy,
        vx: bezier1d(0, sx, cx, ex),
        vy: bezier1d(0, sy, cy, ey),
        t: 0,
        speed: 1 / duration,
        sx,
        sy,
        cx,
        cy,
        ex,
        ey,
        born: 0,
        size: rand(4.05, 6.15),
        phase: Math.random() * Math.PI * 2,
        flicker: rand(2.4, 4.8),
        rock: makeCometRock(),
      });
    };

    const emitCometDust = (c: Comet) => {
      const mag = Math.hypot(c.vx, c.vy) || 1;
      const ux = c.vx / mag;
      const uy = c.vy / mag;
      const px = -uy;
      const py = ux;
      const n = Math.random() < 0.5 ? 4 : 3;
      for (let i = 0; i < n; i++) {
        if (cometDust.length >= 360) break;
        const along = rand(c.size * 0.2, c.size * 1.5);
        const side = gauss() * c.size * 0.35;
        const spark = Math.random() < 0.34;
        cometDust.push({
          x: c.x - ux * along + px * side,
          y: c.y - uy * along + py * side,
          vx: gauss() * 1.6,
          vy: gauss() * 1.6,
          life: 0,
          maxLife: rand(5.2, 9.2),
          r: spark ? rand(0.1, 0.26) : rand(0.12, 0.38),
          warm: Math.random() > 0.35,
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

          if (!fx.cometsOn) {
            const waiting = cometSpawnIn > 1000;
            comets.length = 0;
            cometDust.length = 0;
            dustAcc = 0;
            if (waiting) cometSpawnIn = gap(4, 10, fx.cometF);
          } else {
            const cz = fx.cometZ;
            cometSpawnIn -= dt;
            if (cometSpawnIn <= 0 && comets.length < 1) {
              spawnComet(ew, eh);
              cometSpawnIn = 1e9;
            }

            for (let i = comets.length - 1; i >= 0; i--) {
              const c = comets[i];
              c.born += dt;
              c.phase += c.flicker * dt;
              c.t += c.speed * dt;
              const t = Math.min(1, c.t);
              c.x = bezier1(t, c.sx, c.cx, c.ex);
              c.y = bezier1(t, c.sy, c.cy, c.ey);
              c.vx = bezier1d(t, c.sx, c.cx, c.ex);
              c.vy = bezier1d(t, c.sy, c.cy, c.ey);
              dustAcc += dt;
              while (dustAcc >= 1 / 72) {
                emitCometDust(c);
                dustAcc -= 1 / 72;
              }
              if (c.t >= 1) {
                comets.splice(i, 1);
                cometSpawnIn = gap(15, 60, fx.cometF);
              }
            }

            for (let i = cometDust.length - 1; i >= 0; i--) {
              const p = cometDust[i];
              p.life += dt;
              p.phase += p.twinkle * dt;
              p.x += p.vx * dt;
              p.y += p.vy * dt;
              if (p.life >= p.maxLife) {
                cometDust.splice(i, 1);
              }
            }

            for (const p of cometDust) {
              drawCometDust(ctx, p, driftX, driftY, cz);
            }
            for (const c of comets) {
              drawCometHead(ctx, c, driftX, driftY, cz);
            }
          }
          ctx.restore();
        }
      } catch {
        /* keep the loop alive if a frame fails */
      }

      if (!reduceMotion && running) {
        raf = requestAnimationFrame(draw);
      }
    };

    draw(performance.now());

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("mousemove", onMove);
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
