#!/usr/bin/env node
// Create (or reset) an admin user directly in DynamoDB.
//
//   npm run create-admin -- you@example.com 'password'          # LocalStack
//   npm run create-admin -- you@example.com 'password' --prod   # real AWS (us-west-2, uses your AWS CLI credentials)

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';

const args = process.argv.slice(2);
const prod = args.includes('--prod');
const [email, password] = args.filter((a) => a !== '--prod');

if (!email || !password) {
  console.error("Usage: npm run create-admin -- <email> <password> [--prod]");
  process.exit(1);
}

const client = new DynamoDBClient(
  prod
    ? { region: 'us-west-2' }
    : {
        region: 'us-east-1',
        endpoint: 'http://localhost:4566',
        credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
      }
);

const now = new Date().toISOString();
await DynamoDBDocumentClient.from(client).send(
  new PutCommand({
    TableName: 'winery-users',
    Item: { email, password: await bcrypt.hash(password, 10), role: 'admin', createdAt: now, updatedAt: now },
  })
);

console.log(`Admin ${email} saved to ${prod ? 'AWS (us-west-2)' : 'LocalStack'}.`);
