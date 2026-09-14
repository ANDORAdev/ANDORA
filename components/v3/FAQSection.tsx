"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { DESIGN } from "@/config/design";

gsap.registerPlugin(ScrollTrigger);

const FAQS = [
  {
    q: "What is a stock token?",
    a: "A token on Robinhood Chain that tracks the price of a US stock or ETF, like NVDA or SPY. You hold it in your own wallet and can move it 24/7. It gives you price exposure, not shareholder voting rights.",
  },
  {
    q: "What is USDG?",
    a: "Global Dollar, a US dollar stablecoin issued by Paxos. It is what borrowers receive and what lenders deposit into vaults.",
  },
  {
    q: "What is a health factor?",
    a: "A number that shows how safe your loan is: collateral value times the liquidation LTV, divided by your debt. Above 1.0 you are fine. Below 1.0, anyone can repay part of your loan and take some of your stock tokens, plus a penalty.",
  },
  {
    q: "What happens when the US market is closed?",
    a: "Stock tokens keep trading onchain, but the underlying stocks don't. Prices can jump when the market reopens, so keep your health factor well above 1.0 over weekends and holidays.",
  },
  {
    q: "Who can use it?",
    a: "Anyone with a self-custody wallet where stock tokens are offered. They are not available in the US, Canada, the UK, Switzerland, the UAE or sanctioned regions.",
  },
  {
    q: "Do you hold my funds?",
    a: "No. There is no account and no custodian. Your collateral sits in smart contracts, and only your wallet can withdraw it, unless the position is liquidated.",
  },
  {
    q: "What are the risks?",
    a: "Smart contract bugs, oracle failures and sharp price gaps can all cause losses, including liquidation. Only deposit what you can afford to lose.",
  },
];

function FAQItem({
  faq,
  index,
  itemRef,
}: {
  faq: { q: string; a: string };
  index: number;
  itemRef: (el: HTMLDivElement | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const answerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={itemRef}
      style={{
        borderBottom: `1px solid ${DESIGN.colors.border}`,
        willChange: "transform, opacity",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "clamp(16px, 2.5vh, 24px) 0",
          background: "none",
          border: "none",
          cursor: "none",
          textAlign: "left",
          gap: 16,
        }}
      >
        <span
          style={{
            fontSize: "clamp(16px, 2vw, 20px)",
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
            color: DESIGN.colors.text,
            lineHeight: 1.3,
          }}
        >
          {faq.q}
        </span>
        <span
          style={{
            fontSize: 20,
            color: DESIGN.colors.accent,
            flexShrink: 0,
            transition: "transform 300ms ease",
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
            lineHeight: 1,
            fontWeight: 300,
          }}
        >
          +
        </span>
      </button>

      <div
        ref={answerRef}
        style={{
          maxHeight: open ? 300 : 0,
          overflow: "hidden",
          transition: "max-height 400ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <p
          style={{
            fontSize: "clamp(14px, 1.6vw, 16px)",
            fontFamily: "var(--font-sans)",
            color: DESIGN.colors.textMuted,
            lineHeight: 1.65,
            paddingBottom: "clamp(16px, 2.5vh, 24px)",
          }}
        >
          {faq.a}
        </p>
      </div>
    </div>
  );
}

export default function FAQSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  // labelRef removed — section label moved to TOC strip in page.tsx
  const titleRef = useRef<HTMLHeadingElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  // Wrapper that carries the FIRST horizontal hairline (borderTop). Was
  // static — animate so the line doesn't hang alone on the dark bg before
  // the FAQ items enter, and leaves with them on exit.
  const itemsWrapRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const items = itemsRef.current.filter(Boolean) as HTMLDivElement[];

      gsap.set(titleRef.current, { y: 40, opacity: 0 });
      gsap.set(itemsWrapRef.current, { scaleX: 0, transformOrigin: "left center" });
      items.forEach((item) => {
        gsap.set(item, { x: -40, opacity: 0 });
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });

      tl.to(titleRef.current, { y: 0, opacity: 1, duration: 0.1, ease: "power3.out" }, 0);

      // Top hairline draws from left to right, lands just before the first
      // FAQ item slides in. Same direction as the items so it reads as one
      // gesture.
      tl.to(itemsWrapRef.current, {
        scaleX: 1, duration: 0.12, ease: "power3.out",
      }, 0.08);

      // FAQ items slide in from left, staggered
      items.forEach((item, i) => {
        tl.to(item, {
          x: 0,
          opacity: 1,
          duration: 0.1,
          ease: "power3.out",
        }, 0.12 + i * 0.06);
      });

      // ── Content exit — mirrors HeroVision manifesto close ──────────────────
      // FAQSection has no bg morph (stays dark) so exits fire at 0.65–0.80.
      // This ensures content clears before sticky disengage so the section
      // feels properly "closed" rather than the text sitting frozen at rest.
      tl.to(titleRef.current, {
        yPercent: -80, opacity: 0, duration: 0.15, ease: "power2.in",
      }, 0.67);

      items.forEach((item, i) => {
        tl.to(item, {
          xPercent: -60, opacity: 0, duration: 0.12, ease: "power2.in",
        }, 0.70 + i * 0.01);
      });

      // Top hairline retracts to the LEFT in sync with the items leaving.
      tl.to(itemsWrapRef.current, {
        scaleX: 0, duration: 0.12, ease: "power2.in", transformOrigin: "left center",
      }, 0.70);

      // Padding tween — extends timeline to 1.0 so scrub lag doesn't leave
      // content visible past sticky disengage. Mirrors HeroVision / FeaturedMarkets.
      const pad = { _: 0 };
      tl.to(pad, { _: 1, duration: 0.17, ease: "none" }, 0.83);
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      id="faq"
      data-toc="faq"
      style={{
        minHeight: "250vh",
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
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          padding: "0 clamp(20px, 4vw, 64px)",
        }}
      >
        <div style={{ maxWidth: 1100, width: "100%" }}>
          {/* Header */}
          <div style={{ marginBottom: "clamp(24px, 4vh, 48px)" }}>
            <h2
              ref={titleRef}
              style={{
                fontSize: "clamp(28px, 5.5vw, 88px)",
                fontWeight: 900,
                fontFamily: "var(--font-sans)",
                letterSpacing: "-0.04em",
                lineHeight: 1,
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
                paddingBottom: "0.15em",
              }}
            >
              Questions, answered.
            </h2>
          </div>

          {/* FAQ items */}
          <div
            ref={itemsWrapRef}
            style={{
              borderTop: `1px solid ${DESIGN.colors.border}`,
              willChange: "transform",
            }}
          >
            {FAQS.map((faq, i) => (
              <FAQItem
                key={i}
                faq={faq}
                index={i}
                itemRef={(el) => { itemsRef.current[i] = el; }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
