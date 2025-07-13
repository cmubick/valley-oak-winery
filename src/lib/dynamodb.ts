import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.NODE_ENV === 'development' ? 'http://localhost:4566' : undefined,
  credentials: process.env.NODE_ENV === 'development' ? {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  } : {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const dynamodb = DynamoDBDocumentClient.from(client);

export interface Wine {
  id: string;
  name: string;
  vintage: number;
  varietal: string;
  region: string;
  price: number;
  description: string;
  tastingNotes: string;
  imageUrl?: string;
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  email: string;
  password: string;
  role: 'admin' | 'staff';
  createdAt: string;
}