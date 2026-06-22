/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  reactStrictMode: false,

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // Explicit empty custom routes — prevents Next.js from calling
  // loadCustomRoutes() which crashes on shared hosting due to missing
  // onMatchHeaders field in the build manifest
  headers: async () => [],
  redirects: async () => [],
  rewrites: async () => [],
};

export default nextConfig;
