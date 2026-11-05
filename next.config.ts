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
  async redirects() {
    return [
      // The site lives at www; send the bare domain and the old test address there.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'valleyoakwinery.com' }],
        destination: 'https://www.valleyoakwinery.com/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'valleyoakwinery.chrisubick.io' }],
        destination: 'https://www.valleyoakwinery.com/:path*',
        permanent: false,
      },
      // "/" is Our Story now (as on the original site); keep the old URL working.
      { source: '/our-story', destination: '/', permanent: true },
    ];
  },
};

module.exports = nextConfig;
