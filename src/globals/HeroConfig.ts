import type { GlobalConfig } from 'payload'

export const HeroConfig: GlobalConfig = {
  slug: 'hero-config',
  label: 'Cấu hình Hero',
  access: {
    read: () => true,
    update: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'tiltAngle',
      type: 'number',
      label: 'Độ nghiêng thẻ đếm ngược (deg)',
      defaultValue: 1.2,
      min: -15,
      max: 15,
      admin: {
        description: 'Dương = nghiêng phải, âm = nghiêng trái. Khuyên dùng: -5 đến 5. Nhấn Save để áp dụng.',
        step: 0.5,
      },
    },
    {
      name: 'tiltPreview',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/HeroTiltPreview#HeroTiltPreview',
        },
      },
    },
  ],
}
