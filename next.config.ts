import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // allow inline styles used by Tailwind preflight and user agents
              "style-src 'self' 'unsafe-inline' https:",
              // allow Next/React dev features if needed and inline for small scripts
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // allow images from self, https, and previews via data:/blob:
              "img-src 'self' data: blob: https:",
              // allow media if needed
              "media-src 'self' data: blob: https:",
              // allow API calls
              "connect-src 'self' https: http:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
