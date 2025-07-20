/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Temporarily remove static export to fix client-side rendering
  // output: 'export',
  trailingSlash: true,
  experimental: {
    appDir: true,
  },
}

export default nextConfig
