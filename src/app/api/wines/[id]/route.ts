import { NextRequest, NextResponse } from 'next/server';
import { dynamodb } from '@/lib/dynamodb';
import { GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { requireAdmin } from '@/lib/auth';
import { cleanWineInput, normalizeWine, wineInputSchema } from '@/lib/wines';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const result = await dynamodb.send(new GetCommand({
      TableName: process.env.DYNAMODB_WINES_TABLE,
      Key: { id },
    }));

    if (!result.Item) {
      return NextResponse.json({ error: 'Wine not found' }, { status: 404 });
    }

    return NextResponse.json(normalizeWine(result.Item));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch wine' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const parsed = wineInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid wine', issues: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await dynamodb.send(new GetCommand({
      TableName: process.env.DYNAMODB_WINES_TABLE,
      Key: { id },
    }));
    if (!existing.Item) {
      return NextResponse.json({ error: 'Wine not found' }, { status: 404 });
    }

    // Replace the whole item so cleared optional fields (award, vintage, image) are removed
    // and fields from the old schema (varietal, region, tastingNotes) are dropped.
    const wine = {
      id,
      ...cleanWineInput(parsed.data),
      createdAt: existing.Item.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dynamodb.send(new PutCommand({
      TableName: process.env.DYNAMODB_WINES_TABLE,
      Item: wine,
    }));

    return NextResponse.json(wine);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update wine' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    await dynamodb.send(new DeleteCommand({
      TableName: process.env.DYNAMODB_WINES_TABLE,
      Key: { id },
    }));

    return NextResponse.json({ message: 'Wine deleted successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete wine' }, { status: 500 });
  }
}
