/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['your-s3-bucket.s3.amazonaws.com'],
  },
  experimental: {
    serverComponentsExternalPackages: ['@aws-sdk/client-dynamodb', '@aws-sdk/lib-dynamodb'],
  },
};

module.exports = nextConfig;