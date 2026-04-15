import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

function toOrigin(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function buildContentSecurityPolicy(): string {
  const appOrigin = toOrigin(process.env.NEXT_PUBLIC_APP_URL);
  const apiOrigin = toOrigin(process.env.NEXT_PUBLIC_API_BASE_URL);
  const connectSrc = new Set(["'self'", "https:"]);
  const scriptSrc = new Set(["'self'", "'unsafe-inline'"]);

  if (!isProduction) {
    connectSrc.add("ws:");
    scriptSrc.add("'unsafe-eval'");
  }

  if (appOrigin) {
    connectSrc.add(appOrigin);
  }

  if (apiOrigin) {
    connectSrc.add(apiOrigin);
  }

  const directives = [
    "default-src 'self'",
    `script-src ${Array.from(scriptSrc).join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${Array.from(connectSrc).join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ];

  if (isProduction) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: buildContentSecurityPolicy()
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "X-Frame-Options",
    value: "DENY"
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=(), usb=()"
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin"
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-site"
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "off"
  },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains; preload"
        }
      ]
    : [])
];

const nextConfig: NextConfig = {
  transpilePackages: ["@thai-lottery-checker/i18n", "@thai-lottery-checker/types"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders
      },
      {
        source: "/admin/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0"
          },
          {
            key: "Pragma",
            value: "no-cache"
          },
          {
            key: "Expires",
            value: "0"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
