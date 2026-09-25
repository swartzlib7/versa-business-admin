"use client";

import { useEffect } from "react";

const THRESHOLD = 0.25;
const SETTLE_MS = 700;
/** Ignore scroll direction while the mobile browser bar is resizing the viewport. */
const CHROME_MS = 700;

let programmaticLock = false;
let programmaticTimer = 0;

export function scrollPublicToTop() {
  programmaticLock = true;
  window.clearTimeout(programmaticTimer);
  window.scrollTo({ top: 0, behavior: "smooth" });
  const unlock = () => {
    programmaticLock = false;
    window.removeEventListener("scrollend", unlock);
  };
  window.addEventListener("scrollend", unlock, { once: true });
  programmaticTimer = window.setTimeout(unlock, 2000);
}

function mobileLayout(): boolean {
  return (
    window.matchMedia("(max-width: 1023px)").matches ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

/**
 * Snap the visitor homepage to the next/previous full-viewport section once
 * native scroll has crossed 25% of the distance between section tops.
 * Phones and tablets do not use that activation region.
 */
export function PublicSnapScroll() {
  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 1023px)");
    const coarse = window.matchMedia("(pointer: coarse)");
    let cleanup = () => {};

    function attach() {
      cleanup();
      cleanup = () => {};
      if (mobileLayout()) return;
      const main = document.querySelector("main");
      if (!main) return;

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let snapping = false;
      let lastY = window.scrollY;
      let lastDir = 1;
      let settleTimer = 0;
      let chromeUntil = 0;
      let lastVv = window.visualViewport?.height ?? 0;

      const sections = () =>
        [...main.querySelectorAll<HTMLElement>("[data-public-section]")];

      function snapTo(target: number) {
        if (Math.abs(window.scrollY - target) < 8) return;
        snapping = true;
        window.scrollTo({ top: target, behavior: reduce ? "auto" : "smooth" });
        window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(() => {
          snapping = false;
          lastY = window.scrollY;
        }, reduce ? 40 : SETTLE_MS);
      }

      function onViewport() {
        const h = window.visualViewport?.height ?? lastVv;
        if (Math.abs(h - lastVv) > 1) {
          lastVv = h;
          chromeUntil = Date.now() + CHROME_MS;
          lastY = window.scrollY;
        }
      }

      function onScroll() {
        if (snapping || programmaticLock) return;
        const y = window.scrollY;
        if (Date.now() < chromeUntil) {
          lastY = y;
          return;
        }
        const delta = y - lastY;
        if (delta !== 0) lastDir = delta > 0 ? 1 : -1;
        lastY = y;

        const els = sections();
        if (els.length < 2) return;
        const tops = els.map((el) => el.offsetTop);

        let i = 0;
        for (let n = 0; n < tops.length; n++) {
          if (tops[n] <= y + 1) i = n;
        }
        const vh = window.innerHeight;
        const heightOf = (n: number) => els[n].offsetHeight;
        // A section taller than the screen reads with native scroll; its snap point
        // going back up is where its bottom meets the bottom of the screen.
        const tall = (n: number) => heightOf(n) > vh + 8;
        const settleOf = (n: number) => (tall(n) ? tops[n] + heightOf(n) - vh : tops[n]);

        if (lastDir > 0 && i < els.length - 1) {
          if (tall(i)) {
            const shown = y + vh - tops[i + 1];
            if (shown / vh >= THRESHOLD) snapTo(tops[i + 1]);
          } else {
            const span = Math.max(1, tops[i + 1] - tops[i]);
            if ((y - tops[i]) / span >= THRESHOLD) snapTo(tops[i + 1]);
          }
        } else if (lastDir < 0 && i + 1 < tops.length) {
          if (tall(i) && y > tops[i]) return;
          const back = tops[i + 1] - y;
          const span = tall(i) ? vh : Math.max(1, tops[i + 1] - tops[i]);
          if (back / span >= THRESHOLD) snapTo(settleOf(i));
        }
      }

      window.addEventListener("scroll", onScroll, { passive: true });
      window.visualViewport?.addEventListener("resize", onViewport);
      cleanup = () => {
        window.removeEventListener("scroll", onScroll);
        window.visualViewport?.removeEventListener("resize", onViewport);
        window.clearTimeout(settleTimer);
      };
    }

    attach();
    narrow.addEventListener("change", attach);
    coarse.addEventListener("change", attach);
    return () => {
      narrow.removeEventListener("change", attach);
      coarse.removeEventListener("change", attach);
      cleanup();
    };
  }, []);

  return null;
}
