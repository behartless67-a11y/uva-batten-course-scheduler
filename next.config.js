/** @type {import('next').NextConfig} */
const nextConfig = {
  // Uncomment for static export deployment:
  output: 'export',
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
