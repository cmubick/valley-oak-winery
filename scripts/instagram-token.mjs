#!/usr/bin/env node
// Connect the Pictures page to Instagram by saving a long-lived access token.
//
//   npm run instagram-token              # LocalStack
//   npm run instagram-token -- --prod    # real AWS (us-west-2, uses your AWS CLI credentials)
//
// Paste the token generated in the Meta developer dashboard when prompted (it's read from
// stdin so it doesn't end up in your shell history). The site renews it automatically
// from then on; you only need to run this again if the feed is ever disconnected.

import { createInterface } from 'node:readline/promises';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const prod = process.argv.includes('--prod');

const rl = createInterface({ input: process.stdin, output: process.stdout });
const token = (await rl.question('Paste the Instagram access token: ')).trim();
rl.close();
if (!token) {
  console.error('No token given.');
  process.exit(1);
}

// Check the token works and find out which account it belongs to.
const res = await fetch(`https://graph.instagram.com/me?${new URLSearchParams({ fields: 'user_id,username', access_token: token })}`);
const me = await res.json();
if (!res.ok || me.error) {
  console.error(`Instagram rejected the token: ${me.error?.message ?? `HTTP ${res.status}`}`);
  process.exit(1);
}

const db = DynamoDBDocumentClient.from(
  new DynamoDBClient(
    prod
      ? { region: 'us-west-2' }
      : { region: 'us-east-1', endpoint: 'http://localhost:4566', credentials: { accessKeyId: 'test', secretAccessKey: 'test' } }
  )
);

await db.send(new PutCommand({
  TableName: 'winery-settings',
  Item: {
    id: 'instagram',
    accessToken: token,
    username: me.username,
    // Dashboard tokens are long-lived (60 days from when they were generated). The site
    // refreshes it within a week, which sets the real expiry.
    refreshedAt: new Date().toISOString(),
  },
}));

console.log(`Connected @${me.username} in ${prod ? 'AWS (us-west-2)' : 'LocalStack'}. The site will keep the token renewed.`);
