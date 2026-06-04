// src/globals/Vao10Config.ts
import type { GlobalConfig } from 'payload'

export const Vao10Config: GlobalConfig = {
  slug: 'vao10-2026-config',
  admin: {
    group: 'Cấu hình trang',
    description: 'Overlay dữ liệu cho trang "Đề chính thức vào lớp 10 — 2026". FE hardcode 34 tỉnh; CMS chỉ cung cấp slug đề + thumbnail tùy chỉnh.',
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'editor',
  },
  fields: [
    {
      name: 'items',
      type: 'array',
      maxRows: 40,
      admin: {
        description: 'Mỗi dòng = 1 tỉnh/thành. Seed tự điền 34 tỉnh; editor chỉ cần chọn đề và thumbnail.',
      },
      fields: [
        {
          name: 'provinceName',
          type: 'text',
          required: true,
          admin: {
            description: "Tên tỉnh (không sửa — khớp cấu trúc trang)",
          },
        },
        {
          name: 'exam',
          type: 'relationship',
          relationTo: 'exams',
          admin: {
            description:
              'Chọn đề chính thức của tỉnh này. Bỏ trống → trang hiện "Đang cập nhật ^^".',
          },
        },
        {
          name: 'thumbnail',
          type: 'upload',
          relationTo: 'media',
          filterOptions: { purpose: { equals: 'exam_thumbnail' } },
          admin: {
            description:
              'Thumbnail tùy chỉnh. Bỏ trống → dùng ảnh mặc định của trang.',
          },
        },
      ],
    },
  ],
}
