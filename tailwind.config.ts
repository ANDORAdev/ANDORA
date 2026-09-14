import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces
        bg: "#08080a",
        "bg-elevated": "#101013",
        "bg-card": "#15151a",
        "bg-hover": "#1c1c22",
        border: "#26262d",
        "border-strong": "#3a3a44",
        // Text
        text: "#fafaf5",
        "text-muted": "#9b9b9b",
        "text-dim": "#5a5a5a",
        // Color shift sections
        "section-light": "#fafaf5",
        "section-dark": "#08080a",
        "section-accent": "#ff5722",
        "section-text-light": "#08080a",

        // Accent
        accent: "#ff5722",
        "accent-bright": "#ff7042",
        "accent-deep": "#cc3a00",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-geist-mono)", '"JetBrains Mono"', '"Fira Code"', "monospace"],
        display: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["128px", { lineHeight: "1", letterSpacing: "-0.04em" }],
        "display-lg": ["96px", { lineHeight: "1.0", letterSpacing: "-0.03em" }],
        "display-md": ["72px", { lineHeight: "1.05", letterSpacing: "-0.03em" }],
        "display-sm": ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-xs": ["32px", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
        xl: "24px",
      },
      boxShadow: {
        glow: "0 0 40px rgba(255, 87, 34, 0.4)",
        "glow-strong": "0 0 80px rgba(255, 87, 34, 0.6)",
        card: "0 4px 20px rgba(0, 0, 0, 0.4)",
        "card-hover": "0 8px 40px rgba(0, 0, 0, 0.6)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        ticker: "ticker 28s linear infinite",
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        shimmer: "shimmer 2s linear infinite",
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, #ff5722, #cc3a00)",
        "dark-gradient": "radial-gradient(ellipse at top, #101013 0%, #08080a 70%)",
      },
      zIndex: {
        cursor: "9999",
        modal: "40",
        overlay: "30",
        sticky: "20",
        dropdown: "10",
      },
    },
  },
  plugins: [],
};

export default config;
