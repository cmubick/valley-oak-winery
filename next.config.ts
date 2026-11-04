/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@aws-sdk/client-dynamodb', '@aws-sdk/lib-dynamodb'],
  images: {
    // Wine photos come straight from S3 (prod) or LocalStack (dev)
    remotePatterns: [
      { protocol: 'https', hostname: '*.s3.us-west-2.amazonaws.com' },
      { protocol: 'http', hostname: 'localhost', port: '4566' },
    ],
    unoptimized: true,
  },
  // "/" is Our Story now (as on the original site); keep the old URL working.
  async redirects() {
    return [{ source: '/our-story', destination: '/', permanent: true }];
  },
};

module.exports = nextConfig;
