import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // PGlite ships WASM + data files that must be loaded from node_modules at runtime.
  serverExternalPackages: ["@electric-sql/pglite", "pdfkit", "fontkit"],
  // SQL migrations are read from disk at runtime.
  outputFileTracingIncludes: {
    "/api/**/*": ["./drizzle/**/*"],
    // Fonts for the PDF reports (Indian scripts need full fonts to shape correctly).
    "/api/reports/**/*": ["./assets/pdf-fonts/**/*"],
  },
  partialPrefetching: true,
  // Basic hardening for every page: no framing (clickjacking), no MIME sniffing, no referrer leaks to other
  // sites, no camera/mic/location, HTTPS only.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://accounts.google.com" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self \"https://checkout.razorpay.com\" \"https://api.razorpay.com\")" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
