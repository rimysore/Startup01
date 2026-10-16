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
