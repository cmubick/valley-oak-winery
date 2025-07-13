# terraform/main.tf
provider "aws" {
  region = "us-west-2"
}

# DynamoDB Tables
resource "aws_dynamodb_table" "wines" {
  name           = "winery-wines"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Name = "Winery Wines"
  }
}

resource "aws_dynamodb_table" "users" {
  name           = "winery-users"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "email"

  attribute {
    name = "email"
    type = "S"
  }

  tags = {
    Name = "Winery Users"
  }
}

# S3 Bucket for wine images
resource "aws_s3_bucket" "wine_images" {
  bucket = "winery-wine-images-${random_id.bucket_suffix.hex}"
}

resource "random_id" "bucket_suffix" {
  byte_length = 8
}

resource "aws_s3_bucket_public_access_block" "wine_images" {
  bucket = aws_s3_bucket.wine_images.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}
