"use client";

import { useEffect } from "react";

const THRESHOLD = 0.25;
const SETTLE_MS = 700;

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

/**
 * Snap the visitor homepage to the next/previous full-viewport section once
 * native scroll has crossed 25% of the distance between section tops.
 */
export function PublicSnapScroll() {
  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let snapping = false;
    let lastY = window.scrollY;
    let lastDir = 1;
    let settleTimer = 0;

    const sections = () =>
      [...main.querySelectorAll<HTMLElement>("[data-public-section]")];

    function snapTo(el: HTMLElement) {
      if (Math.abs(window.scrollY - el.offsetTop) < 8) return;
      snapping = true;
      el.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "start",
      });
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        snapping = false;
        lastY = window.scrollY;
      }, reduce ? 40 : SETTLE_MS);
    }

    function onScroll() {
      if (snapping || programmaticLock) return;
      const y = window.scrollY;
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

      if (lastDir > 0 && i < els.length - 1) {
        const span = Math.max(1, tops[i + 1] - tops[i]);
        if ((y - tops[i]) / span >= THRESHOLD) snapTo(els[i + 1]);
      } else if (lastDir < 0 && i + 1 < tops.length) {
        const span = Math.max(1, tops[i + 1] - tops[i]);
        if ((tops[i + 1] - y) / span >= THRESHOLD) snapTo(els[i]);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(settleTimer);
    };
  }, []);

  return null;
}
