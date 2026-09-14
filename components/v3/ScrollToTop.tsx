"use client";

import { useEffect, useState, useCallback } from "react";
import { useLenis } from "@/lib/lenis";
import { useCursorHover } from "@/lib/cursor";

/**
 * ScrollToTop — fixed bottom-right pill that scrolls user to the top.
 *
 *  - Hidden until user has scrolled past ~500px.
 *  - Theme-reactive: orange by default; black when over an `accent` section
 *    (matches cursor + nav wallet button on the Ready/CTA section).
 *  - Uses Lenis smooth scroll when available, else native scrollTo.
 */
export default function ScrollToTop() {
  const { lenis } = useLenis();
  const cursorProps = useCursorHover("button");
  const [visible, setVisible] = useState(false);
  const [onAccent, setOnAccent] = useState(false);

  // Show button after scrolling down a bit. Also probe the section at the
  // button's screen position so it themes correctly.
  useEffect(() => {
    let raf = 0;

    const detectThemeUnderButton = () => {
      // Probe ~80px above the bottom-right corner (where the button sits).
      const x = window.innerWidth - 60;
      const y = window.innerHeight - 80;
      const el = document.elementFromPoint(x, y);
      const themeEl = (el as Element | null)?.closest("[data-theme]") as
        | HTMLElement
        | null;
      setOnAccent(themeEl?.dataset.theme === "accent");
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setVisible(window.scrollY > 500);
        detectThemeUnderButton();
      });
    };

    // Initial state on mount
    detectThemeUnderButton();
    requestAnimationFrame(() => setVisible(window.scrollY > 500));

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const handleClick = useCallback(() => {
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 3) });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [lenis]);

  // Theme colors: orange bg + white arrow normally; black bg + white arrow on
  // accent (orange) sections.
  const bg = onAccent ? "#08080a" : "#ff5722";

  return (
    <button
      type="button"
      aria-label="Scroll to top"
      onClick={handleClick}
      onMouseEnter={cursorProps.onMouseEnter}
      onMouseLeave={cursorProps.onMouseLeave}
      style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        width: 52,
        height: 52,
        borderRadius: 999,
        backgroundColor: bg,
        border: "none",
        color: "#fff",
        cursor: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9990,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        pointerEvents: visible ? "auto" : "none",
        boxShadow:
          "0 6px 20px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.15)",
        transition:
          "opacity 280ms ease, transform 280ms ease, background-color 280ms ease, box-shadow 200ms ease",
      }}
      onMouseDown={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform =
          "translateY(0) scale(0.94)";
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M10 15V5M5 10L10 5L15 10"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
