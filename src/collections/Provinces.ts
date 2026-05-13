import type { CollectionConfig } from 'payload'

export const Provinces: CollectionConfig = {
  slug: 'provinces',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'slug', 'type'] },
  access: {
    read: () => true,
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Tỉnh', value: 'tinh' },
        { label: 'Thành phố trực thuộc TW', value: 'thanh-pho' },
      ],
    },
  ],
}
