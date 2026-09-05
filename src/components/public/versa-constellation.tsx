"use client";

import { useEffect, useRef } from "react";

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
  life: number;
  maxLife: number;
  r: number;
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

/**
 * Fixed starry field (full viewport). Gentle parallax with the cursor.
 * Shooting stars. Two variants:
 *  - classic: dense diagonal band, brand-tinted stars (original look).
 *  - realistic: natural star distribution with subtle color temperature
 *    variation, a faint galactic haze, diffraction glints on the brightest
 *    stars, and intermittent satellites crossing at varying speeds
 *    (never more than 3 at once, with quiet gaps between passes).
 * Colors resolve from the active theme as rgba(). No constellation lines.
 */
export function VersaConstellation({
  variant = "classic",
}: {
  variant?: ConstellationVariant;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    let raf = 0;
    let last = performance.now();
    let spawnIn = rand(1.8, 4.2);
    let satelliteSpawnIn = rand(6, 14);
    const mouse = { tx: 0, ty: 0, x: 0, y: 0 };
    let palette = readTheme();
    let running = true;

    const seedStars = (w: number, h: number) => {
      const next: Star[] = [];

      if (realistic) {
        // Natural sky: uniform field, no diagonal band. A few bright stars
        // carry diffraction glints; most stars are small and quiet.
        const fieldCount = Math.round(Math.min(w, h) * 0.22);
        for (let i = 0; i < fieldCount; i++) {
          const isBright = Math.random() < 0.045;
          next.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: isBright ? rand(1.5, 2.3) : rand(0.35, 1.35),
            phase: Math.random() * Math.PI * 2,
            twinkle: rand(0.4, 1.4),
            bright: isBright ? rand(0.75, 0.95) : rand(0.2, 0.62),
            depth: rand(0.2, 0.6),
            tone: 0,
            flicker: Math.random() < 0.3,
            jitter: rand(0, Math.PI * 2),
            tint: naturalTint(),
            glint: isBright,
          });
        }
      } else {
        const fieldCount = Math.round(Math.min(w, h) * 0.14);
        const bandCount = Math.round(Math.min(w, h) * 0.42);

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
            jitter: rand(0, Math.PI * 2),
          });
        }

        for (let i = 0; i < bandCount; i++) {
          const t = Math.random();
          const anchor = bandAnchor(t, w, h);
          const spread = (0.035 + Math.sin(t * Math.PI) * 0.055) * h;
          const nx = -0.68;
          const ny = -1.12;
          const mag = Math.hypot(nx, ny) || 1;
          const off = gauss() * spread;
          const along = gauss() * 10;
          const brightCore = i % 19 === 0;
          next.push({
            x: anchor.x + (nx / mag) * off + (ny / mag) * along,
            y: anchor.y + (ny / mag) * off - (nx / mag) * along,
            r: brightCore ? rand(2.0, 3.1) : rand(0.54, 1.7),
            phase: Math.random() * Math.PI * 2,
            twinkle: rand(0.7, 2.0),
            bright: brightCore ? 0.98 : rand(0.45, 0.88),
            depth: 0.55 + Math.random() * 0.55,
            tone: (i % 7 === 0 ? 2 : i % 4 === 0 ? 1 : 0) as 0 | 1 | 2,
            flicker: Math.random() < 0.48,
            jitter: rand(0, Math.PI * 2),
          });
        }
      }
      stars = next;
    };

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedStars(w, h);
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

    const onMove = (e: PointerEvent | MouseEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      mouse.tx = (e.clientX / w - 0.5) * 2;
      mouse.ty = (e.clientY / h - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("mousemove", onMove, { passive: true });

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

    // Satellites: steady points crossing the sky on gentle diagonal paths.
    // Intentionally intermittent - long quiet gaps between passes - and
    // never more than 3 at once. They fade in, drift at their own speed,
    // and fade out (a satellite passing into shadow), rather than always
    // exiting the frame.
    const spawnSatellite = (w: number, h: number) => {
      const fromLeft = Math.random() > 0.5;
      const speed = rand(16, 52);
      const y = rand(h * 0.06, h * 0.55);
      const vx = (fromLeft ? 1 : -1) * speed;
      const vy = rand(-0.3, 0.4) * speed;
      const crossTime = (w + 120) / speed;
      satellites.push({
        x: fromLeft ? -40 : w + 40,
        y,
        vx,
        vy,
        life: 0,
        maxLife: Math.min(crossTime, rand(11, 26)),
        r: rand(1.1, 1.7),
      });
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
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      try {
        if (!reduceMotion) {
          mouse.x += (mouse.tx - mouse.x) * 0.08;
          mouse.y += (mouse.ty - mouse.y) * 0.08;
        }

        ctx.clearRect(0, 0, w, h);

        const driftX = mouse.x * 28;
        const driftY = mouse.y * 18;

        // Realistic sky: faint galactic haze along the same diagonal the
        // classic band follows. Drawn first so stars sit on top of it.
        if (realistic) {
          const haze = ctx.createLinearGradient(0, h * 0.95, w, -0.05 * h);
          haze.addColorStop(0, rgba(palette.fg, 0));
          haze.addColorStop(0.42, rgba(palette.fg, 0.045));
          haze.addColorStop(0.58, rgba(palette.primary, 0.035));
          haze.addColorStop(1, rgba(palette.fg, 0));
          ctx.fillStyle = haze;
          ctx.fillRect(0, 0, w, h);
        }

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
          ctx.beginPath();
          ctx.arc(x, y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = rgba(color, s.bright * pulse);
          ctx.fill();
          if (s.glint) {
            const gl = s.r * 4.2;
            ctx.strokeStyle = rgba(color, s.bright * pulse * 0.32);
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(x - gl, y);
            ctx.lineTo(x + gl, y);
            ctx.moveTo(x, y - gl);
            ctx.lineTo(x, y + gl);
            ctx.stroke();
          }
        }

        if (!reduceMotion) {
          spawnIn -= dt;
          if (spawnIn <= 0 && meteors.length < 2) {
            spawnMeteor(w, h);
            spawnIn = rand(2.4, 5.5);
          }
          for (let i = meteors.length - 1; i >= 0; i--) {
            const m = meteors[i];
            m.life += dt;
            m.x += m.vx * dt;
            m.y += m.vy * dt;
            const speed = Math.hypot(m.vx, m.vy) || 1;
            const tx = m.x - (m.vx / speed) * m.length + driftX;
            const ty = m.y - (m.vy / speed) * m.length + driftY;
            const hx = m.x + driftX;
            const hy = m.y + driftY;
            if (![tx, ty, hx, hy].every(Number.isFinite)) {
              meteors.splice(i, 1);
              continue;
            }
            const fadeLife = Math.max(0, 1 - m.life / m.maxLife);
            const g = ctx.createLinearGradient(tx, ty, hx, hy);
            g.addColorStop(0, rgba(palette.primary, 0));
            g.addColorStop(0.65, rgba(palette.primary, 0.45 * fadeLife));
            g.addColorStop(1, rgba(palette.fg, 0.95 * fadeLife));
            ctx.strokeStyle = g;
            ctx.lineWidth = 1.4;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(hx, hy);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(hx, hy, 1.6, 0, Math.PI * 2);
            ctx.fillStyle = rgba(palette.fg, 0.95 * fadeLife);
            ctx.fill();
            if (m.life >= m.maxLife || m.x < -120 || m.x > w + 120 || m.y > h + 80) {
              meteors.splice(i, 1);
            }
          }

          // Satellites (realistic variant only).
          if (realistic) {
            satelliteSpawnIn -= dt;
            if (satelliteSpawnIn <= 0 && satellites.length < 3) {
              spawnSatellite(w, h);
              satelliteSpawnIn = rand(9, 22);
            }
            for (let i = satellites.length - 1; i >= 0; i--) {
              const sat = satellites[i];
              sat.life += dt;
              sat.x += sat.vx * dt;
              sat.y += sat.vy * dt;
              const fadeIn = Math.min(1, sat.life / 1.2);
              const fadeOut = Math.min(1, (sat.maxLife - sat.life) / 1.2);
              const alpha = 0.75 * Math.max(0, Math.min(fadeIn, fadeOut));
              if (alpha > 0.01) {
                const sx = sat.x + driftX * 0.3;
                const sy = sat.y + driftY * 0.3;
                // Subtle short trail opposite to motion.
                const mag = Math.hypot(sat.vx, sat.vy) || 1;
                const tl = 7;
                const g = ctx.createLinearGradient(
                  sx - (sat.vx / mag) * tl,
                  sy - (sat.vy / mag) * tl,
                  sx,
                  sy,
                );
                g.addColorStop(0, rgba(palette.fg, 0));
                g.addColorStop(1, rgba(palette.fg, alpha * 0.55));
                ctx.strokeStyle = g;
                ctx.lineWidth = sat.r * 0.9;
                ctx.lineCap = "round";
                ctx.beginPath();
                ctx.moveTo(sx - (sat.vx / mag) * tl, sy - (sat.vy / mag) * tl);
                ctx.lineTo(sx, sy);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(sx, sy, sat.r, 0, Math.PI * 2);
                ctx.fillStyle = rgba(palette.fg, alpha);
                ctx.fill();
              }
              if (sat.life >= sat.maxLife || sat.y < -60 || sat.y > h + 60) {
                satellites.splice(i, 1);
              }
            }
          }
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
      themeObserver.disconnect();
    };
  }, [variant]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-svh w-full"
      aria-hidden
    />
  );
}
