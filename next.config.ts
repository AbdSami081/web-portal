import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://192.168.19.16:7878/api/:path*",
      },
    ];
  },
};

export default nextConfig;