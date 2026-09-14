/**
 * DESIGN TOKENS — single source of truth for colors, typography, spacing.
 *
 * NEVER use raw Tailwind defaults (bg-blue-500, text-gray-900, etc.).
 * Always reference these tokens. Frontend agent may extend, never overwrite
 * the principles: dark base + ONE orange accent + premium feel.
 *
 * Three layers:
 *  1. DESIGN.colors — raw dark hex values (homepage / v3/* still imports this directly).
 *  2. tokens.colors — CSS var strings, theme-aware. Dashboard components use this.
 *  3. DARK_PALETTE / LIGHT_PALETTE — raw hex for the CSS-var emitter in ThemeProvider.
 *  4. ACCENT_VARIANTS — one per avatar color, each defining the full accent family.
 */

// ─────────────────────────────────────────────────────────────────
// Raw dark palette (homepage-facing, do NOT remove)
// ─────────────────────────────────────────────────────────────────

export const DESIGN = {
  colors: {
    // Surfaces (dark base, layered)
    bg: "#0C0C0C",
    bgElevated: "#0C0C0C",
    bgCard: "#15151a",
    bgHover: "#1c1c22",
    border: "#26262d",
    borderStrong: "#3a3a44",

    // Text
    text: "#fafaf5",
    textMuted: "#9b9b9b",
    textDim: "#5a5a5a",

    // Accent — burnt orange. ONLY accent. Do not introduce blue/purple/green.
    accent: "#ff5722",
    accentBright: "#ff7042",
    accentDeep: "#cc3a00",
    accentSoft: "rgba(255, 87, 34, 0.12)",
    accentGlow: "rgba(255, 87, 34, 0.4)",

    // Semantic (use sparingly, only for status)
    success: "#10b981",
    danger: "#ef4444",
    warning: "#f59e0b",

    // Color shift section palettes (vettvangur-inspired)
    sectionLight: "#f5f5f5",
    sectionDark: "#08080a",
    sectionAccent: "#ff5722",
    sectionTextLight: "#08080a",
    sectionTextDim: "rgba(8,8,10,0.45)",
    sectionCardLight: "#f0f0e8",
    sectionBorderLight: "rgba(38,38,45,0.13)",
  },

  font: {
    sans: '"Geist Sans", system-ui, -apple-system, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
    display: '"Geist Sans", system-ui, sans-serif',
  },

  fontSize: {
    xs: "12px",
    sm: "14px",
    base: "16px",
    lg: "18px",
    xl: "24px",
    "2xl": "32px",
    "3xl": "48px",
    "4xl": "72px",
    "5xl": "96px",
    "6xl": "128px",
  },

  radius: {
    sm: "6px",
    md: "10px",
    lg: "16px",
    xl: "24px",
    full: "999px",
  },

  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "40px",
    "2xl": "64px",
    "3xl": "96px",
    "4xl": "160px",
  },

  shadow: {
    glow: "0 0 40px rgba(255, 87, 34, 0.4)",
    glowStrong: "0 0 80px rgba(255, 87, 34, 0.6)",
    card: "0 4px 20px rgba(0, 0, 0, 0.4)",
    cardHover: "0 8px 40px rgba(0, 0, 0, 0.6)",
  },

  motion: {
    quick: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
    base: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
    slow: "600ms cubic-bezier(0.16, 1, 0.3, 1)",
    spring: "500ms cubic-bezier(0.34, 1.56, 0.64, 1)",
  },

  z: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    overlay: 30,
    modal: 40,
    cursor: 9999,
  },
} as const;

export type DesignTokens = typeof DESIGN;

// ─────────────────────────────────────────────────────────────────
// CSS-var-aware token object — dashboard components import THIS
// ─────────────────────────────────────────────────────────────────
// Values resolve via CSS custom properties scoped to [data-theme][data-accent]
// on the ThemeProvider wrapper div. Homepage never enters that wrapper, so
// DESIGN.colors (raw hex) is still safe for homepage use.

export const tokens = {
  colors: {
    bg: "var(--bg)",
    bgElevated: "var(--bg-elevated)",
    bgCard: "var(--bg-card)",
    bgHover: "var(--bg-hover)",
    border: "var(--border)",
    borderStrong: "var(--border-strong)",
    text: "var(--text)",
    textMuted: "var(--text-muted)",
    textDim: "var(--text-dim)",
    accent: "var(--accent)",
    accentBright: "var(--accent-bright)",
    accentDeep: "var(--accent-deep)",
    accentSoft: "var(--accent-soft)",
    accentGlow: "var(--accent-glow)",
    success: "var(--success)",
    danger: "var(--danger)",
    warning: "var(--warning)",
  },
  font: DESIGN.font,
  fontSize: DESIGN.fontSize,
  radius: DESIGN.radius,
  spacing: DESIGN.spacing,
  motion: DESIGN.motion,
  shadow: DESIGN.shadow,
  z: DESIGN.z,
} as const;

// ─────────────────────────────────────────────────────────────────
// Dark palette — raw hex values (used by ThemeProvider CSS emitter only)
// ─────────────────────────────────────────────────────────────────

export const DARK_PALETTE = {
  bg: "#0C0C0C",
  bgElevated: "#0C0C0C",
  bgCard: "#15151a",
  bgHover: "#1c1c22",
  border: "#26262d",
  borderStrong: "#3a3a44",
  text: "#fafaf5",
  textMuted: "#9b9b9b",
  textDim: "#5a5a5a",
  success: "#10b981",
  danger: "#ef4444",
  warning: "#f59e0b",
} as const;

// ─────────────────────────────────────────────────────────────────
// Light palette — raw hex values (used by ThemeProvider CSS emitter only)
// ─────────────────────────────────────────────────────────────────

export const LIGHT_PALETTE = {
  // Neutral cool greys. Previous palette skewed warm (slight yellow cast);
  // these hex values sit on the cool side of true grey for a clean
  // "paper white" feel rather than parchment.
  bg: "#fafafa",
  bgElevated: "#ffffff",
  bgCard: "#ffffff",
  bgHover: "#f1f2f4",
  border: "#e4e6ea",
  borderStrong: "#c9ccd1",
  text: "#0b0c0f",
  textMuted: "#4b5260",
  textDim: "#8b919b",
  success: "#0b8c5f",
  danger: "#c1351c",
  warning: "#b88018",
} as const;

// ─────────────────────────────────────────────────────────────────
// Accent variant families
// Each variant defines the full 5-value accent family so all
// CSS vars (--accent, --accent-bright, etc.) scale together.
// ─────────────────────────────────────────────────────────────────

export interface AccentFamily {
  accent: string;
  accentBright: string;
  accentDeep: string;
  accentSoft: string;
  accentGlow: string;
}

export const ACCENT_VARIANTS: Record<string, AccentFamily> = {
  flame: {
    accent:       "#ff5722",
    accentBright: "#ff7042",
    accentDeep:   "#cc3a00",
    accentSoft:   "rgba(255, 87, 34, 0.12)",
    accentGlow:   "rgba(255, 87, 34, 0.4)",
  },
  ocean: {
    accent:       "#3b82f6",
    accentBright: "#60a5fa",
    accentDeep:   "#1d4ed8",
    accentSoft:   "rgba(59, 130, 246, 0.12)",
    accentGlow:   "rgba(59, 130, 246, 0.4)",
  },
  leaf: {
    accent:       "#10b981",
    accentBright: "#34d399",
    accentDeep:   "#059669",
    accentSoft:   "rgba(16, 185, 129, 0.12)",
    accentGlow:   "rgba(16, 185, 129, 0.4)",
  },
  sun: {
    accent:       "#f59e0b",
    accentBright: "#fbbf24",
    accentDeep:   "#d97706",
    accentSoft:   "rgba(245, 158, 11, 0.12)",
    accentGlow:   "rgba(245, 158, 11, 0.4)",
  },
  rose: {
    accent:       "#ec4899",
    accentBright: "#f472b6",
    accentDeep:   "#db2777",
    accentSoft:   "rgba(236, 72, 153, 0.12)",
    accentGlow:   "rgba(236, 72, 153, 0.4)",
  },
  sky: {
    accent:       "#06b6d4",
    accentBright: "#22d3ee",
    accentDeep:   "#0891b2",
    accentSoft:   "rgba(6, 182, 212, 0.12)",
    accentGlow:   "rgba(6, 182, 212, 0.4)",
  },
  violet: {
    accent:       "#8b5cf6",
    accentBright: "#a78bfa",
    accentDeep:   "#7c3aed",
    accentSoft:   "rgba(139, 92, 246, 0.12)",
    accentGlow:   "rgba(139, 92, 246, 0.4)",
  },
  ember: {
    accent:       "#cc3a00",
    accentBright: "#e84e0e",
    accentDeep:   "#992900",
    accentSoft:   "rgba(204, 58, 0, 0.12)",
    accentGlow:   "rgba(204, 58, 0, 0.4)",
  },
};

// Convenience: just the hex color for each variant (for sidebar dot + picker)
export const AVATAR_GRADIENT_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(ACCENT_VARIANTS).map(([k, v]) => [k, v.accent])
);
