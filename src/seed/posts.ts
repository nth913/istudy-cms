import type { Payload } from 'payload'

interface SamplePost {
  title: string
  slug: string
  excerpt: string
  category: 'tu-vung' | 'ngu-phap' | 'meo' | 'tin-tuc'
  isFeatured?: boolean
}

const SAMPLES: SamplePost[] = [
  {
    title: '5 mẹo học từ vựng tiếng Anh hiệu quả cho học sinh lớp 9',
    slug: '5-meo-hoc-tu-vung-tieng-anh-hieu-qua',
    excerpt: 'Tổng hợp 5 phương pháp giúp ghi nhớ từ vựng dài hạn, áp dụng được ngay cho học sinh ôn vào 10.',
    category: 'meo',
    isFeatured: true,
  },
  {
    title: 'Cấu trúc đề thi tuyển sinh vào 10 môn Tiếng Anh 2025',
    slug: 'cau-truc-de-thi-vao-10-tieng-anh-2025',
    excerpt: 'Phân tích cấu trúc đề thi mới nhất, các dạng câu hỏi xuất hiện và phân bổ điểm.',
    category: 'tin-tuc',
    isFeatured: true,
  },
  {
    title: 'Ngữ pháp: Thì hiện tại hoàn thành vs quá khứ đơn',
    slug: 'thi-hien-tai-hoan-thanh-vs-qua-khu-don',
    excerpt: 'So sánh chi tiết hai thì cơ bản, dấu hiệu nhận biết và bài tập áp dụng.',
    category: 'ngu-phap',
  },
  {
    title: 'Top 100 từ vựng chủ đề học đường',
    slug: 'top-100-tu-vung-chu-de-hoc-duong',
    excerpt: 'Danh sách từ vựng theo chủ đề trường học kèm phiên âm và ví dụ.',
    category: 'tu-vung',
  },
  {
    title: 'Mẹo làm bài đọc hiểu nhanh và chính xác',
    slug: 'meo-lam-bai-doc-hieu-nhanh-chinh-xac',
    excerpt: 'Kỹ thuật scan + skim, cách loại trừ đáp án sai trong đề thi Tiếng Anh.',
    category: 'meo',
  },
]

export async function seedPosts(payload: Payload) {
  console.log('Seeding Posts...')
  let created = 0
  for (const sample of SAMPLES) {
    const existing = await payload.find({
      collection: 'posts',
      where: { slug: { equals: sample.slug } },
      limit: 1,
    })
    if (existing.docs.length > 0) continue

    await payload.create({
      collection: 'posts',
      data: {
        title: sample.title,
        slug: sample.slug,
        excerpt: sample.excerpt,
        category: sample.category,
        isFeatured: sample.isFeatured || false,
        tags: [sample.category],
        publishedAt: new Date().toISOString(),
        _status: 'published',
      } as never,
    })
    created++
  }
  console.log(`✓ Posts: ${created} created (${SAMPLES.length - created} existed)`)
}
