# terraform/main.tf
provider "aws" {
  region = "us-west-2"
}

# Provider for ACM certificates (must be in us-east-1 for CloudFront)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# IAM Role for Lambda Functions
resource "aws_iam_role" "lambda_role" {
  name = "winery-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Policy for Lambda to access DynamoDB and S3
resource "aws_iam_policy" "lambda_policy" {
  name = "winery-lambda-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan",
          "dynamodb:Query"
        ]
        Resource = [
          aws_dynamodb_table.wines.arn,
          aws_dynamodb_table.users.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:GetObjectUrl"
        ]
        Resource = "${aws_s3_bucket.wine_images.arn}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy_attachment" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
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

resource "aws_s3_bucket_cors_configuration" "wine_images" {
  bucket = aws_s3_bucket.wine_images.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Lambda function for wines API
resource "aws_lambda_function" "wines_api" {
  filename         = "wines-api.zip"
  function_name    = "winery-wines-api"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs20.x"
  timeout         = 30

  environment {
    variables = {
      DYNAMODB_WINES_TABLE = aws_dynamodb_table.wines.name
      S3_BUCKET_NAME      = aws_s3_bucket.wine_images.bucket
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_policy_attachment,
    aws_cloudwatch_log_group.wines_api_logs,
  ]
}

# Lambda function for admin API
resource "aws_lambda_function" "admin_api" {
  filename         = "admin-api.zip"
  function_name    = "winery-admin-api"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs20.x"
  timeout         = 30

  environment {
    variables = {
      DYNAMODB_USERS_TABLE = aws_dynamodb_table.users.name
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_policy_attachment,
    aws_cloudwatch_log_group.admin_api_logs,
  ]
}

# Lambda function for auth API
resource "aws_lambda_function" "auth_api" {
  filename         = "auth-api.zip"
  function_name    = "winery-auth-api"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs20.x"
  timeout         = 30

  environment {
    variables = {
      DYNAMODB_USERS_TABLE = aws_dynamodb_table.users.name
      NEXTAUTH_SECRET     = var.nextauth_secret
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_policy_attachment,
    aws_cloudwatch_log_group.auth_api_logs,
  ]
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "wines_api_logs" {
  name              = "/aws/lambda/winery-wines-api"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "admin_api_logs" {
  name              = "/aws/lambda/winery-admin-api"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "auth_api_logs" {
  name              = "/aws/lambda/winery-auth-api"
  retention_in_days = 14
}

# API Gateway
resource "aws_api_gateway_rest_api" "winery_api" {
  name = "winery-api"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# API Gateway Resources and Methods for Wines
resource "aws_api_gateway_resource" "wines" {
  rest_api_id = aws_api_gateway_rest_api.winery_api.id
  parent_id   = aws_api_gateway_rest_api.winery_api.root_resource_id
  path_part   = "wines"
}

resource "aws_api_gateway_method" "wines_get" {
  rest_api_id   = aws_api_gateway_rest_api.winery_api.id
  resource_id   = aws_api_gateway_resource.wines.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "wines_post" {
  rest_api_id   = aws_api_gateway_rest_api.winery_api.id
  resource_id   = aws_api_gateway_resource.wines.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "wines_get_integration" {
  rest_api_id = aws_api_gateway_rest_api.winery_api.id
  resource_id = aws_api_gateway_resource.wines.id
  http_method = aws_api_gateway_method.wines_get.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.wines_api.invoke_arn
}

resource "aws_api_gateway_integration" "wines_post_integration" {
  rest_api_id = aws_api_gateway_rest_api.winery_api.id
  resource_id = aws_api_gateway_resource.wines.id
  http_method = aws_api_gateway_method.wines_post.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.wines_api.invoke_arn
}

# API Gateway Resources for individual wine
resource "aws_api_gateway_resource" "wine_id" {
  rest_api_id = aws_api_gateway_rest_api.winery_api.id
  parent_id   = aws_api_gateway_resource.wines.id
  path_part   = "{id}"
}

resource "aws_api_gateway_method" "wine_get" {
  rest_api_id   = aws_api_gateway_rest_api.winery_api.id
  resource_id   = aws_api_gateway_resource.wine_id.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "wine_put" {
  rest_api_id   = aws_api_gateway_rest_api.winery_api.id
  resource_id   = aws_api_gateway_resource.wine_id.id
  http_method   = "PUT"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "wine_delete" {
  rest_api_id   = aws_api_gateway_rest_api.winery_api.id
  resource_id   = aws_api_gateway_resource.wine_id.id
  http_method   = "DELETE"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "wine_get_integration" {
  rest_api_id = aws_api_gateway_rest_api.winery_api.id
  resource_id = aws_api_gateway_resource.wine_id.id
  http_method = aws_api_gateway_method.wine_get.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.wines_api.invoke_arn
}

resource "aws_api_gateway_integration" "wine_put_integration" {
  rest_api_id = aws_api_gateway_rest_api.winery_api.id
  resource_id = aws_api_gateway_resource.wine_id.id
  http_method = aws_api_gateway_method.wine_put.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.wines_api.invoke_arn
}

resource "aws_api_gateway_integration" "wine_delete_integration" {
  rest_api_id = aws_api_gateway_rest_api.winery_api.id
  resource_id = aws_api_gateway_resource.wine_id.id
  http_method = aws_api_gateway_method.wine_delete.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.wines_api.invoke_arn
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "wines_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.wines_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.winery_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "admin_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.admin_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.winery_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "auth_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auth_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.winery_api.execution_arn}/*/*"
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "winery_api_deployment" {
  depends_on = [
    aws_api_gateway_integration.wines_get_integration,
    aws_api_gateway_integration.wines_post_integration,
    aws_api_gateway_integration.wine_get_integration,
    aws_api_gateway_integration.wine_put_integration,
    aws_api_gateway_integration.wine_delete_integration,
  ]

  rest_api_id = aws_api_gateway_rest_api.winery_api.id
}

# API Gateway Stage
resource "aws_api_gateway_stage" "winery_api_stage" {
  deployment_id = aws_api_gateway_deployment.winery_api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.winery_api.id
  stage_name    = "prod"
}

# Variables
variable "nextauth_secret" {
  description = "Secret key for NextAuth"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Domain name for the website"
  type        = string
  default     = "valleyoakwinery.chrisubick.io"
}

# Route 53 Hosted Zone
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = {
    Name = "Valley Oak Winery Domain"
  }
}

# ACM Certificate for HTTPS (must be in us-east-1 for CloudFront)
resource "aws_acm_certificate" "main" {
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    "www.${var.domain_name}"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "Valley Oak Winery Certificate"
  }
}

# Route 53 record for ACM certificate validation
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.main.zone_id
}

# ACM certificate validation
resource "aws_acm_certificate_validation" "main" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# S3 bucket for static website hosting
resource "aws_s3_bucket" "website" {
  bucket = "${replace(var.domain_name, ".", "-")}-website"
}

resource "aws_s3_bucket_website_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "website" {
  bucket = aws_s3_bucket.website.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.website.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.website]
}

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "main" {
  name                              = "${var.domain_name}-oac"
  description                       = "OAC for ${var.domain_name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  origin {
    domain_name              = aws_s3_bucket.website.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.main.id
    origin_id                = "S3-${aws_s3_bucket.website.bucket}"
  }

  # API Gateway origin for API calls
  origin {
    domain_name = replace(aws_api_gateway_stage.winery_api_stage.invoke_url, "https://", "")
    origin_id   = "APIGateway-${aws_api_gateway_rest_api.winery_api.name}"
    origin_path = "/prod"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  comment             = "Valley Oak Winery CloudFront Distribution"

  aliases = [var.domain_name, "www.${var.domain_name}"]

  # Default behavior for static website
  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.website.bucket}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  # API behavior for /api/* paths
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "APIGateway-${aws_api_gateway_rest_api.winery_api.name}"

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Content-Type"]
      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.main.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Name = "Valley Oak Winery CloudFront"
  }
}

# Route 53 records pointing to CloudFront
resource "aws_route53_record" "main" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

# Outputs
output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = aws_api_gateway_stage.winery_api_stage.invoke_url
}

output "website_url" {
  description = "Website URL"
  value       = "https://${var.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "CloudFront Distribution ID"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_domain_name" {
  description = "CloudFront Distribution Domain Name"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "route53_zone_id" {
  description = "Route 53 Hosted Zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "route53_name_servers" {
  description = "Route 53 Name Servers (configure these with your domain registrar)"
  value       = aws_route53_zone.main.name_servers
}

output "s3_website_bucket" {
  description = "S3 bucket for website hosting"
  value       = aws_s3_bucket.website.bucket
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for wine images"
  value       = aws_s3_bucket.wine_images.bucket
}

output "dynamodb_wines_table" {
  description = "Name of the DynamoDB wines table"
  value       = aws_dynamodb_table.wines.name
}

output "dynamodb_users_table" {
  description = "Name of the DynamoDB users table"
  value       = aws_dynamodb_table.users.name
}
