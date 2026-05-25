import type { CollectionConfig } from 'payload'
import { normalizeSlug } from '../hooks/normalizeSlug'
import { computeSearchKey } from '../hooks/computeSearchKey'
import { examsAfterChange } from '../hooks/examsAfterChange'
import { examsAutoReadyFlags } from '../hooks/examsAutoReadyFlags'
import { searchExamsEndpoint } from '../endpoints/search-exams'
import { distinctSchoolsEndpoint } from '../endpoints/distinct-schools'
import { downloadExamEndpoint } from '../endpoints/download-exam'
import { examsSidebarFacetsEndpoint } from '../endpoints/exams-sidebar-facets'
import { seoGroup } from '../lib/fields/seoGroup'

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
    beforeChange: [examsAutoReadyFlags, computeSearchKey],
    afterChange: [examsAfterChange],
  },
  endpoints: [searchExamsEndpoint, distinctSchoolsEndpoint, downloadExamEndpoint, examsSidebarFacetsEndpoint],
  access: {
    read: () => true,
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
      name: 'pdfFile', type: 'upload', relationTo: 'media',
      admin: { description: 'File đề PDF gốc (required khi publish)' },
      access: {
        read: ({ req: { user }, doc }: any) => {
          if (user?.role === 'admin' || user?.role === 'editor' || user?.role === 'reviewer') return true
          return doc?._status === 'published'
        },
      },
    },
    {
      name: 'answerFile', type: 'upload', relationTo: 'media',
      admin: { description: 'File đáp án (PDF hoặc image)' },
      access: {
        read: ({ req: { user }, doc }: any) => {
          if (user?.role === 'admin' || user?.role === 'editor' || user?.role === 'reviewer') return true
          return doc?._status === 'published'
        },
      },
    },
    {
      name: 'testOnline', type: 'checkbox', defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Cho phép làm bài online. Tick → hiện pill "Làm online" + nút "Làm bài" trên FE.',
      },
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
      name: 'deReady', type: 'checkbox', defaultValue: false,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Đề đã có file PDF. Tự động set từ pdfFile (read-only).',
        readOnly: true,
      },
    },
    {
      name: 'dapAnReady', type: 'checkbox', defaultValue: false,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Đáp án đã có file. Tự động set từ answerFile (read-only).',
        readOnly: true,
      },
    },
    {
      name: 'views', type: 'number', defaultValue: 0, min: 0,
      admin: {
        position: 'sidebar',
        description: 'Lượt xem khởi điểm (seed). Sẽ cộng dồn lượt xem thật sau.',
      },
    },
    {
      name: 'allowDownload',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Cho phép tải PDF/đáp án về máy. Tắt → ẩn các nút Tải trên FE (đề thi + đáp án + mobile CTA).',
      },
    },
    {
      name: 'allowOpenInNewTab',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Cho phép mở PDF trong tab mới (raw URL, KHÔNG có watermark FE). Tắt → ẩn nút "Mở tab mới" trên trang xem đề. Mặc định tắt vì lý do bảo vệ nội dung.',
      },
    },
    {
      name: 'searchKey', type: 'text', index: true,
      admin: { hidden: true, readOnly: true },
    },
    seoGroup,
  ],
}
