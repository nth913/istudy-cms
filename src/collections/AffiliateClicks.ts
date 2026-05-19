import type { CollectionConfig, CollectionSlug } from 'payload'

export const AffiliateClicks: CollectionConfig = {
  slug: 'affiliate_clicks',
  admin: {
    useAsTitle: 'partner',
    defaultColumns: ['partner', 'book', 'anonId', 'clickedAt'],
    description: 'Tracking 10% sample click affiliate sang Shopee/Tiki/Fahasa',
  },
  timestamps: true,
  access: {
    read: ({ req: { user } }) => user?.role === 'admin',
    create: () => true,
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'book',
      type: 'relationship',
      relationTo: 'books' as CollectionSlug,
      required: true,
      index: true,
    },
    { name: 'anonId', type: 'text', index: true },
    {
      name: 'clickedAt',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
      index: true,
    },
    { name: 'referer', type: 'text' },
    { name: 'ua', type: 'text' },
    { name: 'partner', type: 'text' },
  ],
}
