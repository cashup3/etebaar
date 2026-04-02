import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

/** Tracing root is for `next build` output in monorepos; in dev it can break manifests on some Windows setups. */
const useTracingRoot =
  process.argv.includes("build") || process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  ...(useTracingRoot ? { outputFileTracingRoot: monorepoRoot } : {}),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    const api = process.env.API_ORIGIN ?? "http://127.0.0.1:4000";
    // Market reference data is served by Next route handlers (Binance proxy) so the UI
    // loads prices without the Fastify API. Everything else still proxies to the API.
    return [
      { source: "/api/auth/:path*", destination: `${api}/auth/:path*` },
      { source: "/api/health", destination: `${api}/health` },
      { source: "/api/markets/:path*", destination: `${api}/markets/:path*` },
      { source: "/api/orders/:id/cancel", destination: `${api}/orders/:id/cancel` },
      { source: "/api/orders", destination: `${api}/orders` },
    ];
  },
};

export default nextConfig;
