"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { DESIGN } from "@/config/design";
import { useCursorHover } from "@/lib/cursor";
import { useMarkets, usePriceStatus, type MarketView } from "@/lib/lending/hooks";
import { formatBps, formatUsd } from "@/lib/lending/format";
import LogoMark from "@/components/LogoMark";

gsap.registerPlugin(ScrollTrigger);

// Six markets shown on the homepage. Data comes from the lending hooks
// (bootstrapped in app/page.tsx); ids that don't exist are skipped.
const FEATURED_IDS = [
  "spy-usdg",
  "nvda-usdg",
  "tsla-usdg",
  "aapl-usdg",
  "qqq-usdg",
  "coin-usdg",
];

// ─── Skeleton bar (same footprint as the value it replaces) ──────────────────

function Bar({ width, height = 14 }: { width: number; height?: number }) {
  return (
    <span
      aria-hidden="true"
      className="fm-skeleton"
      style={{
        display: "inline-block",
        width,
        height,
        borderRadius: DESIGN.radius.sm,
        backgroundColor: DESIGN.colors.bgHover,
      }}
    />
  );
}

// ─── Market card ─────────────────────────────────────────────────────────────

/** 70% or 62.5%: one decimal only when needed. */
function formatPct(bps: number): string {
  return formatBps(bps, { digits: bps % 100 ? 1 : 0 });
}

function MarketCard({
  market,
  isLoading,
  cardRef,
}: {
  market: MarketView;
  isLoading: boolean;
  cardRef: (el: HTMLAnchorElement | null) => void;
}) {
  const cursorProps = useCursorHover("card");
  const change = market.price.change24hBps;
  const logo = market.collateral.logo;
  const aspect = market.collateral.logoAspect ?? 1;
  const changeColor = (change ?? 0) >= 0 ? DESIGN.colors.success : DESIGN.colors.danger;

  return (
    <Link
      href={`/markets/${market.id}`}
      ref={cardRef}
      className="fm-card"
      aria-label={`${market.collateral.name} market: borrow USDG against ${market.collateral.symbol}`}
      onMouseEnter={cursorProps.onMouseEnter}
      onMouseLeave={cursorProps.onMouseLeave}
    >
      {/* Big faded logo behind the card content */}
      {logo && (
        <LogoMark
          className={`fm-bg-logo${aspect > 2 ? " fm-bg-logo-wide" : ""}${aspect > 4 ? " fm-bg-logo-xwide" : ""}`}
          src={logo}
          aspect={aspect}
          height={Math.round(Math.min(150, (aspect > 4 ? 290 : 230) / aspect))}
          color={DESIGN.colors.text}
        />
      )}

      {/* Top row: logo + ticker + kind */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span className="fm-ticker">
          {logo && <LogoMark src={logo} aspect={aspect} height={aspect > 2 ? 11 : 20} />}
          {market.collateral.symbol}
        </span>
        <span className="fm-kind">{market.collateral.kind === "etf" ? "ETF" : "Stock"}</span>
      </div>
      <span className="fm-name">{market.collateral.name}</span>

      {/* Price + 24h change */}
      <div className="fm-price-row">
        {isLoading ? (
          <Bar width={92} height={22} />
        ) : (
          <>
            <span className="fm-price">{formatUsd(market.price.usdCents)}</span>
            {change === null ? (
              <Bar width={44} height={12} />
            ) : (
              <span className="fm-change" style={{ color: changeColor }}>
                {formatBps(change, { sign: true })}
              </span>
            )}
          </>
        )}
      </div>

      {/* Stats row */}
      <div className="fm-stats">
        <div className="fm-stat">
          <span className="fm-stat-label">Max LTV</span>
          <span className="fm-stat-value">{formatPct(market.maxLtvBps)}</span>
        </div>
        <div className="fm-stat fm-stat-right">
          <span className="fm-stat-label">Liquidation LTV</span>
          <span className="fm-stat-value">{formatPct(market.liquidationLtvBps)}</span>
        </div>
      </div>
    </Link>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

export default function FeaturedMarkets() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const captionRef = useRef<HTMLParagraphElement>(null);
  const cardsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  // White overlay fades IN at the end of this section, morphing dark → light
  // so the join with TwoSidesSection (white) is seamless.
  const whiteOverlayRef = useRef<HTMLDivElement>(null);

  // Drives data-theme: dark while overlay is transparent, light once overlay
  // passes the visual midpoint so BottomNav reads "light" at the right moment.
  const [sectionTheme, setSectionTheme] = useState<"light" | "dark">("dark");

  const { markets, isLoading } = useMarkets();
  const priceStatus = usePriceStatus();
  const featured = FEATURED_IDS
    .map((id) => markets.find((m) => m.id === id))
    .filter((m): m is MarketView => Boolean(m));

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const cards = cardsRef.current.filter(Boolean) as HTMLAnchorElement[];

      gsap.set(titleRef.current, { y: 40, opacity: 0 });
      gsap.set(subtitleRef.current, { y: 25, opacity: 0 });
      gsap.set(captionRef.current, { y: 16, opacity: 0 });
      cards.forEach((card) => {
        gsap.set(card, { y: 80, opacity: 0, scale: 0.96 });
      });
      // White overlay starts invisible — only fades in near the section end
      if (whiteOverlayRef.current) {
        gsap.set(whiteOverlayRef.current, { opacity: 0 });
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });

      // Title enters
      tl.to(titleRef.current, {
        y: 0, opacity: 1, duration: 0.1, ease: "power3.out",
      }, 0.03);

      tl.to(subtitleRef.current, {
        y: 0, opacity: 1, duration: 0.1, ease: "power3.out",
      }, 0.07);

      // Cards stagger in
      cards.forEach((card, i) => {
        tl.to(card, {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.12,
          ease: "power3.out",
        }, 0.1 + i * 0.06);
      });

      tl.to(captionRef.current, {
        y: 0, opacity: 1, duration: 0.08, ease: "power3.out",
      }, 0.1 + cards.length * 0.06);

      // ── Content exit — mirrors HeroVision manifesto close ──────────────────
      // All content is gone before the white overlay starts at 0.70.
      tl.to(titleRef.current, {
        yPercent: -80, opacity: 0, duration: 0.15, ease: "power2.in",
      }, 0.57);

      tl.to(subtitleRef.current, {
        yPercent: -60, opacity: 0, duration: 0.12, ease: "power2.in",
      }, 0.59);

      cards.forEach((card, i) => {
        tl.to(card, {
          yPercent: -60, opacity: 0, duration: 0.12, ease: "power2.in",
        }, 0.60 + i * 0.01);
      });

      tl.to(captionRef.current, {
        yPercent: -60, opacity: 0, duration: 0.1, ease: "power2.in",
      }, 0.62);

      // Dark → Light transition: fade white overlay in at the section tail.
      if (whiteOverlayRef.current) {
        tl.to(
          whiteOverlayRef.current,
          {
            opacity: 1,
            duration: 0.20,
            ease: "none",
            onUpdate: function () {
              const op = gsap.getProperty(
                whiteOverlayRef.current,
                "opacity"
              ) as number;
              setSectionTheme(op > 0.5 ? "light" : "dark");
            },
          },
          0.70
        );
      }

      // Padding tween — extends timeline past 0.90 so scroll-end maps to 1.0
      // and the overlay is fully opaque before sticky disengage.
      const pad = { _: 0 };
      tl.to(pad, { _: 1, duration: 0.15, ease: "none" }, 0.90);
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      id="markets"
      data-toc="markets"
      data-theme={sectionTheme}
      style={{
        minHeight: "270vh",
        position: "relative",
        backgroundColor: DESIGN.colors.bg,
      }}
    >
      <style>{`
        .fm-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: clamp(12px, 1.5vw, 20px);
          max-width: 1100px;
          width: 100%;
        }
        .fm-card {
          position: relative;
          overflow: hidden;
          isolation: isolate;
          display: flex;
          flex-direction: column;
          padding: clamp(20px, 2.5vw, 28px);
          background-color: ${DESIGN.colors.bgCard};
          border: 1px solid ${DESIGN.colors.border};
          border-radius: ${DESIGN.radius.lg};
          text-decoration: none;
          color: ${DESIGN.colors.text};
          will-change: transform, opacity;
          transition: border-color 200ms ease, box-shadow 200ms ease;
          cursor: none;
        }
        .fm-card:hover {
          border-color: ${DESIGN.colors.accent};
          box-shadow: 0 0 40px ${DESIGN.colors.accentSoft};
        }
        .fm-card > :not(.fm-bg-logo) { position: relative; z-index: 1; }
        .fm-bg-logo {
          position: absolute;
          right: -6px;
          bottom: -12px;
          z-index: 0;
          opacity: 0.1;
          transform: rotate(-9deg);
          transition: opacity 300ms ease, transform 500ms cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: none;
        }
        .fm-card:hover .fm-bg-logo {
          opacity: 0.16;
          transform: rotate(-5deg) scale(1.04);
        }
        /* Wide wordmarks (SPDR) sit further inside the card. */
        .fm-bg-logo-wide { right: 14px; bottom: 2px; opacity: 0.13; transform: rotate(-8deg); }
        .fm-card:hover .fm-bg-logo-wide { opacity: 0.2; transform: rotate(-4deg) scale(1.04); }
        /* Very wide wordmarks (Coinbase) get more width and sit a bit higher so the letters stay visible. */
        .fm-bg-logo-xwide { bottom: 14px; }
        .fm-card:focus-visible {
          outline: 2px solid ${DESIGN.colors.accent};
          outline-offset: 2px;
        }
        .fm-ticker {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-mono);
          font-size: clamp(18px, 2vw, 22px);
          font-weight: 700;
          letter-spacing: 0.02em;
          line-height: 1.1;
        }
        .fm-kind {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
          color: ${DESIGN.colors.accent};
          letter-spacing: 0.12em;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .fm-name {
          margin-top: 4px;
          font-family: var(--font-sans);
          font-size: 13px;
          color: ${DESIGN.colors.textMuted};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .fm-price-row {
          display: flex;
          align-items: baseline;
          gap: 10px;
          margin: 18px 0 16px;
          min-height: 26px;
          flex-wrap: wrap;
        }
        .fm-price {
          font-family: var(--font-mono);
          font-variant-numeric: tabular-nums;
          font-size: clamp(20px, 2.2vw, 26px);
          font-weight: 600;
          letter-spacing: -0.02em;
          line-height: 1;
        }
        .fm-change {
          font-family: var(--font-mono);
          font-variant-numeric: tabular-nums;
          font-size: 13px;
          font-weight: 500;
        }
        .fm-stats {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding-top: 12px;
          border-top: 1px solid ${DESIGN.colors.border};
        }
        .fm-stat {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .fm-stat-right { align-items: flex-end; }
        .fm-stat-label {
          font-family: var(--font-mono);
          font-size: 10px;
          color: ${DESIGN.colors.textDim};
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .fm-stat-value {
          font-family: var(--font-mono);
          font-variant-numeric: tabular-nums;
          font-size: 15px;
          font-weight: 600;
          color: ${DESIGN.colors.text};
        }
        .fm-skeleton {
          animation: fm-pulse 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes fm-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @media (max-width: 1023px) {
          .fm-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 639px) {
          .fm-grid { gap: 10px; }
          .fm-card { padding: 14px; }
          .fm-name { display: none; }
          .fm-price-row { margin: 10px 0; min-height: 0; gap: 6px; }
          .fm-price { font-size: 17px; }
          .fm-change { font-size: 11px; }
          .fm-stats { flex-direction: column; gap: 6px; padding-top: 8px; }
          .fm-stat { flex-direction: row; justify-content: space-between; align-items: baseline; }
          .fm-stat-right { align-items: baseline; }
          .fm-stat-label { font-size: 9px; letter-spacing: 0.1em; }
          .fm-stat-value { font-size: 12px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .fm-skeleton { animation: none; }
          .fm-bg-logo, .fm-card:hover .fm-bg-logo { transition: none; transform: rotate(-9deg); }
          .fm-bg-logo-wide, .fm-card:hover .fm-bg-logo-wide { transform: rotate(-8deg); }
        }
      `}</style>

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
          padding: "0 clamp(16px, 4vw, 64px)",
        }}
      >
        {/* White overlay — fades in at the section tail to morph dark → light
            before the join with TwoSidesSection. Rendered first so it sits
            behind all content at z-index 0. */}
        <div
          ref={whiteOverlayRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "#ffffff",
            pointerEvents: "none",
            willChange: "opacity",
            zIndex: 0,
          }}
        />
        {/* Content wrapper — sits above the white overlay (z:1) */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "clamp(20px, 4vh, 48px)" }}>
            <h2
              ref={titleRef}
              style={{
                fontSize: "clamp(44px, 7vw, 110px)",
                fontWeight: 800,
                fontFamily: "var(--font-sans)",
                letterSpacing: "-0.04em",
                lineHeight: 0.95,
                willChange: "transform, opacity",
                // Halftone (dot-shift) text — matches the hero/vision sections.
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
                paddingBottom: "0.15em",
                textAlign: "center",
                maxWidth: "min(1100px, 92vw)",
                margin: "0 auto",
              }}
            >
              Pick your collateral.
            </h2>
            <p
              ref={subtitleRef}
              style={{
                marginTop: "clamp(10px, 1.6vh, 22px)",
                fontFamily: "var(--font-sans)",
                fontSize: "clamp(15px, 1.6vw, 22px)",
                color: DESIGN.colors.textMuted,
                textAlign: "center",
                maxWidth: 640,
                marginLeft: "auto",
                marginRight: "auto",
                lineHeight: 1.5,
                willChange: "transform, opacity",
              }}
            >
              Every stock and ETF is its own isolated market, with its own
              borrow rate and loan limit.
            </p>
          </div>

          {/* Cards grid */}
          <div className="fm-grid">
            {featured.map((market, i) => (
              <MarketCard
                key={market.id}
                market={market}
                isLoading={isLoading}
                cardRef={(el) => { cardsRef.current[i] = el; }}
              />
            ))}
          </div>

          <p
            ref={captionRef}
            style={{
              marginTop: "clamp(14px, 2.4vh, 28px)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: DESIGN.colors.textDim,
              textAlign: "center",
              willChange: "transform, opacity",
            }}
          >
            {priceStatus === "live"
              ? "Live prices from Chainlink"
              : priceStatus === "error"
                ? "Live prices unavailable · retrying"
                : "\u00a0"}
          </p>
        </div>
      </div>
    </div>
  );
}
