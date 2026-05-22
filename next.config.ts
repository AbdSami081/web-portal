import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const REPORTING_API_URL = process.env.NEXT_PUBLIC_ReportingApi_URL;

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  output: "standalone",

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      },
      {
        source: "/reporting/:path*",
        destination: `${REPORTING_API_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
