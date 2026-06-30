import type { NextConfig } from "next";

const laravelOrigin =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "currency-backend-hv03.onrender.com",
        pathname: "/storage/**",
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/api/laravel/:path*",
        destination: `${laravelOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;