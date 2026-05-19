import type { CollectionConfig } from 'payload'

const isAdminOrEditor = ({ req: { user } }: { req: { user?: { role?: string } | null } }) =>
  user?.role === 'admin' || user?.role === 'editor'

const isAdmin = ({ req: { user } }: { req: { user?: { role?: string } | null } }) =>
  user?.role === 'admin'

export const NotifyIntents: CollectionConfig = {
  slug: 'notify_intents',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['type', 'refSlug', 'email', 'fulfilled', 'createdAt'],
  },
  access: {
    read: isAdminOrEditor,
    create: () => true,
    update: isAdminOrEditor,
    delete: isAdmin,
  },
  indexes: [
    { fields: ['type', 'refSlug', 'email'], unique: true },
    { fields: ['fulfilled'] },
  ],
  timestamps: true,
  fields: [
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Exam release', value: 'exam' },
        { label: 'Đáp án release', value: 'dap-an' },
        { label: 'Feature launch', value: 'feature' },
        { label: 'Event reminder', value: 'event' },
      ],
    },
    { name: 'refSlug', type: 'text', required: true, index: true },
    {
      name: 'email',
      type: 'email',
      required: true,
      hooks: {
        beforeChange: [({ value }) => (typeof value === 'string' ? value.toLowerCase().trim() : value)],
      },
    },
    { name: 'anonId', type: 'text', index: true },
    { name: 'ua', type: 'text' },
    { name: 'referer', type: 'text' },
    { name: 'ip', type: 'text' },
    { name: 'fulfilled', type: 'checkbox', defaultValue: false, index: true },
    { name: 'fulfilledAt', type: 'date' },
  ],
}
