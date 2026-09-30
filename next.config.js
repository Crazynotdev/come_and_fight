/** @type {import('next').NextConfig} */

// CSP : uniquement notre propre origine + Supabase (API + Realtime websocket).
// 'unsafe-inline' sur style-src : Tailwind + styles inline générés par React
// (pas d'alternative simple sans nonce dynamique côté App Router pour l'instant).
const supabaseOrigin = "https://*.supabase.co";
const csp = [
  "default-src 'self'",
  `connect-src 'self' ${supabaseOrigin} wss://*.supabase.co`,
  "img-src 'self' data: blob:",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Le callback DarePay ne doit jamais être mis en cache ni indexé.
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
