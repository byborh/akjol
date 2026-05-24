import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const plausibleSrc = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC;
let plausibleOrigin = "https://plausible.io";
if (plausibleSrc) {
  try {
    plausibleOrigin = new URL(plausibleSrc).origin;
  } catch {
    // fallback to plausible.io if env var malformed
  }
}

// CSP volontairement permissive sur 'unsafe-inline' style/script : Next.js
// injecte des scripts d'hydratation et Tailwind des styles inline qui
// casseraient une CSP stricte sans nonces. Une CSP nonce-based via
// middleware sera l'étape suivante quand on aura le temps de tester.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isProd ? "" : "'unsafe-eval'"} ${plausibleOrigin}`.trim(),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${plausibleOrigin}`,
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // HSTS : 1 an, sous-domaines inclus, preload-ready. À activer fort en prod
  // seulement — en dev local on évite pour ne pas bloquer http://.
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }]
    : []),
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  transpilePackages: ["@akjol/db", "@akjol/logger", "@akjol/shared", "@akjol/ui"],
  serverExternalPackages: ["better-sqlite3"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
