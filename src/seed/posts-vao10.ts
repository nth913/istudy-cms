// src/seed/posts-vao10.ts
// Seed a blog post introducing the "Đề chính thức vào lớp 10 — 2026" feature.
// IDEMPOTENT: skips if post with target slug already exists.

import type { Payload } from 'payload'

type LexNode = Record<string, unknown>

const txt = (text: string, format = 0): LexNode => ({
  type: 'text',
  text,
  format,
  mode: 'normal',
  style: '',
  detail: 0,
  version: 1,
})

const bold = (text: string) => txt(text, 1)

const para = (...children: LexNode[]): LexNode => ({
  type: 'paragraph',
  children,
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  textFormat: 0,
  textStyle: '',
})

const linkNode = (url: string, linkText: string): LexNode => ({
  type: 'link',
  version: 1,
  direction: 'ltr',
  format: '',
  indent: 0,
  fields: {
    linkType: 'custom',
    url,
    newTab: false,
  },
  children: [txt(linkText)],
})

const buildBody = (): LexNode => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      para(
        bold('Kỳ tuyển sinh vào lớp 10 năm học 2026–2027 '),
        txt(
          'đã chính thức diễn ra tại 34 tỉnh/thành trên cả nước. Môn Tiếng Anh là một trong những môn thi trọng tâm, với đề thi phong phú và độ phủ rộng từ Bắc vào Nam — từ Hà Nội, Hải Phòng đến TP.HCM, Cần Thơ và Cà Mau.',
        ),
      ),
      para(
        txt(
          'iStudy đã tổng hợp đề thi Tiếng Anh chính thức của tất cả 34 tỉnh/thành để học sinh và phụ huynh dễ dàng tra cứu, ôn luyện. Đề thi được cập nhật ngay sau khi kết thúc mỗi buổi thi — đảm bảo độ chính xác và kịp thời.',
        ),
      ),
      para(
        txt(
          'Bên cạnh đề thi, mỗi tỉnh còn kèm đáp án tham khảo và chế độ làm bài online để tự chấm điểm. Truy cập trang dưới để xem toàn bộ đề Tiếng Anh của 34 tỉnh thành:',
        ),
      ),
      para(linkNode('/de-chinh-thuc-vao-10-2026', 'Xem đề chính thức 34 tỉnh thành →')),
    ],
  },
})

export async function seedVao10Post(payload: Payload): Promise<void> {
  const slug = 'de-chinh-thuc-vao-10-2026-tieng-anh'

  const existing = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    console.log(`✓ Vao10 post already exists (slug=${slug}), skipping`)
    return
  }

  const excerpt =
    'Tổng hợp đề thi Tiếng Anh chính thức kỳ tuyển sinh vào lớp 10 năm 2026 của 34 tỉnh/thành trên toàn quốc. Cập nhật nhanh, đầy đủ, dễ tìm kiếm.'

  const data = {
    title: 'Đề chính thức tuyển sinh vào lớp 10 năm 2026 — Tiếng Anh (34 tỉnh thành)',
    slug,
    excerpt,
    body: buildBody(),
    category: 'tin-tuc' as const,
    publishedAt: new Date().toISOString(),
    isFeatured: false,
    seoDescription: excerpt,
    _status: 'published',
  }

  const created = await payload.create({
    collection: 'posts',
    data: data as never,
  })

  console.log(`✓ Created Vao10 post id=${created.id} slug=${slug}`)
}
