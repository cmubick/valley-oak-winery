import { NextRequest, NextResponse } from 'next/server';
import { dynamodb } from '@/lib/dynamodb';
import { ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { requireAdmin } from '@/lib/auth';
import { cleanWineInput, normalizeWine, sortWines, wineInputSchema } from '@/lib/wines';

export async function GET() {
  try {
    const result = await dynamodb.send(new ScanCommand({
      TableName: process.env.DYNAMODB_WINES_TABLE,
    }));

    return NextResponse.json(sortWines((result.Items ?? []).map(normalizeWine)));
  } catch (error) {
    console.error('GET /api/wines error:', error);
    return NextResponse.json({ error: 'Failed to fetch wines' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const parsed = wineInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid wine', issues: parsed.error.flatten() }, { status: 400 });
    }

    const now = new Date().toISOString();
    const wine = { id: uuidv4(), ...cleanWineInput(parsed.data), createdAt: now, updatedAt: now };

    await dynamodb.send(new PutCommand({
      TableName: process.env.DYNAMODB_WINES_TABLE,
      Item: wine,
    }));

    return NextResponse.json(wine, { status: 201 });
  } catch (error) {
    console.error('POST /api/wines error:', error);
    return NextResponse.json({ error: 'Failed to create wine' }, { status: 500 });
  }
}
