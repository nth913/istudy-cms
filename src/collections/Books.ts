import type { CollectionConfig, CollectionSlug } from 'payload'
import { booksBeforeValidate } from '../hooks/booksBeforeValidate'
import { booksListEndpoint } from '../endpoints/books-list'
import { booksDetailEndpoint } from '../endpoints/books-detail'
import { bookClickEndpoint } from '../endpoints/book-click'
import { seoGroup } from '../lib/fields/seoGroup'
import { makeMediaPurposeTagger } from '../hooks/media-purpose-tag'

export const Books: CollectionConfig = {
  slug: 'books',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'partner', 'clickCount', '_status', 'updatedAt'],
  },
  versions: {
    drafts: { autosave: true, schedulePublish: true },
    maxPerDoc: 20,
  },
  timestamps: true,
  access: {
    read: () => true,
    create: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'editor',
    update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'editor',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  hooks: {
    beforeValidate: [booksBeforeValidate],
    afterChange: [makeMediaPurposeTagger('cover', 'book_cover')],
  },
  endpoints: [booksListEndpoint, booksDetailEndpoint, bookClickEndpoint],
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 200 },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: { description: 'Auto từ title nếu trống' },
    },
    { name: 'author', type: 'text' },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    { name: 'shortDescription', type: 'textarea', maxLength: 300 },
    { name: 'fullDescription', type: 'richText' },
    { name: 'externalUrl', type: 'text', required: true, admin: { description: 'URL affiliate tới Shopee/Tiki/Fahasa' } },
    {
      name: 'partner',
      type: 'select',
      required: true,
      options: [
        { label: 'Shopee', value: 'shopee' },
        { label: 'Tiki', value: 'tiki' },
        { label: 'Fahasa', value: 'fahasa' },
        { label: 'Tự bán', value: 'self' },
      ],
      defaultValue: 'shopee',
    },
    { name: 'price', type: 'number' },
    { name: 'discountPrice', type: 'number' },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Văn học', value: 'van-hoc' },
        { label: 'Giáo trình', value: 'giao-trinh' },
        { label: 'Tham khảo', value: 'tham-khao' },
        { label: 'Ôn thi', value: 'on-thi' },
        { label: 'Khác', value: 'khac' },
      ],
      defaultValue: 'tham-khao',
    },
    {
      name: 'level',
      type: 'select',
      options: [
        { label: 'Tiểu học', value: 'tieu-hoc' },
        { label: 'THCS', value: 'thcs' },
        { label: 'THPT', value: 'thpt' },
        { label: 'Cao đẳng / Đại học', value: 'cao-dang-dai-hoc' },
        { label: 'Khác', value: 'khac' },
      ],
      defaultValue: 'thpt',
    },
    {
      name: 'relatedExams',
      type: 'relationship',
      relationTo: 'exams' as CollectionSlug,
      hasMany: true,
      maxRows: 6,
    },
    {
      name: 'relatedPosts',
      type: 'relationship',
      relationTo: 'posts' as CollectionSlug,
      hasMany: true,
      maxRows: 6,
    },
    {
      name: 'clickCount',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true },
    },
    {
      name: 'views',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: { readOnly: true, position: 'sidebar' },
      index: true,
    },
    seoGroup,
  ],
}
