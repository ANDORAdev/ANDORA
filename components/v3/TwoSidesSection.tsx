"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { DESIGN } from "@/config/design";

gsap.registerPlugin(ScrollTrigger);

// ── Data ──────────────────────────────────────────────────────────────────────

const BORROWER_POINTS = [
  "Get USDG without selling NVDA, TSLA or SPY",
  "Stay exposed if the stock keeps climbing",
  "Repay any time. No fixed term, no lock-up",
  "Each stock is isolated from your other loans",
];

const LENDER_POINTS = [
  "Deposit USDG into a curated vault",
  "Blue Chip, Mega Cap or High Beta: pick your risk",
  "Earn the interest borrowers pay, minus a fee",
  "Withdraw whenever the vault has idle liquidity",
];

// ── Light-section tokens ──────────────────────────────────────────────────────

const LIGHT = {
  bg: "#ffffff",
  cardBg: DESIGN.colors.sectionCardLight,  // "#f0f0e8"
  border: DESIGN.colors.sectionBorderLight,// "rgba(38,38,45,0.13)"
  text: DESIGN.colors.sectionTextLight,    // "#08080a"
  textMuted: DESIGN.colors.textDim,        // "#5a5a5a"
  textDim: DESIGN.colors.sectionTextDim,   // "rgba(8,8,10,0.45)"
  cardBorder: "rgba(38,38,45,0.18)",
  shadow: "0 4px 20px rgba(0,0,0,0.06)",
};

// ── Bullet blur helper ───────────────────────────────────────────────────────
// `clear` is 0-1. At 0 = 8px blur (default). At 1 = 0px blur (clear).
function bulletsBlurFromClear(clear: number): number {
  return 8 * (1 - Math.min(1, Math.max(0, clear)));
}

// ── Label color blend ────────────────────────────────────────────────────────
// `pulse` is 0-1. At 0 = black text. At 1 = full accent orange.
function labelColorFromPulse(pulse: number): string {
  const t = Math.min(1, Math.max(0, pulse));
  const r = Math.round(8 + (255 - 8) * t);
  const g = Math.round(8 + (87 - 8) * t);
  const b = Math.round(10 + (34 - 10) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

// ── Zone helpers ──────────────────────────────────────────────────────────────

type Zone = "spine" | "normal" | "hero";

function getZone(pct: number): Zone {
  if (pct < 30) return "spine";
  if (pct < 70) return "normal";
  return "hero";
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TwoSidesSection() {
  // Split state — 0-100, clamped 8-92 during drag
  const splitPctRef = useRef<number>(50);
  const [splitPct, setSplitPct] = useState<number>(50);

  // Drag state
  const isDraggingRef = useRef<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerWidthRef = useRef<number>(0);
  const containerLeftRef = useRef<number>(0);
  const [hintVisible, setHintVisible] = useState<boolean>(true);
  const hasEverDraggedRef = useRef<boolean>(false);

  // Mobile tab state — Borrowers active by default
  const [mobileActive, setMobileActive] = useState<"borrowers" | "lenders">("borrowers");

  // Scroll-driven reveal state (driven by scrub timeline)
  const [reveal, setReveal] = useState({
    leftClear: 0,
    rightClear: 0,
    leftPulse: 0,
    rightPulse: 0,
  });

  // Scroll animation refs
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const sectionHeaderRef = useRef<HTMLDivElement>(null);
  const headerTitleRef = useRef<HTMLHeadingElement>(null);
  const headerSubtitleRef = useRef<HTMLParagraphElement>(null);
  const leftTitleRef = useRef<HTMLDivElement>(null);
  const rightTitleRef = useRef<HTMLDivElement>(null);
  const leftPointsRef = useRef<(HTMLLIElement | null)[]>([]);
  const rightPointsRef = useRef<(HTMLLIElement | null)[]>([]);
  const handleRef = useRef<HTMLDivElement>(null);
  const handleDotRef = useRef<HTMLDivElement>(null);

  // Hero element refs for GSAP

  // Zones derived from splitPct
  const leftZone = getZone(splitPct);
  const rightZone = getZone(100 - splitPct);

  // Bullet opacity values (for direct style, recalculated each render)
  const leftBlur = bulletsBlurFromClear(reveal.leftClear);
  const rightBlur = bulletsBlurFromClear(reveal.rightClear);
  const leftLabelColor = labelColorFromPulse(reveal.leftPulse);
  const rightLabelColor = labelColorFromPulse(reveal.rightPulse);

  // ── GSAP: scroll timeline + pulse ──────────────────────────────────────────

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const leftPoints = leftPointsRef.current.filter(Boolean) as HTMLLIElement[];
      const rightPoints = rightPointsRef.current.filter(Boolean) as HTMLLIElement[];

      // Initial states
      gsap.set(headerTitleRef.current, { y: 40, opacity: 0 });
      gsap.set(headerSubtitleRef.current, { y: 25, opacity: 0 });
      gsap.set(leftTitleRef.current, { x: -120, opacity: 0 });
      gsap.set(rightTitleRef.current, { x: 120, opacity: 0 });
      gsap.set(leftPoints, { x: -80, opacity: 0 });
      gsap.set(rightPoints, { x: 80, opacity: 0 });
      gsap.set(handleRef.current, { opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });

      // ── ENTRY ──────────────────────────────────────────────────────────────
      // Header title + subtitle staged entry (matches FeaturedMarkets section).
      tl.to(headerTitleRef.current, { y: 0, opacity: 1, duration: 0.10, ease: "power3.out" }, 0.03);
      tl.to(headerSubtitleRef.current, { y: 0, opacity: 1, duration: 0.10, ease: "power3.out" }, 0.07);
      tl.to(handleRef.current, { opacity: 1, duration: 0.10, ease: "power2.out" }, 0.08);
      tl.to(leftTitleRef.current, { x: 0, opacity: 1, duration: 0.12, ease: "power3.out" }, 0.10);

      // Borrower bullets slide in (blurred, since leftClear stays 0 until phase 2)
      leftPoints.forEach((point, i) => {
        tl.to(point, { x: 0, opacity: 1, duration: 0.10, ease: "power3.out" }, 0.14 + i * 0.03);
      });

      // ── Scroll-driven reveal pulses ─────────────────────────────────────────
      const revealObj = { leftClear: 0, rightClear: 0, leftPulse: 0, rightPulse: 0 };
      const applyReveal = () => setReveal({ ...revealObj });

      // PHASE 2: borrower becomes orange, points become clear
      tl.to(revealObj, { leftClear: 1, leftPulse: 1, duration: 0.10, ease: "power2.inOut", onUpdate: applyReveal }, 0.26);

      // HOLD: read borrower clear+orange

      // PHASE 3: lender title + bullets appear (still blurred)
      tl.to(rightTitleRef.current, { x: 0, opacity: 1, duration: 0.08, ease: "power3.out" }, 0.46);
      rightPoints.forEach((point, i) => {
        tl.to(point, { x: 0, opacity: 1, duration: 0.07, ease: "power3.out" }, 0.49 + i * 0.02);
      });

      // PHASE 4: borrower returns to black, lender becomes orange, lender points clear
      tl.to(revealObj, { leftPulse: 0, rightClear: 1, rightPulse: 1, duration: 0.10, ease: "power2.inOut", onUpdate: applyReveal }, 0.62);

      // HOLD 0.72 - 0.82: read lender clear+orange (main breathing window)

      // PHASE 5: lender returns to black (both stay clear).
      tl.to(revealObj, { rightPulse: 0, duration: 0.08, ease: "power2.inOut", onUpdate: applyReveal }, 0.82);

      // HOLD 0.90 - 0.96: settled final state, both black, both clear

      // ── EXIT ───────────────────────────────────────────────────────────────
      tl.to(headerTitleRef.current, { yPercent: -80, opacity: 0, duration: 0.04, ease: "power2.in" }, 0.96);
      tl.to(headerSubtitleRef.current, { yPercent: -60, opacity: 0, duration: 0.04, ease: "power2.in" }, 0.97);
      tl.to(leftTitleRef.current, { xPercent: -80, opacity: 0, duration: 0.03, ease: "power2.in" }, 0.97);
      tl.to(rightTitleRef.current, { xPercent: 80, opacity: 0, duration: 0.03, ease: "power2.in" }, 0.97);
      tl.to(handleRef.current, { opacity: 0, duration: 0.03, ease: "power2.in" }, 0.97);

      // Padding for scrub headroom past exit
      const pad = { _: 0 };
      tl.to(pad, { _: 1, duration: 0.02, ease: "none" }, 0.98);

    },
    { scope: containerRef }
  );

  // ── GSAP snap utility ──────────────────────────────────────────────────────

  const snapTo = useCallback((target: number) => {
    const obj = { pct: splitPctRef.current };
    gsap.to(obj, {
      pct: target,
      duration: 0.55,
      ease: "power3.out",
      onUpdate() {
        const clamped = Math.min(92, Math.max(8, obj.pct));
        splitPctRef.current = clamped;
        setSplitPct(clamped);
      },
    });
  }, []);

  // ── Pointer drag handlers ──────────────────────────────────────────────────

  const onHandlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      const sticky = stickyRef.current;
      if (!sticky) return;

      isDraggingRef.current = true;
      setIsDragging(true);
      const rect = sticky.getBoundingClientRect();
      containerWidthRef.current = rect.width;
      containerLeftRef.current = rect.left;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      // Kill any running snap tween
      gsap.killTweensOf({ pct: splitPctRef.current });

      // Pause the grab-dot pulse while dragging
      const dot = handleDotRef.current;
      if (dot) {
        gsap.getTweensOf(dot).forEach((t) => t.pause());
        gsap.set(dot, { scale: 1 });
      }
    },
    []
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return;
      const rawPct =
        ((e.clientX - containerLeftRef.current) / containerWidthRef.current) * 100;
      const clamped = Math.min(92, Math.max(8, rawPct));
      splitPctRef.current = clamped;
      setSplitPct(clamped);

      if (!hasEverDraggedRef.current) {
        hasEverDraggedRef.current = true;
        setHintVisible(false);
      }
    },
    []
  );

  const onPointerUp = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);

    // Resume the grab-dot pulse once drag ends
    const dot = handleDotRef.current;
    if (dot) {
      gsap.getTweensOf(dot).forEach((t) => t.resume());
    }
  }, []);

  // ── Click-to-snap handlers ─────────────────────────────────────────────────

  const onLeftPanelClick = useCallback(
    (_e: React.MouseEvent<HTMLDivElement>) => {
      if (hasEverDraggedRef.current && isDraggingRef.current) return;
      snapTo(75);
    },
    [snapTo]
  );

  const onRightPanelClick = useCallback(
    (_e: React.MouseEvent<HTMLDivElement>) => {
      if (hasEverDraggedRef.current && isDraggingRef.current) return;
      snapTo(25);
    },
    [snapTo]
  );

  const onHandleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      snapTo(50);
    },
    [snapTo]
  );

  // ── Derived styles ─────────────────────────────────────────────────────────

  // Widths locked 50/50 — reveal is via color + blur, not width
  const leftWidthPct = 50;
  const rightWidthPct = 50;

  const MONO_LABEL_STYLE: React.CSSProperties = {
    fontFamily: DESIGN.font.mono,
    fontSize: "13px",
    letterSpacing: "0.14em",
    color: DESIGN.colors.accent,
    textTransform: "uppercase",
    display: "block",
    lineHeight: 1.2,
  };

  const BIG_LABEL_STYLE: React.CSSProperties = {
    fontFamily: "var(--font-sans)",
    fontSize: "clamp(26px, 3.4vw, 48px)",
    fontWeight: 800,
    letterSpacing: "-0.03em",
    lineHeight: 1,
    color: LIGHT.text,
    textTransform: "uppercase",
    margin: 0,
    userSelect: "none",
  };

  const NUMBER_LABEL_STYLE: React.CSSProperties = {
    fontFamily: DESIGN.font.mono,
    fontSize: DESIGN.fontSize.xs,
    letterSpacing: "0.12em",
    color: DESIGN.colors.accent,
    textTransform: "uppercase",
    marginBottom: DESIGN.spacing.sm,
    display: "block",
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      id="sides"
      data-toc="sides"
      data-theme="light"
      style={{
        minHeight: "340vh",
        position: "relative",
        backgroundColor: LIGHT.bg,
      }}
    >
      <div
        ref={stickyRef}
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "center",
          gap: "clamp(16px, 2vh, 28px)",
          cursor: isDragging ? "col-resize" : "default",
        }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >

        {/* ── SECTION HEADER ───────────────────────────────────────────────── */}
        <div
          ref={sectionHeaderRef}
          className="two-sides-desktop-header"
          style={{
            width: "100%",
            textAlign: "center",
            paddingLeft: DESIGN.spacing.lg,
            paddingRight: DESIGN.spacing.lg,
            flexShrink: 0,
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <h2
            ref={headerTitleRef}
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(48px, 7vw, 110px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 0.95,
              margin: "0 auto",
              textAlign: "center",
              whiteSpace: "nowrap",
              background:
                "radial-gradient(circle, rgba(8,8,10,0.85) 1px, transparent 1px)",
              backgroundSize: "4px 4px",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter:
                "drop-shadow(0 2px 1px rgba(0,0,0,0.20))" +
                " drop-shadow(0 6px 8px rgba(0,0,0,0.18))" +
                " drop-shadow(0 16px 24px rgba(0,0,0,0.10))",
              paddingBottom: "0.15em",
              willChange: "transform, opacity",
            }}
          >
            Two sides. One market.
          </h2>
          <p
            ref={headerSubtitleRef}
            style={{
              marginTop: "clamp(12px, 1.6vh, 22px)",
              marginLeft: "auto",
              marginRight: "auto",
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(15px, 1.6vw, 22px)",
              color: LIGHT.textMuted,
              textAlign: "center",
              maxWidth: 640,
              lineHeight: 1.5,
              willChange: "transform, opacity",
            }}
          >
            Borrowers unlock cash from their stocks. Lenders earn the interest they pay.
          </p>
        </div>

        {/* ── DESKTOP LAYOUT ───────────────────────────────────────────────── */}
        <div
          className="two-sides-desktop"
          style={{ display: "flex", width: "100%", height: "clamp(300px, 48vh, 480px)", minHeight: 0 }}
        >

          {/* LEFT PANEL — Borrower */}
          <div
            style={{
              width: `${leftWidthPct}%`,
              height: "100%",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: leftZone === "spine" ? "center" : "flex-end",
              padding: leftZone === "spine" ? 0 : `0 clamp(20px, 3vw, 56px) 0 clamp(24px, 4vw, 80px)`,
              overflow: "hidden",
              cursor: "default",
              transition: "width 0s",
            }}
          >
            {/* Spine mode: vertical label only */}
            {leftZone === "spine" && (
              <div
                style={{
                  ...BIG_LABEL_STYLE,
                  fontSize: "clamp(20px, 2.4vw, 32px)",
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                  position: "relative",
                  zIndex: 2,
                  color: leftLabelColor,
                  transition: "color 0.45s ease",
                }}
              >
                BORROWER
              </div>
            )}

            {/* Normal / Hero mode: label above bullets */}
            {leftZone !== "spine" && (
              <div
                ref={leftTitleRef}
                style={{
                  position: "relative",
                  zIndex: 2,
                  width: "100%",
                  maxWidth: 540,
                  flexShrink: 0,
                  willChange: "transform, opacity",
                }}
              >
                <h3
                  style={{
                    ...BIG_LABEL_STYLE,
                    textAlign: "left",
                    marginBottom: "clamp(16px, 2.2vh, 28px)",
                    color: leftLabelColor,
                    transition: "color 0.45s ease",
                  }}
                >
                  Borrower
                </h3>

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    filter: `blur(${leftBlur}px)`,
                    transition: "filter 0.45s ease",
                  }}
                >
                  {BORROWER_POINTS.map((point, i) => (
                    <li
                      key={i}
                      ref={(el) => { leftPointsRef.current[i] = el; }}
                      style={{
                        fontSize: "clamp(15px, 1.8vw, 19px)",
                        fontFamily: DESIGN.font.sans,
                        color: LIGHT.textMuted,
                        lineHeight: 1.5,
                        marginBottom: "clamp(10px, 1.8vh, 18px)",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        willChange: "transform, opacity",
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          backgroundColor: DESIGN.colors.accent,
                          flexShrink: 0,
                          marginTop: "0.55em",
                        }}
                      />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* CENTER HANDLE */}
          <div
            ref={handleRef}
            style={{
              position: "relative",
              width: 0,
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              flexShrink: 0,
              pointerEvents: "none",
            }}
          >
            {/* Thin black divider — faded on top + bottom corners */}
            <div
              style={{
                position: "absolute",
                top: "18%",
                bottom: "18%",
                left: 0,
                width: 1,
                background:
                  "linear-gradient(to bottom, transparent 0%, rgba(8,8,10,0.55) 25%, rgba(8,8,10,0.55) 75%, transparent 100%)",
                pointerEvents: "none",
                transform: "translateX(-50%)",
              }}
            />
          </div>

          {/* RIGHT PANEL — Lender */}
          <div
            style={{
              width: `${rightWidthPct}%`,
              height: "100%",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: rightZone === "spine" ? "center" : "flex-start",
              padding: rightZone === "spine" ? 0 : `0 clamp(24px, 4vw, 80px) 0 clamp(20px, 3vw, 56px)`,
              overflow: "hidden",
              cursor: "default",
              transition: "width 0s",
            }}
          >
            {/* Spine mode: vertical label only */}
            {rightZone === "spine" && (
              <div
                style={{
                  ...BIG_LABEL_STYLE,
                  fontSize: "clamp(20px, 2.4vw, 32px)",
                  writingMode: "vertical-rl",
                  position: "relative",
                  zIndex: 2,
                  color: rightLabelColor,
                  transition: "color 0.45s ease",
                }}
              >
                LENDER
              </div>
            )}

            {/* Normal / Hero mode: label above bullets */}
            {rightZone !== "spine" && (
              <div
                ref={rightTitleRef}
                style={{
                  position: "relative",
                  zIndex: 2,
                  width: "100%",
                  maxWidth: 540,
                  flexShrink: 0,
                  willChange: "transform, opacity",
                }}
              >
                <h3
                  style={{
                    ...BIG_LABEL_STYLE,
                    textAlign: "right",
                    marginBottom: "clamp(16px, 2.2vh, 28px)",
                    color: rightLabelColor,
                    transition: "color 0.45s ease",
                  }}
                >
                  Lender
                </h3>

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    filter: `blur(${rightBlur}px)`,
                    transition: "filter 0.45s ease",
                  }}
                >
                  {LENDER_POINTS.map((point, i) => (
                    <li
                      key={i}
                      ref={(el) => { rightPointsRef.current[i] = el; }}
                      style={{
                        fontSize: "clamp(15px, 1.8vw, 19px)",
                        fontFamily: DESIGN.font.sans,
                        color: LIGHT.textMuted,
                        lineHeight: 1.5,
                        marginBottom: "clamp(10px, 1.8vh, 18px)",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        justifyContent: "flex-end",
                        willChange: "transform, opacity",
                      }}
                    >
                      {point}
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          backgroundColor: DESIGN.colors.accent,
                          flexShrink: 0,
                          marginTop: "0.55em",
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* ── MOBILE LAYOUT ────────────────────────────────────────────────── */}
        <div className="two-sides-mobile">
          {/* Section header (mobile) */}
          <div
            style={{
              width: "100%",
              textAlign: "center",
              padding: `${DESIGN.spacing.xl} ${DESIGN.spacing.lg} ${DESIGN.spacing.md}`,
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "clamp(24px, 7vw, 56px)",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 0.95,
                margin: "0 auto",
                textAlign: "center",
                whiteSpace: "nowrap",
                background:
                  "radial-gradient(circle, rgba(8,8,10,0.85) 1px, transparent 1px)",
                backgroundSize: "4px 4px",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter:
                  "drop-shadow(0 2px 1px rgba(0,0,0,0.20))" +
                  " drop-shadow(0 6px 8px rgba(0,0,0,0.18))" +
                  " drop-shadow(0 16px 24px rgba(0,0,0,0.10))",
                paddingBottom: "0.15em",
              }}
            >
              Two sides. One market.
            </h2>
            <p
              style={{
                marginTop: DESIGN.spacing.md,
                marginLeft: "auto",
                marginRight: "auto",
                fontFamily: "var(--font-sans)",
                fontSize: "clamp(15px, 4vw, 18px)",
                color: LIGHT.textMuted,
                textAlign: "center",
                maxWidth: 480,
                lineHeight: 1.5,
              }}
            >
              Tap a side. Borrow against your stocks, or lend idle USDG and earn.
            </p>
          </div>

          {/* Tab pills */}
          <div
            style={{
              display: "flex",
              gap: DESIGN.spacing.sm,
              justifyContent: "center",
              padding: `0 ${DESIGN.spacing.md} ${DESIGN.spacing.md}`,
            }}
          >
            {(["borrowers", "lenders"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setMobileActive(tab)}
                style={{
                  fontFamily: DESIGN.font.mono,
                  fontSize: DESIGN.fontSize.sm,
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  padding: `${DESIGN.spacing.sm} ${DESIGN.spacing.lg}`,
                  borderRadius: DESIGN.radius.full,
                  border: `1px solid ${mobileActive === tab ? DESIGN.colors.accent : LIGHT.border}`,
                  background: mobileActive === tab ? DESIGN.colors.accentSoft : "transparent",
                  color: mobileActive === tab ? DESIGN.colors.accent : LIGHT.textMuted,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {tab === "borrowers" ? "01 - BORROWER" : "02 - LENDER"}
              </button>
            ))}
          </div>

          {/* Active panel content */}
          <div
            style={{
              padding: `0 ${DESIGN.spacing.lg}`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "relative", zIndex: 2 }}>
              {mobileActive === "borrowers" ? (
                <>
                  <span style={{ ...NUMBER_LABEL_STYLE }}>01 - BORROWER</span>
                  <ul style={{ listStyle: "none", padding: 0, margin: `${DESIGN.spacing.md} 0 0` }}>
                    {BORROWER_POINTS.map((point, i) => (
                      <li
                        key={i}
                        style={{
                          fontSize: DESIGN.fontSize.base,
                          fontFamily: DESIGN.font.sans,
                          color: LIGHT.textMuted,
                          lineHeight: 1.5,
                          marginBottom: DESIGN.spacing.md,
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            backgroundColor: DESIGN.colors.accent,
                            flexShrink: 0,
                            marginTop: "0.55em",
                          }}
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <span style={{ ...NUMBER_LABEL_STYLE }}>02 - LENDER</span>
                  <ul style={{ listStyle: "none", padding: 0, margin: `${DESIGN.spacing.md} 0 0` }}>
                    {LENDER_POINTS.map((point, i) => (
                      <li
                        key={i}
                        style={{
                          fontSize: DESIGN.fontSize.base,
                          fontFamily: DESIGN.font.sans,
                          color: LIGHT.textMuted,
                          lineHeight: 1.5,
                          marginBottom: DESIGN.spacing.md,
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            backgroundColor: DESIGN.colors.accent,
                            flexShrink: 0,
                            marginTop: "0.55em",
                          }}
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Responsive CSS ─────────────────────────────────────────────────── */}
      <style>{`
        .two-sides-desktop { display: flex !important; }
        .two-sides-desktop-header { display: block !important; }
        .two-sides-mobile  { display: none !important; }

        @media (max-width: 768px) {
          .two-sides-desktop { display: none !important; }
          .two-sides-desktop-header { display: none !important; }
          .two-sides-mobile  {
            display: flex !important;
            flex-direction: column;
            width: 100%;
            height: 100%;
            overflow-y: auto;
          }
        }
      `}</style>
    </div>
  );
}
