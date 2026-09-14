/**
 * LogoMark — draws a single-color logo from /public/logos as a CSS mask, so
 * it takes any color (ink on the white hero, text color in cards) and can be
 * faded without separate image variants.
 */

import type { CSSProperties } from "react";

interface LogoMarkProps {
  src: string;
  /** Height in px; width follows the mark's aspect ratio. */
  height: number;
  aspect?: number;
  color?: string;
  style?: CSSProperties;
  className?: string;
}

export default function LogoMark({ src, height, aspect = 1, color = "currentColor", style, className }: LogoMarkProps) {
  const mask = `url("${src}") center / contain no-repeat`;
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: "inline-block",
        flexShrink: 0,
        width: Math.round(height * aspect),
        height,
        backgroundColor: color,
        WebkitMask: mask,
        mask,
        ...style,
      }}
    />
  );
}
