import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Vercel Blob gives each store its own subdomain. Scoped to the
        // `uploads/` prefix so the optimizer can't be aimed at anything else.
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
        port: '',
        pathname: '/uploads/**',
        search: '',
      },
    ],
  },
}

export default nextConfig
