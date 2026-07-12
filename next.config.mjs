/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // three.js ecosystem ships untranspiled ESM; let Next compile it.
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  // pdf-parse (and mammoth) are CommonJS libs that stay external to the bundle.
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "mammoth"],
  },
};

export default nextConfig;
