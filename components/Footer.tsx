"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { BRAND } from "@/config/brand";
import { DESIGN } from "@/config/design";
import ColorShiftSection from "@/components/ColorShiftSection";

// ---------------------------------------------------------------------------
// ColLink — a single link item with trailing period and hover dim
// ---------------------------------------------------------------------------
function ColLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      style={{
        display: "block",
        fontFamily: "var(--font-geist-sans)",
        fontSize: 15,
        fontWeight: 500,
        color: DESIGN.colors.sectionTextLight,
        textDecoration: "none",
        marginBottom: 12,
        opacity: hovered ? 0.45 : 1,
        transition: "opacity 180ms ease",
        cursor: "pointer",
        pointerEvents: "auto",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </a>
  );
}

// ---------------------------------------------------------------------------
// Dot grid constants
// ---------------------------------------------------------------------------
const CELL = 10;           // grid cell size in CSS pixels
const DOT_R = 1.8;         // dot radius in CSS pixels
const BASE_ALPHA = 0;      // dots invisible at rest — same color as bg, only show near cursor
const GLOW_RADIUS = 280;   // cursor falloff radius in CSS pixels
const BOOST_MAX = 0.85;    // alpha boost at cursor center (now drives the only visible state)

// Accent RGB — matches DESIGN.colors.accent (#ff5722)
const ACCENT_R = 255;
const ACCENT_G = 87;
const ACCENT_B = 34;

// Rest RGB — matches footer bg (#f9f9fc) so dots are invisible at rest. Cursor reveals them in accent.
const REST_R = 249;
const REST_G = 249;
const REST_B = 252;

// Smoothstep: returns a value in [0, 1] with a cubic ease between edge0 and edge1
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// ---------------------------------------------------------------------------
// Footer — main export
//
// Architecture:
//   Layer 0 (z:0) — <canvas> absolutely positioned behind the ENTIRE footer.
//     Dots fill the full surface. Vertical smoothstep fade: top = alpha 0,
//     bottom = alpha BASE_ALPHA. Cursor proximity tints dots toward accent and
//     boosts alpha, both still multiplied by the vertical fade factor.
//
//   Layer 1 (z:1) — 4-column grid, transparent bg, floats above canvas.
//
//   Layer 2 (z:2) — Massive solid white wordmark at the very bottom of the
//     footer. HTML text, never canvas-drawn. Nothing covers it.
//
//   Mousemove is listened on the outer footer wrapper (not the canvas), so
//   events fire whether cursor is over the grid, the wordmark, or the canvas.
//   Canvas has pointerEvents: none — never blocks clicks on links.
// ---------------------------------------------------------------------------

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  // Ref to the outer footer wrapper — used to measure canvas bounds
  const footerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Smoothed cursor position relative to the canvas. null = outside footer.
  const cursorTargetRef = useRef<{ x: number; y: number } | null>(null);
  const cursorRef = useRef<{ x: number; y: number } | null>(null);

  const rafRef = useRef<number>(0);
  const rafRunningRef = useRef(false);

  // Detect reduced-motion once on mount
  const reducedMotionRef = useRef(false);
  useEffect(() => {
    reducedMotionRef.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // -------------------------------------------------------------------------
  // drawFrame — hot path. Clears and redraws the full dot grid each RAF tick.
  // Per-dot: compute vertical fade (vFactor) + cursor proximity boost.
  // -------------------------------------------------------------------------
  const drawFrame = useCallback((once = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    if (W === 0 || H === 0) return;

    // Sync backing store to display size
    if (
      canvas.width !== Math.round(W * dpr) ||
      canvas.height !== Math.round(H * dpr)
    ) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }

    // Lerp cursor toward target
    const target = cursorTargetRef.current;
    let settled = false;

    if (target === null) {
      cursorRef.current = null;
      settled = true;
    } else {
      if (cursorRef.current === null) {
        cursorRef.current = { x: target.x, y: target.y };
      } else {
        const dx = target.x - cursorRef.current.x;
        const dy = target.y - cursorRef.current.y;
        cursorRef.current.x += dx * 0.18;
        cursorRef.current.y += dy * 0.18;
        settled = Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5;
      }
    }

    const cursor = cursorRef.current;

    // Single-pass dot draw
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const cols = Math.ceil(W / CELL) + 1;
    const rows = Math.ceil(H / CELL) + 1;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cx = col * CELL + CELL / 2;
        const cy = row * CELL + CELL / 2;

        // Vertical fade: 0 at top, 1 at bottom.
        // Smooth ramp starts at 8% from top and finishes at 65%.
        const vFactor = smoothstep(H * 0.08, H * 0.65, cy);

        let r = REST_R;
        let g = REST_G;
        let b = REST_B;
        // Base alpha is attenuated by vertical fade
        let alpha = BASE_ALPHA * vFactor;

        if (cursor !== null) {
          const dist = Math.hypot(cx - cursor.x, cy - cursor.y);
          if (dist < GLOW_RADIUS) {
            const factor = 1 - Math.pow(dist / GLOW_RADIUS, 2);
            // Blend rest color toward accent based on proximity
            r = REST_R + (ACCENT_R - REST_R) * factor;
            g = REST_G + (ACCENT_G - REST_G) * factor;
            b = REST_B + (ACCENT_B - REST_B) * factor;
            // Boost alpha still attenuated by vFactor — top stays invisible on hover
            alpha = (BASE_ALPHA + factor * BOOST_MAX) * vFactor;
          }
        }

        // Skip near-invisible pixels for perf
        if (alpha < 0.01) continue;

        ctx.fillStyle = `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(cx, cy, DOT_R, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (once) return;

    // Stop RAF when cursor is gone and lerp has settled
    if (settled && target === null) {
      rafRunningRef.current = false;
      return;
    }

    rafRef.current = requestAnimationFrame(() => drawFrame());
  }, []);

  const startRaf = useCallback(() => {
    if (rafRunningRef.current) return;
    rafRunningRef.current = true;
    rafRef.current = requestAnimationFrame(() => drawFrame());
  }, [drawFrame]);

  // -------------------------------------------------------------------------
  // Mount + ResizeObserver — keep canvas sized to the footer
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Initial draw
    if (reducedMotionRef.current) {
      drawFrame(true);
    } else {
      drawFrame(true);
    }

    const ro = new ResizeObserver(() => {
      if (reducedMotionRef.current) {
        drawFrame(true);
      } else {
        startRaf();
      }
    });

    const footer = footerRef.current;
    if (footer) ro.observe(footer);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
      rafRunningRef.current = false;
    };
  }, [drawFrame, startRaf]);

  // -------------------------------------------------------------------------
  // Mousemove/leave — attached to the outer footer wrapper so events fire
  // regardless of which layer the cursor is over (grid, wordmark, or canvas).
  // Coords are computed relative to the canvas bounding rect.
  // -------------------------------------------------------------------------
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reducedMotionRef.current) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      cursorTargetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      startRaf();
    },
    [startRaf]
  );

  const handleMouseLeave = useCallback(() => {
    if (reducedMotionRef.current) return;
    cursorTargetRef.current = null;
    // One more frame to snap to the cleared state
    startRaf();
  }, [startRaf]);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setEmail("");
    setSubscribed(true);
    setTimeout(() => setSubscribed(false), 3500);
  };

  return (
    <ColorShiftSection
      as="footer"
      theme="light"
      style={{
        // Near-white with a cool grey undertone (not warm/cream).
        backgroundColor: "#f9f9fc",
        overflow: "hidden",
        position: "relative",
        zIndex: 100,
      }}
    >
      {/* Outer wrapper that receives mousemove for the entire footer surface */}
      <div
        ref={footerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ position: "relative", width: "100%" }}
      >
        {/* ----------------------------------------------------------------- */}
        {/* Layer 0 — dot canvas, spans the entire footer, behind everything  */}
        {/* ----------------------------------------------------------------- */}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{
            display: "block",
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            zIndex: 0,
            // Canvas never blocks pointer events — mousemove lives on the wrapper
            pointerEvents: "none",
          }}
        />

        {/* ----------------------------------------------------------------- */}
        {/* Layer 1 — 4-column meta grid, transparent bg, floats above canvas */}
        {/* ----------------------------------------------------------------- */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 1400,
            margin: "0 auto",
            padding: `clamp(80px, 10vh, 120px) clamp(24px, 4vw, 64px) 0`,
          }}
        >
          <div
            className="footer-grid"
            style={{
              marginBottom: "clamp(0px, 1vh, 12px)",
            }}
          >
            {/* Column 1 — Updates? */}
            <div>
              <div
                style={{
                  fontFamily: "var(--font-geist-sans)",
                  fontSize: 15,
                  fontWeight: 600,
                  color: DESIGN.colors.sectionTextLight,
                  marginBottom: 24,
                }}
              >
                Updates?
              </div>
              <div
                style={{
                  fontFamily: "var(--font-geist-sans)",
                  fontSize: 14,
                  color: DESIGN.colors.sectionTextDim,
                  lineHeight: 1.55,
                  marginBottom: 20,
                }}
              >
                New markets and product news, straight to your inbox.
              </div>
              <div
                style={{
                  fontFamily: "var(--font-geist-sans)",
                  fontSize: 11,
                  color: DESIGN.colors.sectionTextDim,
                  marginBottom: 8,
                }}
              >
                Email.
              </div>
              <form
                onSubmit={handleNewsletterSubmit}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 8,
                  maxWidth: 280,
                  pointerEvents: "auto",
                }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{
                    flex: 1,
                    height: 40,
                    background: "#ffffff",
                    border: `1px solid ${DESIGN.colors.sectionBorderLight}`,
                    borderRadius: 8,
                    color: DESIGN.colors.sectionTextLight,
                    padding: "0 12px",
                    fontFamily: "var(--font-geist-sans)",
                    fontSize: 13,
                    outline: "none",
                    minWidth: 0,
                  }}
                />
                <button
                  type="submit"
                  style={{
                    width: 36,
                    height: 40,
                    flexShrink: 0,
                    background: DESIGN.colors.accent,
                    border: "none",
                    borderRadius: 8,
                    color: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                  }}
                >
                  {/* Right-pointing chevron, 14px */}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 3L9 7L5 11"
                      stroke="#ffffff"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </form>
              <div
                style={{
                  marginTop: 10,
                  minHeight: 18,
                  fontFamily: "var(--font-geist-sans)",
                  fontSize: 12,
                  color: DESIGN.colors.accent,
                  opacity: subscribed ? 1 : 0,
                  transition: "opacity 250ms ease",
                  pointerEvents: "none",
                }}
              >
                Subscribed. We will keep you posted.
              </div>
            </div>

            {/* Column 2 — App links. */}
            <div>
              <div
                style={{
                  fontFamily: "var(--font-geist-sans)",
                  fontSize: 15,
                  fontWeight: 600,
                  color: DESIGN.colors.sectionTextLight,
                  marginBottom: 24,
                }}
              >
                App.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 20, rowGap: 0 }}>
                <div>
                  <ColLink href="/markets">Markets.</ColLink>
                  <ColLink href="/earn">Earn.</ColLink>
                </div>
                <div>
                  <ColLink href="/portfolio">Portfolio.</ColLink>
                  <ColLink href="/activity">Activity.</ColLink>
                </div>
              </div>
            </div>

            {/* Column 3 — legal + social */}
            <div>
              <div
                style={{
                  fontFamily: "var(--font-geist-sans)",
                  fontSize: 14,
                  color: DESIGN.colors.sectionTextDim,
                  lineHeight: 1.6,
                  marginBottom: 24,
                }}
              >
                <div>{`© ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.`}</div>
              </div>
              <ColLink href="/docs">Docs.</ColLink>
              <ColLink href="/terms">Terms of service.</ColLink>
              <ColLink href="/privacy">Privacy policy.</ColLink>
              <ColLink href={BRAND.twitterUrl} external>X.</ColLink>
            </div>
          </div>
        </div>

        {/* Spacer that pushes wordmark toward the bottom */}
        <div style={{ height: "clamp(40px, 6vh, 80px)" }} />

        {/* ----------------------------------------------------------------- */}
        {/* Layer 2 — massive solid white wordmark, bottom-aligned, on top.   */}
        {/* HTML text only — never canvas-drawn. Nothing covers it.           */}
        {/* ----------------------------------------------------------------- */}
        <div
          role="img"
          aria-label={BRAND.name}
          style={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            paddingBottom: "clamp(40px, 6vh, 72px)",
            paddingLeft: "clamp(16px, 4vw, 48px)",
            paddingRight: "clamp(16px, 4vw, 48px)",
            pointerEvents: "none",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-geist-sans)",
              fontWeight: 900,
              fontSize: "clamp(96px, 22vw, 320px)",
              letterSpacing: "-0.05em",
              lineHeight: 1,
              color: "#ffffff",
              userSelect: "none",
              whiteSpace: "nowrap",
              textTransform: "uppercase",
            }}
          >
            {BRAND.name}
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Media queries                                                         */}
      {/* ------------------------------------------------------------------- */}
      <style>{`
        .footer-grid {
          display: grid;
          grid-template-columns: 1fr 1.4fr 1fr;
          gap: clamp(32px, 4vw, 64px);
        }

        @media (max-width: 959px) and (min-width: 640px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 639px) {
          .footer-grid {
            grid-template-columns: 1fr;
          }
          .footer-grid > div {
            margin-bottom: 32px;
          }
        }

        /* input placeholder color */
        .footer-grid input::placeholder {
          color: ${DESIGN.colors.sectionTextDim};
          opacity: 1;
        }

        /* input focus ring */
        .footer-grid input:focus {
          border-color: ${DESIGN.colors.sectionTextLight};
          outline: none;
        }
      `}</style>
    </ColorShiftSection>
  );
}
