/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pdf-parse (and mammoth) are CommonJS libs that stay external to the bundle.
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "mammoth"],
  },
  // Serve the static vanilla hero (public/hero.html) at the root, while the
  // React app lives at /app. beforeFiles runs before the filesystem check so
  // "/" resolves to the static hero even though other app routes are unaffected.
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/hero.html" }],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
