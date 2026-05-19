import type { CollectionConfig } from 'payload'
import { normalizeSlug } from '../hooks/normalizeSlug'
import { computeSearchKey } from '../hooks/computeSearchKey'
import { searchExamsEndpoint } from '../endpoints/search-exams'
import { distinctSchoolsEndpoint } from '../endpoints/distinct-schools'
import { downloadExamEndpoint } from '../endpoints/download-exam'

const YEAR_OPTIONS = ['2020', '2021', '2022', '2023', '2024', '2025', '2026'].map(y => ({
  label: y, value: y,
}))

export const Exams: CollectionConfig = {
  slug: 'exams',
  versions: { drafts: true, maxPerDoc: 20 },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'examType', 'year', '_status'],
  },
  hooks: {
    beforeValidate: [normalizeSlug],
    beforeChange: [computeSearchKey],
  },
  endpoints: [searchExamsEndpoint, distinctSchoolsEndpoint, downloadExamEndpoint],
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'admin' || user?.role === 'editor' || user?.role === 'reviewer') {
        return true
      }
      return { _status: { equals: 'published' } }
    },
    create: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'editor',
    update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'editor',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    {
      name: 'category', type: 'select', required: true,
      options: [
        { label: 'Vào lớp 10', value: 'vao-10' },
        { label: 'THPT Quốc gia', value: 'vao-dai-hoc' },
      ],
    },
    {
      name: 'examType', type: 'select', required: true,
      options: [
        { label: 'Đề chính thức', value: 'chinh-thuc' },
        { label: 'Đề thi thử', value: 'thi-thu' },
        { label: 'Đề minh hoạ', value: 'minh-hoa' },
      ],
    },
    {
      name: 'year', type: 'select', required: true,
      options: YEAR_OPTIONS,
    },
    {
      name: 'school', type: 'text',
      admin: {
        condition: (data: any) => data?.category === 'vao-10',
        description: 'Tên trường THCS (autocomplete từ giá trị đã có)',
      },
    },
    {
      name: 'province', type: 'relationship', relationTo: 'provinces',
      admin: { condition: (data: any) => data?.category === 'vao-10' },
    },
    {
      name: 'subject', type: 'relationship', relationTo: 'subjects',
      admin: { description: 'Môn học (tuỳ chọn, dùng cho hub /mon-hoc/<slug>)' },
      index: true,
    },
    {
      name: 'assignedReviewer', type: 'relationship', relationTo: 'users',
      admin: {
        description: 'Reviewer được giao kiểm duyệt (admin/editor pick)',
        position: 'sidebar',
      },
      access: {
        read: ({ req: { user } }: any) =>
          Boolean(user && (user.role === 'admin' || user.role === 'editor' || user.role === 'reviewer')),
        update: ({ req: { user } }: any) =>
          Boolean(user && (user.role === 'admin' || user.role === 'editor')),
      },
    },
    {
      name: 'notesForReviewer', type: 'textarea',
      admin: {
        description: 'Ghi chú cho reviewer (chỉ staff nội bộ: admin/editor/reviewer)',
      },
      access: {
        read: ({ req: { user } }: any) =>
          Boolean(user && (user.role === 'admin' || user.role === 'editor' || user.role === 'reviewer')),
        update: ({ req: { user } }: any) =>
          Boolean(user && (user.role === 'admin' || user.role === 'editor')),
      },
    },
    {
      name: 'pdfFile', type: 'upload', relationTo: 'media', required: true,
      admin: { description: 'File đề PDF gốc' },
    },
    {
      name: 'answerFile', type: 'upload', relationTo: 'media',
      admin: { description: 'File đáp án (PDF hoặc image)' },
    },
    {
      name: 'tags', type: 'group',
      fields: [
        {
          name: 'hot', type: 'group',
          fields: [
            { name: 'enabled', type: 'checkbox', defaultValue: false },
            {
              name: 'expiresAt', type: 'date',
              admin: { description: 'Auto-clear hot sau ngày này. Default: 7 ngày sau khi tick enabled.' },
            },
          ],
        },
        { name: 'hay', type: 'checkbox', defaultValue: false },
      ],
    },
    {
      name: 'searchKey', type: 'text', index: true,
      admin: { hidden: true, readOnly: true },
    },
  ],
}
