/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@greenpages/database'],
  reactStrictMode: true,
  swcMinify: true,
};

export default nextConfig;
