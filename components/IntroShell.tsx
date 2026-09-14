"use client";

/**
 * IntroShell v3 -- splits nav mounting from intro animation mounting.
 *
 * NAV_PATHS:   BottomNav mounts on these routes (homepage only; docs/privacy/terms have own top bars).
 * INTRO_PATHS: the intro (CoinStreamIntro) only plays here (homepage only).
 *
 * Any other route (dashboard, login, authenticated areas) gets a chrome-less shell.
 */

import { useRef, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import ScrollToTop from "@/components/v3/ScrollToTop";
import QuickReveal from "@/components/QuickReveal";
import CoinStreamIntro from "@/components/intro/CoinStreamIntro";
import { INTRO_DONE_EVENT, INTRO_SESSION_KEY } from "@/components/intro/introKit";

// Routes where BottomNav renders. Add new marketing pages here.
// /privacy, /terms, and /docs all use their own sticky top bar (CONDUCTOR-style layout).
const NAV_PATHS = ["/"];

// Routes where the intro animation plays.
// Keep this to homepage only so /docs does not replay the intro.
const INTRO_PATHS = ["/"];

interface IntroShellProps {
  children: React.ReactNode;
}

export default function IntroShell({ children }: IntroShellProps) {
  const pathname = usePathname();
  const showNav   = NAV_PATHS.includes(pathname);
  const showIntro = INTRO_PATHS.includes(pathname);

  const navLogoRef = useRef<HTMLAnchorElement | null>(null);
  const [introPlayed, setIntroPlayed] = useState(false);

  useEffect(() => {
    if (!showIntro) return; // no intro on /docs; nav appears immediately below
    // Check prefers-reduced-motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      requestAnimationFrame(() => setIntroPlayed(true));
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const isReset = params.has("reset");

    // Detect page reload (F5 / Ctrl+R / browser reload) — replay intro on
    // every refresh, but still skip it when navigating back from an internal
    // route (which preserves sessionStorage but is not a reload).
    const navEntries = performance.getEntriesByType(
      "navigation"
    ) as PerformanceNavigationTiming[];
    const isReload = navEntries[0]?.type === "reload";

    if (isReset || isReload) sessionStorage.removeItem(INTRO_SESSION_KEY);

    if (!isReset && !isReload && sessionStorage.getItem(INTRO_SESSION_KEY)) {
      requestAnimationFrame(() => setIntroPlayed(true));
    }
  }, [showIntro]);

  useEffect(() => {
    const handler = () => setIntroPlayed(true);
    window.addEventListener(INTRO_DONE_EVENT, handler);
    return () => window.removeEventListener(INTRO_DONE_EVENT, handler);
  }, []);

  if (!showNav) {
    // Dashboard / login / authenticated areas: no marketing chrome at all.
    return <>{children}</>;
  }

  // On routes in NAV_PATHS that are not in INTRO_PATHS (none currently, but kept for future pages):
  // pass introPlayed=true so BottomNav appears immediately without waiting
  // for an intro animation that is not playing.
  const navIntroPlayed = showIntro ? introPlayed : true;

  return (
    <>
      <QuickReveal />
      {showIntro && <CoinStreamIntro navLogoRef={navLogoRef} />}
      <BottomNav logoRef={navLogoRef} introPlayed={navIntroPlayed} />
      {children}
      <ScrollToTop />
    </>
  );
}
