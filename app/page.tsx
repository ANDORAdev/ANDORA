"use client";

/**
 * Homepage — stock-backed lending on Robinhood Chain.
 *
 * Section order:
 *   1. HeroVisionSection — thesis backdrop + manifesto (700vh scroll distance)
 *   2. HowSection        — 3 steps cycle through while pinned
 *   3. FeaturedMarkets, TwoSides, Edge, Pricing (rates & fees), FAQ, CTA, Footer
 *
 * Logo architecture:
 *   The 3D logo is a single <HeroLogo> component rendered here as
 *   `position: fixed`. ONE master GSAP ScrollTrigger timeline in this file
 *   drives the logo's position/scale/opacity across sections 1 and 2.
 *
 *   HeroVisionSection owns: backdrop text, fact chips, manifesto.
 *   HowSection owns:        step-reveal text.
 *   Neither section contains any logo DOM or logo ScrollTrigger.
 *
 * Lenis ↔ ScrollTrigger sync:
 *   Handled in lib/lenis.tsx — lenis.on("scroll", ScrollTrigger.update) +
 *   gsap.ticker drives lenis.raf.
 */

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, useScroll, useTransform } from "framer-motion";
import { useLendingBootstrap } from "@/lib/lending/hooks";

import HeroVisionSection from "@/components/v3/HeroVisionSection";
import HeroLogo, { logoScrollState } from "@/components/v3/HeroLogo";
import HowSection from "@/components/v3/HowSection";
import FeaturedMarkets from "@/components/v3/FeaturedMarkets";
import TwoSidesSection from "@/components/v3/TwoSidesSection";
import EdgeSection from "@/components/v3/EdgeSection";
import PricingSection from "@/components/v3/PricingSection";
import FAQSection from "@/components/v3/FAQSection";
import CTASection from "@/components/v3/CTASection";
import Footer from "@/components/Footer";
import { DESIGN } from "@/config/design";

gsap.registerPlugin(ScrollTrigger);

/**
 * TOC_SECTIONS — ordered list that drives both the TOC strip labels and the
 * IntersectionObserver active-detection. The `key` must match `data-toc`
 * attributes on each section's outer wrapper div.
 */
const TOC_SECTIONS = [
  { key: "vision",  label: "THE IDEA"  },
  { key: "how",     label: "HOW"       },
  { key: "markets", label: "MARKETS"   },
  { key: "sides",   label: "TWO SIDES" },
  { key: "edge",    label: "EDGE"      },
  { key: "rates",   label: "RATES"     },
  { key: "faq",     label: "FAQ"       },
  { key: "connect", label: "START"     },
] as const;

type TocKey = typeof TOC_SECTIONS[number]["key"];

/**
 * ScrollTOCBar — fixed bottom strip with:
 *   - Row of section names (grey by default, orange when active).
 *   - 2px scaleX progress bar directly below the names.
 *   - IntersectionObserver (rootMargin -50% 0px -50% 0px) for O(1) active switch.
 *   - Click on name scrolls that section into view (Lenis-compatible native scroll).
 */
function ScrollTOCBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const [activeKey, setActiveKey] = useState<TocKey | null>(null);
  // Each label's horizontal position as % of total scrollable height — so
  // the label sits exactly where the progress bar reaches when that section
  // starts. Equal-width grid columns are wrong because sections have very
  // different scroll lengths (Hero 700vh, Pricing 200vh, ...).
  const [positions, setPositions] = useState<Record<string, number>>({});

  useEffect(() => {
    const computePositions = () => {
      const totalScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll <= 0) return;
      const next: Record<string, number> = {};
      TOC_SECTIONS.forEach(({ key }) => {
        const el = document.querySelector(`[data-toc="${key}"]`);
        if (!el) return;
        const rect = (el as HTMLElement).getBoundingClientRect();
        const docTop = rect.top + window.scrollY;
        next[key] = Math.max(0, Math.min(100, (docTop / totalScroll) * 100));
      });
      setPositions(next);
    };
    // Initial compute (next paint, after sticky/section heights resolve).
    const raf = requestAnimationFrame(computePositions);
    window.addEventListener("resize", computePositions, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", computePositions);
    };
  }, []);

  useEffect(() => {
    // Build a map of key → section element for quick lookup
    const elements: Map<TocKey, Element> = new Map();
    TOC_SECTIONS.forEach(({ key }) => {
      const el = document.querySelector(`[data-toc="${key}"]`);
      if (el) elements.set(key, el);
    });

    if (elements.size === 0) return;

    // rootMargin "0px 0px -100% 0px" → root collapses to a 0-height line at
    // VIEWPORT TOP. A wrapper intersects exactly while its document range
    // covers the viewport-top scroll position — which matches when its
    // sticky child is pinned and visually showing. Previous "-50% 0px -50%
    // 0px" (viewport center) was firing the switch halfway through each
    // section's scroll, well before / after the visible content changed.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const key = entry.target.getAttribute("data-toc") as TocKey | null;
            if (key) setActiveKey(key);
          }
        });
      },
      { rootMargin: "0px 0px -100% 0px", threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  function scrollToSection(key: TocKey) {
    const el = document.querySelector(`[data-toc="${key}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9990,
        pointerEvents: "none",
        // Backdrop blur floats cleanly over both dark and light sections.
        // A solid bg would clash with the orange CTA section.
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      {/* Label row — absolute positioning per label. Each label sits at
          its section's real start position (% of total scroll), so the
          horizontal placement matches where the orange progress bar
          reaches when that section begins. */}
      <div
        style={{
          position: "relative",
          height: 22,
          paddingTop: 8,
          paddingBottom: 6,
        }}
      >
        {TOC_SECTIONS.map(({ key, label }) => {
          const isActive = key === activeKey;
          const leftPct = positions[key];
          if (leftPct === undefined) return null;
          return (
            <button
              key={key}
              onClick={() => scrollToSection(key)}
              aria-label={`Scroll to ${label} section`}
              style={{
                position: "absolute",
                left: `${leftPct}%`,
                top: 8,
                // Center label on its section-start position so the label
                // sits exactly over where the orange bar reaches.
                transform: "translateX(-50%)",
                background: "none",
                border: "none",
                padding: "0 4px",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                color: DESIGN.colors.accent,
                opacity: isActive ? 1 : 0,
                cursor: isActive ? "none" : "default",
                pointerEvents: isActive ? "auto" : "none",
                transition: `opacity ${DESIGN.motion.base}`,
                lineHeight: 1,
                userSelect: "none",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 2px progress bar — scaleX 0→1 same as before */}
      <motion.div
        style={{
          height: "2px",
          backgroundColor: DESIGN.colors.accent,
          scaleX,
          transformOrigin: "left center",
          willChange: "transform",
        }}
      />
    </div>
  );
}

export default function Home() {
  // Starts the market data feed used by FeaturedMarkets.
  useLendingBootstrap();

  // These refs are passed into HeroLogo.
  //   logoContainerRef — outer div: GSAP ScrollTrigger writes x/y/scale/opacity.
  //   logoImgRef       — inner div: mouse-tilt RAF writes rotateX/rotateY.
  const logoContainerRef = useRef<HTMLDivElement>(null);
  const logoImgRef = useRef<HTMLDivElement>(null);

  // Refs to the scroll-distance wrappers so we can build the trigger range.
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const howSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Wait one frame so all DOM is painted and ScrollTrigger can measure heights.
    const raf = requestAnimationFrame(() => {
      const logoCont = logoContainerRef.current;
      const heroEl = heroSectionRef.current;
      const howEl = howSectionRef.current;
      if (!logoCont || !heroEl || !howEl) return;

      // Center the logo via GSAP transform (xPercent/yPercent) so scale pivots
      // from the logo's actual centre. Doing this in CSS would leave GSAP's
      // transform-origin off-center, making the entrance scale-up drift.
      gsap.set(logoCont, { xPercent: -50, yPercent: -50 });

      // ── Phase keyframes ─────────────────────────────────────────────────────
      //
      // The full scroll distance = heroSection (700vh) + howSection (400vh) = 1100vh.
      // We normalise this to [0, 1] for the scrubbed timeline.
      //
      // Segment boundaries (approximate, based on component scroll heights):
      //   0.00 → 0.25  : logo centred while pills / backdrop are visible
      //   0.10 → 0.30  : logo shifts LEFT as manifesto appears on right
      //   0.30 → 0.39  : logo parked LEFT while manifesto exits
      //   0.39 → 0.59  : SYNC TRANSITION — bg white→dark, logo dark→light,
      //                  logo travels LEFT→RIGHT (all start together at 0.39)
      //   0.59 → 0.70  : transition into HowSection (sticky disengage)
      //   0.70 → 0.955 : logo parked RIGHT for How steps (01 → 02 → 03)
      //   0.955 → 1.0  : logo fades out as HowSection ends

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroEl,
          start: "top top",
          endTrigger: howEl,
          end: "bottom bottom",
          scrub: 0.5, // tighter lerp (was 1) → less visible lag on reverse
          invalidateOnRefresh: true, // re-measure on resize / HMR
        },
      });

      // Phase 0→0.25: centred (scale removed — logo size locked at 1 always)
      tl.to(logoCont, { x: 0, y: 0, duration: 0.25 }, 0);

      // Phase 0.10→0.30: shift LEFT while manifesto is on right.
      // Only POSITION on the parent — rotation is delegated to the real 3D
      // model via logoScrollState.rotationY (separate tween below). CSS
      // rotateY on the parent would flatten the inner Canvas as a 2D plane.
      tl.to(
        logoCont,
        {
          x: () => -(window.innerWidth * 0.2),
          y: () => -(window.innerHeight * 0.02),
          duration: 0.2,
          ease: "power2.inOut",
        },
        0.1
      );
      // 3D rotation of the actual mesh during the left shift — one full
      // 360° turn so the model ends at the SAME orientation it started at
      // (same silhouette = same apparent size at endpoints).
      tl.to(
        logoScrollState,
        { rotationY: -Math.PI * 2, duration: 0.2, ease: "power2.inOut" },
        0.1
      );

      // Phase 0.39→0.59: travel LEFT → RIGHT, coordinated with the bg fade
      // and dark→light crossfade. POSITION-only on the parent — the 720°
      // visual rotation happens on the real 3D mesh below.
      tl.to(
        logoCont,
        {
          x: () => window.innerWidth * 0.2,
          y: () => -window.innerHeight * 0.03,
          duration: 0.2,
          ease: "power2.inOut",
        },
        0.39
      );
      // One additional 360° turn during the LEFT → RIGHT travel. From
      // -2π (end of left-shift turn) to -4π (= -720°, two full turns total).
      // -4π is a multiple of 360° so the mesh ends at the SAME orientation
      // as start → silhouette identical, no apparent size change at the
      // new location. The full turn is visible mid-travel as a spin.
      tl.to(
        logoScrollState,
        { rotationY: -Math.PI * 4, duration: 0.2, ease: "power2.inOut" },
        0.39
      );

      // Phase 0.955→1.0: closing transition synced with step 03 text exit.
      // Step 03 fades at HowSection local 0.85 = master 0.955, duration local
      // 0.15 = master 0.045. Same params here so logo + text leave together.
      tl.to(
        logoCont,
        {
          opacity: 0,
          yPercent: -130,
          duration: 0.045,
          ease: "power2.in",
        },
        0.955
      );

      // Reverse fade: when scrolling back into HowSection from below
      // (scrub handles this automatically because scrub:1 reverses on scroll-back)

      // ── Page-load entrance ───────────────────────────────────────────────────
      // Only fade in on mount if user is at TOP of page. On mid-page refresh,
      // the scrub timeline already sets correct opacity for current scroll
      // position — running fromTo here would fight it and leave logo invisible.
      // No scale animation: would conflict with scrub timeline on scroll-back.
      if (window.scrollY < 100) {
        gsap.fromTo(
          logoCont,
          { opacity: 0 },
          { opacity: 1, duration: 1.2, ease: "power4.out", delay: 0.3 }
        );
      } else {
        gsap.set(logoCont, { opacity: 1 });
      }
    });

    return () => {
      cancelAnimationFrame(raf);
      ScrollTrigger.getAll().forEach((st) => {
        // Only kill triggers created by this effect — the ones attached to heroEl/howEl.
        // We identify them by trigger element.
        const triggerEl = st.vars?.trigger;
        if (
          triggerEl === heroSectionRef.current ||
          triggerEl === howSectionRef.current
        ) {
          st.kill();
        }
      });
    };
  }, []);

  return (
    <main
      style={{
        // Use the same dark-grey as HeroVisionSection's morph target and
        // HowSection's bg so the section boundary between them shows zero seam.
        // Was `DESIGN.colors.bg` (#08080a) which created a visible darker strip
        // peeking through during the Hero→How transition.
        backgroundColor: "#0C0C0C",
        color: DESIGN.colors.text,
      }}
    >
      <ScrollTOCBar />

      {/*
       * Fixed logo — lives outside all sections.
       * GSAP ScrollTrigger in this file drives it.
       * Mouse-tilt RAF inside HeroLogo drives the inner image only.
       */}
      <HeroLogo containerRef={logoContainerRef} imgRef={logoImgRef} />

      {/*
       * We wrap HeroVisionSection in a div so we have a reliable ref to its
       * scroll distance wrapper for the ScrollTrigger endTrigger calculation.
       * The inner component's own wrapperRef does the same for its own trigger —
       * no conflict because they are the same DOM node.
       */}
      <div ref={heroSectionRef}>
        <HeroVisionSection />
      </div>

      <div ref={howSectionRef}>
        <HowSection />
      </div>

      <FeaturedMarkets />
      <TwoSidesSection />
      <EdgeSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  );
}
