import type { CollectionConfig } from 'payload'
import { eventsBeforeValidate } from '../hooks/eventsBeforeValidate'
import { eventsAfterChange } from '../hooks/eventsAfterChange'
import { eventsActiveEndpoint } from '../endpoints/events-active'
import { eventsDetailEndpoint } from '../endpoints/events-detail'
import { eventPublishDeEndpoint } from '../endpoints/event-publish-de'
import { eventPublishDapAnEndpoint } from '../endpoints/event-publish-dapan'
import { seoGroup } from '../lib/fields/seoGroup'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'submenu', 'startAt', '_status', 'deReady', 'dapAnReady'],
    components: {
      edit: {
        beforeDocumentControls: [
          '/components/admin/EventPublishButtons.tsx#EventPublishButtons',
          '/components/admin/EventPinConflictWarning.tsx#EventPinConflictWarning',
        ],
      },
    },
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
  endpoints: [
    eventsActiveEndpoint,
    eventsDetailEndpoint,
    eventPublishDeEndpoint,
    eventPublishDapAnEndpoint,
  ],
  timestamps: true,
  fields: [
    {
      name: 'stateBadge',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '/components/admin/EventStateBadge.tsx#EventStateBadge',
        },
      },
    },
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
      admin: {
        description:
          '[DEPRECATED] Surfaces array — giữ cho backward compat. Logic mới dùng submenu + BE algo (T1 3-state).',
      },
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
    {
      name: 'short',
      type: 'text',
      maxLength: 40,
      admin: { description: 'Tên ngắn cho slot hẹp (mega-menu, chips). Default = title.' },
    },
    {
      name: 'heroEyebrow',
      type: 'text',
      maxLength: 30,
      defaultValue: 'Sự kiện sắp diễn ra',
      admin: {
        description:
          'Caption in hoa phía trên title hero card (vd "Mùa thi 2026", "Tuyển sinh Hà Nội")',
      },
    },
    {
      name: 'examEndTime',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        description:
          'Giờ kỳ thi chính thức kết thúc (vd 09:30 sáng 27/06). Nhập tay. Required khi kind=live-exam.',
      },
      validate: (value: any, { data }: any) => {
        if (data?.kind === 'live-exam' && !value) {
          return 'Phải nhập giờ kỳ thi kết thúc cho live-exam'
        }
        return true
      },
    },
    {
      name: 'submenu',
      type: 'select',
      required: true,
      options: [
        { label: 'Vào lớp 10', value: 'vao-10' },
        { label: 'THPT QG', value: 'thpt-qg' },
        { label: 'ĐGNL', value: 'dgnl' },
        { label: 'Đề quốc tế', value: 'quoc-te-de' },
        { label: 'Thi thử vào 10', value: 'vao-10-thu' },
        { label: 'Thi thử THPT QG', value: 'thpt-qg-thu' },
        { label: 'Thi thử ĐGNL', value: 'dgnl-thu' },
        { label: 'Thi thử quốc tế', value: 'quoc-te-thu' },
        { label: 'Khoá THCS', value: 'thcs' },
        { label: 'Khoá THPT', value: 'thpt' },
        { label: 'Khoá quốc tế', value: 'quoc-te' },
        { label: 'Khoá giao tiếp', value: 'giao-tiep' },
        { label: 'NP cơ bản', value: 'np-co-ban' },
        { label: 'NP nâng cao', value: 'np-nang-cao' },
        { label: 'Từ vựng', value: 'tu-vung' },
        { label: 'Phát âm', value: 'phat-am' },
        { label: 'SGK', value: 'sgk' },
        { label: 'Bài giảng', value: 'bai-giang' },
        { label: 'Sách', value: 'sach' },
        { label: 'Công cụ', value: 'cong-cu' },
      ],
      admin: { description: 'Submenu mega-menu mặc định gắn với event' },
    },
    {
      name: 'deReady',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Đề đã đăng. Khi true → state "de" (banner "Đề đã lên").' },
    },
    {
      name: 'dapAnReady',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Đáp án đã có. Khi true → state "dap-an". Ưu tiên cao hơn deReady. Auto-tick deReady.',
      },
    },
    {
      name: 'dePostedAt',
      type: 'date',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Auto-set khi deReady chuyển 0→1',
      },
    },
    {
      name: 'dapAnPostedAt',
      type: 'date',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Auto-set khi dapAnReady chuyển 0→1',
      },
    },
    {
      name: 'examRef',
      type: 'relationship',
      relationTo: 'exams',
      hasMany: false,
      admin: { description: 'Đề thi tương ứng — auto-derive examUrl/answerUrl' },
    },
    {
      name: 'priority',
      type: 'number',
      defaultValue: 50,
      min: 1,
      max: 99,
      admin: {
        position: 'sidebar',
        description: 'BE-internal: 1 = ưu tiên cao nhất. KHÔNG trả về FE.',
      },
    },
    {
      name: 'leadDays',
      type: 'number',
      defaultValue: 14,
      min: 0,
      max: 365,
      admin: {
        position: 'sidebar',
        description: 'BE-internal: số ngày trước "date" mà event active. KHÔNG trả về FE.',
      },
    },
    {
      name: 'subject',
      type: 'text',
      defaultValue: 'Tiếng Anh',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Multi-subject tương lai. Hiện cứng "Tiếng Anh".',
      },
    },
    {
      name: 'manualPin',
      type: 'group',
      admin: {
        position: 'sidebar',
        description: 'Force pin event vào slot cụ thể (override BE algo)',
      },
      fields: [
        { name: 'hero', type: 'checkbox', defaultValue: false },
        { name: 'popup', type: 'checkbox', defaultValue: false },
      ],
    },
    {
      name: 'views',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: { readOnly: true, position: 'sidebar' },
      index: true,
    },
    seoGroup,
  ],
}
