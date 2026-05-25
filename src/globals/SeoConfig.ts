import type { GlobalConfig } from 'payload'

const ogImageField = {
  name: 'ogImage',
  type: 'upload' as const,
  relationTo: 'media' as const,
  filterOptions: { purpose: { equals: 'og_image' } },
}

export const SeoConfig: GlobalConfig = {
  slug: 'seo-config',
  admin: { group: 'Settings' },
  access: {
    read:   () => true,
    update: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    { name: 'siteName',           type: 'text',     defaultValue: 'iStudy' },
    { name: 'twitterHandle',      type: 'text' },
    { name: 'defaultTitle',       type: 'text',     maxLength: 70 },
    { name: 'defaultTitleSuffix', type: 'text',     defaultValue: ' — istudy' },
    { name: 'defaultDescription', type: 'textarea', maxLength: 200 },
    { ...ogImageField, name: 'defaultOgImage' },
    {
      name: 'collectionDefaults',
      type: 'group',
      fields: [
        { name: 'posts',  type: 'group', fields: [ogImageField] },
        { name: 'exams',  type: 'group', fields: [ogImageField] },
        { name: 'events', type: 'group', fields: [ogImageField] },
        { name: 'books',  type: 'group', fields: [ogImageField] },
      ],
    },
  ],
}
