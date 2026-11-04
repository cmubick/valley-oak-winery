#!/usr/bin/env node
// Load the wine list from the original valleyoakwinery.com site (scripts/wines-seed.json).
//
//   npm run seed-wines                  # LocalStack
//   npm run seed-wines -- --prod        # real AWS (us-west-2, uses your AWS CLI credentials)
//
// Skips if the table already has wines, so it's safe to run on every `dev:local`.
// Pass --force to write anyway: seed wines have fixed ids, so this resets them to the
// seed values (losing admin edits to those wines) without creating duplicates.

import { readFile } from 'node:fs/promises';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { BatchWriteCommand, DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const args = process.argv.slice(2);
const prod = args.includes('--prod');
const force = args.includes('--force');
const TableName = 'winery-wines';

const db = DynamoDBDocumentClient.from(
  new DynamoDBClient(
    prod
      ? { region: 'us-west-2' }
      : { region: 'us-east-1', endpoint: 'http://localhost:4566', credentials: { accessKeyId: 'test', secretAccessKey: 'test' } }
  )
);
const where = prod ? 'AWS (us-west-2)' : 'LocalStack';

const existing = await db.send(new ScanCommand({ TableName, Select: 'COUNT' }));
if (existing.Count > 0 && !force) {
  console.log(`${TableName} in ${where} already has ${existing.Count} wine(s); skipping seed (use --force to overwrite).`);
  process.exit(0);
}

const seed = JSON.parse(await readFile(new URL('./wines-seed.json', import.meta.url), 'utf8'));
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const now = new Date().toISOString();
const items = seed.map((w) => ({
  id: slug([w.collection, w.name, w.vintage ?? 'nv'].join(' ')),
  ...w,
  createdAt: now,
  updatedAt: now,
}));

for (let i = 0; i < items.length; i += 25) {
  let RequestItems = { [TableName]: items.slice(i, i + 25).map((Item) => ({ PutRequest: { Item } })) };
  while (RequestItems && Object.keys(RequestItems).length) {
    ({ UnprocessedItems: RequestItems } = await db.send(new BatchWriteCommand({ RequestItems })));
  }
}

console.log(`Seeded ${items.length} wines into ${TableName} in ${where}.`);
