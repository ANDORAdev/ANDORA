import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/config/brand";
import { LenisProvider } from "@/lib/lenis";
import { CursorProvider } from "@/lib/cursor";
import IntroShell from "@/components/IntroShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Viewport meta — without this Next.js doesn't emit <meta name="viewport">
// and mobile browsers render the page at desktop width (~980px), so CSS
// @media (max-width: 767px) queries never match on phones.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0C0C0C",
};

export const metadata: Metadata = {
  title: `${BRAND.name} | ${BRAND.tagline}`,
  description: BRAND.description,
  metadataBase: new URL(BRAND.url),
  openGraph: {
    title: `${BRAND.name} | ${BRAND.tagline}`,
    description: BRAND.description,
    url: BRAND.url,
    siteName: BRAND.name,
    images: [{ url: BRAND.ogImage, width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} | ${BRAND.tagline}`,
    description: BRAND.description,
    creator: BRAND.twitter,
    images: [BRAND.ogImage],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html:
              // Paint dark bg on html + body INLINE so the first paint is
              // already dark — without this the external globals.css hasn't
              // loaded yet and the browser falls back to white, causing a
              // brief white flash before QuickReveal + the intro
              // (CoinStreamIntro) cover the page.
              "html,body{background-color:#0C0C0C;}",
          }}
        />
        <link
          rel="preload"
          href="/logo-white-draco.glb"
          as="fetch"
          type="model/gltf-binary"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <LenisProvider>
          <CursorProvider>
            {/*
              IntroShell holds:
              - navLogoRef (shared between CoinStreamIntro + Nav)
              - CoinStreamIntro (brand reveal on first session visit)
              - Nav (persistent top bar)
              - page children (hero + all sections)
            */}
            <IntroShell>
              {children}
            </IntroShell>
          </CursorProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
