#!/bin/bash

# Script to build and deploy Lambda functions

echo "Building Lambda functions for Valley Oak Winery..."

# Change to lambda directory
cd lambda

# Install dependencies
echo "Installing dependencies..."
npm install

# Create deployment packages
echo "Creating deployment packages..."

# Clean up old packages
rm -f ../terraform/*.zip

# Package wines API
echo "Packaging wines API..."
zip -r ../terraform/wines-api.zip wines-api.js node_modules/ package.json

# Package admin API
echo "Packaging admin API..."
zip -r ../terraform/admin-api.zip admin-api.js node_modules/ package.json

# Package auth API
echo "Packaging auth API..."
zip -r ../terraform/auth-api.zip auth-api.js node_modules/ package.json

echo "Lambda functions packaged successfully!"
echo "Packages created:"
echo "  - terraform/wines-api.zip"
echo "  - terraform/admin-api.zip"
echo "  - terraform/auth-api.zip"

# Return to root directory
cd ..

echo "Ready to deploy with Terraform!"
echo "Run: cd terraform && terraform apply"
