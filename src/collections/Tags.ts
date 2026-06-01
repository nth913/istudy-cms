import type { CollectionConfig } from 'payload'
import { vietnameseSlugify } from '../lib/vietnamese-slugify'

export const Tags: CollectionConfig = {
  slug: 'tags',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'slug', 'usageCount', 'hot'] },
  access: {
    read: () => true,
    create: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'editor',
    update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'editor',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data
        const src = typeof data.slug === 'string' && data.slug.length > 0 ? data.slug : (data.name ?? '')
        const slug = vietnameseSlugify(String(src))
        if (!slug) throw new Error('Tên tag không hợp lệ')
        data.slug = slug
        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', unique: true, index: true },
    { name: 'hot', type: 'checkbox', defaultValue: false, admin: { description: 'Hiện badge HOT trong popup search' } },
    { name: 'usageCount', type: 'number', defaultValue: 0, index: true, admin: { readOnly: true, description: 'Số đề + bài viết published gắn tag (auto)' } },
    { name: 'popularScore', type: 'number', defaultValue: 0, index: true, admin: { readOnly: true, description: 'usageCount + trọng số views (auto)' } },
  ],
}
