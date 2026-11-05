import { unstable_cache } from 'next/cache';
import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodb } from './dynamodb';

// Latest posts from the winery's Instagram Business account, for the Pictures page.
//
// The access token lives in the settings table (id = "instagram"), saved by
// `npm run instagram-connect`. Two kinds of token are supported, depending on how Meta
// issued it (newer Meta apps can only get the second kind):
//
//   api: "instagram"  Instagram API with Instagram Login. Read via graph.instagram.com/me/media.
//                     Expires after 60 days unless refreshed; refreshed here once it's a week
//                     old, and weekly by the EventBridge job (terraform/main.tf).
//   api: "facebook"   System-user token from Meta's "Unified login" (Facebook Login for
//                     Business). Read via graph.facebook.com/{igUserId}/media. Never expires,
//                     so no refresh.

const TABLE = process.env.DYNAMODB_SETTINGS_TABLE || 'winery-settings';
const KEY = { id: 'instagram' };
// Overrides exist only for local testing against a mock server.
const INSTAGRAM_API = process.env.INSTAGRAM_API_BASE || 'https://graph.instagram.com';
const FACEBOOK_API = process.env.FACEBOOK_API_BASE || 'https://graph.facebook.com';
const DAY = 24 * 60 * 60 * 1000;
const OPPORTUNISTIC_REFRESH_AGE = 7 * DAY;
const MIN_REFRESH_AGE = DAY; // Instagram rejects refreshes of tokens younger than 24h
const MEDIA_FIELDS = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';

export interface InstagramPost {
  id: string;
  imageUrl: string;
  permalink: string;
  caption?: string;
  timestamp: string;
}

interface TokenRecord {
  id: 'instagram';
  api?: 'instagram' | 'facebook'; // missing = "instagram" (records saved before this field existed)
  accessToken: string;
  igUserId?: string; // required for api "facebook" and when byId is set
  byId?: boolean; // read /{igUserId}/media instead of /me/media (tokens from Unified login)
  username?: string;
  refreshedAt: string;
  expiresAt?: string; // missing for tokens that never expire
  lastError?: string;
  lastErrorAt?: string;
}

export interface InstagramStatus {
  connected: boolean;
  api?: 'instagram' | 'facebook';
  username?: string;
  refreshedAt?: string;
  expiresAt?: string;
  lastError?: string;
  lastErrorAt?: string;
}

const apiOf = (record: TokenRecord) => record.api ?? 'instagram';

async function loadToken(): Promise<TokenRecord | null> {
  const { Item } = await dynamodb.send(new GetCommand({ TableName: TABLE, Key: KEY }));
  return (Item as TokenRecord | undefined) ?? null;
}

async function recordError(message: string) {
  console.error('Instagram:', message);
  try {
    await dynamodb.send(new UpdateCommand({
      TableName: TABLE,
      Key: KEY,
      UpdateExpression: 'SET lastError = :e, lastErrorAt = :t',
      ConditionExpression: 'attribute_exists(id)',
      ExpressionAttributeValues: { ':e': message, ':t': new Date().toISOString() },
    }));
  } catch {
    // No token record yet, or the table is unreachable; the console log is enough.
  }
}

async function graphGet(base: string, path: string, params: Record<string, string>) {
  const res = await fetch(`${base}${path}?${new URLSearchParams(params)}`, { cache: 'no-store' });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    // Never include the URL in errors: it carries the access token.
    throw new Error(body.error?.message ?? `HTTP ${res.status} from ${path}`);
  }
  return body;
}

// Refresh an Instagram-API token if it's at least `minAge` old. Returns the (possibly new) record.
async function refreshIfOlderThan(record: TokenRecord, minAge: number): Promise<TokenRecord> {
  // Only tokens from the older Instagram-login setup expire; Unified-login (system-user) tokens don't.
  if (apiOf(record) !== 'instagram' || record.byId) return record;
  const age = Date.now() - new Date(record.refreshedAt).getTime();
  if (age < Math.max(minAge, MIN_REFRESH_AGE)) return record;

  try {
    const body = await graphGet(INSTAGRAM_API, '/refresh_access_token', {
      grant_type: 'ig_refresh_token',
      access_token: record.accessToken,
    });
    const now = Date.now();
    const updated: TokenRecord = {
      ...record,
      accessToken: body.access_token,
      refreshedAt: new Date(now).toISOString(),
      expiresAt: body.expires_in ? new Date(now + body.expires_in * 1000).toISOString() : undefined,
    };
    await dynamodb.send(new PutCommand({ TableName: TABLE, Item: JSON.parse(JSON.stringify(updated)) }));
    return updated;
  } catch (error) {
    await recordError(`Token refresh failed: ${(error as Error).message}`);
    return record; // the current token may still be valid; keep going with it
  }
}

/** Used by the weekly scheduled job. */
export async function refreshInstagramToken(): Promise<InstagramStatus> {
  const record = await loadToken();
  if (!record) return { connected: false };
  const updated = await refreshIfOlderThan(record, MIN_REFRESH_AGE);
  return statusOf(updated);
}

async function fetchLatestPosts(limit: number): Promise<InstagramPost[]> {
  let record = await loadToken();
  if (!record) throw new Error('Instagram is not connected (run `npm run instagram-connect`)');
  record = await refreshIfOlderThan(record, OPPORTUNISTIC_REFRESH_AGE);

  // Ask for extra in case some posts have no displayable image (e.g. copyrighted audio).
  const params = { fields: MEDIA_FIELDS, limit: String(limit + 6), access_token: record.accessToken };
  let body;
  try {
    const base = apiOf(record) === 'facebook' ? FACEBOOK_API : INSTAGRAM_API;
    const path = apiOf(record) === 'facebook' || record.byId ? `/${record.igUserId}/media` : '/me/media';
    body = await graphGet(base, path, params);
  } catch (error) {
    await recordError(`Fetching posts failed: ${(error as Error).message}`);
    throw error;
  }

  if (record.lastError) {
    await dynamodb.send(new UpdateCommand({ TableName: TABLE, Key: KEY, UpdateExpression: 'REMOVE lastError, lastErrorAt' }));
  }

  type Media = { id: string; caption?: string; media_type: string; media_url?: string; thumbnail_url?: string; permalink: string; timestamp: string };
  return (body.data as Media[])
    .map((m) => ({
      id: m.id,
      imageUrl: (m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url) ?? '',
      permalink: m.permalink,
      caption: m.caption,
      timestamp: m.timestamp,
    }))
    .filter((p) => p.imageUrl)
    .slice(0, limit);
}

// Cache successful results for an hour. Errors are thrown, so they aren't cached.
const cachedLatestPosts = unstable_cache(fetchLatestPosts, ['instagram-latest-posts'], { revalidate: 3600 });

/** Latest posts, or null if Instagram isn't reachable (the page shows fallback photos). */
export async function getLatestPosts(limit = 9): Promise<InstagramPost[] | null> {
  try {
    const posts = await cachedLatestPosts(limit);
    return posts.length ? posts : null;
  } catch (error) {
    console.error('Instagram feed unavailable:', (error as Error).message);
    return null;
  }
}

function statusOf(record: TokenRecord | null): InstagramStatus {
  if (!record) return { connected: false };
  const { username, refreshedAt, expiresAt, lastError, lastErrorAt } = record;
  return { connected: true, api: record.byId ? 'facebook' : apiOf(record), username, refreshedAt, expiresAt, lastError, lastErrorAt };
}

export async function getInstagramStatus(): Promise<InstagramStatus> {
  return statusOf(await loadToken());
}
