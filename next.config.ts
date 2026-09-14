import type { NextConfig } from "next";
import { BRAND } from "./config/brand";

/** App routes live on the main site; the landing page links there. */
const APP_ROUTES = ["/markets", "/markets/:path*", "/earn", "/portfolio", "/activity", "/docs", "/terms", "/privacy"];

const nextConfig: NextConfig = {
  // Transpile Three.js and R3F packages for Next.js compatibility
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],

  redirects() {
    return APP_ROUTES.map((source) => ({
      source,
      destination: `${BRAND.appUrl}${source}`,
      permanent: false,
    }));
  },
};

export default nextConfig;
