/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@greenpages/database'],
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
