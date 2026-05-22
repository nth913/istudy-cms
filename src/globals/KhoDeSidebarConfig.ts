import type { GlobalConfig } from 'payload'

const FILTER_QUERY_REGEX = /^\?[a-z]+=[a-z0-9-,]+(&[a-z]+=[a-z0-9-,]+)*$/

export function validateFilterQuery(value: string): true | string {
  if (typeof value !== 'string' || !FILTER_QUERY_REGEX.test(value)) {
    return 'Phải bắt đầu bằng ? và đúng định dạng ?key=value'
  }
  return true
}

export const KhoDeSidebarConfig: GlobalConfig = {
  slug: 'kho_de_sidebar_config',
  admin: {
    description: 'Cấu hình sidebar filter trang /kho-de-thi (groups + items)',
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'editor',
  },
  fields: [
    {
      name: 'groups',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'items',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true },
            {
              name: 'filterQuery',
              type: 'text',
              required: true,
              admin: { description: 'Vd ?cat=vao-10&province=ha-noi' },
              validate: validateFilterQuery as any,
            },
            {
              name: 'countOverride',
              type: 'number',
              admin: { description: 'Để trống = tự đếm từ DB. Có = override.' },
            },
          ],
        },
      ],
    },
  ],
}
