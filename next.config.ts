import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow phone/LAN access during next dev (blank page without this)
  allowedDevOrigins: ["192.168.4.107"],
};

export default nextConfig;
