// app/api/upload-url/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { awsConfig, isLocal } from '@/lib/dynamodb';
import { requireAdmin } from '@/lib/auth';

const s3Client = new S3Client({ ...awsConfig, forcePathStyle: isLocal });

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { fileName, fileType } = await request.json();

    // Generate unique file name
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `wines/${uuidv4()}.${fileExtension}`;

    // Objects under wines/ are publicly readable via the bucket policy (terraform/main.tf)
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: uniqueFileName,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    const imageUrl = isLocal
      ? `http://localhost:4566/${process.env.S3_BUCKET_NAME}/${uniqueFileName}`
      : `https://${process.env.S3_BUCKET_NAME}.s3.${awsConfig.region}.amazonaws.com/${uniqueFileName}`;

    return NextResponse.json({
      uploadUrl,
      imageUrl,
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
