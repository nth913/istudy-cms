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

import { KhoDeSidebarConfig } from './globals/KhoDeSidebarConfig'
import { SeoConfig } from './globals/SeoConfig'

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
import { searchExamsGetEndpoint } from './endpoints/search-exams'
import { megaMenuKhoDeEndpoint } from './endpoints/mega-menu-kho-de'
import { trackViewEndpoint } from './endpoints/track-view'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      afterNavLinks: ['/components/SignOutLink#SignOutLink'],
    },
  },
  collections: [Users, Media, Subjects, Provinces, Exams, Posts, Events, Subscribers, NotifyIntents, Interactions, Books, AffiliateClicks],
  globals: [KhoDeSidebarConfig, SeoConfig],
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
    searchExamsGetEndpoint,
    megaMenuKhoDeEndpoint,
    trackViewEndpoint,
  ],
  cors: [
    'https://aistudy.com.vn',
    'https://www.aistudy.com.vn',
    'https://h913.aistudy.com.vn',
    ...(process.env.NODE_ENV !== 'production'
      ? ['http://localhost:3000', 'http://localhost:3001']
      : []),
  ],
  csrf: [
    'http://localhost:3000',
    'http://localhost:3131',
    'https://www.aistudy.com.vn',
    'https://aistudy.com.vn',
    'https://h913.aistudy.com.vn',
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
