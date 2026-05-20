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
import { Posts } from './collections/Posts'
import { Events } from './collections/Events'
import { Subscribers } from './collections/Subscribers'
import { NotifyIntents } from './collections/NotifyIntents'
import { Interactions } from './collections/Interactions'
import { Books } from './collections/Books'
import { AffiliateClicks } from './collections/AffiliateClicks'

import { notifyEndpoint } from './endpoints/notify'
import { eventsV1Endpoint } from './endpoints/events-v1'
import { newsletterSubscribeEndpoint } from './endpoints/newsletter-subscribe'
import { newsletterVerifyEndpoint } from './endpoints/newsletter-verify'
import { postsLike, examsLike } from './endpoints/like-toggle'
import { postsBookmark, examsBookmark } from './endpoints/bookmark-toggle'
import { meBookmarks } from './endpoints/me-bookmarks'
import {
  provinceHubEndpoint,
  schoolHubEndpoint,
  subjectHubEndpoint,
  yearHubEndpoint,
} from './endpoints/hubs'
import { sitemapDataEndpoint } from './endpoints/sitemap-data'
import { importExamsCsvEndpoint } from './endpoints/import-exams-csv'
import { importExamsBulkPdfEndpoint } from './endpoints/import-exams-bulk-pdf'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Subjects, Provinces, Exams, Posts, Events, Subscribers, NotifyIntents, Interactions, Books, AffiliateClicks],
  endpoints: [
    notifyEndpoint,
    eventsV1Endpoint,
    newsletterSubscribeEndpoint,
    newsletterVerifyEndpoint,
    postsLike,
    examsLike,
    postsBookmark,
    examsBookmark,
    meBookmarks,
    provinceHubEndpoint,
    schoolHubEndpoint,
    subjectHubEndpoint,
    yearHubEndpoint,
    sitemapDataEndpoint,
    importExamsCsvEndpoint,
    importExamsBulkPdfEndpoint,
  ],
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
})
