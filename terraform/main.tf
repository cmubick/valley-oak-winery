# terraform/main.tf
provider "aws" {
  region = "us-west-2"
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

# Outputs
output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = aws_api_gateway_stage.winery_api_stage.invoke_url
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
