import type { CollectionConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'
import { mediaBeforeValidate } from '../hooks/mediaBeforeValidate'
import { mediaAfterChange } from '../hooks/mediaAfterChange'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: 'media',
  access: { read: () => true },
  hooks: {
    beforeValidate: [mediaBeforeValidate],
    afterChange: [mediaAfterChange],
  },
  upload: {
    staticDir: path.resolve(dirname, '../../media'),
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    imageSizes: [
      {
        name: 'og',
        width: 1200,
        height: 630,
        fit: 'cover',
        position: 'center',
        formatOptions: {
          format: 'jpeg',
          options: { quality: 85 },
        },
      },
      {
        name: 'card',
        width: 400,
        height: 300,
        fit: 'cover',
        position: 'center',
        formatOptions: {
          format: 'webp',
          options: { quality: 72 },
        },
      },
    ],
  },
  fields: [
    { name: 'alt', type: 'text' },
    {
      name: 'purposes',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Đề thi (file đề)',  value: 'exam_content' },
        { label: 'Đáp án',            value: 'exam_answer' },
        { label: 'Giải chi tiết',     value: 'exam_solution' },
        { label: 'Cover bài viết',    value: 'post_cover' },
        { label: 'OG image',          value: 'og_image' },
        { label: 'Thumbnail đề thi',  value: 'exam_thumbnail' },
        { label: 'Cover sự kiện',     value: 'event_cover' },
        { label: 'Cover sách',        value: 'book_cover' },
        { label: 'Khác',              value: 'other' },
      ],
      defaultValue: ['other'],
    },
    {
      name: 'visibility',
      type: 'select',
      options: [
        { label: 'Public CDN', value: 'public' },
        { label: 'Private signed-URL', value: 'private' },
      ],
      defaultValue: 'public',
    },
    {
      name: 'checksum',
      type: 'text',
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'derivedMeta',
      type: 'group',
      admin: { readOnly: true },
      fields: [
        { name: 'pageCount', type: 'number' },
        { name: 'width', type: 'number' },
        { name: 'height', type: 'number' },
        { name: 'avgColor', type: 'text' },
        { name: 'firstPageThumbUrl', type: 'text' },
        { name: 'webpVariants', type: 'json' },
      ],
    },
    {
      name: 'watermarkedAt',
      type: 'date',
      admin: { readOnly: true },
    },
    {
      name: 'watermarkVersion',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true },
    },
  ],
}
