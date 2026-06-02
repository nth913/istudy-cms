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
      admin: {
        description: 'Tỉ lệ 1200×630 khuyến nghị. Để trống → web tự pick 1 trong 4 ảnh brand iStudy (random theo URL).',
      },
    },
    { name: 'ogTitle',       type: 'text',     maxLength: 95  },
    { name: 'ogDescription', type: 'textarea', maxLength: 200 },
    {
      name: 'noindex',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Ẩn trang này khỏi Google (noindex) và loại khỏi sitemap.' },
    },
    {
      name: 'canonicalUrl',
      type: 'text',
      admin: { description: 'URL gốc nếu nội dung trùng nơi khác. Để trống = tự dùng URL trang này.' },
      validate: (value: string | null | undefined) => {
        if (value === undefined || value === null || value === '') return true
        if (typeof value === 'string' && /^https?:\/\/.+/.test(value)) return true
        return 'Canonical phải là URL đầy đủ (http/https) hoặc để trống'
      },
    },
    {
      name: 'focusKeyword',
      type: 'text',
      admin: { description: 'Từ khóa chính bạn muốn bài này lên top Google.' },
    },
    {
      name: 'panel',
      type: 'ui',
      admin: { components: { Field: '/components/admin/SeoPanel.tsx#SeoPanel' } },
    },
  ],
}
