import type { NextConfig } from "next";

const laravelOrigin =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "currency-backend-hv03.onrender.com",
        pathname: "/storage/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
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