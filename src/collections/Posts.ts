import type { CollectionConfig, CollectionSlug } from 'payload'
import { postsBeforeValidate } from '../hooks/postsBeforeValidate'
import { postsAfterChange } from '../hooks/postsAfterChange'
import { postsListEndpoint } from '../endpoints/posts-list'
import { postsDetailEndpoint } from '../endpoints/posts-detail'
import { postsFeaturedEndpoint } from '../endpoints/posts-featured'
import { seoGroup } from '../lib/fields/seoGroup'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', '_status', 'publishedAt', 'updatedAt'],
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
    beforeValidate: [postsBeforeValidate],
    afterChange: [postsAfterChange],
  },
  endpoints: [postsListEndpoint, postsDetailEndpoint, postsFeaturedEndpoint],
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 200 },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: { description: 'Auto từ title nếu trống' },
    },
    { name: 'excerpt', type: 'textarea', maxLength: 300 },
    { name: 'body', type: 'richText' },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    { name: 'author', type: 'relationship', relationTo: 'users' },
    { name: 'tags', type: 'text', hasMany: true },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Từ vựng', value: 'tu-vung' },
        { label: 'Ngữ pháp', value: 'ngu-phap' },
        { label: 'Mẹo', value: 'meo' },
        { label: 'Tin tức', value: 'tin-tuc' },
      ],
    },
    { name: 'publishedAt', type: 'date' },
    { name: 'isFeatured', type: 'checkbox', defaultValue: false },
    {
      name: 'viewCount',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true },
    },
    {
      name: 'likeCount',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true },
    },
    {
      name: 'relatedPosts',
      type: 'relationship',
      relationTo: 'posts' as CollectionSlug,
      hasMany: true,
      maxRows: 6,
    },
    {
      name: 'relatedExams',
      type: 'relationship',
      relationTo: 'exams',
      hasMany: true,
      maxRows: 6,
    },
    seoGroup,
  ],
}
