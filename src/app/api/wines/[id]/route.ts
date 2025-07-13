import { NextRequest, NextResponse } from 'next/server';
import { dynamodb } from '@/lib/dynamodb';
import { GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await dynamodb.send(new GetCommand({
      TableName: process.env.DYNAMODB_WINES_TABLE,
      Key: { id },
    }));

    if (!result.Item) {
      return NextResponse.json({ error: 'Wine not found' }, { status: 404 });
    }

    return NextResponse.json(result.Item);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch wine' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log("body:", body);
    
    const result = await dynamodb.send(new UpdateCommand({
      TableName: process.env.DYNAMODB_WINES_TABLE,
      Key: { id },
      UpdateExpression: 'SET #name = :name, vintage = :vintage, varietal = :varietal, region = :region, price = :price, description = :description, tastingNotes = :tastingNotes, inStock = :inStock, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#name': 'name',
      },
      ExpressionAttributeValues: {
        ':name': body.name,
        ':vintage': body.vintage,
        ':varietal': body.varietal,
        ':region': body.region,
        ':price': body.price,
        ':description': body.description,
        ':tastingNotes': body.tastingNotes,
        ':inStock': body.inStock,
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    }));

    return NextResponse.json(result.Attributes);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update wine' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
