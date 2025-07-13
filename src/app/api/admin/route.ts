import { NextResponse } from 'next/server';
import { dynamodb } from '@/lib/dynamodb';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password, role = 'admin' } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await dynamodb.send(new PutCommand({
      TableName: process.env.DYNAMODB_USERS_TABLE,
      Item: {
        email,
        password: hashedPassword,
        role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }));

    return NextResponse.json({ message: 'User created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
