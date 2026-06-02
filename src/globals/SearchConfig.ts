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
      name: 'defaultTags',
      type: 'array',
      maxRows: 12,
      admin: { description: 'Tag mặc định hiện trong popup khi chưa có data thật / timeout.' },
      fields: [
        { name: 'id', type: 'text', required: true },
        { name: 'label', type: 'text', required: true },
        { name: 'hot', type: 'checkbox', defaultValue: false },
      ],
    },
    {
      name: 'defaultProvinces',
      type: 'array',
      maxRows: 20,
      admin: { description: 'Tỉnh/thành mặc định khi chưa có data thật / timeout.' },
      fields: [
        { name: 'name', type: 'text', required: true },
      ],
    },
    {
      name: 'trendingItems',
      type: 'array',
      maxRows: 10,
      admin: { description: 'Trending thật (xu hướng tìm kiếm).' },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'delta', type: 'text' },
      ],
    },
    {
      name: 'defaultTrending',
      type: 'array',
      maxRows: 6,
      admin: { description: 'Trending mặc định khi chưa có data / timeout. Có href → click điều hướng.' },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', admin: { description: 'Đường dẫn (vd /de-thi-chi-tiet/<slug>). Trống = điền vào ô tìm kiếm.' } },
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
    {
      name: 'maxTrendingSuggest', type: 'number', defaultValue: 3, min: 1, max: 8,
      admin: { description: 'Số trending tối đa hiện trong popup (desktop). FE tự co trên màn nhỏ.' },
    },
    {
      name: 'loadingTimeoutMs', type: 'number', defaultValue: 13000, min: 1000, max: 60000,
      admin: { description: 'Chờ data tối đa (mili-giây, 13000 = 13s). Quá hạn → hiện default.' },
    },
  ],
}
