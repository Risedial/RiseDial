/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  
  // Environment variables configuration
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Build configuration
  generateBuildId: async () => {
    // Use a consistent build ID to avoid unnecessary rebuilds
    return 'build-' + Date.now()
  },
  
  // API routes configuration
  async rewrites() {
    return [
      {
        source: '/health',
        destination: '/api/health'
      }
    ]
  },
  
  // Headers configuration
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          }
        ]
      }
    ]
  },
  
  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Ignore build-time environment checks in client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    return config
  },
  
  // Output configuration for static export if needed
  // output: 'export',
  // trailingSlash: true,
  // images: { unoptimized: true },
  
  // Disable telemetry for faster builds
  telemetry: false,
  
  // Compress output
  compress: true,
  
  // Power by header
  poweredByHeader: false,
  
  // React strict mode
  reactStrictMode: true,
  
  // SWC configuration
  swcMinify: true,
  
  // Image domains if needed
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      }
    ]
  }
}

module.exports = nextConfig 