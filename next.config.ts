import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  output: "standalone",
  optimizeFonts: false, // Prevents Google Font network calls on IIS
  outputFileTracingRoot: path.join(__dirname, "./"),

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