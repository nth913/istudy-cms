import type { CollectionConfig, CollectionSlug } from 'payload'
import { postsBeforeValidate } from '../hooks/postsBeforeValidate'
import { postsAfterChange } from '../hooks/postsAfterChange'
import { computeSearchKeyPost } from '../hooks/computeSearchKeyPost'
import { markSearchDirty } from '../lib/search-index'
import { recomputeTagsAfterChange, recomputeTagsAfterDelete } from '../hooks/recomputeTagsForDoc'
import { postsListEndpoint } from '../endpoints/posts-list'
import { postsDetailEndpoint } from '../endpoints/posts-detail'
import { postsFeaturedEndpoint } from '../endpoints/posts-featured'
import { seoGroup } from '../lib/fields/seoGroup'
import { makeMediaPurposeTagger } from '../hooks/media-purpose-tag'

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
    beforeChange: [computeSearchKeyPost],
    afterChange: [postsAfterChange, markSearchDirty, recomputeTagsAfterChange, makeMediaPurposeTagger('cover', 'post_cover')],
    afterDelete: [markSearchDirty, recomputeTagsAfterDelete],
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
      name: 'topics',
      type: 'relationship',
      relationTo: 'tags' as CollectionSlug,
      hasMany: true,
      admin: {
        description: 'Chủ đề / Tag (gõ để tìm, gõ mới để tạo)',
        components: { Field: '/components/TopicsField#TopicsField' },
      },
    },
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
    {
      name: 'searchKeyPost',
      type: 'text',
      index: true,
      admin: { hidden: true, readOnly: true },
    },
    seoGroup,
  ],
}
