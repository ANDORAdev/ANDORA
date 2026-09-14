/**
 * BRAND CONFIG — single source of truth for name, domain, social, etc.
 *
 * Change name or domain? Edit ONLY this file. Every reference across the
 * codebase imports from here. Do NOT hardcode brand strings anywhere else.
 */

// No domain yet: use NEXT_PUBLIC_SITE_URL once one exists, else the Vercel
// deployment URL (exposed automatically on Vercel), else local dev.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : "http://localhost:3001");

export const BRAND = {
  // Identity
  name: "ANDORA",
  nameLower: "andora",
  tagline: "Borrow against your stocks. Keep the upside.",
  description:
    "Borrow USDG against tokenized stocks and ETFs on Robinhood Chain, or lend USDG and earn yield. Self-custody, 24/7.",

  // Web
  url: SITE_URL,
  domain: new URL(SITE_URL).host,
  // Markets, Earn, Portfolio, Docs and legal pages
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://andora-nu.vercel.app",

  // Contact — no email yet. While null, legal pages point people to X instead.
  email: null as string | null,
  emailLegal: null as string | null,
  emailSupport: null as string | null,

  // Social
  twitter: "@ANDORArwa",
  twitterUrl: "https://x.com/ANDORArwa",
  githubUrl: "https://github.com/ANDORAdev/ANDORA",

  // Assets
  logo: "/logo.svg",
  favicon: "/favicon.ico",
  ogImage: "/og.png",

  // Copy fragments reused across UI
  ctaPrimary: "Start borrowing",
  ctaSecondary: "Earn on USDG",
} as const;

export type BrandConfig = typeof BRAND;
