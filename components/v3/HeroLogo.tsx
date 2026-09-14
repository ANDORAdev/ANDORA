"use client";

/**
 * HeroLogo — fixed-position 3D logo element.
 *
 * Lives outside any sticky section so it can travel continuously across
 * HeroVisionSection → HowSection without pin/unpin handoff gaps.
 *
 * 3-layer transform split (avoids fighting between systems):
 *   - containerRef: outer fixed div — GSAP ScrollTrigger writes x/y/scale/opacity
 *   - posRef:       middle div      — RAF writes translate(%, %) for cursor drift
 *   - imgRef:       inner image div — RAF writes perspective+rotate for tilt
 *
 * Values match original (pre-refactor) feel: 40% translate drift, 20°/30° tilt.
 */

import { useEffect, useCallback, useRef, useMemo, Suspense } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createSettlingLoop, SETTLE_EPSILON } from "@/lib/hooks/settlingLoop";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Center, Bounds, Environment } from "@react-three/drei";
import {
  MeshPhysicalMaterial,
  ACESFilmicToneMapping,
  type Group,
  type Mesh,
  type MeshStandardMaterial,
} from "three";

gsap.registerPlugin(ScrollTrigger);

/**
 * Shared mutable state used by the master ScrollTrigger timeline in
 * page.tsx to drive REAL 3D rotation of the logo (not a CSS rotation on
 * the parent — that flattens the Canvas as a 2D plane and the model
 * appears as a thin strip).
 *
 * GSAP tweens `rotationY` on this object as the user scrolls; useFrame()
 * inside GlbLogo reads it every frame and applies it to the mesh group's
 * own rotation. Result: the actual 3D mesh spins, so depth, sides, and
 * back faces are all visible during the rotation.
 */
export const logoScrollState = { rotationY: 0 };

/**
 * Module-level cursor state shared between BOTH glb Canvas instances.
 *
 * Why not use r3f's `state.pointer`?
 *   The dark and light layers stack absolute-inset-0. Only the topmost
 *   canvas in DOM order (light) receives pointer events, so its pointer
 *   updates while the dark canvas's pointer stays at (0, 0). Result:
 *   dark logo doesn't react to the cursor at all.
 *
 * Solution: one global mousemove listener (set up in HeroLogo) writes
 * normalised cursor coords here, and every GlbLogo useFrame reads from
 * here instead of from r3f's per-canvas pointer. Both layers react in
 * lockstep.
 *
 * Coordinates are normalised to [-1, 1] to match r3f's pointer convention,
 * so the existing useFrame math doesn't need to change.
 */
export const logoCursorState = { x: 0, y: 0 };
// Raw 0..1 cursor position. Used by secondary logo instances (e.g. CTA section)
// to apply cursor-drift translate matching the hero's movement.
export const logoCursorPos = { nx: 0.5, ny: 0.5 };

// Draco-compressed GLB (252KB vs 23MB original).
const LIGHT_GLB = "/logo-white-draco.glb";
const DARK_GLB  = "/logo-white-draco.glb";
useGLTF.preload(LIGHT_GLB, true);
useGLTF.preload(DARK_GLB, true);

/**
 * GlbLogo — renders one of the AGORA glb logos inside its Canvas parent.
 *
 *  - `src` = which glb file to load.
 *  - `darkMaterial` = override material colour to near-black (used by the
 *    dark layer that's visible while hero bg is still white, so the logo
 *    actually reads against the white background until the dark glb file
 *    is provided).
 *
 * Scene is cloned per-instance so material overrides on one layer don't
 * leak into the other (useGLTF caches by URL — both crossfading layers
 * would share the same scene + materials without a deep clone).
 *
 * Cursor-driven 3D rotation runs in useFrame:
 *   - Big range (Y ±108°, X ±45°) so a cursor sweep reveals every face
 *     of the model — the user explicitly asked for "all sides" visibility.
 *   - Base Y rotation = +20° so the logo defaults to a slight 3/4 view
 *     showing its depth instead of a flat-front silhouette.
 */
function GlbLogo({ src, darkMaterial = false }: { src: string; darkMaterial?: boolean }) {
  const { scene } = useGLTF(src, true);
  const groupRef = useRef<Group>(null);

  // Deep clone scene AND each mesh's material so per-instance overrides
  // (color, metalness, …) don't leak to the other Canvas using the same glb.
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((child) => {
      const m = child as unknown as {
        isMesh?: boolean;
        material?: { clone?: () => unknown };
      };
      if (m.isMesh && m.material && typeof m.material.clone === "function") {
        m.material = m.material.clone() as never;
      }
    });
    return c;
  }, [scene]);

  // Apply metalness/roughness + (for dark layer) colour override + smooth
  // shading. The glb ships with per-face (flat) normals which made the
  // polished surface read as faceted/bumpy. Recomputing vertex normals
  // averages them across shared vertices → smooth specular highlights that
  // sweep cleanly across the surface as the model rotates.
  useEffect(() => {
    cloned.traverse((child) => {
      const mesh = child as Mesh;
      if (!(mesh as { isMesh?: boolean }).isMesh) return;

      // Re-derive per-vertex normals from the geometry. Averages normals
      // across shared vertices → reflections sweep as one smooth gradient
      // across each flat panel. Required for the "polished black piano"
      // look in the reference.
      mesh.geometry?.computeVertexNormals?.();

      if (!mesh.material) return;

      // MeshPhysical kept for future clearcoat use; clearcoat is OFF
      // here because the extra mirror layer was AMPLIFYING every micro-
      // normal variation into visible splotches. With it disabled, the
      // single specular gradient is clean.
      const std = mesh.material as MeshStandardMaterial;
      const phys = new MeshPhysicalMaterial({
        color: std.color,
        metalness: 1.0,
        // 0.28 = soft mirror gradient. Lower than this and reflections
        // become pixel-sharp dots that magnify normal noise; higher and
        // the surface reads matte. 0.28 is the wide-soft-highlight band
        // that matches the reference render.
        roughness: darkMaterial ? 0.28 : 0.32,
        envMapIntensity: darkMaterial ? 2.4 : 1.1,
        flatShading: false,
        clearcoat: 0,
        clearcoatRoughness: 0.04,
      });
      mesh.material = phys;

      // Dark: very dark grey — almost black but with enough tonal range
      // to receive the key highlight as a visible gradient.
      // Light: silver, never pure white.
      phys.color.set(darkMaterial ? "#2c2c33" : "#c8c8cc");
      phys.needsUpdate = true;
    });
  }, [cloned, darkMaterial]);

  // Canvas runs frameloop="demand": keep requesting frames only while the
  // rotation is still easing toward its target, then let the GPU rest.
  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    // Base = 290° Y, -5° X (measured against reference).
    const baseY = (Math.PI * 290) / 180;
    const baseX = (Math.PI * -5) / 180;
    // Use SHARED cursor state instead of r3f's per-canvas pointer so the
    // dark layer (below the light layer in DOM order, blocked from pointer
    // events) reacts identically to the light layer.
    const cursorTargetY = logoCursorState.x * (Math.PI * 0.07);   // ±13°
    const cursorTargetX = -logoCursorState.y * (Math.PI * 0.04);  // ±7°
    const dy = logoScrollState.rotationY + baseY + cursorTargetY - g.rotation.y;
    const dx = baseX + cursorTargetX - g.rotation.x;
    g.rotation.y += dy * 0.18;
    g.rotation.x += dx * 0.10;
    if (Math.abs(dy) > 1e-4 || Math.abs(dx) > 1e-4) state.invalidate();
  });

  return (
    // margin=1.15 gives a 15% breathing ring — cursor parallax + scroll
    // 3D rotation can swing through any angle without clipping the model
    // against the Canvas edge. Visual model size ≈ canvas/1.15 ≈ original
    // PNG footprint.
    <Bounds fit clip margin={1.15}>
      <group ref={groupRef}>
        <Center>
          <primitive object={cloned} />
        </Center>
      </group>
    </Bounds>
  );
}

/** True when no ancestor (up to the page) is faded to ~0 by GSAP inline styles. */
function isShown(el: HTMLElement): boolean {
  for (let node: HTMLElement | null = el; node && node !== document.body; node = node.parentElement) {
    const o = node.style.opacity;
    if (o !== "" && parseFloat(o) < 0.01) return false;
  }
  return true;
}

/**
 * Wakes a demand-rendered Canvas on mouse or scroll input, but only while the
 * canvas is on screen and not faded out. Idle or hidden logos cost nothing.
 */
function WakeOnInput() {
  const invalidate = useThree((s) => s.invalidate);
  const canvas = useThree((s) => s.gl.domElement);

  useEffect(() => {
    let inView = true;
    const wake = () => {
      if (inView && isShown(canvas)) invalidate();
    };
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      wake();
    });
    io.observe(canvas);
    window.addEventListener("mousemove", wake, { passive: true });
    window.addEventListener("scroll", wake, { passive: true });
    document.addEventListener("mouseleave", wake);
    return () => {
      io.disconnect();
      window.removeEventListener("mousemove", wake);
      window.removeEventListener("scroll", wake);
      document.removeEventListener("mouseleave", wake);
    };
  }, [invalidate, canvas]);

  return null;
}

// Re-used Canvas + lights config for both dark and light layers.
export function LogoCanvas({ darkMaterial }: { darkMaterial?: boolean }) {
  return (
    <Canvas
      // Render only when something changes (see WakeOnInput + GlbLogo useFrame).
      frameloop="demand"
      // Cap pixel ratio at 1.5 (DESIGN.md) — 2x+ screens otherwise render 4x the pixels.
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 3], fov: 45 }}
      gl={{
        antialias: true,
        alpha: true,
        // ACES Filmic tonemapping = the same response curve used by film
        // and modern game engines. Compresses highlights smoothly instead
        // of clipping, which is exactly what gives the reference render
        // its "soft band roll-off" on the bright right edge.
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
      }}
      style={{ width: "100%", height: "100%", pointerEvents: "none" }}
    >
      {/* KEY from UPPER-RIGHT-FRONT — matches the reference, where the
          bright wraparound highlight runs down the model's right edge.
          Fill from upper-LEFT keeps the shadow side from crushing.
          Top adds a small overhead boost. */}
      {/* Lighting recipe to match the reference render:
         KEY: strong from upper-RIGHT, paints the wraparound highlight band.
         RIM: faint, opposite side, just lifts the shadow edge.
         TOP: small overhead boost separates apex from background.
         No bottom fill — keeps the base of the model in deep shadow like
         the reference (helps anchor the form). */}
      <WakeOnInput />
      <ambientLight intensity={0.18} />
      <directionalLight position={[10, 4, 5]} intensity={4.0} color="#ffffff" />
      <directionalLight position={[-5, 1, 3]} intensity={0.4} color="#ffffff" />
      <directionalLight position={[0, 9, 2]} intensity={0.6} color="#ffffff" />
      <Suspense fallback={null}>
        {/* "studio" HDRI rotated so its primary bright softbox lands on
            the model's right side as viewed in the rendered image —
            otherwise the HDRI dominates the chrome reflections regardless
            of directional-light position, and the highlight stays where
            the HDRI's bright zone is by default (model's left edge here). */}
        <Environment
          preset="studio"
          background={false}
          environmentRotation={[0, -Math.PI * 0.42, 0]}
        />
        <GlbLogo src={darkMaterial ? DARK_GLB : LIGHT_GLB} darkMaterial={darkMaterial} />
      </Suspense>
    </Canvas>
  );
}

interface HeroLogoProps {
  /** Outer container — GSAP ScrollTrigger owns this transform */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Inner image wrapper — mouse-tilt RAF owns this transform */
  imgRef: React.RefObject<HTMLDivElement | null>;
}

export default function HeroLogo({ containerRef, imgRef }: HeroLogoProps) {
  const posRef = useRef<HTMLDivElement | null>(null);
  const lightImgRef = useRef<HTMLDivElement | null>(null);
  const mousePos = useRef({ x: 0.5, y: 0.5 });
  const currentPos = useRef({ x: 0.5, y: 0.5 });


  // Crossfade dark logo → light logo PERFECTLY synced with hero bg morph
  // (HeroVisionSection: overlay fade at timeline 0.65 → 0.80, padded to 1.0).
  useEffect(() => {
    const dark = imgRef.current;
    const light = lightImgRef.current;
    if (!dark || !light) return;

    // Stable selector: data-hero="vision" never changes. data-theme used
    // to be "light" always, but it now toggles dynamically with the
    // overlay opacity for the nav theme detector.
    const heroEl = document.querySelector<HTMLElement>('[data-hero="vision"]');
    if (!heroEl) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: heroEl,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
      },
    });

    tl.to(dark, { opacity: 0, duration: 0.15, ease: "none" }, 0.65);
    tl.to(light, { opacity: 1, duration: 0.15, ease: "none" }, 0.65);
    // Pad timeline to 1.0 so the crossfade ends at ~80% of scroll, leaving
    // headroom for scrub lag before sticky disengage at scroll-end.
    const pad = { _: 0 };
    tl.to(pad, { _: 1, duration: 0.20, ease: "none" }, 0.80);

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [imgRef]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    const nx = e.clientX / window.innerWidth;   // 0..1
    const ny = e.clientY / window.innerHeight;  // 0..1
    // Used by posRef cursor-drift translate (expects 0..1 range).
    mousePos.current = { x: nx, y: ny };
    // Shared state read by every GlbLogo.useFrame (expects -1..1 like r3f).
    logoCursorState.x = nx * 2 - 1;
    logoCursorState.y = ny * 2 - 1;
    logoCursorPos.nx = nx;
    logoCursorPos.ny = ny;
  }, []);

  useEffect(() => {
    const onMouseLeave = () => {
      // Reset BOTH cursor refs so the position-drift AND the 3D mesh
      // rotation lerp back to their base values when the cursor leaves
      // the window.
      mousePos.current = { x: 0.5, y: 0.5 };
      logoCursorState.x = 0;
      logoCursorState.y = 0;
      logoCursorPos.nx = 0.5;
      logoCursorPos.ny = 0.5;
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    // Cursor drift eases toward the pointer, then sleeps until it moves again.
    const drift = createSettlingLoop(() => {
      const dx = mousePos.current.x - currentPos.current.x;
      const dy = mousePos.current.y - currentPos.current.y;
      currentPos.current.x = lerp(currentPos.current.x, mousePos.current.x, 0.015);
      currentPos.current.y = lerp(currentPos.current.y, mousePos.current.y, 0.015);

      // Middle div: cursor-drift only (centering is on outer container via GSAP)
      if (posRef.current) {
        const tx = (currentPos.current.x - 0.5) * 40;
        const ty = (currentPos.current.y - 0.5) * 40;
        posRef.current.style.transform = `translate(${tx}%, ${ty}%)`;
      }

      // CSS perspective tilt removed — both dark and light layers are now
      // <Canvas> elements. Tilting the Canvas via CSS would rotate it as a
      // 2D plane (making the glb look flat). 3D rotation now happens
      // inside the Canvas via GlbLogo's useFrame + pointer.
      return Math.abs(dx) > SETTLE_EPSILON || Math.abs(dy) > SETTLE_EPSILON;
    });

    const onMove = (e: MouseEvent) => {
      onMouseMove(e);
      drift.wake();
    };
    const onLeave = () => {
      onMouseLeave();
      drift.wake();
    };

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      drift.stop();
    };
  }, [onMouseMove, imgRef]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: "58%",
        left: "50%",
        zIndex: 5,
        pointerEvents: "none",
        willChange: "transform, opacity",
        opacity: 0, // GSAP fade-in on mount
      }}
    >
      {/* Middle layer — cursor-driven position drift (does NOT touch GSAP container).
          Canvas wrapper restored to the previous working size. Bounds
          margin (below) gives breathing room so cursor/scroll rotation
          never clips the corners. */}
      <div
        ref={posRef}
        className="hero-logo-pos"
        style={{
          position: "relative",
          // Desktop / default: original size from before the mobile pass.
          width: "clamp(245px, 49vw, 770px)",
          height: "clamp(245px, 49vw, 770px)",
          willChange: "transform",
        }}
      >
        {/* Mobile override: bigger logo on phones (≤767px). Desktop stays
            untouched. */}
        <style>{`
          @media (max-width: 767px) {
            .hero-logo-pos {
              width: 78vw !important;
              height: 78vw !important;
            }
          }
        `}</style>
        {/* DARK layer — glb Canvas with material colour forced to near-black
            (#141417) so it reads against the white hero bg. Same file as the
            light layer for now; will swap to a dedicated dark glb later by
            changing DARK_GLB at the top of this file. */}
        <div
          ref={imgRef}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 1,
            pointerEvents: "none",
            willChange: "opacity",
            filter: "drop-shadow(0 90px 110px rgba(0,0,0,0.20))",
          }}
        >
          <LogoCanvas darkMaterial />
        </div>
        {/* LIGHT layer — glb Canvas with original material (metallic light).
            Crossfades in over the dark layer via the existing GSAP scroll
            timeline as hero bg morphs from white → dark. */}
        <div
          ref={lightImgRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            pointerEvents: "none",
            willChange: "opacity",
          }}
        >
          <LogoCanvas />
        </div>
      </div>
    </div>
  );
}
