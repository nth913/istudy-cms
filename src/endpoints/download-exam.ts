import type { Endpoint, PayloadRequest } from 'payload'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const TTL_SECONDS = 15 * 60

const getS3Client = () => new S3Client({
  endpoint: process.env.S3_ENDPOINT!,
  region: process.env.S3_REGION || 'auto',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
})

export const downloadExamEndpoint: Endpoint = {
  path: '/:id/download',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    if (!req.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = req.routeParams?.id as string
    const url = new URL(req.url || '', 'http://localhost')
    const type = (url.searchParams.get('type') ?? 'pdf') as 'pdf' | 'answer'

    let exam: any
    try {
      exam = await req.payload.findByID({
        collection: 'exams',
        id,
        depth: 1,
      })
    } catch {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    if (!exam || exam._status !== 'published') {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const media = type === 'answer' ? exam.answerFile : exam.pdfFile
    if (!media?.filename) {
      return Response.json({ error: `${type} file not available` }, { status: 404 })
    }

    const useR2 = !!process.env.S3_ENDPOINT
    if (useR2) {
      const s3 = getS3Client()
      const signedUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({
          Bucket: process.env.S3_BUCKET_PUBLIC!,
          Key: media.filename,
        }),
        { expiresIn: TTL_SECONDS }
      )
      return Response.json({ url: signedUrl, expiresAt: Date.now() + TTL_SECONDS * 1000 })
    }

    return Response.json({
      url: `${process.env.PAYLOAD_PUBLIC_SERVER_URL || ''}/media/${media.filename}`,
      expiresAt: Date.now() + TTL_SECONDS * 1000,
    })
  },
}
