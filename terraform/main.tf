# terraform/main.tf
#
# Valley Oak Winery on AWS:
#   - DynamoDB tables (wines, users) and an S3 bucket for wine photos
#   - Amplify Hosting app that builds the Next.js app from GitHub on every push to main
#     and serves it (SSR + API routes) at https://valleyoakwinery.chrisubick.io

terraform {
  required_providers {
    aws    = { source = "hashicorp/aws", version = "~> 6.3" }
    random = { source = "hashicorp/random" }
  }
}

provider "aws" {
  region = "us-west-2"
}

# ---------------------------------------------------------------------------
# Variables (set in terraform.tfvars, see terraform.tfvars.example)

variable "nextauth_secret" {
  description = "Secret NextAuth uses to sign session cookies (long random string)"
  type        = string
  sensitive   = true
}

variable "github_token" {
  description = "GitHub personal access token Amplify uses to read the repo and add its webhook"
  type        = string
  sensitive   = true
}

variable "repository" {
  type    = string
  default = "https://github.com/cmubick/valley-oak-winery"
}

variable "root_domain" {
  description = "Route 53 hosted zone (already exists in this account)"
  type        = string
  default     = "chrisubick.io"
}

variable "subdomain" {
  type    = string
  default = "valleyoakwinery"
}

locals {
  site_url = "https://${var.subdomain}.${var.root_domain}"
}

# ---------------------------------------------------------------------------
# Data

resource "aws_dynamodb_table" "wines" {
  name         = "winery-wines"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = { Name = "Winery Wines" }
}

resource "aws_dynamodb_table" "users" {
  name         = "winery-users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "email"

  attribute {
    name = "email"
    type = "S"
  }

  tags = { Name = "Winery Users" }
}

# Wine photos. The admin UI uploads via presigned PUT; objects under wines/ are public-read.
resource "random_id" "bucket_suffix" {
  byte_length = 8
}

resource "aws_s3_bucket" "wine_images" {
  bucket = "winery-wine-images-${random_id.bucket_suffix.hex}"
}

resource "aws_s3_bucket_public_access_block" "wine_images" {
  bucket = aws_s3_bucket.wine_images.id

  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "wine_images_public_read" {
  bucket = aws_s3_bucket.wine_images.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "PublicReadWinePhotos"
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.wine_images.arn}/wines/*"
    }]
  })
  depends_on = [aws_s3_bucket_public_access_block.wine_images]
}

resource "aws_s3_bucket_cors_configuration" "wine_images" {
  bucket = aws_s3_bucket.wine_images.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "HEAD"]
    allowed_origins = [local.site_url, "http://localhost:3000"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# ---------------------------------------------------------------------------
# Hosting: Amplify (Next.js SSR)

# Role the app's server code (API routes, server components) runs as.
resource "aws_iam_role" "amplify_compute" {
  name = "winery-amplify-compute"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "amplify.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "amplify_compute" {
  name = "winery-app-data"
  role = aws_iam_role.amplify_compute.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem", "dynamodb:Scan", "dynamodb:Query"]
        Resource = [aws_dynamodb_table.wines.arn, aws_dynamodb_table.users.arn]
      },
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:GetObject"]
        Resource = "${aws_s3_bucket.wine_images.arn}/wines/*"
      }
    ]
  })
}

resource "aws_amplify_app" "winery" {
  name             = "valley-oak-winery"
  repository       = var.repository
  access_token     = var.github_token
  platform         = "WEB_COMPUTE"
  compute_role_arn = aws_iam_role.amplify_compute.arn

  # Amplify only exposes env vars at build time, so the build writes the ones the
  # server needs into .env.production. (Amplify reserves the AWS_ prefix; the region
  # comes from the runtime.)
  build_spec = <<-YAML
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - nvm use 22
            - npm ci
        build:
          commands:
            - env | grep -E '^(DYNAMODB_|S3_BUCKET_NAME|NEXTAUTH_)' >> .env.production
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - .next/cache/**/*
          - node_modules/**/*
  YAML

  environment_variables = {
    DYNAMODB_WINES_TABLE = aws_dynamodb_table.wines.name
    DYNAMODB_USERS_TABLE = aws_dynamodb_table.users.name
    S3_BUCKET_NAME       = aws_s3_bucket.wine_images.bucket
    NEXTAUTH_URL         = local.site_url
    NEXTAUTH_SECRET      = var.nextauth_secret
  }
}

resource "aws_amplify_branch" "main" {
  app_id            = aws_amplify_app.winery.id
  branch_name       = "main"
  framework         = "Next.js - SSR"
  stage             = "PRODUCTION"
  enable_auto_build = true
}

# Amplify issues the TLS cert and, because chrisubick.io is a Route 53 zone in this
# account, creates the valleyoakwinery CNAME + validation records itself.
resource "aws_amplify_domain_association" "winery" {
  app_id                = aws_amplify_app.winery.id
  domain_name           = var.root_domain
  wait_for_verification = false

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = var.subdomain
  }
}

# ---------------------------------------------------------------------------
# Outputs

output "site_url" {
  value = local.site_url
}

output "amplify_app_id" {
  value = aws_amplify_app.winery.id
}

output "amplify_default_url" {
  description = "Works before the custom domain finishes verifying"
  value       = "https://main.${aws_amplify_app.winery.default_domain}"
}

output "s3_bucket_name" {
  value = aws_s3_bucket.wine_images.bucket
}
