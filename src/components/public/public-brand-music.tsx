"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBrand } from "@/components/shell/brand-provider";
import { BRAND_MUSIC_HREF } from "@/lib/public/brand-music";

const STORAGE_KEY = "vba-brand-music-v3";

type SavedMusic = {
  href: string;
  t: number;
  pausedByUser: boolean;
};

/** Survives PublicLayout remounts when moving Home ↔ custom canvas. */
let sharedAudio: HTMLAudioElement | null = null;

function ensureAudio(): HTMLAudioElement {
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.preload = "auto";
  }
  return sharedAudio;
}

function trackUrl(href: string): string {
  return new URL(href, window.location.origin).href;
}

function isSameTrack(el: HTMLAudioElement, href: string): boolean {
  const url = trackUrl(href);
  return el.src === url || el.currentSrc === url;
}

function readSaved(href: string): SavedMusic | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedMusic>;
    if (!parsed || parsed.href !== href) return null;
    const t = typeof parsed.t === "number" && Number.isFinite(parsed.t) && parsed.t > 0 ? parsed.t : 0;
    return { href, t, pausedByUser: parsed.pausedByUser === true };
  } catch {
    return null;
  }
}

function writeSaved(href: string, time: number, pausedByUser: boolean) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        href,
        t: Number.isFinite(time) && time > 0 ? time : 0,
        pausedByUser,
      }),
    );
  } catch {
    /* ignore */
  }
}

function seekTo(el: HTMLAudioElement, time: number, loop: boolean) {
  const duration = el.duration;
  if (!Number.isFinite(time) || time <= 0) return;
  if (Number.isFinite(duration) && duration > 0) {
    el.currentTime = loop ? time % duration : Math.min(time, Math.max(duration - 0.05, 0));
    return;
  }
  el.currentTime = time;
}

export function PublicBrandMusic() {
  const brand = useBrand();
  const href = brand.brand_music_url || BRAND_MUSIC_HREF;
  const enabled = Boolean(brand.brand_music_url);
  const loop = brand.brand_music_loop !== false;
  const autoplay = brand.brand_music_autoplay !== false;
  const wantedRef = useRef(false);
  const pausedByUserRef = useRef(false);
  const unloadingRef = useRef(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const el = ensureAudio();
    const url = trackUrl(href);
    const same = isSameTrack(el, href);
    const audible = same && !el.paused && !el.muted;
    unloadingRef.current = false;

    if (!same) {
      el.src = url;
    }
    el.loop = loop;
    el.volume = 1;

    const saved = readSaved(href);
    pausedByUserRef.current = saved?.pausedByUser === true;
    wantedRef.current = audible || (autoplay && !pausedByUserRef.current);
    if (audible) setPlaying(true);

    const persist = () => {
      if (unloadingRef.current) return;
      writeSaved(href, el.currentTime, pausedByUserRef.current);
    };

    const applySaved = () => {
      if (audible) return;
      if (el.currentTime > 0.25) return;
      if (!saved) return;
      seekTo(el, saved.t, loop);
    };

    const disarmGesture = () => {
      window.removeEventListener("pointerdown", onGesture, true);
      window.removeEventListener("keydown", onGesture, true);
    };

    const tryPlay = () => {
      if (!wantedRef.current) return;
      el.muted = false;
      void el
        .play()
        .then(() => {
          setPlaying(true);
          disarmGesture();
        })
        .catch(() => {
          el.muted = true;
          void el
            .play()
            .then(() => {
              /* running muted until the next click unmutes */
            })
            .catch(() => {
              /* still waiting for a gesture */
            });
        });
    };

    function onGesture(e: Event) {
      const target = e.target;
      if (target instanceof Element && target.closest("[data-brand-music-toggle]")) {
        return;
      }
      if (pausedByUserRef.current) {
        disarmGesture();
        return;
      }
      applySaved();
      wantedRef.current = true;
      el.muted = false;
      void el
        .play()
        .then(() => {
          setPlaying(true);
          disarmGesture();
        })
        .catch(() => {
          /* keep listening */
        });
    }

    const onReady = () => {
      applySaved();
      tryPlay();
    };

    const onPlay = () => {
      if (el.muted) return;
      wantedRef.current = true;
      setPlaying(true);
      persist();
    };
    const onPause = () => {
      if (unloadingRef.current) return;
      setPlaying(false);
    };
    const onHide = () => {
      unloadingRef.current = true;
      writeSaved(href, el.currentTime, pausedByUserRef.current);
    };

    el.addEventListener("loadedmetadata", onReady);
    el.addEventListener("canplay", onReady);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    window.addEventListener("pagehide", onHide);
    if (wantedRef.current && !audible) {
      window.addEventListener("pointerdown", onGesture, true);
      window.addEventListener("keydown", onGesture, true);
    }
    if (el.readyState >= 1) onReady();
    else tryPlay();

    const tick = window.setInterval(persist, 1000);

    return () => {
      window.clearInterval(tick);
      el.removeEventListener("loadedmetadata", onReady);
      el.removeEventListener("canplay", onReady);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      window.removeEventListener("pagehide", onHide);
      disarmGesture();
      writeSaved(href, el.currentTime, pausedByUserRef.current);
    };
  }, [enabled, href, loop, autoplay]);

  if (!enabled) return null;

  const toggle = () => {
    const el = ensureAudio();
    if (el.paused || el.muted) {
      pausedByUserRef.current = false;
      wantedRef.current = true;
      el.muted = false;
      void el.play().then(() => setPlaying(true));
      writeSaved(href, el.currentTime, false);
    } else {
      pausedByUserRef.current = true;
      wantedRef.current = false;
      el.pause();
      setPlaying(false);
      writeSaved(href, el.currentTime, true);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      data-brand-music-toggle=""
      onPointerDown={(e) => e.stopPropagation()}
      onClick={toggle}
      className="shrink-0 gap-1.5"
      title={playing ? "Pause music" : "Play music"}
      aria-pressed={playing}
    >
      {playing ? (
        <span className="inline-flex items-center gap-1" style={{ color: brand.brand_color }}>
          <Volume2 className="vba-speaker-live h-4 w-4" />
          <span className="vba-speaker-bars" aria-hidden>
            <span />
            <span />
            <span />
          </span>
        </span>
      ) : (
        <VolumeX className="h-4 w-4" />
      )}
      <span className="sr-only">{playing ? "Pause music" : "Play music"}</span>
    </Button>
  );
}
