"use client";

import { useEffect, useState } from "react";

/**
 * QuickReveal — masks the FOUC window where the raw DOM is visible before
 * GSAP's `gsap.set(... opacity:0)` calls hide animated elements.
 *
 *  - Renders a full-screen black overlay on mount.
 *  - Fades out after a short delay so GSAP timelines have time to initialize.
 *  - Sits BELOW the full intro curtain (CoinStreamIntro) (when that plays first-visit),
 *    so it's invisible during the longer intro. On refresh / subsequent
 *    visits, only this short reveal runs.
 */
export default function QuickReveal() {
  const [hide, setHide] = useState(false);

  useEffect(() => {
    // Wait two RAF frames so React has committed, GSAP's useGSAP effects have
    // run, and the next paint will show the GSAP-positioned state.
    const t = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        // Tiny extra delay covers Lenis init + ScrollTrigger.refresh().
        window.setTimeout(() => setHide(true), 120);
      });
    });
    return () => window.cancelAnimationFrame(t);
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#0C0C0C",
        zIndex: 9995, // below the intro curtain (9996), above page content
        opacity: hide ? 0 : 1,
        pointerEvents: hide ? "none" : "auto",
        transition: "opacity 320ms cubic-bezier(0.4, 0, 0.2, 1)",
        // Force this onto its own GPU compositing layer so it stacks ABOVE
        // the WebGL canvas's GPU layer. Without translateZ, Chrome composites
        // the 3D logo Canvas above this CSS overlay on first paint → user sees
        // a brief WHITE flash where the canvas paints its initial framebuffer
        // before the GLB material/lighting finishes loading.
        transform: "translateZ(0)",
        willChange: "opacity",
      }}
    />
  );
}
