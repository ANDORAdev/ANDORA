"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { DESIGN } from "@/config/design";

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    stat: "Isolated",
    label: "One stock, one market.",
    detail: "Each stock token has its own market and loan limits. If one name crashes, bad debt stays in that market.",
  },
  {
    stat: "Oracle",
    label: "Priced by Chainlink.",
    detail: "Collateral is valued with Chainlink price feeds, not a thin onchain pool that one big trade can move.",
  },
  {
    stat: "24/7",
    label: "Onchain all week. Honest about the gaps.",
    detail: "Tokens trade around the clock, but the US market keeps its hours. Prices can gap at the open, so max LTV sits well below liquidation.",
  },
  {
    stat: "Open",
    label: "Your keys. Public rules.",
    detail: "No custodian holds your collateral. LTV limits and liquidation penalties are published for every market.",
  },
];

// Light-section surface tokens — soft accent-tinted cards on white bg
const LIGHT = {
  bg: "#ffffff",
  cardBg: "rgba(255, 87, 34, 0.04)",         // barely-there orange wash
  border: "rgba(255, 87, 34, 0.14)",         // hairline accent-tinted border
  text: DESIGN.colors.sectionTextLight,      // "#08080a"
  textMuted: "#5a5a5a",
};

export default function EdgeSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentWrapRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const statsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const labelsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const detailsRef = useRef<(HTMLParagraphElement | null)[]>([]);

  // Dark overlay fades IN at the section tail, morphing light to dark
  // before the join with PricingSection (dark bg).
  const darkOverlayRef = useRef<HTMLDivElement>(null);

  // data-theme: light while resting, flips to dark once overlay passes midpoint.
  const [sectionTheme, setSectionTheme] = useState<"light" | "dark">("light");

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
      const stats = statsRef.current.filter(Boolean) as HTMLSpanElement[];
      const labels = labelsRef.current.filter(Boolean) as HTMLSpanElement[];
      const details = detailsRef.current.filter(Boolean) as HTMLParagraphElement[];

      // Initial states
      gsap.set(titleRef.current, { y: 40, opacity: 0 });
      gsap.set(subtitleRef.current, { y: 25, opacity: 0 });
      cards.forEach((card, i) => {
        // Rows drop in from above one by one, like heavy beads on a string
        gsap.set(card, { y: -70, opacity: 0 });
        gsap.set(stats[i], { scale: 0.6, opacity: 0 });
        gsap.set(labels[i], { y: 10, opacity: 0 });
        gsap.set(details[i], { y: 10, opacity: 0 });
      });
      // Dark overlay starts invisible
      if (darkOverlayRef.current) {
        gsap.set(darkOverlayRef.current, { opacity: 0 });
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });

      // ── ENTRY — title + subtitle staged like other sections ─────────────────
      tl.to(titleRef.current, {
        y: 0, opacity: 1, duration: 0.12, ease: "power3.out",
      }, 0.02);
      tl.to(subtitleRef.current, {
        y: 0, opacity: 1, duration: 0.12, ease: "power3.out",
      }, 0.06);

      // ── Rows drop in one by one with PAUSES between ────────────────────────
      // Each fact gets its own beat. Spacing 0.11 between rows = roughly
      // 27vh of scroll between drops at 250vh section height.
      cards.forEach((card, i) => {
        const offset = 0.12 + i * 0.16;

        // Row drops from above with bounce — feels like a heavy bead landing
        tl.to(card, {
          y: 0,
          opacity: 1,
          duration: 0.07,
          ease: "bounce.out",
        }, offset);

        // Stat pops a tick after the row lands
        tl.to(stats[i], {
          scale: 1,
          opacity: 1,
          duration: 0.06,
          ease: "back.out(2.2)",
        }, offset + 0.04);

        tl.to(labels[i], {
          y: 0, opacity: 1, duration: 0.05, ease: "power3.out",
        }, offset + 0.05);

        tl.to(details[i], {
          y: 0, opacity: 1, duration: 0.05, ease: "power3.out",
        }, offset + 0.06);
      });

      // ── HOLD 0.55 - 0.70: settled state, all 4 facts visible ────────────────

      // Content exit (pushed late so each drop has reading time)
      tl.to(titleRef.current, {
        yPercent: -80, opacity: 0, duration: 0.08, ease: "power2.in",
      }, 0.82);

      tl.to(subtitleRef.current, {
        yPercent: -60, opacity: 0, duration: 0.06, ease: "power2.in",
      }, 0.83);

      cards.forEach((card, i) => {
        tl.to(card, {
          yPercent: -60, opacity: 0, duration: 0.06, ease: "power2.in",
        }, 0.84 + i * 0.01);
      });

      // Light to dark morph at tail — must complete BEFORE section ends
      if (darkOverlayRef.current) {
        tl.to(
          darkOverlayRef.current,
          {
            opacity: 1,
            duration: 0.10,
            ease: "none",
            onUpdate: function () {
              const op = gsap.getProperty(
                darkOverlayRef.current,
                "opacity"
              ) as number;
              setSectionTheme(op > 0.5 ? "dark" : "light");
            },
          },
          0.85
        );
      }

      // Hold overlay opaque for the final 5% so seam to Pricing is clean.
      const pad = { _: 0 };
      tl.to(pad, { _: 1, duration: 0.05, ease: "none" }, 0.95);
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      id="edge"
      data-toc="edge"
      data-theme={sectionTheme}
      style={{
        minHeight: "380vh",
        position: "relative",
        backgroundColor: LIGHT.bg,
      }}
    >
      {/* Split layout — title left, rows right */}
      <style>{`
        .edge-split {
          display: flex;
          flex-direction: column;
          gap: clamp(32px, 5vh, 56px);
          max-width: min(1400px, 92vw);
          width: 100%;
          align-items: stretch;
        }
        @media (min-width: 1024px) {
          .edge-split {
            flex-direction: row;
            gap: clamp(40px, 6vw, 96px);
            align-items: center;
          }
        }
        .edge-left {
          flex: 1;
          text-align: left;
        }
        @media (max-width: 1023px) {
          .edge-left {
            text-align: center;
          }
        }
        .edge-right {
          flex: 1.1;
          display: flex;
          flex-direction: column;
          gap: clamp(20px, 3vh, 36px);
        }
        .edge-row {
          display: flex;
          align-items: flex-start;
          gap: clamp(16px, 2.4vw, 32px);
          padding-bottom: clamp(20px, 3vh, 32px);
          border-bottom: 1px solid ${LIGHT.border};
          text-align: left;
        }
        .edge-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
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
          padding: "0 clamp(20px, 4vw, 64px)",
        }}
      >
        {/* Dark overlay fades in at the section tail to morph light to dark
            before the join with PricingSection. Rendered first (z:0). */}
        <div
          ref={darkOverlayRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: DESIGN.colors.bg,
            pointerEvents: "none",
            willChange: "opacity",
            zIndex: 0,
          }}
        />

        {/* Content above overlay (z:1) */}
        <div
          ref={contentWrapRef}
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            willChange: "transform",
          }}
        >
          <div className="edge-split">
            {/* LEFT — title + subtitle */}
            <div className="edge-left">
              <h2
                ref={titleRef}
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "clamp(48px, 7vw, 110px)",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  lineHeight: 0.95,
                  margin: 0,
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
                  paddingBottom: "0.2em",
                  willChange: "transform, opacity",
                }}
              >
                Built for stocks.
              </h2>

              <p
                ref={subtitleRef}
                style={{
                  marginTop: "clamp(12px, 1.6vh, 22px)",
                  fontFamily: "var(--font-sans)",
                  fontSize: "clamp(15px, 1.6vw, 22px)",
                  color: LIGHT.textMuted,
                  maxWidth: 460,
                  lineHeight: 1.5,
                  willChange: "transform, opacity",
                }}
              >
                Equities don&apos;t trade like crypto. The protocol is designed around how they actually move.
              </p>
            </div>

            {/* RIGHT — 4 stacked rows */}
            <div className="edge-right">
              {FEATURES.map((feature, i) => (
                <div
                  key={i}
                  ref={(el) => { cardsRef.current[i] = el; }}
                  className="edge-row"
                  style={{ willChange: "transform, opacity" }}
                >
                  <span
                    ref={(el) => { statsRef.current[i] = el; }}
                    style={{
                      fontSize: "clamp(28px, 3.6vw, 44px)",
                      fontWeight: 900,
                      fontFamily: "var(--font-sans)",
                      color: DESIGN.colors.accent,
                      letterSpacing: "-0.03em",
                      lineHeight: 1,
                      flexShrink: 0,
                      minWidth: "clamp(100px, 11vw, 150px)",
                      transition: "transform 200ms ease, color 200ms ease",
                      willChange: "transform, opacity",
                    }}
                  >
                    {feature.stat}
                  </span>
                  <div>
                    <span
                      ref={(el) => { labelsRef.current[i] = el; }}
                      style={{
                        fontSize: "clamp(17px, 1.8vw, 22px)",
                        fontWeight: 700,
                        fontFamily: "var(--font-sans)",
                        color: LIGHT.text,
                        lineHeight: 1.3,
                        display: "block",
                        marginBottom: 6,
                        willChange: "transform, opacity",
                      }}
                    >
                      {feature.label}
                    </span>
                    <p
                      ref={(el) => { detailsRef.current[i] = el; }}
                      style={{
                        fontSize: "clamp(13px, 1.4vw, 15px)",
                        fontFamily: "var(--font-sans)",
                        color: LIGHT.textMuted,
                        lineHeight: 1.6,
                        margin: 0,
                        willChange: "transform, opacity",
                      }}
                    >
                      {feature.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
