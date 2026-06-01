// istudy-cms/src/globals/SearchConfig.ts
import type { GlobalConfig } from 'payload'

export const SearchConfig: GlobalConfig = {
  slug: 'search-config',
  access: {
    read: () => true,
    update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'editor',
  },
  fields: [
    {
      name: 'popularTags',
      type: 'array',
      maxRows: 12,
      fields: [
        { name: 'id', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
        { name: 'hot', type: 'checkbox', defaultValue: false },
      ],
    },
    {
      name: 'provinces',
      type: 'array',
      maxRows: 20,
      fields: [
        { name: 'name', type: 'text', required: true },
      ],
    },
    {
      name: 'trendingItems',
      type: 'array',
      maxRows: 10,
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'delta', type: 'text' },
      ],
    },
    {
      name: 'maxTagsSuggest', type: 'number', defaultValue: 3, min: 1, max: 8,
      admin: { description: 'Số tag phổ biến tối đa hiện trong popup (desktop). FE tự co trên màn nhỏ.' },
    },
    {
      name: 'maxProvincesSuggest', type: 'number', defaultValue: 3, min: 1, max: 8,
      admin: { description: 'Số tỉnh/thành tối đa hiện trong popup (desktop). FE tự co trên màn nhỏ.' },
    },
  ],
}
