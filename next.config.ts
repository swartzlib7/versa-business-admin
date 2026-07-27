import type { NextConfig } from "next";
import pkg from "./package.json" with { type: "json" };

const nextConfig: NextConfig = {
  // Allow phone/LAN access during next dev (blank page without this)
  allowedDevOrigins: ["192.168.4.107"],

  // Expose package version to client components
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },

  // HTML shells must not be cached across deploys. Chrome was keeping
  // year-long s-maxage prerender responses after 0.7.52->0.7.53, which
  // left /login + auth routes blank while Firefox (stricter/no stale) worked.
  // Hashed /_next/static assets stay immutable.
  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image|favicon.ico).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
