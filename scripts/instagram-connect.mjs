#!/usr/bin/env node
// Connect the Pictures page to the winery's Instagram (one time).
//
//   npm run instagram-connect              # LocalStack
//   npm run instagram-connect -- --prod    # real AWS (us-west-2, uses your AWS CLI credentials)
//
// When asked, paste EITHER:
//   - the full address your browser landed on after opening the Login URL from the Meta
//     dashboard (https://…/api/instagram/callback?code=…). The page itself shows "not found";
//     that's expected, only the address matters. The code expires within minutes, so run
//     this right away. You'll also be asked for the app ID and app secret
//     (Meta dashboard → App settings → Basic). The secret is only used here, never stored.
//   - or an access token generated in the Meta dashboard.
//
// The script works out which Meta API the token belongs to, finds the Instagram account,
// test-reads the latest posts and saves the token. It never prints the token or secret.

import { createInterface } from 'node:readline';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const prod = process.argv.includes('--prod');
const IG = process.env.INSTAGRAM_API_BASE || 'https://graph.instagram.com';
const FB = process.env.FACEBOOK_API_BASE || 'https://graph.facebook.com';

// ---- prompts (with hidden input for secrets) --------------------------------------------
const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: !!process.stdin.isTTY });
const queued = [];
const waiting = [];
rl.on('line', (line) => (waiting.length ? waiting.shift()(line) : queued.push(line)));
let muted = false;
const write = rl._writeToOutput?.bind(rl);
if (write) rl._writeToOutput = (s) => { if (!muted) write(s); };

async function ask(question, { hidden = false } = {}) {
  process.stdout.write(question);
  muted = hidden;
  const answer = queued.length ? queued.shift() : await new Promise((resolve) => waiting.push(resolve));
  if (hidden && process.stdin.isTTY) process.stdout.write('\n');
  muted = false;
  return answer.trim();
}

const ok = (msg) => console.log(`  ✓ ${msg}`);
const info = (msg) => console.log(`  · ${msg}`);
function fail(msg) {
  console.error(`\n✗ ${msg}\nNothing was saved.`);
  process.exit(1);
}

async function get(base, path, params) {
  const res = await fetch(`${base}${path}?${new URLSearchParams(params)}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) throw new Error(body.error?.message ?? `HTTP ${res.status}`);
  return body;
}

// ---- 1. get a token ------------------------------------------------------------------------
const input = await ask('Paste the address you landed on after logging in (or an access token): ');
if (!input) fail('Nothing pasted.');

let appId = '';
let appSecret = '';
async function askAppCredentials({ optional = false } = {}) {
  if (appId) return true;
  appId = await ask(`App ID (Meta dashboard → App settings → Basic)${optional ? ', or press Enter to skip' : ''}: `);
  if (!appId) return false;
  appSecret = await ask('App secret (same page, click "Show"; hidden as you type): ', { hidden: true });
  return !!appSecret;
}

let token;
if (/^https?:\/\//i.test(input)) {
  const landed = new URL(input);
  const code = landed.searchParams.get('code');
  if (!code) fail(landed.searchParams.get('error_description') || 'That address has no ?code=… in it. Open the Login URL again.');
  if (!(await askAppCredentials())) fail('The app ID and secret are needed to exchange the login code.');
  console.log('\nExchanging the login code…');
  try {
    const body = await get(FB, '/oauth/access_token', {
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: `${landed.origin}${landed.pathname}`,
      code,
    });
    token = body.access_token;
    ok('Got an access token');
  } catch (error) {
    fail(`Meta wouldn't exchange the code: ${error.message}\nCodes expire after a few minutes and work once; open the Login URL again and paste the new address.`);
  }
} else {
  token = input;
}

// ---- 2. figure out which API it works with, and find the account -------------------------
console.log('\nChecking the token…');
let record;

try {
  const me = await get(IG, '/me', { fields: 'user_id,username', access_token: token });
  info(`Instagram API /me: @${me.username} (${me.user_id})`);
  try {
    const media = await get(IG, '/me/media', { fields: 'id', limit: '3', access_token: token });
    ok(`Instagram API: @${me.username}, ${media.data.length} recent post(s) readable`);
    record = { api: 'instagram', username: me.username, igUserId: String(me.user_id ?? '') };
  } catch (error) {
    info(`Instagram API /me/media: ${error.message}`);
  }
} catch (error) {
  info(`Instagram API /me: ${error.message}`);
}
if (!record) info('Trying the Facebook Graph API');

if (!record) {
  const candidates = new Set();
  let expiresAt;

  if (await askAppCredentials({ optional: true })) {
    try {
      const { data } = await get(FB, '/debug_token', { input_token: token, access_token: `${appId}|${appSecret}` });
      info(`Token type: ${data.type ?? 'unknown'}; expires: ${data.expires_at ? new Date(data.expires_at * 1000).toISOString() : 'never'}`);
      info(`Permissions: ${(data.scopes ?? []).join(', ') || 'none listed'}`);
      for (const s of data.granular_scopes ?? []) {
        info(`  ${s.scope}: ${s.target_ids?.length ? `granted for ids ${s.target_ids.join(', ')}` : 'no specific accounts listed'}`);
      }
      if (data.expires_at) expiresAt = new Date(data.expires_at * 1000).toISOString();
      for (const s of data.granular_scopes ?? []) {
        // Instagram account ids may be listed under any granted scope (instagram_* or business_management).
        for (const id of s.target_ids ?? []) candidates.add(String(id));
      }
    } catch (error) {
      info(`Couldn't inspect the token: ${error.message}`);
    }
  }

  try {
    const me = await get(FB, '/me', { fields: 'id,name', access_token: token });
    info(`Token belongs to: ${me.name ?? me.id}`);
  } catch (error) {
    info(`/me failed: ${error.message}`);
  }

  // Other places Meta may expose the granted Instagram account. Each is tried and reported;
  // failures are expected for some of them.
  async function probe(label, path, fields, pick) {
    try {
      const body = await get(FB, path, { fields, access_token: token });
      const ids = pick(body).filter(Boolean).map(String);
      info(`${label}: ${ids.length ? ids.join(', ') : 'nothing'}`);
      ids.forEach((id) => candidates.add(id));
      return body;
    } catch (error) {
      info(`${label}: ${error.message}`);
      return null;
    }
  }
  await probe('Pages with Instagram', '/me/accounts', 'instagram_business_account{id,username}',
    (b) => (b.data ?? []).map((p) => p.instagram_business_account?.id));
  await probe('Assigned Instagram accounts', '/me/assigned_instagram_accounts', 'id,username', (b) => (b.data ?? []).map((a) => a.id));
  await probe('Instagram accounts', '/me/instagram_accounts', 'id,username', (b) => (b.data ?? []).map((a) => a.id));
  const businesses = await probe('Business portfolios', '/me/businesses', 'id,name', () => []);
  for (const biz of businesses?.data ?? []) {
    info(`  portfolio "${biz.name}" (${biz.id})`);
    await probe('    its Instagram accounts', `/${biz.id}/instagram_accounts`, 'id,username', (b) => (b.data ?? []).map((a) => a.id));
    await probe('    its owned Instagram accounts', `/${biz.id}/owned_instagram_accounts`, 'id,username', (b) => (b.data ?? []).map((a) => a.id));
  }

  if (!candidates.size) {
    console.log('\nNo Instagram account found automatically.');
    const manual = await ask('Instagram account ID (the long number, e.g. 1784…; not the @name), or press Enter to stop: ');
    if (manual) candidates.add(manual.replace(/\D/g, ''));
  }
  if (!candidates.size) {
    fail('The token works but no Instagram account was found on it. Send the lines above (they contain no secrets) so the lookup can be fixed.');
  }

  // Try each account on both APIs: "Instagram Login Compatible" configurations may issue
  // tokens that only Instagram's API accepts.
  outer: for (const id of candidates) {
    for (const [api, base] of [['facebook', FB], ['instagram', IG]]) {
      try {
        const account = await get(base, `/${id}`, { fields: 'id,username', access_token: token });
        const media = await get(base, `/${id}/media`, { fields: 'id', limit: '3', access_token: token });
        ok(`${api === 'facebook' ? 'Facebook Graph' : 'Instagram'} API: @${account.username} (id ${id}), ${media.data.length} recent post(s) readable`);
        record = { api, byId: true, username: account.username, igUserId: id, expiresAt };
        break outer;
      } catch (error) {
        info(`Account ${id} via ${api === 'facebook' ? 'Facebook Graph' : 'Instagram'} API: ${error.message}`);
      }
    }
  }
  if (!record) fail('Found the Instagram account but could not read its posts with this token (see messages above).');
}

// ---- 3. save ------------------------------------------------------------------------------
const db = DynamoDBDocumentClient.from(
  new DynamoDBClient(
    prod
      ? { region: 'us-west-2' }
      : { region: 'us-east-1', endpoint: 'http://localhost:4566', credentials: { accessKeyId: 'test', secretAccessKey: 'test' } }
  )
);

await db.send(new PutCommand({
  TableName: 'winery-settings',
  Item: JSON.parse(JSON.stringify({
    id: 'instagram',
    api: record.api,
    byId: record.byId || undefined,
    accessToken: token,
    igUserId: record.igUserId || undefined,
    username: record.username,
    refreshedAt: new Date().toISOString(),
    expiresAt: record.expiresAt,
  })),
}));

console.log(`\nConnected @${record.username} in ${prod ? 'AWS (us-west-2)' : 'LocalStack'}. The Pictures page will show its latest posts within the hour.`);
rl.close();
