import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  output: "standalone",

  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    const reportingBase = process.env.NEXT_PUBLIC_ReportingApi_URL?.replace(/\/$/, "");

    return [
      apiBase && {
        source: "/api/:path*",
        destination: `${apiBase}/api/:path*`,
      },

      reportingBase && {
        source: "/reporting/:path*",
        destination: `${reportingBase}/:path*`,
      },
    ].filter(Boolean) as any;
  },
};

export default nextConfig;