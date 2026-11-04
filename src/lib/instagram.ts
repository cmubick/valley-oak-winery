import { unstable_cache } from 'next/cache';
import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodb } from './dynamodb';

// Latest posts from the winery's Instagram (Business/Creator account) via the
// "Instagram API with Instagram Login". The long-lived access token lives in the
// settings table and is renewed here: tokens last 60 days, can be refreshed once
// they're 24h old, and a refresh resets them to 60 days.
//
// Refreshes happen (a) weekly via the EventBridge job in terraform/main.tf, which
// POSTs /api/instagram/refresh, and (b) opportunistically whenever posts are fetched.
// Set the initial token with `npm run instagram-token`.

const TABLE = process.env.DYNAMODB_SETTINGS_TABLE || 'winery-settings';
const KEY = { id: 'instagram' };
const API = process.env.INSTAGRAM_API_BASE || 'https://graph.instagram.com'; // override only for local testing
const DAY = 24 * 60 * 60 * 1000;
const OPPORTUNISTIC_REFRESH_AGE = 7 * DAY;
const MIN_REFRESH_AGE = DAY; // Instagram rejects refreshes of tokens younger than 24h

export interface InstagramPost {
  id: string;
  imageUrl: string;
  permalink: string;
  caption?: string;
  timestamp: string;
}

interface TokenRecord {
  id: 'instagram';
  accessToken: string;
  username?: string;
  refreshedAt: string;
  expiresAt?: string;
  lastError?: string;
  lastErrorAt?: string;
}

export interface InstagramStatus {
  connected: boolean;
  username?: string;
  refreshedAt?: string;
  expiresAt?: string;
  lastError?: string;
  lastErrorAt?: string;
}

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

async function instagramGet(path: string, params: Record<string, string>) {
  const url = `${API}${path}?${new URLSearchParams(params)}`;
  const res = await fetch(url, { cache: 'no-store' });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    // Never include the URL in errors: it carries the access token.
    throw new Error(body.error?.message ?? `HTTP ${res.status} from ${path}`);
  }
  return body;
}

// Refresh the token if it's at least `minAge` old. Returns the (possibly new) record.
async function refreshIfOlderThan(record: TokenRecord, minAge: number): Promise<TokenRecord> {
  const age = Date.now() - new Date(record.refreshedAt).getTime();
  if (age < Math.max(minAge, MIN_REFRESH_AGE)) return record;

  try {
    const body = await instagramGet('/refresh_access_token', {
      grant_type: 'ig_refresh_token',
      access_token: record.accessToken,
    });
    const now = Date.now();
    const updated: TokenRecord = {
      id: 'instagram',
      accessToken: body.access_token,
      username: record.username,
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
  if (!record) throw new Error('Instagram is not connected (run `npm run instagram-token`)');
  record = await refreshIfOlderThan(record, OPPORTUNISTIC_REFRESH_AGE);

  let body;
  try {
    body = await instagramGet('/me/media', {
      fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp',
      // Ask for extra in case some posts have no displayable image (e.g. copyrighted audio).
      limit: String(limit + 6),
      access_token: record.accessToken,
    });
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
  return { connected: true, username, refreshedAt, expiresAt, lastError, lastErrorAt };
}

export async function getInstagramStatus(): Promise<InstagramStatus> {
  return statusOf(await loadToken());
}
