import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Local dev talks to LocalStack (docker-compose.yml). In production (Amplify) the
// SDK's default credential chain picks up the app's IAM compute role.
export const isLocal = process.env.NODE_ENV === 'development';

export const awsConfig = isLocal
  ? {
      region: 'us-east-1',
      endpoint: 'http://localhost:4566',
      credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
    }
  : { region: process.env.AWS_REGION || 'us-west-2' };

const client = new DynamoDBClient(awsConfig);

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