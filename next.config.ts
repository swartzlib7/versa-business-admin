import type { NextConfig } from "next";
import pkg from "./package.json" with { type: "json" };

// 1.0.14 attachments: every request passes the proxy (src/middleware.ts),
// which buffers request bodies up to 10 MB by default and cuts off the rest.
// Allow the attachment limit (VBA_ATTACHMENT_MAX_MB, default 20) plus room
// for the multipart wrapping. Read at build and at `next start`.
const attachmentMaxMb = Number(process.env.VBA_ATTACHMENT_MAX_MB) > 0 ? Number(process.env.VBA_ATTACHMENT_MAX_MB) : 20;

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: `${Math.ceil(attachmentMaxMb) + 5}mb`,
  },

  // 1.0.27 print templates: pdfkit reads its font metrics from its own folder at run time,
  // so it is loaded with Node's require instead of being bundled.
  serverExternalPackages: ["pdfkit"],

  // Allow phone/LAN access during next dev (blank page without this)
  allowedDevOrigins: ["192.168.4.107"],

  // Expose package version to client components
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },

  // HTML shells must not be cached across deploys. Chrome was keeping
  // year-long s-maxage prerender responses after 0.7.52->0.7.53, which
  // left /login + auth routes blank while Firefox (stricter/no stale) worked.
  // Sidebar Contacts page retired — type lives under Organization → Distribution.
  async redirects() {
    return [{ source: "/contact", destination: "/organization", permanent: false }];
  },

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
