import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatar.iran.liara.run",
        port: "",
        pathname: "/**",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true, // skips ESLint errors/warnings on production build
  },
  typescript: {
    ignoreBuildErrors: true, // allows production build even if TS errors exist
  },
  experimental: {
    after: true, // Enables the after() function to properly run tasks in the background without blocking the HTTP response
  },
};

export default nextConfig;
