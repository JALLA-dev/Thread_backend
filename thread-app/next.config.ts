import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure pg/postgres drivers run only on server
  serverExternalPackages: ["postgres", "@neondatabase/serverless"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.clerk.com",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
};

export default nextConfig;
