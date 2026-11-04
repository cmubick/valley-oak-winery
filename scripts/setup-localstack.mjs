#!/usr/bin/env node
// Create the DynamoDB tables and S3 bucket in LocalStack. Safe to re-run.

import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import {
  S3Client, CreateBucketCommand, HeadBucketCommand, PutBucketCorsCommand, PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';

const endpoint = 'http://localhost:4566';
const config = { region: 'us-east-1', endpoint, credentials: { accessKeyId: 'test', secretAccessKey: 'test' } };
const ddb = new DynamoDBClient(config);
const s3 = new S3Client({ ...config, forcePathStyle: true });
const BUCKET = 'winery-wine-images-local';

process.stdout.write('Waiting for LocalStack');
for (let i = 0; ; i++) {
  try { if ((await fetch(`${endpoint}/_localstack/health`)).ok) break; } catch {}
  if (i > 60) throw new Error('LocalStack did not start. Is Docker running?');
  process.stdout.write('.');
  await new Promise((r) => setTimeout(r, 1000));
}
console.log();

for (const [TableName, key] of [['winery-wines', 'id'], ['winery-users', 'email'], ['winery-settings', 'id']]) {
  try {
    await ddb.send(new DescribeTableCommand({ TableName }));
    console.log(`Table ${TableName} exists`);
  } catch {
    await ddb.send(new CreateTableCommand({
      TableName,
      AttributeDefinitions: [{ AttributeName: key, AttributeType: 'S' }],
      KeySchema: [{ AttributeName: key, KeyType: 'HASH' }],
      BillingMode: 'PAY_PER_REQUEST',
    }));
    console.log(`Created table ${TableName}`);
  }
}

try { await s3.send(new HeadBucketCommand({ Bucket: BUCKET })); }
catch { await s3.send(new CreateBucketCommand({ Bucket: BUCKET })); console.log(`Created bucket ${BUCKET}`); }

await s3.send(new PutBucketCorsCommand({
  Bucket: BUCKET,
  CORSConfiguration: { CORSRules: [{ AllowedOrigins: ['*'], AllowedMethods: ['GET', 'PUT'], AllowedHeaders: ['*'] }] },
}));
await s3.send(new PutBucketPolicyCommand({
  Bucket: BUCKET,
  Policy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [{ Effect: 'Allow', Principal: '*', Action: 's3:GetObject', Resource: `arn:aws:s3:::${BUCKET}/wines/*` }],
  }),
}));

console.log('LocalStack setup complete.');
