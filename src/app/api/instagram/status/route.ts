import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getInstagramStatus } from '@/lib/instagram';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    return NextResponse.json(await getInstagramStatus());
  } catch (error) {
    console.error('GET /api/instagram/status error:', error);
    return NextResponse.json({ error: 'Failed to read Instagram status' }, { status: 500 });
  }
}
