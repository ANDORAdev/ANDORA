"use client";

/**
 * TopNav (file still named BottomNav for backward compatibility with IntroShell).
 *
 * Layout — moro.com style:
 *   [Home. How it works. Markets. Rates. FAQ.]   [ BRAND. ]   [X.  Launch app]
 *
 * Fully transparent: no background, no border, no shadow. Sits over the page.
 * Orange accent dots after each link / brand / socials. "Launch app" is a
 * single orange tab (CTA pop) linking into the lending app.
 *
 * Theme-reactive text color (white on dark sections, black on light) — same
 * detection logic as the prior BottomNav, but probing the TOP of the viewport
 * (~40px down) instead of the bottom.
 *
 * Mobile (<768px): nav links + socials + app button collapse into a hamburger
 * drawer that slides from the top.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { BRAND } from "@/config/brand";
import { DESIGN } from "@/config/design";
import { useCursorHover } from "@/lib/cursor";
import { useMagnet } from "@/lib/hooks/useMagnet";

// ─── Types ────────────────────────────────────────────────────────────────────

type NavTheme = "dark" | "light" | "accent";

interface NavLink {
  href: string;
  label: string;
}

// Order matches scroll position on the page (top to bottom):
// vision → how → markets → sides → edge → rates → faq → connect
const NAV_LINKS: NavLink[] = [
  { href: "/#how",     label: "How it works" },
  { href: "/#markets", label: "Markets"      },
  { href: "/#rates",   label: "Rates"        },
  { href: "/#faq",     label: "FAQ"          },
];

const APP_HREF = "/markets";

interface SocialLink {
  href: string;
  label: string;
  aria: string;
  external?: boolean;
  /** Hidden from the top bar on narrow laptops; still in the footer and drawer. */
  secondary?: boolean;
}

const SOCIAL_LINKS: SocialLink[] = [
  { href: "/docs", label: "Docs", aria: "Documentation", external: false, secondary: true },
  { href: BRAND.githubUrl, label: "GitHub", aria: "GitHub", secondary: true },
  { href: BRAND.twitterUrl, label: "X", aria: "Twitter / X" },
];

// ─── Theme styles ─────────────────────────────────────────────────────────────

const THEME_STYLES: Record<NavTheme, { text: string; textDim: string }> = {
  dark: {
    text:    "rgba(255,255,255,0.95)",
    textDim: "rgba(255,255,255,0.55)",
  },
  light: {
    text:    "#000000",
    textDim: "#000000",
  },
  accent: {
    // Orange-bg sections (e.g. CTA "Ready?") — black text reads best.
    text:    "#000000",
    textDim: "rgba(0,0,0,0.65)",
  },
};

// ─── Dot-suffixed link ────────────────────────────────────────────────────────

function DotLink({
  href,
  label,
  theme,
  external = false,
  small = false,
}: {
  href: string;
  label: string;
  theme: NavTheme;
  external?: boolean;
  small?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [active, setActive]   = useState(false);
  const cursorProps = useCursorHover("hover");

  const baseColor = active ? THEME_STYLES[theme].text : THEME_STYLES[theme].textDim;

  useEffect(() => {
    if (external) return;
    const check = () => {
      // Root-anchored hash links: href = "/#markets" — compare to current hash.
      if (href.startsWith("/#")) {
        setActive(window.location.hash === href.slice(1));
        return;
      }
      // Plain path links: href = "/terms" — compare to pathname.
      setActive(window.location.pathname === href);
    };
    check();
    window.addEventListener("hashchange", check);
    window.addEventListener("popstate", check);
    return () => {
      window.removeEventListener("hashchange", check);
      window.removeEventListener("popstate", check);
    };
  }, [href, external]);

  const linkStyle: React.CSSProperties = {
    position: "relative",
    textDecoration: "none",
    fontSize: small ? 16 : 16,
    fontWeight: 500,
    letterSpacing: "0.01em",
    fontFamily: "var(--font-geist-sans)",
    lineHeight: 1,
    display: "inline-flex",
    alignItems: "baseline",
    cursor: "none",
    padding: "6px 4px",
    whiteSpace: "nowrap",
  };

  // Two-layer text: base in theme color + orange copy revealed via clip-path
  // circle expanding from centre on hover. Same mechanic as AGORA brand.
  const labelEl = (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        color: baseColor,
      }}
    >
      <span>{label}</span>
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          color: DESIGN.colors.accent,
          clipPath: hovered
            ? "circle(75% at 50% 50%)"
            : "circle(0% at 50% 50%)",
          transition: "clip-path 480ms cubic-bezier(0.65, 0, 0.35, 1)",
          pointerEvents: "none",
        }}
      >
        {label}
      </span>
    </span>
  );

  const dot = (
    <span
      style={{
        color: DESIGN.colors.accent,
        marginLeft: 1,
        fontWeight: 700,
      }}
    >
      .
    </span>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        style={linkStyle}
        onMouseEnter={() => { setHovered(true);  cursorProps.onMouseEnter(); }}
        onMouseLeave={() => { setHovered(false); cursorProps.onMouseLeave(); }}
      >
        {labelEl}{dot}
      </a>
    );
  }

  // Internal hash links (/#markets, /#how, ...) target sections by their
  // data-toc attribute (sections use data-toc, not id). Intercept click and
  // scroll to a position INSIDE the section where its entry animations have
  // already played — so the title/content are visible on landing, not the
  // empty pre-pin state at the section's top edge.
  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!href.startsWith("/#")) return; // external/route: let nav handle
    const key = href.slice(2);
    const target = document.querySelector<HTMLElement>(`[data-toc="${key}"]`);
    if (!target) return;
    e.preventDefault();

    // ~22% into the section = past the entry tweens, content is settled.
    // Works for the 250-500vh sticky sections used across the landing page.
    const sectionTop = target.getBoundingClientRect().top + window.scrollY;
    const settleOffset = Math.max(80, target.offsetHeight * 0.22);
    const targetY = sectionTop + settleOffset;

    window.scrollTo({ top: targetY, behavior: "smooth" });

    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", href);
    }
  };

  return (
    <a
      href={href}
      aria-current={active ? "page" : undefined}
      style={linkStyle}
      onClick={onClick}
      onMouseEnter={() => { setHovered(true);  cursorProps.onMouseEnter(); }}
      onMouseLeave={() => { setHovered(false); cursorProps.onMouseLeave(); }}
    >
      {labelEl}{dot}
    </a>
  );
}

// ─── Launch app CTA ───────────────────────────────────────────────────────────

function AppCTA({ theme }: { theme: NavTheme }) {
  const cursorProps = useCursorHover("button");
  const [hovered, setHovered] = useState(false);

  // On orange-bg "accent" sections the accent button blends into the section —
  // flip to black bg. Other themes (dark/light) keep orange at rest.
  // Hover reveal: on light bg → BLACK blob + orange text.
  // On dark / accent bg → WHITE blob + orange text.
  const bg = theme === "accent" ? "#08080a" : DESIGN.colors.accent;
  const inkColor = theme === "light" ? "#08080a" : "#fff";
  const inkRevealText = DESIGN.colors.accent;

  return (
    <Link
      href={APP_HREF}
      onMouseEnter={() => { setHovered(true);  cursorProps.onMouseEnter(); }}
      onMouseLeave={() => { setHovered(false); cursorProps.onMouseLeave(); }}
      className="top-nav-app-btn"
      style={{
        position: "relative",
        overflow: "hidden",
        display: "inline-flex",
        alignItems: "center",
        // Tab anchored to TOP of viewport -- extra top padding + negative top
        // margin push the button up so it visually attaches to nav's top edge.
        padding: "32px 28px 18px 28px",
        marginTop: -18, // cancel nav's top padding so button reaches y=0
        backgroundColor: bg,
        color: "#fff",
        border: "none",
        borderRadius: "0 0 28px 28px",
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: "0.03em",
        fontFamily: "var(--font-geist-sans)",
        cursor: "none",
        whiteSpace: "nowrap",
        flexShrink: 0,
        lineHeight: 1,
        textDecoration: "none",
        transition: "background-color 280ms ease",
      }}
      aria-label="Launch the app"
    >
      {/* Ink-blot that expands from center on hover, clipped by button. */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "260%",
          aspectRatio: "1 / 1",
          borderRadius: "50%",
          backgroundColor: inkColor,
          transform: `translate(-50%, -50%) scale(${hovered ? 1 : 0})`,
          transition: "transform 480ms cubic-bezier(0.65, 0, 0.35, 1)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <span
        style={{
          position: "relative",
          zIndex: 1,
          color: hovered ? inkRevealText : "#fff",
          transition: "color 280ms ease",
        }}
      >
        <span className="top-nav-app-label-full">Launch app</span>
        <span className="top-nav-app-label-short">App</span>
      </span>
    </Link>
  );
}

// ─── Mobile hamburger drawer ───────────────────────────────────────────────────

function MobileDrawer({
  open,
  onClose,
  theme,
}: {
  open: boolean;
  onClose: () => void;
  theme: NavTheme;
}) {
  // Body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleNavClick = (href: string) => {
    onClose();
    if (!href.startsWith("/#")) return;
    const key = href.slice(2);
    const target = document.querySelector<HTMLElement>(`[data-toc="${key}"]`);
    if (!target) return;
    const sectionTop = target.getBoundingClientRect().top + window.scrollY;
    const settleOffset = Math.max(80, target.offsetHeight * 0.22);
    window.scrollTo({ top: sectionTop + settleOffset, behavior: "smooth" });
    window.history.replaceState(null, "", href);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — clicking outside closes drawer */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              cursor: "default",
            }}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <motion.div
            key="drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            initial={{ y: "-100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10001,
              backgroundColor: DESIGN.colors.bg,
              opacity: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "24px 32px 48px 32px",
              fontFamily: "var(--font-geist-sans)",
            }}
          >
            {/* Top row: close button */}
            <div
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                marginBottom: 8,
              }}
            >
              {/* Brand wordmark centered */}
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.95)",
                  fontFamily: "var(--font-geist-sans)",
                  lineHeight: 1,
                }}
              >
                {BRAND.name}
                <span style={{ color: DESIGN.colors.accent, marginLeft: 1 }}>.</span>
              </span>

              {/* Close X — top right */}
              <button
                onClick={onClose}
                aria-label="Close navigation menu"
                style={{
                  position: "absolute",
                  right: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 44,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.7)",
                  padding: 0,
                  borderRadius: DESIGN.radius.sm,
                  flexShrink: 0,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <line x1="3" y1="3" x2="19" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="19" y1="3" x2="3" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Divider */}
            <div
              aria-hidden="true"
              style={{
                width: "100%",
                height: 1,
                backgroundColor: DESIGN.colors.border,
                marginBottom: 16,
              }}
            />

            {/* Nav links + social links stacked */}
            <nav
              aria-label="Mobile navigation"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 32,
                width: "100%",
              }}
            >
              <a
                href="/"
                onClick={() => { onClose(); }}
                style={{
                  fontSize: 24,
                  fontWeight: 500,
                  letterSpacing: "0.01em",
                  color: "rgba(255,255,255,0.90)",
                  textDecoration: "none",
                  fontFamily: "var(--font-geist-sans)",
                  display: "inline-flex",
                  alignItems: "baseline",
                }}
              >
                Home
                <span style={{ color: DESIGN.colors.accent, marginLeft: 1, fontWeight: 700 }}>.</span>
              </a>

              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(link.href);
                  }}
                  style={{
                    fontSize: 24,
                    fontWeight: 500,
                    letterSpacing: "0.01em",
                    color: "rgba(255,255,255,0.90)",
                    textDecoration: "none",
                    fontFamily: "var(--font-geist-sans)",
                    display: "inline-flex",
                    alignItems: "baseline",
                  }}
                >
                  {link.label}
                  <span style={{ color: DESIGN.colors.accent, marginLeft: 1, fontWeight: 700 }}>.</span>
                </a>
              ))}

              {/* Divider before socials */}
              <div
                aria-hidden="true"
                style={{
                  width: 48,
                  height: 1,
                  backgroundColor: DESIGN.colors.border,
                }}
              />

              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.href}
                  href={s.href}
                  target={s.external !== false ? "_blank" : undefined}
                  rel={s.external !== false ? "noopener noreferrer" : undefined}
                  aria-label={s.aria}
                  onClick={onClose}
                  style={{
                    fontSize: 24,
                    fontWeight: 500,
                    letterSpacing: "0.01em",
                    color: "rgba(255,255,255,0.65)",
                    textDecoration: "none",
                    fontFamily: "var(--font-geist-sans)",
                    display: "inline-flex",
                    alignItems: "baseline",
                  }}
                >
                  {s.label}
                  <span style={{ color: DESIGN.colors.accent, marginLeft: 1, fontWeight: 700 }}>.</span>
                </a>
              ))}
            </nav>

            {/* Launch app button at bottom */}
            <Link
              href={APP_HREF}
              onClick={onClose}
              style={{
                width: "100%",
                maxWidth: 320,
                padding: "18px 28px",
                backgroundColor: DESIGN.colors.accent,
                color: "#fff",
                border: "none",
                borderRadius: DESIGN.radius.xl,
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: "0.03em",
                fontFamily: "var(--font-geist-sans)",
                cursor: "pointer",
                lineHeight: 1,
                textAlign: "center",
                textDecoration: "none",
              }}
            >
              Launch app
            </Link>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Theme detector at TOP of viewport ────────────────────────────────────────

function getThemeAtNavPosition(): NavTheme {
  // Top nav center ≈ 40px from top of viewport
  const probeY = 40;
  const TOLERANCE = 8;

  // Strategy 1: data-bg-pane (GSAP curtain architecture)
  const panes = Array.from(document.querySelectorAll<HTMLElement>("[data-bg-pane]"));
  if (panes.length > 0) {
    for (let i = panes.length - 1; i >= 0; i--) {
      const pane = panes[i];
      const rect = pane.getBoundingClientRect();
      if (rect.top <= probeY - TOLERANCE && rect.bottom >= probeY + TOLERANCE) {
        const t = pane.dataset.theme;
        if (t === "light" || t === "dark" || t === "accent") {
          return t as NavTheme;
        }
      }
    }
  }

  // Strategy 2: data-theme sticky sections
  const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-theme]"));
  let bestZ = -Infinity;
  let bestTheme: NavTheme = "dark";
  for (const section of sections) {
    const rect = section.getBoundingClientRect();
    if (rect.top <= probeY + TOLERANCE && rect.bottom >= probeY - TOLERANCE) {
      const t = section.dataset.theme;
      if (t === "light" || t === "dark" || t === "accent") {
        const z = parseInt(window.getComputedStyle(section).zIndex, 10) || 0;
        if (z >= bestZ) {
          bestZ = z;
          bestTheme = t as NavTheme;
        }
      }
    }
  }
  if (bestZ > -Infinity) return bestTheme;

  return "dark";
}

// ─── Main TopNav ──────────────────────────────────────────────────────────────

interface BottomNavProps {
  logoRef: React.RefObject<HTMLAnchorElement | null>;
  introPlayed: boolean;
}

export default function BottomNav({ logoRef, introPlayed }: BottomNavProps) {
  const [theme, setTheme] = useState<NavTheme>("dark");
  const [logoHovered, setLogoHovered] = useState(false);
  const logoCursorProps = useCursorHover("hover");
  const rafRef = useRef<number>(0);
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Cleanup the inline CSS vars BottomNav writes onto <html> when it unmounts
  // (e.g. navigating from homepage to dashboard). Without this, the marketing
  // scrollbar orange persists in the dashboard and overrides the user's
  // chosen accent. Property-removal lets the :root fallback in globals.css
  // (which uses var(--accent)) take effect again.
  useEffect(() => {
    return () => {
      if (typeof document === "undefined") return;
      const root = document.documentElement.style;
      root.removeProperty("--scrollbar-thumb");
      root.removeProperty("--scrollbar-track-bg");
      root.removeProperty("background-color");
    };
  }, []);

  // Auto-hide on scroll down + reveal on scroll up.
  // `hidden`  → translate nav up out of viewport
  // `scrolled` → past top → enable backdrop blur so text stays readable over content
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastY = useRef(0);

  const updateTheme = useCallback(() => {
    const detected = getThemeAtNavPosition();
    setTheme((prev) => (prev === detected ? prev : detected));
    // Sync scrollbar + html bg to the section under the nav. The scrollbar
    // gutter is part of <html>'s box, so we set html background to match the
    // current section. Thumb color flips per theme too.
    if (typeof document !== "undefined") {
      const root = document.documentElement.style;
      let sectionBg = "#0C0C0C";
      let thumb = "#ff5722";
      if (detected === "accent") {
        sectionBg = "#ff5722";
        thumb = "#08080a";
      } else if (detected === "light") {
        sectionBg = "#ffffff";
      }
      root.setProperty("--scrollbar-thumb", thumb);
      root.setProperty("--scrollbar-track-bg", sectionBg);
      // Write html bg directly so gutter blends with section.
      root.backgroundColor = sectionBg;
    }
  }, []);

  const updateScrollState = useCallback(() => {
    const y = window.scrollY;
    const dy = y - lastY.current;
    // Threshold: don't hide near the very top, ignore tiny scroll noise
    if (y < 80) {
      setHidden(false);
      setScrolled(false);
    } else {
      setScrolled(true);
      if (dy > 4) setHidden(true);        // scrolling down → hide
      else if (dy < -4) setHidden(false); // scrolling up → show
    }
    lastY.current = y;
  }, []);

  useEffect(() => {
    const timeout = setTimeout(updateTheme, 150);
    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        updateTheme();
        updateScrollState();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateTheme, { passive: true });
    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateTheme);
    };
  }, [updateTheme, updateScrollState]);

  const textColor = THEME_STYLES[theme].text;

  if (!mounted) return null;

  return createPortal(
    <>
      <style>{`
        /* Narrow laptops: the bar is crowded, Docs and GitHub stay in the footer and drawer */
        @media (max-width: 1180px) {
          .top-nav-secondary { display: none !important; }
        }
        /* Below 1024px the links no longer fit beside the wordmark: menu button instead */
        @media (max-width: 1023px) {
          .top-nav-links { display: none !important; }
          .top-nav-socials { display: none !important; }
        }
        /* Mobile: compact app button, tighter nav padding */
        .top-nav-app-label-full { display: inline; }
        .top-nav-app-label-short { display: none; }
        @media (max-width: 639px) {
          .top-nav-app-label-full { display: none; }
          .top-nav-app-label-short { display: inline; }
          .top-nav-app-btn {
            padding: 20px 14px 12px 14px !important;
            font-size: 13px !important;
          }
          .top-nav-brand {
            font-size: 17px !important;
            letter-spacing: 0.06em !important;
          }
        }
        /* Hide the app tab on mobile — it lives in the drawer instead */
        @media (max-width: 767px) {
          .top-nav-app-btn { display: none !important; }
        }
        /* Hamburger button: shown whenever the links are hidden */
        .top-nav-hamburger { display: none; }
        @media (max-width: 1023px) {
          .top-nav-hamburger { display: flex !important; }
        }
      `}</style>

      <AnimatePresence>
        {introPlayed && (
          <motion.nav
            key="top-nav"
            data-top-nav="true"
            aria-label="Site navigation"
            initial={{ y: -80, opacity: 0 }}
            animate={{
              y: hidden ? -100 : 0,
              opacity: hidden ? 0 : 1,
            }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 9999,
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              // Content stays ~1100px wide on big screens; on smaller ones the
              // side groups move out to 24px from the edges.
              padding: "18px clamp(24px, calc((100vw - 1100px) / 2), 220px)",
              pointerEvents: "none",
              // Fully transparent always. Blur only when scrolled past top so
              // content behind stays readable. No tint, no border, no color.
              background: "transparent",
              backdropFilter: scrolled ? "blur(14px)" : "none",
              WebkitBackdropFilter: scrolled ? "blur(14px)" : "none",
              transition: "backdrop-filter 280ms ease",
            }}
          >
            {/* ── LEFT: nav links with dots ── */}
            <div
              className="top-nav-links"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "clamp(4px, 1vw, 14px)",
                pointerEvents: "auto",
                justifySelf: "start",
              }}
            >
              <DotLink href="/" label="Home" theme={theme} />
              {NAV_LINKS.map((link) => (
                <DotLink key={link.href} href={link.href} label={link.label} theme={theme} />
              ))}
            </div>

            {/* ── Mobile left: empty spacer to keep brand centered ── */}
            <div
              className="top-nav-hamburger"
              style={{
                display: "none", // overridden by CSS above on mobile
                width: 44,
                justifySelf: "start",
                pointerEvents: "auto",
              }}
              aria-hidden="true"
            />

            {/* ── CENTER: brand wordmark ── */}
            <Link
              href="/"
              aria-label={BRAND.name}
              ref={logoRef}
              onMouseEnter={() => { setLogoHovered(true);  logoCursorProps.onMouseEnter(); }}
              onMouseLeave={() => { setLogoHovered(false); logoCursorProps.onMouseLeave(); }}
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "baseline",
                pointerEvents: "auto",
                cursor: "none",
                justifySelf: "center",
              }}
            >
              {/* Two-layer text: base in current theme color + orange copy on
                  top revealed via clip-path circle expanding from centre.
                  Same ink-blot mechanic as the Launch app tab, applied to text. */}
              <span
                className="top-nav-brand"
                style={{
                  position: "relative",
                  display: "inline-block",
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: "0.10em",
                  fontFamily: "var(--font-geist-sans)",
                  textTransform: "uppercase",
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ color: textColor }}>{BRAND.name}</span>
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    color: DESIGN.colors.accent,
                    clipPath: logoHovered
                      ? "circle(75% at 50% 50%)"
                      : "circle(0% at 50% 50%)",
                    transition:
                      "clip-path 480ms cubic-bezier(0.65, 0, 0.35, 1)",
                    pointerEvents: "none",
                  }}
                >
                  {BRAND.name}
                </span>
              </span>
              <span
                style={{
                  color: DESIGN.colors.accent,
                  fontSize: 20,
                  fontWeight: 800,
                  marginLeft: 1,
                  lineHeight: 1,
                }}
              >
                .
              </span>
            </Link>

            {/* ── RIGHT: socials + Launch app + hamburger ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "clamp(8px, 1.5vw, 18px)",
                pointerEvents: "auto",
                justifySelf: "end",
              }}
            >
              <div
                className="top-nav-socials"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "clamp(2px, 0.5vw, 8px)",
                }}
              >
                {SOCIAL_LINKS.map((s) => (
                  <span key={s.href} className={s.secondary ? "top-nav-secondary" : undefined} style={{ display: "inline-flex" }}>
                    <DotLink
                      href={s.href}
                      label={s.label}
                      theme={theme}
                      external={s.external ?? true}
                      small
                    />
                  </span>
                ))}
              </div>
              <AppCTA theme={theme} />

              {/* Hamburger — mobile only, toggled via CSS */}
              <button
                className="top-nav-hamburger"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={drawerOpen}
                style={{
                  width: 44,
                  height: 44,
                  display: "none", // overridden by CSS class on mobile
                  alignItems: "center",
                  justifyContent: "center",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  color: textColor,
                  flexShrink: 0,
                  borderRadius: DESIGN.radius.sm,
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  fill="none"
                  aria-hidden="true"
                >
                  <line x1="2" y1="5"  x2="20" y2="5"  stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="2" y1="11" x2="20" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <line x1="2" y1="17" x2="20" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Mobile navigation drawer */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        theme={theme}
      />
    </>,
    document.body
  );
}
