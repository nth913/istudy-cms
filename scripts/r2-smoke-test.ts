import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3'
import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(process.cwd(), '.env.local') })

const env = (k: string) => {
  const v = process.env[k]
  if (!v) throw new Error(`Missing env ${k}`)
  return v
}

const s3 = new S3Client({
  region: env('S3_REGION'),
  endpoint: env('S3_ENDPOINT'),
  credentials: {
    accessKeyId: env('S3_ACCESS_KEY_ID'),
    secretAccessKey: env('S3_SECRET_ACCESS_KEY'),
  },
  forcePathStyle: true,
})

const buckets = [
  env('S3_BUCKET_PUBLIC'),
  env('S3_BUCKET_PRIVATE'),
  env('S3_BUCKET_BACKUPS'),
]

const TEST_KEY = '__smoke-test.txt'
const TEST_BODY = `hello from istudy-cms smoke test @ ${new Date().toISOString()}`

async function main() {
  console.log('Endpoint:', env('S3_ENDPOINT'))
  console.log('Public URL:', env('S3_PUBLIC_URL'))
  console.log('')

  for (const Bucket of buckets) {
    console.log(`--- ${Bucket} ---`)
    try {
      await s3.send(new HeadBucketCommand({ Bucket }))
      console.log('  HeadBucket: OK')
    } catch (e: any) {
      console.log('  HeadBucket: FAIL', e.name, e.message, '— continue Put test')
    }

    try {
      await s3.send(new PutObjectCommand({ Bucket, Key: TEST_KEY, Body: TEST_BODY, ContentType: 'text/plain' }))
      console.log('  Put: OK')
    } catch (e: any) {
      console.log('  Put: FAIL', e.name, e.message)
      continue
    }

    try {
      const r = await s3.send(new GetObjectCommand({ Bucket, Key: TEST_KEY }))
      const body = await r.Body!.transformToString()
      console.log('  Get: OK, body len =', body.length)
    } catch (e: any) {
      console.log('  Get: FAIL', e.name, e.message)
    }

    try {
      await s3.send(new DeleteObjectCommand({ Bucket, Key: TEST_KEY }))
      console.log('  Delete: OK')
    } catch (e: any) {
      console.log('  Delete: FAIL', e.name, e.message)
    }
  }

  // Public URL test
  console.log('')
  console.log('--- Public URL fetch test ---')
  await s3.send(new PutObjectCommand({
    Bucket: env('S3_BUCKET_PUBLIC'),
    Key: TEST_KEY,
    Body: TEST_BODY,
    ContentType: 'text/plain',
  }))
  const publicUrl = `${env('S3_PUBLIC_URL')}/${TEST_KEY}`
  console.log('Fetching', publicUrl)
  const res = await fetch(publicUrl)
  console.log('Status:', res.status)
  if (res.ok) {
    console.log('Body:', (await res.text()).slice(0, 80))
  }
  await s3.send(new DeleteObjectCommand({ Bucket: env('S3_BUCKET_PUBLIC'), Key: TEST_KEY }))
  console.log('Cleanup: OK')
}

main().catch((e) => {
  console.error('FATAL:', e)
  process.exit(1)
})
