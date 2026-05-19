import type { CollectionConfig } from 'payload'

export const Interactions: CollectionConfig = {
  slug: 'interactions',
  admin: {
    useAsTitle: 'anonId',
    defaultColumns: ['anonId', 'refType', 'refId', 'kind', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => Boolean(user && user.role === 'admin'),
    create: () => true,
    update: () => false,
    delete: () => true,
  },
  indexes: [
    { fields: ['anonId', 'refType', 'refId', 'kind'], unique: true },
    { fields: ['refType', 'refId', 'kind'] },
  ],
  timestamps: true,
  fields: [
    { name: 'anonId', type: 'text', required: true, index: true },
    {
      name: 'refType',
      type: 'select',
      required: true,
      options: [
        { label: 'Post', value: 'post' },
        { label: 'Exam', value: 'exam' },
      ],
    },
    { name: 'refId', type: 'text', required: true, index: true },
    {
      name: 'kind',
      type: 'select',
      required: true,
      options: [
        { label: 'Like', value: 'like' },
        { label: 'Bookmark', value: 'bookmark' },
      ],
    },
  ],
}
