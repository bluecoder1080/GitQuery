import type { NextConfig } from "next";

// Single-domain setup: the browser only ever talks to
// https://git-query-xi.vercel.app, and Vercel proxies API + OAuth
// to the real Spring backend server-side. This makes the session
// cookie first-party (SameSite=Lax works, no CORS, no third-party
// cookie block in Safari/Firefox).
//
// Vercel env needed:
//   API_BACKEND_URL=https://<real-backend>  (server-only, e.g. Render URL)
//   NEXT_PUBLIC_API_BASE_URL=""              (empty = same-origin fetch)
// Local dev fallback proxies to http://localhost:8080.
const BACKEND_URL =
  process.env.API_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8080";

const nextConfig: NextConfig = {
  async rewrites() {
    // Skip proxying when BACKEND_URL is empty (same-origin build with
    // no backend configured yet) to avoid next dev crash.
    if (!BACKEND_URL) return [];
    return [
      { source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` },
      { source: "/oauth2/:path*", destination: `${BACKEND_URL}/oauth2/:path*` },
      {
        source: "/login/oauth2/:path*",
        destination: `${BACKEND_URL}/login/oauth2/:path*`,
      },
      {
        source: "/actuator/health",
        destination: `${BACKEND_URL}/actuator/health`,
      },
    ];
  },
};

export default nextConfig;
