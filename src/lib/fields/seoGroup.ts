import type { NamedGroupField } from 'payload'

export const seoGroup: NamedGroupField = {
  name: 'seo',
  type: 'group',
  admin: {
    description: 'SEO + Open Graph. Để trống = dùng fallback collection/global.',
  },
  fields: [
    { name: 'title',         type: 'text',     maxLength: 70 },
    { name: 'description',   type: 'textarea', maxLength: 200 },
    {
      name: 'ogImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Tỉ lệ 1200×630 khuyến nghị.' },
    },
    { name: 'ogTitle',       type: 'text',     maxLength: 95  },
    { name: 'ogDescription', type: 'textarea', maxLength: 200 },
  ],
}
