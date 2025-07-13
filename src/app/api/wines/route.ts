import { NextRequest, NextResponse } from 'next/server';
import { dynamodb } from '@/lib/dynamodb';
import { ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  try {
    const result = await dynamodb.send(new ScanCommand({
      TableName: process.env.DYNAMODB_WINES_TABLE,
    }));

    return NextResponse.json(result.Items || []);
  } catch (error) {
    console.error('GET /api/wines error:', error);
    return NextResponse.json({ error: 'Failed to fetch wines' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    
    const wine = {
      id: uuidv4(),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

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
