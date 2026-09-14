"use client";

/**
 * ColorShiftSection -- section wrapper that carries a data-theme attribute.
 * BottomNav reads data-theme via IntersectionObserver to switch its pill colors.
 * Also handles its own background color via the theme prop.
 */

import { type CSSProperties, type ReactNode } from "react";
import { DESIGN } from "@/config/design";

type SectionTheme = "dark" | "light" | "accent";

const BG_MAP: Record<SectionTheme, string> = {
  dark:   DESIGN.colors.bg,
  light:  "#fafaf5",          // pure white -- strict 3-color palette
  accent: DESIGN.colors.accent, // burnt orange CTA sections
};

const TEXT_MAP: Record<SectionTheme, string> = {
  dark:   DESIGN.colors.text,
  light:  "#08080a",
  accent: "#fff",
};

interface ColorShiftSectionProps {
  id?: string;
  theme: SectionTheme;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  as?: any;
}

export default function ColorShiftSection({
  id,
  theme,
  children,
  style,
  className,
  as: Tag = "section",
}: ColorShiftSectionProps) {
  return (
    <Tag
      {...(id ? { id } : {})}
      data-theme={theme}
      {...(className ? { className } : {})}
      style={{
        backgroundColor: BG_MAP[theme],
        color: TEXT_MAP[theme],
        position: "relative",
        width: "100%",
        transition: "background-color 0.6s ease, color 0.4s ease",
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

// Re-export the theme type for convenience
export type { SectionTheme };
