/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@aws-sdk/client-dynamodb', '@aws-sdk/lib-dynamodb'],
  },
  // Enable static export for CloudFront/S3 hosting
  output: 'export',
  trailingSlash: true,
  // Configure images for static export
  images: {
    domains: ['your-s3-bucket.s3.amazonaws.com'],
    unoptimized: true,
  },
};

module.exports = nextConfig;