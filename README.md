# Winery Website

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

A modern winery website with wine catalog management, admin authentication, and AWS integration.

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- AWS CLI (for LocalStack setup)

## Local Development Setup

This project uses LocalStack to simulate AWS services (DynamoDB, S3) for local development.

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

The `.env.local` file is already configured for LocalStack development with these settings:

```bash
NODE_ENV=development
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
DYNAMODB_WINES_TABLE=winery-wines
DYNAMODB_USERS_TABLE=winery-users
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
```

### 3. Start Development Environment

#### Option A: One-command setup (recommended)

```bash
npm run dev:local
```

This will:

- Start LocalStack (DynamoDB + S3)
- Create required database tables
- Start the Next.js development server

#### Option B: Step-by-step setup

```bash
# Start LocalStack
npm run localstack:start

# Wait a few seconds, then setup tables
npm run localstack:setup

# Start Next.js development server
npm run dev
```

### 4. Create Admin User

Use Postman or curl to create an admin user:

```bash
curl -X POST http://localhost:3000/api/admin \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "yourpassword"}'
```

### 5. Access the Application

- **Main Site**: [http://localhost:3000](http://localhost:3000)
- **Admin Login**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- **Admin Dashboard**: [http://localhost:3000/admin](http://localhost:3000/admin) (after login)

### 6. Stop Development Environment

```bash
npm run localstack:stop
```

## Available Scripts

- `npm run dev` - Start Next.js development server only
- `npm run dev:local` - Start LocalStack + setup tables + Next.js dev server
- `npm run localstack:start` - Start LocalStack services
- `npm run localstack:stop` - Stop LocalStack services  
- `npm run localstack:setup` - Create DynamoDB tables and S3 buckets
- `npm run lambda:build` - Build and package Lambda functions for deployment
- `npm run lambda:deploy` - Build Lambda functions and deploy to AWS
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run tf:init` - Initialize Terraform
- `npm run tf:plan` - Plan Terraform deployment
- `npm run tf:apply` - Apply Terraform changes

## Project Structure

```text
src/
├── app/
│   ├── api/
│   │   ├── admin/          # Admin user management
│   │   ├── auth/           # NextAuth authentication
│   │   └── wines/          # Wine CRUD operations
│   ├── admin/              # Admin dashboard pages
│   └── components/         # Reusable React components
├── lib/
│   └── dynamodb.ts         # DynamoDB client configuration
```

## Features

- 🍷 Wine catalog with CRUD operations
- 🔐 Admin authentication with NextAuth
- 🏗️ LocalStack for local AWS services
- ☁️ Serverless deployment with AWS Lambda
- 🌐 API Gateway for RESTful endpoints
- 📱 Responsive design with Tailwind CSS
- 🚀 TypeScript throughout
- 🐳 Docker containerization

## Production Deployment

### Lambda & AWS Infrastructure

This project can be deployed to AWS using Lambda functions and API Gateway for a serverless architecture.

#### Prerequisites for Production Deployment

- AWS CLI configured with appropriate credentials
- Terraform installed
- Node.js 18+ for building Lambda functions

#### Step 1: Configure Terraform Variables

```bash
# Copy the example file
cp terraform/terraform.tfvars.example terraform/terraform.tfvars

# Edit the file and set your values
# Required: nextauth_secret (make it long and random)
```

Example `terraform/terraform.tfvars`:

```bash
nextauth_secret = "your-very-long-random-secret-key-here-at-least-32-characters"
```

#### Step 2: Build Lambda Functions

```bash
# Build and package all Lambda functions
npm run lambda:build
```

This creates deployment packages:

- `terraform/wines-api.zip` - Wine catalog API
- `terraform/admin-api.zip` - Admin user management
- `terraform/auth-api.zip` - Authentication API

#### Step 3: Deploy Infrastructure

```bash
# Initialize Terraform (first time only)
npm run tf:init

# Review deployment plan
npm run tf:plan

# Deploy to AWS
npm run tf:apply
```

#### Step 4: One-Command Deploy (after initial setup)

```bash
# Build Lambda functions and deploy in one command
npm run lambda:deploy
```

#### Infrastructure Created

- **3 Lambda Functions** for API endpoints
- **API Gateway** with RESTful routing
- **DynamoDB Tables** for wines and users
- **S3 Bucket** for wine images
- **IAM Roles** with proper permissions
- **CloudWatch Logs** for monitoring

#### API Endpoints (after deployment)

Your API will be available at: `https://{api-id}.execute-api.us-west-2.amazonaws.com/prod/`

- `GET /wines` - List all wines
- `POST /wines` - Create new wine (requires admin auth)
- `GET /wines/{id}` - Get specific wine
- `PUT /wines/{id}` - Update wine (requires admin auth)
- `DELETE /wines/{id}` - Delete wine (requires admin auth)
- `POST /admin` - Create admin user

#### Cleanup

To destroy all AWS resources:

```bash
cd terraform
terraform destroy
```

### Legacy Deployment Options

For production deployment with traditional infrastructure, update your `.env.local` with real AWS credentials and deploy using:

```bash
npm run tf:init
npm run tf:plan
npm run tf:apply
```

## 🔧 Development Notes

### Build Artifacts

The following files are generated during the build process and are **not tracked in git**:

- **Lambda zip files** (`terraform/*.zip`) - Created by `npm run lambda:build`
- **Terraform state** (`terraform/terraform.tfstate*`) - Managed by Terraform
- **Terraform providers** (`terraform/.terraform/`) - Downloaded during `terraform init`
- **Environment variables** (`terraform/terraform.tfvars`) - Contains secrets

These files are regenerated automatically during deployment and should never be committed to version control.

---

## 🚀 Deployment

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
