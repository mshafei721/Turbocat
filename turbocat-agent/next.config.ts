import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Note: 'standalone' output is only used for Docker deployments (Railway)
  // Vercel handles this automatically, so we conditionally enable it
  ...(process.env.RAILWAY_ENVIRONMENT ? { output: 'standalone' as const } : {}),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'github.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
