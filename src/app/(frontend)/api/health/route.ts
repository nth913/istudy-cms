import { NextResponse } from 'next/server'
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3'
import { getPayload } from 'payload'
import config from '@payload-config'

const startedAt = Date.now()

async function checkMongo() {
  const start = Date.now()
  try {
    const payload = await getPayload({ config })
    const db = payload.db.connection.db
    if (!db) throw new Error('mongo connection unavailable')
    await db.admin().ping()
    return { status: 'ok' as const, latencyMs: Date.now() - start }
  } catch (err) {
    return { status: 'fail' as const, error: (err as Error).message }
  }
}

async function checkR2() {
  try {
    const client = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || 'auto',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
    })
    await client.send(new HeadBucketCommand({ Bucket: process.env.S3_BUCKET! }))
    return { status: 'ok' as const }
  } catch (err) {
    return { status: 'fail' as const, error: (err as Error).message }
  }
}

export async function GET() {
  const [mongo, r2] = await Promise.all([checkMongo(), checkR2()])
  const status =
    mongo.status === 'fail' ? 'down' : r2.status === 'fail' ? 'degraded' : 'ok'
  const httpStatus = mongo.status === 'fail' ? 503 : 200
  return NextResponse.json(
    {
      status,
      checks: { mongo, r2 },
      version: process.env.NEXT_PUBLIC_VERSION || 'dev',
      uptime: Math.floor((Date.now() - startedAt) / 1000),
    },
    { status: httpStatus },
  )
}
