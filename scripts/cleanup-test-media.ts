import { getPayload } from 'payload'
import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import payloadConfig from '../src/payload.config'

const s3 = new S3Client({
  region: process.env.S3_REGION!,
  endpoint: process.env.S3_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
})

async function main() {
  const bucket = process.env.S3_BUCKET_PUBLIC!
  console.log(`Cleanup test data in DB + bucket ${bucket}...`)

  const payload = await getPayload({ config: payloadConfig })

  const found = await payload.find({
    collection: 'media',
    where: { filename: { contains: 'smoke-test-' } },
    limit: 100,
  })
  console.log(`Found ${found.docs.length} test media doc(s) in DB`)

  for (const doc of found.docs) {
    await payload.delete({ collection: 'media', id: doc.id })
    console.log(`  Deleted DB doc ${doc.id} (${doc.filename})`)
  }

  const list = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: 'smoke-test-' }))
  for (const obj of list.Contents ?? []) {
    if (!obj.Key) continue
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: obj.Key }))
    console.log(`  Deleted R2 object ${obj.Key}`)
  }

  const verify = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: 'smoke-test-' }))
  console.log(`Verify: ${verify.Contents?.length ?? 0} smoke-test-* object(s) remain in bucket`)

  process.exit(0)
}

main().catch((e) => {
  console.error('FATAL:', e)
  process.exit(1)
})
