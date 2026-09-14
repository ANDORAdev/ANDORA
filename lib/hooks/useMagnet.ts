"use client";

import { useRef, useCallback, MutableRefObject } from "react";

interface MagnetOptions {
  strength?: number; // how far the button moves (px)
  radius?: number;   // trigger zone (px from center)
}

interface MagnetReturn {
  ref: MutableRefObject<HTMLElement | null>;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
}

export function useMagnet({
  strength = 0.35,
  radius = 80,
}: MagnetOptions = {}): MagnetReturn {
  const ref = useRef<HTMLElement | null>(null);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius) {
        const moveX = dx * strength;
        const moveY = dy * strength;
        el.style.transform = `translate(${moveX}px, ${moveY}px)`;
        el.style.transition = "transform 150ms ease";
      }
    },
    [strength, radius]
  );

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "translate(0px, 0px)";
    el.style.transition = "transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)";
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}
