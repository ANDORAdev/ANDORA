"use client";

/**
 * introKit — plumbing for the landing intro (CoinStreamIntro).
 *
 * The intro plays on first visit and on reload, never locks scroll, and any
 * click / key / wheel / touch ends it at once. The finale fires
 * INTRO_DONE_EVENT so BottomNav slides in while the curtain leaves.
 */

import { useEffect, useRef } from "react";
import { DESIGN } from "@/config/design";

export const INTRO_DONE_EVENT = "agora-intro-done";
export const INTRO_SESSION_KEY = "agora-intro-played";
/** Above QuickReveal (9995), below the nav (9999) so the nav lands on top. */
export const INTRO_Z = 9996;
export const INTRO_BG = DESIGN.colors.bg;
/** Same curve BottomNav uses for its entrance. */
export const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
export const EASE_IN_OUT = "cubic-bezier(0.76, 0, 0.24, 1)";

export function shouldPlayIntro(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const params = new URLSearchParams(window.location.search);
  const nav = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
  if (params.has("reset") || nav[0]?.type === "reload") sessionStorage.removeItem(INTRO_SESSION_KEY);
  if (process.env.NODE_ENV === "development") return true;
  return !sessionStorage.getItem(INTRO_SESSION_KEY);
}

export function announceIntroDone() {
  try {
    if (process.env.NODE_ENV !== "development") sessionStorage.setItem(INTRO_SESSION_KEY, "1");
  } catch {
    /* storage blocked: intro replays next visit */
  }
  window.dispatchEvent(new Event(INTRO_DONE_EVENT));
}

/**
 * Where the nav wordmark will sit once the nav has landed. Uses offset* so
 * the nav's own slide-in transform does not skew the measurement.
 */
export function navLogoCenter(logo: HTMLElement | null): { x: number; y: number } | null {
  const nav = logo?.offsetParent as HTMLElement | null;
  if (!logo || !nav) return null;
  return {
    x: nav.offsetLeft + logo.offsetLeft + logo.offsetWidth / 2,
    y: nav.offsetTop + logo.offsetTop + logo.offsetHeight / 2,
  };
}

/** Nav wordmark type, so a flying wordmark can land as the real one. */
export const NAV_WORDMARK_PX = 20;

/** Calls onInput once on the first click, key, wheel or touch while active. */
export function useEndOnInput(active: boolean, onInput: () => void) {
  const cb = useRef(onInput);
  useEffect(() => {
    cb.current = onInput;
  });
  useEffect(() => {
    if (!active) return;
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    const handler = () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      cb.current();
    };
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, handler));
  }, [active]);
}

/**
 * Intro time for a rAF loop. Each frame advances it by at most `maxStep` ms,
 * so a main thread stalled by the hero loading pauses the intro instead of
 * skipping it, and ordinary jank never piles up the way chained timeouts do.
 */
export function createIntroClock(maxStep = 64) {
  let last = -1;
  let t = 0;
  return (now: number) => {
    if (last >= 0) t += Math.min(now - last, maxStep);
    last = now;
    return t;
  };
}

/** One-shot callbacks fired from the intro clock once their time has come. */
export function createCues() {
  const list: { at: number; run: () => void }[] = [];
  return {
    at: (at: number, run: () => void) => {
      list.push({ at, run });
    },
    fire: (t: number) => {
      for (let i = 0; i < list.length; ) {
        if (list[i].at <= t) list.splice(i, 1)[0].run();
        else i++;
      }
    },
  };
}

/** Timeout bag that clears everything on unmount or skip. */
export function createTimers() {
  const ids: number[] = [];
  return {
    at: (ms: number, fn: () => void) => ids.push(window.setTimeout(fn, ms)),
    clear: () => ids.splice(0).forEach((id) => window.clearTimeout(id)),
  };
}
