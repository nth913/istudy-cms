// src/seed/posts-on-thi-tieng-anh-dai-hoc.ts
// Seed a blog post about strategies for university English entrance exams.
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

const h2 = (text: string): LexNode => ({
  type: 'heading',
  tag: 'h2',
  children: [txt(text)],
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
})

const h3 = (text: string): LexNode => ({
  type: 'heading',
  tag: 'h3',
  children: [txt(text)],
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
})

const ul = (items: string[]): LexNode => ({
  type: 'list',
  listType: 'bullet',
  tag: 'ul',
  children: items.map((t) => ({
    type: 'listitem',
    value: 1,
    checked: undefined,
    indent: 0,
    version: 1,
    direction: 'ltr',
    format: '',
    children: [txt(t)],
  })),
  format: '',
  indent: 0,
  version: 1,
  start: 1,
  direction: 'ltr',
})

const buildBody = (): LexNode => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      // Section 1: Mục đích
      h2('Mục đích của bài thi tiếng Anh đầu vào'),
      para(
        txt(
          'Kỳ thi tiếng Anh đầu vào đại học được thiết kế nhằm đánh giá năng lực ngôn ngữ thực tế của thí sinh — không chỉ đơn thuần là kiểm tra từ vựng hay ngữ pháp, mà còn đo lường khả năng giao tiếp, đọc hiểu và viết luận trong môi trường học thuật. Nhiều trường hiện áp dụng chuẩn quốc tế như CEPT, TOEIC hoặc đề tự ra tương đương để xét tuyển.',
        ),
      ),
      para(
        txt(
          'Kết quả thi tiếng Anh đầu vào không chỉ ảnh hưởng đến việc nhập học mà còn quyết định lộ trình học tập: sinh viên đạt chuẩn sẽ được miễn học phần tiếng Anh cơ bản và học thẳng lên trình độ nâng cao — tiết kiệm đáng kể thời gian và học phí.',
        ),
      ),

      // Section 2: Cấu trúc
      h2('Cấu trúc thường gặp của đề thi'),

      h3('Cấu trúc đề dạng CEPT'),
      para(
        txt(
          'Đề thi CEPT (Comprehensive English Proficiency Test) đánh giá cả 4 kỹ năng: Listening và Reading được thi trong cùng một buổi khoảng 45 phút, tập trung vào khả năng hiểu văn bản học thuật và hội thoại tự nhiên. Phần Writing kéo dài 45 phút với bài luận 250–300 từ theo dạng academic hoặc general. Speaking diễn ra trực tiếp với giám khảo trong 10–15 phút, chia làm 3 phần: giới thiệu bản thân, phát triển chủ đề và thảo luận mở.',
        ),
      ),

      h3('Cấu trúc đề dạng TOEIC'),
      para(
        txt(
          'Đề TOEIC dành cho đầu vào đại học thường gồm 200 câu hỏi trong 120 phút, phân thành 7 part: Part 1–2 là nhận diện hình ảnh và hỏi-đáp ngắn (Listening), Part 3–4 là hội thoại và bài nói độc thoại, Part 5–6 là điền từ và đọc đoạn có lỗ hổng, Part 7 là đọc hiểu văn bản đơn và đa. Kết quả được quy đổi ra thang điểm 10–990 theo chuẩn ETS.',
        ),
      ),

      // Section 3: Cách ôn thi
      h2('Cách ôn thi tiếng Anh đầu vào hiệu quả'),
      para(
        bold('Bước 1: '),
        txt(
          'Xác định dạng đề của trường bạn đăng ký. Kiểm tra website chính thức hoặc liên hệ phòng đào tạo để biết đề thi theo chuẩn nào (CEPT, TOEIC, IELTS tương đương, hay đề riêng). Từ đó, lựa chọn tài liệu và phương pháp luyện tập phù hợp — không luyện lẫn lộn nhiều dạng đề sẽ tiết kiệm thời gian đáng kể.',
        ),
      ),
      para(
        bold('Bước 2: '),
        txt(
          'Xây dựng nền từ vựng và ngữ pháp căn bản trong 4–6 tuần đầu. Tập trung vào 1.200–1.500 từ học thuật thông dụng (Academic Word List), các cấu trúc câu phức hợp và connectors thường xuất hiện trong bài Reading và Writing. Sử dụng flashcard kết hợp với ngữ cảnh thực để ghi nhớ lâu hơn.',
        ),
      ),
      para(
        bold('Bước 3: '),
        txt(
          'Luyện đề mô phỏng trong 2–3 tuần cuối. Làm đề full-time (đúng thời gian quy định), chấm điểm và phân tích từng lỗi sai. Ưu tiên sửa lỗi hệ thống (lỗi lặp lại nhiều lần) hơn lỗi đơn lẻ. Ghi chép "lỗi hay gặp" vào notebook riêng và ôn lại trước ngày thi.',
        ),
      ),

      // Section 4: Chiến lược làm bài
      h2('Chiến lược làm bài đạt điểm cao'),
      ul([
        'Đọc lướt câu hỏi trước khi đọc bài: tiết kiệm 30–40% thời gian phần Reading vì biết cần tìm thông tin gì.',
        'Không để trống ô trả lời: với đề trắc nghiệm không trừ điểm, luôn chọn đáp án dù chưa chắc chắn — xác suất đúng 25% vẫn tốt hơn 0%.',
        'Nghe Listening tập trung vào từ khóa số, tên riêng và thì động từ — đây là điểm phân biệt đáp án đúng/sai phổ biến nhất.',
        'Writing: dành 5 phút lập dàn ý trước khi viết; kết cấu rõ ràng (mở bài → 2 luận điểm → kết bài) được giám khảo đánh giá cao hơn văn phong hoa mỹ nhưng thiếu mạch lạc.',
        'Speaking: nói tự nhiên, tránh học thuộc lòng; giám khảo chấm khả năng giao tiếp thực tế, không chấm trình diễn.',
        'Quản lý thời gian: đặt mốc thời gian cho từng part, nếu mắc kẹt quá 90 giây một câu thì bỏ qua và quay lại sau.',
      ]),

      // Section 5: Xem thêm
      h2('Xem thêm'),
      para(linkNode('/de-chinh-thuc-vao-10-2026', 'Xem đề vào 10 →')),
    ],
  },
})

export async function seedOnThiTiengAnhDaiHoc(payload: Payload): Promise<void> {
  const slug = 'on-thi-tieng-anh-dai-hoc'

  const existing = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    console.log(`✓ OnThiTiengAnhDaiHoc post already exists (slug=${slug}), skipping`)
    return
  }

  const excerpt =
    'Hiểu rõ cấu trúc đề CEPT & TOEIC, xây lộ trình ôn luyện 3 bước và nắm chiến lược làm bài giúp bạn tự tin vượt qua kỳ thi tiếng Anh đầu vào đại học.'

  const data = {
    title: 'Chiến lược ôn thi tiếng Anh đầu vào đại học đạt điểm cao',
    slug,
    excerpt,
    body: buildBody(),
    category: 'meo' as const,
    publishedAt: new Date('2026-06-06').toISOString(),
    isFeatured: false,
    tags: ['ôn thi', 'tiếng Anh đại học', 'CEPT', 'TOEIC', 'chiến lược làm bài', 'đầu vào đại học'],
    seo: {
      title: 'Chiến lược ôn thi tiếng Anh đầu vào đại học đạt điểm cao | iStudy',
      description: excerpt,
      focusKeyword: 'ôn thi tiếng Anh đầu vào đại học',
    },
    _status: 'published',
  }

  const created = await payload.create({
    collection: 'posts',
    data: data as never,
  })

  console.log(`✓ Created OnThiTiengAnhDaiHoc post id=${created.id} slug=${slug}`)
}
