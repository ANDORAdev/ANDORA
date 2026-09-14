"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { DESIGN } from "@/config/design";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    number: "01",
    title: "Deposit your stock tokens.",
    description:
      "Connect a self-custody wallet on Robinhood Chain and deposit NVDA, SPY or any listed stock token. Each one sits in its own isolated market as collateral.",
  },
  {
    number: "02",
    title: "Borrow USDG.",
    description:
      "Borrow up to the market's max LTV. Your health factor shows how safe the loan is: above 1.0, it can't be liquidated.",
  },
  {
    number: "03",
    title: "Repay. Withdraw. Keep the upside.",
    description:
      "Interest accrues continuously. Repay any amount at any time, then withdraw your stock tokens back to your wallet. No lock-ups.",
  },
];

export default function HowSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);
  const numbersRef = useRef<(HTMLSpanElement | null)[]>([]);
  const titlesRef = useRef<(HTMLHeadingElement | null)[]>([]);
  const descsRef = useRef<(HTMLParagraphElement | null)[]>([]);
  // labelRef removed — section label moved to TOC strip in page.tsx
  const progressRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const steps = stepsRef.current.filter(Boolean) as HTMLDivElement[];
      const numbers = numbersRef.current.filter(Boolean) as HTMLSpanElement[];
      const titles = titlesRef.current.filter(Boolean) as HTMLHeadingElement[];
      const descs = descsRef.current.filter(Boolean) as HTMLParagraphElement[];

      // Hide all steps initially except first
      steps.forEach((step, i) => {
        if (i === 0) {
          gsap.set(step, { opacity: 1 });
          gsap.set(numbers[i], { y: 0, opacity: 1 });
          gsap.set(titles[i], { y: 0, opacity: 1 });
          gsap.set(descs[i], { y: 0, opacity: 1 });
        } else {
          gsap.set(step, { opacity: 0 });
          gsap.set(numbers[i], { y: 80, opacity: 0 });
          gsap.set(titles[i], { y: 60, opacity: 0 });
          gsap.set(descs[i], { y: 40, opacity: 0 });
        }
      });

      // Main scroll-driven timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          onUpdate: (self) => {
            // Progress bar
            if (progressRef.current) {
              gsap.set(progressRef.current, {
                scaleY: self.progress,
              });
            }
          },
        },
      });

      // Step transitions: each step takes ~30% of timeline, with overlapping transitions
      steps.forEach((step, i) => {
        if (i === 0) return;

        const pos = (i - 1) * 0.4;

        // Fade out previous step — matches LOGO closing transition:
        // yPercent -80 slide up + opacity fade + power2.in easing.
        tl.to(
          steps[i - 1],
          { opacity: 0, duration: 0.15, ease: "power2.in" },
          pos
        );
        tl.to(
          numbers[i - 1],
          { yPercent: -80, opacity: 0, duration: 0.15, ease: "power2.in" },
          pos
        );
        tl.to(
          titles[i - 1],
          { yPercent: -80, opacity: 0, duration: 0.15, ease: "power2.in" },
          pos
        );
        tl.to(
          descs[i - 1],
          { yPercent: -80, opacity: 0, duration: 0.15, ease: "power2.in" },
          pos
        );

        // Fade in current step
        tl.to(
          steps[i],
          { opacity: 1, duration: 0.15 },
          pos + 0.1
        );
        tl.to(
          numbers[i],
          { y: 0, opacity: 1, duration: 0.2, ease: "power3.out" },
          pos + 0.1
        );
        tl.to(
          titles[i],
          { y: 0, opacity: 1, duration: 0.2, ease: "power3.out" },
          pos + 0.15
        );
        tl.to(
          descs[i],
          { y: 0, opacity: 1, duration: 0.2, ease: "power3.out" },
          pos + 0.18
        );
      });

      // Step 03 (last step) closing — matches LOGO closing exactly.
      // Position local 0.85 = master 0.955, finishes by section end.
      // yPercent -80 + opacity 0 + power2.in, identical to step 01/02 exits.
      const lastIdx = steps.length - 1;
      tl.to(
        steps[lastIdx],
        { opacity: 0, duration: 0.15, ease: "power2.in" },
        0.85
      );
      tl.to(
        numbers[lastIdx],
        { yPercent: -80, opacity: 0, duration: 0.15, ease: "power2.in" },
        0.85
      );
      tl.to(
        titles[lastIdx],
        { yPercent: -80, opacity: 0, duration: 0.15, ease: "power2.in" },
        0.85
      );
      tl.to(
        descs[lastIdx],
        { yPercent: -80, opacity: 0, duration: 0.15, ease: "power2.in" },
        0.85
      );
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      id="how"
      data-toc="how"
      data-section="how"
      data-theme="dark"
      style={{
        minHeight: "320vh",
        position: "relative",
        // Wrapper bg removed — page <main> (#0C0C0C) is the only paint layer
        // at the boundary with HeroVisionSection. Mirrors CTASection pattern.
        // The sticky child below carries the actual #0C0C0C so the bg never
        // gets cut off when the sticky disengages at end of 400vh.
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
          // Sticky child carries the dark surface color. Same hex as page
          // main, so when sticky engages there is zero visible boundary.
          backgroundColor: "#0C0C0C",
        }}
      >
        {/* Vertical progress bar */}
        <div
          style={{
            position: "absolute",
            left: "clamp(20px, 6vw, 80px)",
            top: "50%",
            transform: "translateY(-50%)",
            width: 2,
            height: 120,
            backgroundColor: DESIGN.colors.border,
            borderRadius: 1,
            overflow: "hidden",
          }}
        >
          <div
            ref={progressRef}
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: DESIGN.colors.accent,
              transformOrigin: "top center",
              transform: "scaleY(0)",
              willChange: "transform",
            }}
          />
        </div>

        {/* Mobile responsive styles for how section */}
        <style>{`
          .how-steps {
            position: absolute;
            left: clamp(180px, 18vw, 320px);
            top: 50%;
            transform: translateY(-50%);
            max-width: 640px;
            width: 100%;
            min-height: 350px;
          }
          @media (max-width: 767px) {
            .how-steps {
              left: 16px;
              right: 16px;
              width: auto;
              max-width: none;
              padding-left: 48px;
            }
          }
        `}</style>
        {/* Step content area — anchored to LEFT side (logo lives on right) */}
        <div className="how-steps">
          {STEPS.map((step, i) => (
            <div
              key={i}
              ref={(el) => { stepsRef.current[i] = el; }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                willChange: "opacity",
              }}
            >
              {/* Step number */}
              <span
                ref={(el) => { numbersRef.current[i] = el; }}
                style={{
                  fontSize: "clamp(48px, 12vw, 160px)",
                  fontWeight: 900,
                  fontFamily: "var(--font-sans)",
                  background: "radial-gradient(circle, rgba(255,87,34,0.5) 1px, transparent 1px)",
                  backgroundSize: "4px 4px",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter:
                    "drop-shadow(0 2px 1px rgba(0,0,0,0.35))" +
                    " drop-shadow(0 6px 12px rgba(0,0,0,0.30))" +
                    " drop-shadow(0 18px 28px rgba(0,0,0,0.20))",
                  paddingBottom: "0.15em",
                  lineHeight: 0.85,
                  display: "block",
                  marginBottom: "clamp(8px, 1.5vh, 16px)",
                  willChange: "transform, opacity",
                  letterSpacing: "-0.04em",
                }}
              >
                {step.number}
              </span>

              {/* Step title */}
              <h3
                ref={(el) => { titlesRef.current[i] = el; }}
                style={{
                  fontSize: "clamp(32px, 5vw, 56px)",
                  fontWeight: 800,
                  fontFamily: "var(--font-sans)",
                  color: DESIGN.colors.text,
                  lineHeight: 1.05,
                  letterSpacing: "-0.03em",
                  marginBottom: "clamp(12px, 2vh, 24px)",
                  willChange: "transform, opacity",
                }}
              >
                {step.title}
              </h3>

              {/* Step description */}
              <p
                ref={(el) => { descsRef.current[i] = el; }}
                style={{
                  fontSize: "clamp(16px, 2vw, 22px)",
                  fontFamily: "var(--font-sans)",
                  color: DESIGN.colors.textMuted,
                  lineHeight: 1.6,
                  maxWidth: 500,
                  willChange: "transform, opacity",
                }}
              >
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
