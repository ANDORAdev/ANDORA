"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { BRAND } from "@/config/brand";
import { DESIGN } from "@/config/design";
import { LogoCanvas, logoCursorPos } from "@/components/v3/HeroLogo";
import { createSettlingLoop, SETTLE_EPSILON } from "@/lib/hooks/settlingLoop";

gsap.registerPlugin(ScrollTrigger);

export default function CTASection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const readyRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const domainRef = useRef<HTMLDivElement>(null);
  const logoWrapRef = useRef<HTMLDivElement>(null);
  const readyCharsRef = useRef<(HTMLSpanElement | null)[]>([]);
  // Inner drift wrapper for the 3D logo — same cursor-drift translate as the
  // hero logo. Reads shared logoCursorPos written by HeroLogo's mousemove.
  const logoDriftRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const cur = { x: 0.5, y: 0.5 };
    // Eases toward the cursor, then sleeps until the pointer moves again.
    const drift = createSettlingLoop(() => {
      const dx = logoCursorPos.nx - cur.x;
      const dy = logoCursorPos.ny - cur.y;
      cur.x = lerp(cur.x, logoCursorPos.nx, 0.015);
      cur.y = lerp(cur.y, logoCursorPos.ny, 0.015);
      if (logoDriftRef.current) {
        // Smaller amplitude than hero (which uses 40%): keeps the CTA logo
        // inside its container while still picking up the same gentle sway.
        const tx = (cur.x - 0.5) * 12;
        const ty = (cur.y - 0.5) * 12;
        logoDriftRef.current.style.transform = `translate(${tx}%, ${ty}%)`;
      }
      return Math.abs(dx) > SETTLE_EPSILON || Math.abs(dy) > SETTLE_EPSILON;
    });
    const wake = () => drift.wake();
    window.addEventListener("mousemove", wake, { passive: true });
    document.addEventListener("mouseleave", wake);
    return () => {
      window.removeEventListener("mousemove", wake);
      document.removeEventListener("mouseleave", wake);
      drift.stop();
    };
  }, []);

  const readyText = "Ready?";
  const chars = readyText.split("");

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const readyChars = readyCharsRef.current.filter(Boolean) as HTMLSpanElement[];

      // Initial states
      gsap.set(bgRef.current, { backgroundColor: DESIGN.colors.bg });
      readyChars.forEach((char) => {
        gsap.set(char, {
          y: 120,
          opacity: 0,
          rotationX: -90,
        });
      });
      gsap.set(subtitleRef.current, { y: 40, opacity: 0 });
      gsap.set(buttonsRef.current, { y: 30, opacity: 0 });
      gsap.set(domainRef.current, { y: 20, opacity: 0 });
      gsap.set(logoWrapRef.current, { opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });

      // Background color morphs from dark to accent
      tl.to(bgRef.current, {
        backgroundColor: DESIGN.colors.accent,
        duration: 0.3,
        ease: "none",
      }, 0);

      // Logo fades in as section enters
      tl.to(logoWrapRef.current, {
        opacity: 1,
        duration: 0.25,
        ease: "none",
      }, 0.05);

      // "Ready?" chars fly in with 3D rotation
      readyChars.forEach((char, i) => {
        tl.to(char, {
          y: 0,
          opacity: 1,
          rotationX: 0,
          duration: 0.15,
          ease: "power4.out",
        }, 0.15 + i * 0.04);
      });

      // Subtitle fades in
      tl.to(subtitleRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.2,
        ease: "power3.out",
      }, 0.45);

      // Buttons fade in
      tl.to(buttonsRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.2,
        ease: "power3.out",
      }, 0.55);

      // Domain text slides up after buttons
      tl.to(domainRef.current, {
        y: 0, opacity: 1, duration: 0.12, ease: "power3.out",
      }, 0.65);

      // ── Exits ──────────────────────────────────────────────────────────────
      // Domain exits last
      tl.to(domainRef.current, {
        yPercent: -120, opacity: 0, duration: 0.10, ease: "power2.in",
      }, 0.90);

      // Padding tween — ensures scrub headroom past exits
      const pad = { _: 0 };
      tl.to(pad, { _: 1, duration: 0.05, ease: "none" }, 0.97);
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      id="connect"
      data-toc="connect"
      data-theme="accent"
      style={{
        minHeight: "200vh",
        position: "relative",
      }}
    >
      <div
        ref={bgRef}
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          willChange: "background-color",
        }}
      >
        {/*
         * Inner split layout.
         * Desktop (>=1024px): flex row, logo left + text right.
         * Mobile (<1024px):   flex column, logo on top + text below, both centered.
         * The responsive breakpoint is handled via a style tag scoped to this section.
         */}
        <style>{`
          .cta-split {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            width: 100%;
            max-width: 1600px;
            padding: 0 clamp(16px, 5vw, 64px);
            box-sizing: border-box;
          }
          .cta-logo-col {
            flex: none;
            width: clamp(200px, 55vw, 720px);
            height: clamp(200px, 55vw, 720px);
            position: relative;
          }
          .cta-text-col {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            max-width: 540px;
          }
          @media (min-width: 1024px) {
            .cta-split {
              flex-direction: row;
              align-items: center;
              gap: clamp(40px, 5vw, 80px);
            }
            .cta-logo-col {
              flex: none;
              width: clamp(420px, 50vw, 800px);
              height: clamp(420px, 50vw, 800px);
            }
            .cta-text-col {
              align-items: flex-start;
              text-align: left;
              flex: 1;
            }
          }
        `}</style>

        <div className="cta-split">
          {/* LEFT column: 3D logo */}
          <div
            ref={logoWrapRef}
            className="cta-logo-col"
            style={{
              willChange: "opacity",
              position: "relative",
              filter:
                "drop-shadow(0 20px 30px rgba(0,0,0,0.30))" +
                " drop-shadow(0 40px 60px rgba(0,0,0,0.18))",
            }}
          >
            {/* Dark ground shadow beneath the logo — grounds the metal so it
                doesn't float. Wider + softer than before. */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                bottom: "2%",
                left: "8%",
                right: "8%",
                height: "20%",
                background:
                  "radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 40%, transparent 75%)",
                pointerEvents: "none",
                zIndex: 0,
                filter: "blur(14px)",
              }}
            />
            <div
              ref={logoDriftRef}
              style={{
                position: "relative",
                zIndex: 1,
                width: "100%",
                height: "100%",
                willChange: "transform",
              }}
            >
              <LogoCanvas darkMaterial={false} />
            </div>
          </div>

          {/* RIGHT column: heading + subtitle + buttons */}
          <div className="cta-text-col">
            {/* "Ready?" */}
            <h2
              ref={readyRef}
              style={{
                fontSize: "clamp(60px, 14vw, 180px)",
                fontWeight: 900,
                fontFamily: "var(--font-sans)",
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
                display: "flex",
                perspective: "800px",
                paddingBottom: "0.3em",
                overflow: "visible",
              }}
            >
              {chars.map((char, i) => (
                <span
                  key={i}
                  ref={(el) => { readyCharsRef.current[i] = el; }}
                  style={{
                    display: "inline-block",
                    willChange: "transform, opacity",
                    transformStyle: "preserve-3d",
                    background:
                      "radial-gradient(circle, rgba(8,8,10,1) 1.4px, transparent 1.4px)",
                    backgroundSize: "3.5px 3.5px",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    filter:
                      "drop-shadow(0 4px 2px rgba(0,0,0,0.45))" +
                      " drop-shadow(0 12px 18px rgba(0,0,0,0.35))" +
                      " drop-shadow(0 28px 44px rgba(0,0,0,0.22))",
                  }}
                >
                  {char}
                </span>
              ))}
            </h2>

            {/* Subtitle */}
            <p
              ref={subtitleRef}
              style={{
                marginTop: "clamp(16px, 3vh, 32px)",
                fontSize: "clamp(16px, 2.5vw, 24px)",
                fontFamily: "var(--font-sans)",
                color: "rgba(8,8,10,0.85)",
                maxWidth: 480,
                lineHeight: 1.5,
                willChange: "transform, opacity",
              }}
            >
              Borrow against your stocks or earn on idle USDG. Connect a wallet
              on Robinhood Chain and start in a minute.
            </p>

            {/* CTA Buttons */}
            <div
              ref={buttonsRef}
              style={{
                marginTop: "clamp(24px, 4vh, 48px)",
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                willChange: "transform, opacity",
              }}
            >
              <Link
                href="/markets"
                style={{
                  padding: "18px 40px",
                  backgroundColor: "#08080a",
                  color: "#fff",
                  border: "none",
                  borderRadius: DESIGN.radius.full,
                  fontSize: 17,
                  fontWeight: 800,
                  fontFamily: "var(--font-sans)",
                  letterSpacing: "0.02em",
                  cursor: "none",
                  textDecoration: "none",
                  display: "inline-block",
                  transition: "transform 200ms ease, box-shadow 200ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow = "0 8px 40px rgba(0,0,0,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {BRAND.ctaPrimary}
              </Link>
              <Link
                href="/earn"
                style={{
                  padding: "18px 40px",
                  backgroundColor: "transparent",
                  color: "#08080a",
                  border: "2px solid rgba(8,8,10,0.55)",
                  borderRadius: DESIGN.radius.full,
                  fontSize: 17,
                  fontWeight: 700,
                  fontFamily: "var(--font-sans)",
                  letterSpacing: "0.02em",
                  cursor: "none",
                  textDecoration: "none",
                  display: "inline-block",
                  transition: "border-color 200ms ease, background-color 200ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#08080a";
                  e.currentTarget.style.backgroundColor = "rgba(8,8,10,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(8,8,10,0.55)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {BRAND.ctaSecondary}
              </Link>
            </div>
          </div>
        </div>

        {/* X handle */}
        <div
          ref={domainRef}
          style={{
            position: "absolute",
            bottom: "clamp(80px, 10vh, 120px)",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "rgba(8,8,10,0.4)",
            letterSpacing: "0.1em",
            willChange: "transform, opacity",
          }}
        >
          {BRAND.twitter}
        </div>
      </div>
    </div>
  );
}
