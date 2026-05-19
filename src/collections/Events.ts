import type { CollectionConfig } from 'payload'
import { eventsBeforeValidate } from '../hooks/eventsBeforeValidate'
import { eventsAfterChange } from '../hooks/eventsAfterChange'
import { eventsActiveEndpoint } from '../endpoints/events-active'
import { eventsDetailEndpoint } from '../endpoints/events-detail'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'kind', 'startAt', 'endAt', '_status'],
  },
  versions: {
    drafts: { autosave: true },
    maxPerDoc: 20,
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'editor',
    update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'editor',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  hooks: {
    beforeValidate: [eventsBeforeValidate],
    afterChange: [eventsAfterChange],
  },
  endpoints: [eventsActiveEndpoint, eventsDetailEndpoint],
  timestamps: true,
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', unique: true, index: true },
    {
      name: 'kind',
      type: 'select',
      required: true,
      options: [
        { label: 'Thi thử live', value: 'live-exam' },
        { label: 'Thông báo', value: 'announcement' },
        { label: 'Ra mắt', value: 'launch' },
        { label: 'Khuyến mãi', value: 'promo' },
      ],
    },
    {
      name: 'startAt',
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'endAt',
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    {
      name: 'surfaces',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['header-mega'],
      options: [
        { label: 'Header mega menu', value: 'header-mega' },
        { label: 'Homepage hero', value: 'homepage-hero' },
        { label: 'Trang /cho-de', value: 'cho-de' },
      ],
    },
    {
      name: 'cta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'href', type: 'text' },
      ],
    },
    { name: 'body', type: 'richText' },
    {
      name: 'registeredCount',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true },
    },
  ],
}
