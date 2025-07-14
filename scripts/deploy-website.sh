#!/bin/bash

# scripts/deploy-website.sh
# Deploy Next.js static export to S3 and invalidate CloudFront

set -e

echo "🏗️  Building Next.js application..."
npm run build

echo "📦 Exporting static files..."
npm run export 2>/dev/null || echo "Export not configured yet - using .next/static for now"

echo "☁️  Getting S3 bucket name from Terraform..."
cd terraform
S3_BUCKET=$(terraform output -raw s3_website_bucket 2>/dev/null || echo "")
CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id 2>/dev/null || echo "")
cd ..

if [ -z "$S3_BUCKET" ]; then
    echo "❌ Could not get S3 bucket name. Make sure Terraform has been applied."
    exit 1
fi

echo "📤 Deploying to S3 bucket: $S3_BUCKET"

# Sync the build output to S3
if [ -d "out" ]; then
    # Static export exists
    aws s3 sync out/ s3://$S3_BUCKET/ --delete
else
    # Use Next.js build output (for development)
    echo "⚠️  No 'out' directory found. This script needs Next.js static export configured."
    echo "   Add 'output: \"export\"' to next.config.ts for static hosting."
    exit 1
fi

if [ -n "$CLOUDFRONT_ID" ]; then
    echo "🔄 Invalidating CloudFront cache..."
    aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths "/*"
    echo "✅ CloudFront invalidation started"
else
    echo "⚠️  Could not get CloudFront distribution ID"
fi

echo "🚀 Website deployment complete!"
echo "   Visit: https://valleyoakwinery.chrisubick.io"
