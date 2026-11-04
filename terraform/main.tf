# terraform/main.tf
#
# Valley Oak Winery on AWS:
#   - DynamoDB tables (wines, users, settings) and an S3 bucket for wine photos
#   - Amplify Hosting app that builds the Next.js app from GitHub on every push to main
#     and serves it (SSR + API routes) at https://valleyoakwinery.chrisubick.io
#   - A weekly EventBridge job that keeps the Instagram access token renewed

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
  description = "GitHub personal access token Amplify uses to read the repo and add its webhook. Only used when the Amplify app is first created; it may expire afterwards."
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

# Small key/value settings, e.g. the Instagram access token (id = "instagram").
resource "aws_dynamodb_table" "settings" {
  name         = "winery-settings"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = { Name = "Winery Settings" }
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
        Resource = [aws_dynamodb_table.wines.arn, aws_dynamodb_table.users.arn, aws_dynamodb_table.settings.arn]
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
            - env | grep -E '^(DYNAMODB_|S3_BUCKET_NAME|NEXTAUTH_|INSTAGRAM_)' >> .env.production
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
    DYNAMODB_WINES_TABLE     = aws_dynamodb_table.wines.name
    DYNAMODB_USERS_TABLE     = aws_dynamodb_table.users.name
    DYNAMODB_SETTINGS_TABLE  = aws_dynamodb_table.settings.name
    S3_BUCKET_NAME           = aws_s3_bucket.wine_images.bucket
    NEXTAUTH_URL             = local.site_url
    NEXTAUTH_SECRET          = var.nextauth_secret
    INSTAGRAM_REFRESH_SECRET = random_password.instagram_refresh.result
  }

  # The GitHub token is only needed to connect the repo when the app is created (Amplify
  # then builds via its own webhook + deploy key). AWS never returns it, so without this
  # Terraform re-sends it on every update, and an expired token fails the whole apply.
  lifecycle {
    ignore_changes = [access_token]
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
# Instagram token renewal
#
# The Pictures page reads posts with a long-lived Instagram token that expires after
# 60 days unless refreshed. Once a week EventBridge POSTs /api/instagram/refresh with a
# shared secret header, and the app renews the token (src/lib/instagram.ts).

resource "random_password" "instagram_refresh" {
  length  = 40
  special = false
}

resource "aws_cloudwatch_event_connection" "site" {
  name               = "winery-site"
  authorization_type = "API_KEY"

  auth_parameters {
    api_key {
      key   = "x-refresh-secret"
      value = random_password.instagram_refresh.result
    }
  }
}

resource "aws_cloudwatch_event_api_destination" "instagram_refresh" {
  name                             = "winery-instagram-refresh"
  invocation_endpoint              = "${local.site_url}/api/instagram/refresh"
  http_method                      = "POST"
  invocation_rate_limit_per_second = 1
  connection_arn                   = aws_cloudwatch_event_connection.site.arn
}

resource "aws_cloudwatch_event_rule" "instagram_refresh" {
  name                = "winery-instagram-refresh"
  description         = "Weekly renewal of the Instagram access token"
  schedule_expression = "rate(7 days)"
}

resource "aws_iam_role" "events_invoke_site" {
  name = "winery-events-invoke-site"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "events.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "events_invoke_site" {
  name = "invoke-instagram-refresh"
  role = aws_iam_role.events_invoke_site.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "events:InvokeApiDestination"
      Resource = aws_cloudwatch_event_api_destination.instagram_refresh.arn
    }]
  })
}

resource "aws_cloudwatch_event_target" "instagram_refresh" {
  rule     = aws_cloudwatch_event_rule.instagram_refresh.name
  arn      = aws_cloudwatch_event_api_destination.instagram_refresh.arn
  role_arn = aws_iam_role.events_invoke_site.arn
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
