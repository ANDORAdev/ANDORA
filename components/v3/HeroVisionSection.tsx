"use client";

/**
 * HeroVisionSection — thesis backdrop + ecosystem logos + manifesto.
 *
 * The 3D logo has been lifted out of this component into HeroLogo (fixed element
 * in page.tsx). This component is now responsible ONLY for:
 *   - Backdrop halftone text ("NVDA in. USDG out." with a cycling ticker)
 *   - Ecosystem logo strip (USDG, Chainlink, Stocks, Robinhood Chain)
 *   - Vision manifesto (right column)
 *
 * The master ScrollTrigger timeline in page.tsx drives the logo position.
 * This component's own ScrollTrigger handles pills + manifesto reveal only.
 */

import { useRef, useEffect, useCallback, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { BRAND } from "@/config/brand";
import { CHAIN_LOGO } from "@/config/chain";
import { DESIGN } from "@/config/design";
import { LOAN_ASSET } from "@/config/lending";
import LogoMark from "@/components/LogoMark";
import { createSettlingLoop, SETTLE_EPSILON } from "@/lib/hooks/settlingLoop";

gsap.registerPlugin(ScrollTrigger);

// Collateral tickers cycled in the backdrop headline ("NVDA in. USDG out.").
const TICKERS = ["NVDA", "TSLA", "SPY", "AAPL"];
const CYCLE_INTERVAL = 4500;
const CYCLE_FADE = 1.2; // seconds for each fade out / fade in

// Tech the product runs on, shown as a grey logo strip along the bottom of the
// hero (same treatment as the old partner logos). Two items sit on each side
// of the 3D logo. Right-side items anchor from the right edge (em offsets use
// the strip font size) so the row stays symmetric at 1024–1920px widths.
const STRIP_FONT_SIZE = "clamp(18px, 1.55vw, 30px)";
const ECOSYSTEM: { name: string; logos: string[]; left?: string; right?: string }[] = [
  { name: LOAN_ASSET.symbol, logos: [LOAN_ASSET.logo ?? ""], left: "4%" },
  { name: "Chainlink", logos: ["/logos/chainlink.svg"], left: "16%" },
  // Collateral: stock tokens, shown with two of the listed stock marks.
  { name: "Stocks", logos: ["/logos/nvda.svg", "/logos/aapl.svg"], right: "calc(4% + 12.5em)" },
  { name: "Robinhood Chain", logos: [CHAIN_LOGO], right: "4%" },
];

const HALFTONE_INK = "rgba(8,8,10,0.85)";

// Dimmer halftone for the static words around the cycling ticker.
const STATIC_HALFTONE: React.CSSProperties = {
  background: "radial-gradient(circle, rgba(8,8,10,0.7) 1px, transparent 1px)",
  backgroundSize: "4px 4px",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};


/**
 * EcosystemLogo — logo mark + name in large grey type, no box. Drifts with the
 * cursor (sleeps once settled) and darkens on hover. Sits on the white hero.
 */
function EcosystemLogo({ name, logos, compact = false }: { name: string; logos: string[]; compact?: boolean }) {
  const driftRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (compact) return;
    const target = { x: 0.5, y: 0.5 };
    const current = { x: 0.5, y: 0.5 };
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    // Drifts with the cursor, then sleeps until the pointer moves again.
    const drift = createSettlingLoop(() => {
      const dx = target.x - current.x;
      const dy = target.y - current.y;
      current.x = lerp(current.x, target.x, 0.04);
      current.y = lerp(current.y, target.y, 0.04);
      if (driftRef.current) {
        const tx = (current.x - 0.5) * 24;
        const ty = (current.y - 0.5) * 24;
        driftRef.current.style.transform = `translate(${tx}px, ${ty}px)`;
      }
      return Math.abs(dx) > SETTLE_EPSILON || Math.abs(dy) > SETTLE_EPSILON;
    });
    const onMove = (e: MouseEvent) => {
      target.x = e.clientX / window.innerWidth;
      target.y = e.clientY / window.innerHeight;
      drift.wake();
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      drift.stop();
    };
  }, [compact]);

  const fontSize = compact ? 15 : STRIP_FONT_SIZE;

  return (
    <div ref={driftRef} style={{ willChange: compact ? undefined : "transform" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35em",
          fontFamily: "var(--font-sans)",
          fontSize,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          whiteSpace: "nowrap",
          color: hovered ? DESIGN.colors.sectionTextLight : "rgba(8,8,10,0.4)",
          transition: "color 280ms ease",
        }}
      >
        {logos.filter(Boolean).map((src) => (
          <LogoMark key={src} src={src} height={compact ? 18 : 30} style={{ height: "1.25em", width: "1.25em" }} />
        ))}
        {name}
      </div>
    </div>
  );
}

// ─── Mobile ecosystem grid ────────────────────────────────────────────────────

interface MobileEcosystemGridProps {
  gridRef: (el: HTMLDivElement | null) => void;
}

function MobileEcosystemGrid({ gridRef }: MobileEcosystemGridProps) {
  return (
    <div
      ref={gridRef}
      style={{
        position: "fixed",
        bottom: "clamp(20px, 4vh, 60px)",
        // Centered via margin auto so GSAP's transform tween isn't fighting
        // a inline translateX(-50%) that breaks yPercent animation.
        left: 0,
        right: 0,
        marginLeft: "auto",
        marginRight: "auto",
        width: "calc(100% - 64px)",
        maxWidth: 480,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
        padding: 0,
        zIndex: 50,
        pointerEvents: "none",
        willChange: "opacity, transform",
      }}
    >
      {ECOSYSTEM.map((item) => (
        <div key={item.name} style={{ display: "flex", justifyContent: "center" }}>
          <EcosystemLogo name={item.name} logos={item.logos} compact />
        </div>
      ))}
    </div>
  );
}

const MANIFESTO_LINES = [
  "Borrow against your stocks.",
  "No need to sell a single share.",
  "Deposit NVDA, TSLA or SPY.",
  "Borrow USDG. 24/7. Self-custody.",
  "Repay anytime. Keep the upside.",
];

export default function HeroVisionSection() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  // White overlay inside sticky child. Wrapper bg stays locked at #0C0C0C
  // (matches HowSection) so the section boundary never shows a color seam.
  // The white→dark "morph" is achieved by fading THIS overlay's opacity to 0,
  // not by animating the outer wrapper bg (which previously caused the seam
  // due to scrub:1 lag at the section join).
  const whiteOverlayRef = useRef<HTMLDivElement>(null);

  const backdropTextRef = useRef<HTMLDivElement>(null);
  const pillsRef = useRef<(HTMLDivElement | null)[]>([]);
  const pillWrapsRef = useRef<(HTMLDivElement | null)[]>([]);
  const partnerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const partnerWrapsRef = useRef<(HTMLDivElement | null)[]>([]);

  const visionWrapRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLHeadingElement>(null);
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);

  const firstWordRef = useRef<HTMLSpanElement>(null);
  const [tickerIndex, setTickerIndex] = useState(0);
  const tickerRef = useRef(0);

  // Mobile fact grid ref for scroll-linked fade (null on desktop — grid not rendered)
  const partnerGridRef = useRef<HTMLDivElement | null>(null);

  // Detect mobile viewport for fact chip layout switching
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Drives the wrapper's data-theme attribute. While the white overlay is
  // mostly opaque (scroll in the "white hero" phase) the section's bg
  // reads as light and the nav text needs to be DARK. Once the overlay
  // fades past ~50% (bg is now mostly the page dark hex), data-theme flips
  // to "dark" so the BottomNav theme detector picks white text. Fixes the
  // bug where the nav switched to dark text while scrolling up through
  // HowSection because the 700vh hero wrapper's bottom 40px claimed to be
  // "light" even though the visible bg there is already dark.
  const [heroTheme, setHeroTheme] = useState<"light" | "dark">("light");

  // Ticker-cycling animation (time-based, independent of scroll)
  useEffect(() => {
    const interval = setInterval(() => {
      const first = firstWordRef.current;
      if (!first) return;

      gsap.to(first, {
        opacity: 0,
        duration: CYCLE_FADE,
        ease: "power2.in",
        onComplete: () => {
          const next = (tickerRef.current + 1) % TICKERS.length;
          tickerRef.current = next;
          setTickerIndex(next);
          gsap.to(first, {
            opacity: 1,
            duration: CYCLE_FADE,
            ease: "power2.out",
          });
        },
      });
    }, CYCLE_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  useGSAP(
    () => {
      const wrapper = wrapperRef.current;
      const backdrop = backdropTextRef.current;
      const visionWrap = visionWrapRef.current;
      const brand = brandRef.current;
      if (!wrapper || !backdrop || !visionWrap || !brand) return;

      const words = wordsRef.current.filter(Boolean) as HTMLSpanElement[];
      const pills = pillsRef.current.filter(Boolean) as HTMLDivElement[];
      const pillWraps = pillWrapsRef.current.filter(Boolean) as HTMLDivElement[];
      const partners = partnerRefs.current.filter(Boolean) as HTMLDivElement[];
      const partnerWraps = partnerWrapsRef.current.filter(Boolean) as HTMLDivElement[];

      // Initial state
      gsap.set(backdrop, { opacity: 0 });
      gsap.set(pills, { opacity: 0, scale: 0.8 });
      gsap.set(partners, { opacity: 0, scale: 0.8 });
      gsap.set(visionWrap, { opacity: 0 });
      gsap.set(brand, { x: "60%", opacity: 0 });
      gsap.set(words, { opacity: 0, y: 12 });

      // Page-load entrance (time-based)
      const enterTl = gsap.timeline({ delay: 0.3 });
      enterTl.to(backdrop, { opacity: 1, duration: 0.8, ease: "power2.out" });
      pills.forEach((pill, i) => {
        enterTl.to(
          pill,
          { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" },
          0.6 + i * 0.08
        );
      });

      partners.forEach((partner, i) => {
        enterTl.to(
          partner,
          { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)" },
          0.9 + i * 0.08
        );
      });

      // Scroll-driven: pills exit, manifesto reveals, manifesto exits
      enterTl.call(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: wrapper,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
          },
        });

        // Background morph: white → dark.
        // We fade a WHITE OVERLAY inside the sticky child (wrapper stays
        // transparent → page dark bg). Pattern mirrors CTASection.
        //
        // Fade window is LATE so the section reads as a white-hero for most
        // of its scroll — the dark only takes over right before the end.
        if (whiteOverlayRef.current) {
          tl.to(
            whiteOverlayRef.current,
            {
              opacity: 0,
              duration: 0.15,
              ease: "none",
              // Sync the wrapper's data-theme with the overlay's current
              // opacity → BottomNav theme detector flips to "dark" the
              // moment the section is visually dark, not 700vh later.
              onUpdate: function () {
                const op = gsap.getProperty(
                  whiteOverlayRef.current,
                  "opacity"
                ) as number;
                setHeroTheme(op > 0.5 ? "light" : "dark");
              },
            },
            0.65
          );
        }

        // ── TIMELINE PADDING — kills the sticky-bottom clipping seam ────────
        // The sticky child has `overflow: hidden`. As sticky disengages near
        // ScrollTrigger end, its bottom edge migrates UP through the viewport.
        // If the white overlay still has any opacity at that moment, the
        // overflow:hidden clip exposes a sharp horizontal seam (lighter overlay
        // above, raw page bg below).
        //
        // Without padding the overlay tween's end (timeline 0.80) IS the
        // timeline's max duration, meaning ScrollTrigger end maps exactly to
        // overlay-fade-end. scrub:1 lerp lag then leaves the overlay still
        // partially opaque past the sticky-disengage moment → visible seam.
        //
        // This dummy tween extends timeline duration to 1.0. ScrollTrigger
        // now maps scroll 0→end to timeline 0→1.0, so overlay-fade ends at
        // ~80% of scroll, leaving 20% of scroll (and 20% of timeline) as
        // buffer for scrub lag. The overlay reads 0 well before sticky
        // disengage. Wrapping with `as unknown as object` keeps TS happy
        // about tweening an ad-hoc target.
        const pad = { _: 0 };
        tl.to(pad, { _: 1, duration: 0.20, ease: "none" }, 0.80);

        // Pills fly out
        pillWraps.forEach((wrap, i) => {
          tl.to(
            wrap,
            { yPercent: -200 - i * 80, opacity: 0, duration: 0.15 },
            0.03 + i * 0.015
          );
        });

        // Fact chips fly out — same pattern as pills
        partnerWraps.forEach((wrap, i) => {
          tl.to(
            wrap,
            { yPercent: -200 - i * 80, opacity: 0, duration: 0.15 },
            0.05 + i * 0.015
          );
        });

        tl.to(backdrop, { yPercent: -30, opacity: 0, duration: 0.15 }, 0.04);

        // Mobile fact grid fades at the same progress as the backdrop title
        if (partnerGridRef.current) {
          tl.to(partnerGridRef.current, { yPercent: -30, opacity: 0, duration: 0.15 }, 0.04);
        }

        // Manifesto reveals
        tl.to(visionWrap, { opacity: 1, duration: 0.08 }, 0.28);
        tl.to(brand, { x: 0, opacity: 1, duration: 0.1, ease: "power3.out" }, 0.28);

        words.forEach((word, i) => {
          const progress = 0.28 + (i / words.length) * 0.2;
          tl.to(
            word,
            { opacity: 1, y: 0, duration: 0.04, ease: "power2.out" },
            progress
          );
        });

        // Manifesto exits UP — starts EARLIER (0.50) and lasts LONGER (0.15)
        // so it fully closes BEFORE the logo begins its right-shift in the
        // master timeline. Mirror of entry where logo motion preceded text.
        tl.to(visionWrap, { yPercent: -80, opacity: 0, duration: 0.15, ease: "power2.in" }, 0.50);
        tl.to(brand, { yPercent: -100, opacity: 0, duration: 0.12, ease: "power2.in" }, 0.50);
      });
    },
    { scope: wrapperRef, dependencies: [isMobile] }
  );

  let globalWordIndex = 0;

  return (
    <div
      ref={wrapperRef}
      data-theme={heroTheme}
      data-hero="vision"
      style={{
        minHeight: "700vh",
        position: "relative",
        // Wrapper is transparent — page <main> bg (#0C0C0C) shows through.
        // Same trick as CTASection: never paint the 700vh wrapper, so the
        // boundary with HowSection has only ONE paint layer (page main).
        // Two adjacent painted layers with the same hex can still seam due
        // to subpixel rendering + Lenis fractional transforms; one layer
        // can't.
        // The white→dark morph is performed by whiteOverlayRef inside the
        // sticky child below.
      }}
    >
      {/* TOC marker — invisible div positioned in the document at the
          scroll range where the manifesto/vision is actually on screen.
          The IntersectionObserver in page.tsx watches this element with
          rootMargin "0 0 -100% 0" (probe at viewport top), so the bottom
          TOC reads "THE VISION" only during the manifesto phase, not for
          all 700vh of HeroVisionSection's wrapper. */}
      <div
        id="vision"
        data-toc="vision"
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "30%",      // hero timeline ~0.30 = manifesto starts revealing
          height: "30%",   // up to ~0.60 (manifesto exit window)
          left: 0,
          right: 0,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/*
          White overlay — covers the sticky viewport. Opacity 1 on load,
          scrubbed to 0 between scroll progress 0.50 and 0.70. Behind all
          other sticky-child content (rendered first, no z-index), so the
          backdrop/pills/manifesto layer above it.
        */}
        <div
          ref={whiteOverlayRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "#ffffff",
            pointerEvents: "none",
            willChange: "opacity",
          }}
        />
        {/* Giant halftone backdrop text — mobile: 3 stacked lines, desktop: 2-row horizontal */}
        <div
          ref={backdropTextRef}
          style={{
            position: "absolute",
            ...(isMobile
              ? {
                  top: "clamp(80px, 12vh, 140px)",
                  left: "50%",
                  transform: "translate3d(-50%, 0, 0)",
                  width: "calc(100% - 48px)",
                  maxWidth: 480,
                  textAlign: "center",
                }
              : {
                  top: "54%",
                  left: "50%",
                  // translate3d forces GPU compositing → dot grid renders at integer
                  // pixel positions consistently. translate() (2D) lets the browser
                  // pick subpixel rendering on each refresh, causing banding on
                  // letters whose rows happen to land on half-pixels (the "S" bug).
                  transform: "translate3d(-50%, -100%, 0)",
                  width: "95vw",
                  maxWidth: 1400,
                  textAlign: "center",
                }),
            backfaceVisibility: "hidden",
            fontSize: isMobile
              ? "clamp(40px, 11vw, 64px)"
              : "clamp(64px, 10vw, 175px)",
            fontWeight: 800,
            fontFamily: "var(--font-sans)",
            letterSpacing: "-0.04em",
            lineHeight: 1.0,
            background:
              "radial-gradient(circle, rgba(8,8,10,0.85) 1px, transparent 1px)",
            backgroundSize: "4px 4px",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            userSelect: "none",
            pointerEvents: "none",
            filter:
              "drop-shadow(0 2px 1px rgba(0,0,0,0.20))" +
              " drop-shadow(0 6px 8px rgba(0,0,0,0.18))" +
              " drop-shadow(0 16px 24px rgba(0,0,0,0.10))",
            zIndex: 1,
            willChange: "opacity, transform",
          }}
          aria-hidden="true"
        >
          {isMobile ? (
            /* ── Mobile: 2 stacked lines ───────────────────────────────────── */
            <>
              {/* Line 1: cycling ticker + "in." */}
              <div
                style={{
                  marginBottom: "clamp(8px, 1.5vh, 16px)",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  ref={firstWordRef}
                  style={{
                    display: "inline-block",
                    willChange: "transform, opacity",
                    background: `radial-gradient(circle, ${HALFTONE_INK} 1px, transparent 1px)`,
                    backgroundSize: "4px 4px",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {TICKERS[tickerIndex]}
                </span>
                <span style={STATIC_HALFTONE}>&nbsp;in.</span>
              </div>
              {/* Line 2: static loan asset */}
              <div style={{ whiteSpace: "nowrap", ...STATIC_HALFTONE }}>USDG out.</div>
            </>
          ) : (
            /* ── Desktop: 2-row horizontal layout ──────────────────────────── */
            <>
              {/* Line 1 mirrors line 2: ticker left of the 3D logo, "in." right of it.
                  Half the gap of line 2 because the logo's apex is narrower up here. */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "baseline",
                  whiteSpace: "nowrap",
                  marginBottom: "0.1em",
                  gap: "1em",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    justifyContent: "flex-end",
                    overflow: "hidden",
                    width: "5.8em",
                  }}
                >
                  <span
                    ref={firstWordRef}
                    style={{
                      display: "inline-block",
                      willChange: "transform, opacity",
                      background: `radial-gradient(circle, ${HALFTONE_INK} 1px, transparent 1px)`,
                      backgroundSize: "4px 4px",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {TICKERS[tickerIndex]}
                  </span>
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    justifyContent: "flex-start",
                    width: "5.8em",
                    ...STATIC_HALFTONE,
                  }}
                >
                  in.
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "baseline",
                  whiteSpace: "nowrap",
                  gap: "2em",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    justifyContent: "flex-end",
                    width: "5.8em",
                    ...STATIC_HALFTONE,
                  }}
                >
                  USDG
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    justifyContent: "flex-start",
                    width: "5.8em",
                    ...STATIC_HALFTONE,
                  }}
                >
                  out.
                </span>
              </div>
            </>
          )}
        </div>

        {/* Ecosystem logos — desktop: absolute-positioned with cursor parallax.
            Mobile: 2x2 grid centered at bottom of viewport. */}
        {!isMobile && ECOSYSTEM.map((item, i) => (
          <div
            key={item.name}
            ref={(el) => { partnerWrapsRef.current[i] = el; }}
            style={{
              position: "fixed",
              left: item.left,
              right: item.right,
              top: "86%",
              fontSize: STRIP_FONT_SIZE,
              zIndex: 50,
              willChange: "transform, opacity",
            }}
          >
            <div
              ref={(el) => { partnerRefs.current[i] = el; }}
              style={{ willChange: "transform" }}
            >
              <EcosystemLogo name={item.name} logos={item.logos} />
            </div>
          </div>
        ))}
        {isMobile && (
          <MobileEcosystemGrid
            gridRef={(el) => { partnerGridRef.current = el; }}
          />
        )}

        {/* Vision manifesto (right column — appears mid-scroll) */}
        <style>{`
          .vision-manifesto {
            position: absolute;
            top: 50%;
            right: clamp(60px, 18vw, 280px);
            transform: translateY(-50%);
            max-width: 45%;
            will-change: opacity;
            z-index: 2;
          }
          @media (max-width: 767px) {
            .vision-manifesto {
              right: auto;
              left: 0;
              right: 0;
              top: 18%;
              transform: none;
              max-width: 100%;
              padding: 0 16px;
              text-align: center;
            }
            /* Force inline right-alignment to center on mobile */
            .vision-manifesto h2 {
              text-align: center !important;
              font-size: clamp(48px, 16vw, 96px) !important;
              line-height: 1 !important;
              margin-bottom: 8px !important;
              white-space: nowrap;
            }
            .vision-manifesto > div {
              text-align: center !important;
              font-size: clamp(15px, 4.2vw, 22px) !important;
              line-height: 1.35 !important;
            }
            .vision-manifesto > div > div {
              margin-bottom: 0.05em !important;
            }
          }
        `}</style>
        <div
          ref={visionWrapRef}
          className="vision-manifesto"
          style={{ willChange: "opacity" }}
        >

          <h2
            ref={brandRef}
            style={{
              fontSize: "clamp(64px, 10vw, 175px)",
              fontWeight: 800,
              fontFamily: "var(--font-sans)",
              letterSpacing: "-0.04em",
              lineHeight: 0.9,
              marginBottom: "clamp(12px, 2vh, 28px)",
              willChange: "transform, opacity",
              background:
                "radial-gradient(circle, rgba(8,8,10,0.85) 1px, transparent 1px)",
              backgroundSize: "4px 4px",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textAlign: "right",
              // Stronger layered shadows for visible depth on the manifesto wordmark.
              filter:
                "drop-shadow(0 3px 2px rgba(0,0,0,0.35))" +
                " drop-shadow(0 10px 14px rgba(0,0,0,0.28))" +
                " drop-shadow(0 24px 36px rgba(0,0,0,0.18))",
            }}
          >
            {BRAND.name}
          </h2>

          <div
            style={{
              fontSize: "clamp(16px, 2.2vw, 32px)",
              fontWeight: 700,
              lineHeight: 1.3,
              letterSpacing: "-0.02em",
              fontFamily: "var(--font-sans)",
              textAlign: "right",
            }}
          >
            {MANIFESTO_LINES.map((line, lineIdx) => (
              <div key={lineIdx} style={{ marginBottom: "0.1em" }}>
                {line.split(" ").map((word, wordIdx) => {
                  const idx = globalWordIndex++;
                  return (
                    <span
                      key={`${lineIdx}-${wordIdx}`}
                      ref={(el) => {
                        wordsRef.current[idx] = el;
                      }}
                      style={{
                        display: "inline-block",
                        marginRight: "0.28em",
                        color: DESIGN.colors.bg,
                        willChange: "opacity",
                      }}
                    >
                      {word}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
