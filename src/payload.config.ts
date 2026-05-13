import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Subjects } from './collections/Subjects'
import { Provinces } from './collections/Provinces'
import { Exams } from './collections/Exams'
import { searchExamsEndpoint } from './endpoints/search-exams'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Subjects, Provinces, Exams],
  cors: [
    'http://localhost:3000',
    'https://aistudy.com.vn',
  ],
  csrf: [
    'http://localhost:3000',
    'https://aistudy.com.vn',
  ],
  cookiePrefix: 'istudy',
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
  }),
  sharp,
  plugins: [
    ...(process.env.S3_ENDPOINT
      ? [s3Storage({
          collections: { media: true },
          bucket: process.env.S3_BUCKET_PUBLIC!,
          config: {
            endpoint: process.env.S3_ENDPOINT,
            region: process.env.S3_REGION,
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY_ID!,
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
            },
          },
        })]
      : []),
  ],
  endpoints: [searchExamsEndpoint],
})
