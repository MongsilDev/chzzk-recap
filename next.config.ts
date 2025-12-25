import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "font-src 'self' data:",
  "img-src 'self' data: https://nng-phinf.pstatic.net https://ssl.pstatic.net",
  "object-src 'none'",
  // dev 환경에서는 Next/Turbopack가 inline/eval 스크립트를 사용하므로 완화
  isProd
    ? "script-src 'self'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
  "style-src 'self' 'unsafe-inline'",
  isProd
    ? "connect-src 'self'"
    : "connect-src 'self' ws://localhost:3000 ws://127.0.0.1:3000 ws://0.0.0.0:3000",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nng-phinf.pstatic.net",
      },
      {
        protocol: "https",
        hostname: "ssl.pstatic.net",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
