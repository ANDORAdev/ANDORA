"use client";

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { DESIGN } from "@/config/design";
import { BRAND } from "@/config/brand";
import { borrowApyAt } from "@/lib/lending/math";

gsap.registerPlugin(ScrollTrigger);

// ── Data ───────────────────────────────────────────────────────────────────────

const BORROW_BULLETS = [
  "No origination fee",
  "Interest accrues continuously",
  "10% of interest goes to the protocol reserve",
] as const;

// Risk tiers — protocol parameters per collateral class.
const RISK_TIERS = [
  { tier: "Index ETFs", maxLtv: "70%", liqLtv: "77%", penalty: "4%" },
  { tier: "Mega caps", maxLtv: "60%", liqLtv: "70%", penalty: "5%" },
  { tier: "High beta", maxLtv: "50%", liqLtv: "62.5%", penalty: "7.5%" },
] as const;

const KINK_UTILIZATION_BPS = 9000;

// ── Sub-components ─────────────────────────────────────────────────────────────

function BulletItem({ text }: { text: string }) {
  return (
    <li
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontSize: 13,
        fontFamily: "var(--font-sans)",
        color: DESIGN.colors.textMuted,
        lineHeight: 1.6,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          color: DESIGN.colors.accent,
          fontWeight: 700,
          fontSize: 12,
          flexShrink: 0,
          lineHeight: 1,
        }}
      >
        &#10003;
      </span>
      {text}
    </li>
  );
}

const EYEBROW_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  fontFamily: "var(--font-mono)",
};

const CTA_BASE_STYLE: React.CSSProperties = {
  marginTop: "auto",
  width: "100%",
  display: "block",
  textAlign: "center",
  textDecoration: "none",
  borderRadius: DESIGN.radius.md,
  padding: "14px 24px",
  fontSize: 13,
  fontWeight: 700,
  fontFamily: "var(--font-sans)",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  cursor: "none",
  transition: "background-color 200ms ease, border-color 200ms ease, transform 150ms ease",
};

/**
 * Kinked rate curve drawn from the same model the app uses for previews.
 * x = utilization 0–100%, y = borrow APY.
 */
function RateCurve() {
  const W = 280;
  const H = 104;
  const PAD_L = 8;
  const PAD_R = 34;
  const PAD_T = 14;
  const PAD_B = 20;
  const maxApy = borrowApyAt(10_000);
  const x = (bps: number) => PAD_L + (bps / 10_000) * (W - PAD_L - PAD_R);
  const y = (apyBps: number) => PAD_T + (1 - apyBps / maxApy) * (H - PAD_T - PAD_B);

  const points = Array.from({ length: 41 }, (_, i) => {
    const u = (i / 40) * 10_000;
    return `${x(u).toFixed(1)},${y(borrowApyAt(u)).toFixed(1)}`;
  }).join(" ");

  const kinkApy = borrowApyAt(KINK_UTILIZATION_BPS);
  const labelStyle = {
    fontFamily: "var(--font-mono)",
    fontSize: 9,
    fill: DESIGN.colors.textDim,
  } as const;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={`Borrow APY rises from ${borrowApyAt(0) / 100}% to ${kinkApy / 100}% at 90% utilization, then to ${maxApy / 100}% at 100%.`}
      style={{ display: "block", overflow: "visible" }}
    >
      {/* Baseline */}
      <line x1={x(0)} y1={y(0)} x2={x(10_000)} y2={y(0)} stroke={DESIGN.colors.border} strokeWidth="1" />
      {/* Kink guide */}
      <line
        x1={x(KINK_UTILIZATION_BPS)}
        y1={y(0)}
        x2={x(KINK_UTILIZATION_BPS)}
        y2={PAD_T - 6}
        stroke={DESIGN.colors.borderStrong}
        strokeWidth="1"
        strokeDasharray="2 3"
      />
      <polyline points={points} fill="none" stroke={DESIGN.colors.accent} strokeWidth="2" strokeLinejoin="round" />
      <circle cx={x(KINK_UTILIZATION_BPS)} cy={y(kinkApy)} r="3" fill={DESIGN.colors.accent} />

      {/* Value labels */}
      <text x={x(0)} y={y(borrowApyAt(0)) - 6} {...labelStyle}>{borrowApyAt(0) / 100}%</text>
      <text x={x(KINK_UTILIZATION_BPS) - 6} y={y(kinkApy) - 6} textAnchor="end" {...labelStyle}>{kinkApy / 100}%</text>
      <text x={x(10_000) + 6} y={y(maxApy) + 3} {...labelStyle}>{maxApy / 100}%</text>

      {/* Axis labels */}
      <text x={x(0)} y={H - 4} {...labelStyle}>0%</text>
      <text x={x(KINK_UTILIZATION_BPS)} y={H - 4} textAnchor="middle" {...labelStyle}>90%</text>
      <text x={x(10_000) + 6} y={H - 4} {...labelStyle}>util.</text>
    </svg>
  );
}

function BorrowRateCard({
  cardRef,
}: {
  cardRef: React.RefCallback<HTMLDivElement>;
}) {
  return (
    <div
      ref={cardRef}
      style={{
        width: "clamp(280px, 28vw, 360px)",
        position: "relative",
        borderRadius: DESIGN.radius.lg,
        border: `1px solid ${DESIGN.colors.accent}`,
        background: DESIGN.colors.bgCard,
        padding: "clamp(24px, 3vw, 40px)",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        willChange: "transform, opacity",
      }}
    >
      <div style={{ ...EYEBROW_STYLE, color: DESIGN.colors.accent }}>Borrowing</div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span
          style={{
            fontSize: "clamp(28px, 3.4vw, 38px)",
            fontWeight: 800,
            fontFamily: "var(--font-sans)",
            letterSpacing: "-0.03em",
            color: DESIGN.colors.text,
            lineHeight: 1,
          }}
        >
          Variable
        </span>
        <span style={{ fontSize: 14, fontFamily: "var(--font-mono)", color: DESIGN.colors.textDim }}>
          APY
        </span>
      </div>

      <p
        style={{
          margin: 0,
          fontSize: 13,
          fontFamily: "var(--font-sans)",
          color: DESIGN.colors.textMuted,
          lineHeight: 1.5,
        }}
      >
        Set by utilization: how much of a market&apos;s USDG is borrowed.
        Past 90%, the rate climbs fast to pull in lenders.
      </p>

      <RateCurve />

      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {BORROW_BULLETS.map((b) => (
          <BulletItem key={b} text={b} />
        ))}
      </ul>

      <Link
        href="/markets"
        className="pricing-cta-primary"
        style={{
          ...CTA_BASE_STYLE,
          backgroundColor: DESIGN.colors.accent,
          color: DESIGN.colors.text,
          border: "none",
        }}
      >
        {BRAND.ctaPrimary}
      </Link>
    </div>
  );
}

function LimitsCard({
  cardRef,
}: {
  cardRef: React.RefCallback<HTMLDivElement>;
}) {
  const cellStyle: React.CSSProperties = {
    padding: "8px 0",
    fontFamily: "var(--font-mono)",
    fontVariantNumeric: "tabular-nums",
    fontSize: 12,
    color: DESIGN.colors.text,
    textAlign: "right",
    borderTop: `1px solid ${DESIGN.colors.border}`,
    whiteSpace: "nowrap",
  };
  const headStyle: React.CSSProperties = {
    ...cellStyle,
    fontSize: 9,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: DESIGN.colors.textDim,
    fontWeight: 500,
    borderTop: "none",
    paddingTop: 0,
  };

  return (
    <div
      ref={cardRef}
      style={{
        width: "clamp(280px, 28vw, 360px)",
        padding: "clamp(24px, 3vw, 40px)",
        backgroundColor: DESIGN.colors.bgCard,
        border: `1px solid ${DESIGN.colors.border}`,
        borderRadius: DESIGN.radius.lg,
        display: "flex",
        flexDirection: "column",
        gap: 18,
        willChange: "transform, opacity",
        transition: "border-color 250ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = DESIGN.colors.borderStrong;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = DESIGN.colors.border;
      }}
    >
      <div style={{ ...EYEBROW_STYLE, color: DESIGN.colors.textDim }}>Limits &amp; fees</div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <span
          style={{
            fontSize: "clamp(28px, 3.4vw, 38px)",
            fontWeight: 800,
            fontFamily: "var(--font-mono)",
            letterSpacing: "-0.03em",
            color: DESIGN.colors.text,
            lineHeight: 1,
          }}
        >
          4–7.5%
        </span>
        <span style={{ fontSize: 14, fontFamily: "var(--font-sans)", color: DESIGN.colors.textDim }}>
          liquidation penalty
        </span>
      </div>

      <p
        style={{
          margin: 0,
          fontSize: 13,
          fontFamily: "var(--font-sans)",
          color: DESIGN.colors.textMuted,
          lineHeight: 1.5,
        }}
      >
        Riskier stocks get lower borrow limits and a bigger penalty if a
        position is liquidated.
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th scope="col" style={{ ...headStyle, textAlign: "left" }}>Tier</th>
            <th scope="col" style={headStyle}>Max LTV</th>
            <th scope="col" style={headStyle}>Liq. LTV</th>
            <th scope="col" style={headStyle}>Penalty</th>
          </tr>
        </thead>
        <tbody>
          {RISK_TIERS.map((t) => (
            <tr key={t.tier}>
              <th scope="row" style={{ ...cellStyle, textAlign: "left", fontFamily: "var(--font-sans)", fontWeight: 500, color: DESIGN.colors.textMuted }}>
                {t.tier}
              </th>
              <td style={cellStyle}>{t.maxLtv}</td>
              <td style={cellStyle}>{t.liqLtv}</td>
              <td style={cellStyle}>{t.penalty}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        <BulletItem text="Vaults take 10–15% of the interest they earn" />
      </ul>

      <Link
        href="/earn"
        className="pricing-cta-ghost"
        style={{
          ...CTA_BASE_STYLE,
          backgroundColor: "transparent",
          color: DESIGN.colors.text,
          border: `1px solid ${DESIGN.colors.borderStrong}`,
        }}
      >
        {BRAND.ctaSecondary}
      </Link>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function PricingSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const card0Ref = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      // ── Initial state (off-screen / invisible) ─────────────────────────────
      gsap.set(titleRef.current, { y: 50, opacity: 0 });
      gsap.set(subtitleRef.current, { y: 30, opacity: 0 });
      gsap.set(card0Ref.current, { y: 100, opacity: 0, scale: 0.92 });
      gsap.set(card1Ref.current, { y: 100, opacity: 0, scale: 0.92 });

      // ── Pre-pin entry: title + subtitle fade in BEFORE section pins ────────
      // Eats the empty scroll gap from Edge's tail.
      gsap.to(titleRef.current, {
        y: 0, opacity: 1, ease: "power3.out",
        scrollTrigger: {
          trigger: container,
          start: "top 85%",
          end: "top 35%",
          scrub: 1,
        },
      });
      gsap.to(subtitleRef.current, {
        y: 0, opacity: 1, ease: "power3.out",
        scrollTrigger: {
          trigger: container,
          start: "top 78%",
          end: "top 28%",
          scrub: 1,
        },
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });

      // Cards bounce in with stagger — start as soon as section pins
      tl.to(card0Ref.current, {
        y: 0, opacity: 1, scale: 1, duration: 0.14, ease: "back.out(1.4)",
      }, 0.02);

      tl.to(card1Ref.current, {
        y: 0, opacity: 1, scale: 1, duration: 0.14, ease: "back.out(1.4)",
      }, 0.08);

      // ── HOLD 0.34 - 0.65: settled state for reading ────────────────────────

      // ── EXIT ───────────────────────────────────────────────────────────────
      tl.to(titleRef.current, {
        yPercent: -80, opacity: 0, duration: 0.10, ease: "power2.in",
      }, 0.70);

      tl.to(subtitleRef.current, {
        yPercent: -60, opacity: 0, duration: 0.08, ease: "power2.in",
      }, 0.72);

      // Cards slide off to their respective sides — matches TwoSides borrower/lender exit
      tl.to(card0Ref.current, {
        xPercent: -80, opacity: 0, duration: 0.10, ease: "power2.in",
      }, 0.74);

      tl.to(card1Ref.current, {
        xPercent: 80, opacity: 0, duration: 0.10, ease: "power2.in",
      }, 0.76);

      // Padding tween — extends timeline to 1.0
      const pad = { _: 0 };
      tl.to(pad, { _: 1, duration: 0.10, ease: "none" }, 0.88);
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      id="rates"
      data-toc="rates"
      data-theme="dark"
      style={{
        minHeight: "170vh",
        position: "relative",
        backgroundColor: DESIGN.colors.bg,
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          padding: "0 clamp(20px, 4vw, 64px)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "clamp(20px, 3vh, 36px)",
            alignItems: "center",
          }}
        >
          {/* Header block */}
          <div style={{ textAlign: "center" }}>
            {/* Title with halftone dot-text style */}
            <h2
              ref={titleRef}
              style={{
                fontSize: "clamp(24px, 5.5vw, 88px)",
                fontWeight: 800,
                fontFamily: "var(--font-sans)",
                letterSpacing: "-0.025em",
                lineHeight: 1.1,
                margin: 0,
                paddingBottom: "0.15em",
                whiteSpace: "normal",
                willChange: "transform, opacity",
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.92) 1px, transparent 1px)",
                backgroundSize: "4px 4px",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter:
                  "drop-shadow(0 2px 1px rgba(0,0,0,0.35))" +
                  " drop-shadow(0 6px 12px rgba(0,0,0,0.30))" +
                  " drop-shadow(0 18px 28px rgba(0,0,0,0.20))",
              }}
            >
              Rates, in the open.
            </h2>

            {/* Subtitle */}
            <p
              ref={subtitleRef}
              style={{
                margin: "14px auto 0",
                maxWidth: 540,
                fontSize: 17,
                fontFamily: "var(--font-sans)",
                color: DESIGN.colors.textMuted,
                lineHeight: 1.65,
                willChange: "transform, opacity",
              }}
            >
              No subscriptions and no deposit fees. Here is what borrowing and lending actually cost.
            </p>
          </div>

          {/* Cards row */}
          <div
            data-pricing-cards=""
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "clamp(16px, 2.5vw, 28px)",
              justifyContent: "center",
              alignItems: "stretch",
              flexWrap: "wrap",
            }}
          >
            <BorrowRateCard
              cardRef={(el) => {
                card0Ref.current = el;
              }}
            />
            <LimitsCard
              cardRef={(el) => {
                card1Ref.current = el;
              }}
            />
          </div>
        </div>
      </div>

      {/* Scoped styles: CTA hover + mobile swipe row */}
      <style>{`
        .pricing-cta-primary:hover { background-color: ${DESIGN.colors.accentBright} !important; transform: translateY(-1px); }
        .pricing-cta-ghost:hover { border-color: ${DESIGN.colors.text} !important; }
        .pricing-cta-primary:focus-visible,
        .pricing-cta-ghost:focus-visible { outline: 2px solid ${DESIGN.colors.accent}; outline-offset: 2px; }
        @media (max-width: 767px) {
          [data-pricing-cards] {
            flex-wrap: nowrap !important;
            justify-content: flex-start !important;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            width: calc(100% + 40px);
            margin: 0 -20px;
            padding: 0 20px 4px;
            scrollbar-width: none;
          }
          [data-pricing-cards]::-webkit-scrollbar { display: none; }
          [data-pricing-cards] > * {
            flex: 0 0 86%;
            width: auto !important;
            scroll-snap-align: center;
          }
        }
      `}</style>
    </div>
  );
}
