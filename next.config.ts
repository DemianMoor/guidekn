import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow the LP route to optimize landing-page images served from Supabase
    // Storage via /_next/image (rewritten in app/lp/[slug]/route.ts).
    qualities: [75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bdhujqomjvfgzbgicwev.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
