import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

let cachedClient: S3Client | null = null

function getClient(): S3Client {
  if (cachedClient) return cachedClient
  cachedClient = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'auto',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  })
  return cachedClient
}

export async function uploadToR2(
  key: string,
  buffer: Buffer,
  contentType: string,
  bucket?: string,
): Promise<string> {
  const targetBucket = bucket || process.env.S3_BUCKET_PUBLIC!
  await getClient().send(
    new PutObjectCommand({
      Bucket: targetBucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  )
  const publicBase = process.env.S3_PUBLIC_URL?.replace(/\/$/, '') || ''
  return `${publicBase}/${key}`
}
