import type { CollectionConfig } from 'payload'

const isAdmin = ({ req: { user } }: { req: { user?: { role?: string } | null } }) =>
  user?.role === 'admin'

const isAdminOrEditor = ({ req: { user } }: { req: { user?: { role?: string } | null } }) =>
  user?.role === 'admin' || user?.role === 'editor'

export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'status', 'source', 'verifiedAt', 'createdAt'],
  },
  access: {
    read: isAdminOrEditor,
    create: () => true,
    update: isAdmin,
    delete: isAdmin,
  },
  timestamps: true,
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
      hooks: {
        beforeChange: [({ value }) => (typeof value === 'string' ? value.toLowerCase().trim() : value)],
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Verified', value: 'verified' },
        { label: 'Unsubscribed', value: 'unsubscribed' },
      ],
    },
    {
      name: 'verifyToken',
      type: 'text',
      admin: { hidden: true },
    },
    {
      name: 'verifyTokenExpiresAt',
      type: 'date',
      admin: { hidden: true },
    },
    {
      name: 'verifiedAt',
      type: 'date',
    },
    {
      name: 'source',
      type: 'select',
      options: [
        { label: 'Newsletter form', value: 'newsletter' },
        { label: 'Notify exam', value: 'notify-exam' },
        { label: 'Notify event', value: 'notify-event' },
        { label: 'Notify feature', value: 'notify-feature' },
        { label: 'Notify đáp án', value: 'notify-dap-an' },
      ],
    },
    {
      name: 'anonId',
      type: 'text',
      index: true,
    },
    {
      name: 'resendContactId',
      type: 'text',
    },
  ],
}
