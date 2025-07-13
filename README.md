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
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

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
- 📱 Responsive design with Tailwind CSS
- 🚀 TypeScript throughout
- 🐳 Docker containerization

## Production Deployment

For production deployment, update your `.env.local` with real AWS credentials and deploy using:

```bash
npm run tf:init
npm run tf:plan
npm run tf:apply
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
