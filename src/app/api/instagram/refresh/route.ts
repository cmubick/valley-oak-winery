import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { refreshInstagramToken } from '@/lib/instagram';

// Called weekly by EventBridge (terraform/main.tf) to keep the Instagram token alive.
// Authenticated with a shared secret header rather than an admin session.
function authorized(request: NextRequest) {
  const expected = process.env.INSTAGRAM_REFRESH_SECRET;
  const given = request.headers.get('x-refresh-secret');
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const status = await refreshInstagramToken();
    return NextResponse.json({ connected: status.connected, refreshedAt: status.refreshedAt, lastError: status.lastError });
  } catch (error) {
    console.error('POST /api/instagram/refresh error:', error);
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}
