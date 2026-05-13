import type { CollectionConfig } from 'payload'

export const Provinces: CollectionConfig = {
  slug: 'provinces',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'slug', 'region', 'code'] },
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
      name: 'region',
      type: 'select',
      required: true,
      options: [
        { label: 'Bắc', value: 'bac' },
        { label: 'Trung', value: 'trung' },
        { label: 'Nam', value: 'nam' },
      ],
    },
    { name: 'code', type: 'number', required: true, unique: true },
  ],
}
