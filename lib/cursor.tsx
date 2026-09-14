"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { motion, useMotionValue, useSpring } from "framer-motion";

const DASHBOARD_PATHNAME_REGEX =
  /^\/(?:markets|earn|portfolio|activity)(?:\/|$)/;

type CursorVariant = "default" | "hover" | "card" | "button";

interface CursorContextValue {
  variant: CursorVariant;
  setVariant: (v: CursorVariant) => void;
}

const CursorContext = createContext<CursorContextValue>({
  variant: "default",
  setVariant: () => {},
});

export function useCursor() {
  return useContext(CursorContext);
}

interface CursorProviderProps {
  children: ReactNode;
}

// ─── Inner cursor — all hooks called unconditionally ─────────────
function CursorInner({ children }: { children: ReactNode }) {
  const [variant, setVariant] = useState<CursorVariant>("default");
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // Tracks the data-theme of the section under the cursor.
  // On "accent" sections (orange CTA bg) the cursor flips to black so it stays
  // visible against the bright orange. Other themes keep orange cursor.
  const [cursorOnAccent, setCursorOnAccent] = useState(false);
  const themeProbeTimer = useRef<number | null>(null);
  // Ref to track visibility state inside the event handler without re-registering it
  const isVisibleRef = useRef(false);

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Main dot tracks the cursor with no lag — direct motion values, no spring.
  const cursorX = mouseX;
  const cursorY = mouseY;

  // Slower spring for trailing ring
  const trailX = useSpring(mouseX, { damping: 40, stiffness: 150 });
  const trailY = useSpring(mouseY, { damping: 40, stiffness: 150 });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || "ontouchstart" in window);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const handleMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      // Use ref to avoid re-registering listener every time isVisible changes
      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        setIsVisible(true);
      }
      // Throttled section-theme probe (every ~80ms). Reads data-theme of the
      // nearest ancestor at the cursor's position; flips cursor color when
      // hovering an orange/light section.
      if (themeProbeTimer.current !== null) return;
      const x = e.clientX;
      const y = e.clientY;
      themeProbeTimer.current = window.setTimeout(() => {
        themeProbeTimer.current = null;
        const el = document.elementFromPoint(x, y);
        if (!el) return;
        const themeEl = (el as Element).closest("[data-theme]") as HTMLElement | null;
        const t = themeEl?.dataset.theme;
        setCursorOnAccent(t === "accent");
      }, 80);
    };

    const handleLeave = () => {
      isVisibleRef.current = false;
      setIsVisible(false);
    };
    const handleEnter = () => {
      isVisibleRef.current = true;
      setIsVisible(true);
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    document.addEventListener("mouseleave", handleLeave);
    document.addEventListener("mouseenter", handleEnter);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseleave", handleLeave);
      document.removeEventListener("mouseenter", handleEnter);
    };
    // mouseX/mouseY are stable MotionValues — safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  const sizes: Record<CursorVariant, number> = {
    default: 8,
    hover: 32,
    card: 48,
    button: 40,
  };

  const size = sizes[variant];
  const isExpanded = variant !== "default";
  // Dashboard cursor follows the user's chosen accent (via --accent CSS var).
  // Marketing cursor stays brand-orange, flipping to black over accent CTA bg.
  const pathname = usePathname();
  const isOnDashboard = !!pathname && DASHBOARD_PATHNAME_REGEX.test(pathname);
  // Pull the live accent value from <html> so it tracks theme changes. Falls
  // back to flame on SSR / before pre-paint runs.
  const [dashAccent, setDashAccent] = useState("#ff5722");
  useEffect(() => {
    if (!isOnDashboard) return;
    const read = () => {
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue("--accent")
        .trim();
      if (v) setDashAccent(v);
    };
    read();
    // Watch data-accent attribute on <html> so theme switches re-color the cursor.
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-accent", "style"],
    });
    return () => obs.disconnect();
  }, [isOnDashboard]);
  const cursorColor = isOnDashboard
    ? dashAccent
    : cursorOnAccent
      ? "#08080a"
      : "#ff5722";

  return (
    <CursorContext.Provider value={{ variant, setVariant }}>
      {children}

      {/* Skip cursor overlays on mobile and in the app (native pointer there) */}
      {!isMobile && !isOnDashboard && (
        <>
          {/* Main dot */}
          <motion.div
            className="pointer-events-none fixed top-0 left-0"
            style={{
              x: cursorX,
              y: cursorY,
              zIndex: 10001,
              translateX: "-50%",
              translateY: "-50%",
            }}
            animate={{ opacity: isVisible ? 1 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              animate={{
                width: size,
                height: size,
                borderRadius: size,
                backgroundColor: isExpanded ? "transparent" : cursorColor,
                border: isExpanded ? `1.5px solid ${cursorColor}` : "none",
              }}
              transition={{ type: "spring", damping: 20, stiffness: 400 }}
              className="flex items-center justify-center"
            >
              {variant === "card" && (
                <span
                  className="font-mono font-semibold uppercase whitespace-nowrap"
                  style={{ color: cursorColor, fontSize: 9, letterSpacing: "0.1em" }}
                >
                  VIEW
                </span>
              )}
            </motion.div>
          </motion.div>

          {/* Trailing ring — always rendered, opacity controlled */}
          <motion.div
            className="pointer-events-none fixed top-0 left-0"
            style={{
              x: trailX,
              y: trailY,
              zIndex: 9998,
              translateX: "-50%",
              translateY: "-50%",
            }}
            animate={{ opacity: isVisible && isExpanded ? 0.3 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              animate={{
                width: isExpanded ? size * 1.8 : 0,
                height: isExpanded ? size * 1.8 : 0,
              }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{
                borderRadius: "50%",
                border: `1px solid ${cursorColor}`,
              }}
            />
          </motion.div>
        </>
      )}
    </CursorContext.Provider>
  );
}

// ─── Public provider ──────────────────────────────────────────────
export function CursorProvider({ children }: CursorProviderProps) {
  return <CursorInner>{children}</CursorInner>;
}

// ─── Hook helpers for components ─────────────────────────────────
export function useCursorHover(variant: CursorVariant = "hover") {
  const { setVariant } = useCursor();
  return {
    onMouseEnter: () => setVariant(variant),
    onMouseLeave: () => setVariant("default"),
  };
}
