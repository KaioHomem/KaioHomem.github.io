import type { NextConfig } from "next";

// Static export for GitHub Pages. The legacy pages at the repository root
// (ferramentas/, produtos/, privacidade.html, ...) are copied next to this output
// by scripts/assemble.mjs, so their URLs never change.
const nextConfig: NextConfig = {
  output: "export",
  // The repository root has its own package-lock.json (the calculators' test tools).
  turbopack: { root: __dirname },
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
