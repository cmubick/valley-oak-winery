#!/bin/bash

# Script to initialize LocalStack DynamoDB tables for local development

echo "Setting up LocalStack DynamoDB tables..."

# Create wines table
aws --endpoint-url=http://localhost:4566 dynamodb create-table \
    --table-name winery-wines \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region us-east-1

# Create users table
aws --endpoint-url=http://localhost:4566 dynamodb create-table \
    --table-name winery-users \
    --attribute-definitions \
        AttributeName=email,AttributeType=S \
    --key-schema \
        AttributeName=email,KeyType=HASH \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region us-east-1

echo "Tables created successfully!"

# Create S3 bucket
aws --endpoint-url=http://localhost:4566 s3 mb s3://your-bucket-name --region us-east-1

echo "LocalStack setup complete!"
