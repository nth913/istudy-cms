import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const { getPayload } = await import('payload')
const { default: config } = await import('../../src/payload.config')

type LexNode = Record<string, unknown>

const FMT_BOLD = 1
const FMT_ITALIC = 2

const txt = (text: string, format = 0): LexNode => ({
  type: 'text',
  text,
  format,
  mode: 'normal',
  style: '',
  detail: 0,
  version: 1,
})

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

const h = (tag: 'h2' | 'h3', ...children: LexNode[]): LexNode => ({
  type: 'heading',
  tag,
  children,
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
})

const ol = (items: LexNode[][]): LexNode => ({
  type: 'list',
  listType: 'number',
  start: 1,
  tag: 'ol',
  children: items.map((kids, i) => ({
    type: 'listitem',
    value: i + 1,
    children: kids,
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
  })),
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
})

const ul = (items: LexNode[][]): LexNode => ({
  type: 'list',
  listType: 'bullet',
  start: 1,
  tag: 'ul',
  children: items.map((kids, i) => ({
    type: 'listitem',
    value: i + 1,
    children: kids,
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
  })),
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
})

const quote = (...children: LexNode[]): LexNode => ({
  type: 'quote',
  children,
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
})

const bold = (text: string) => txt(text, FMT_BOLD)
const italic = (text: string) => txt(text, FMT_ITALIC)

// Build the article body matching docx content for "Thì tương lai tiếp diễn".
const buildBody = (): LexNode => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      para(
        txt(
          'Thì tương lai tiếp diễn là cấu trúc hay và thường được sử dụng trong tiếng Anh. Hãy cùng istudy tìm hiểu thì tương lai tiếp diễn là gì, cách dùng và cấu trúc của nó nhé!',
        ),
      ),
      para(bold('Kiến thức bạn sẽ học được qua bài viết:')),
      ul([
        [txt('Định nghĩa thì tương lai tiếp diễn là gì?')],
        [txt('Cách dùng và các cấu trúc thường gặp')],
        [txt('Các trạng từ phổ biến')],
        [txt('Bài tập áp dụng có đáp án')],
      ]),

      h('h2', txt('1. Thì tương lai tiếp diễn là gì?')),
      para(
        txt(
          'Thì tương lai tiếp diễn (Future Continuous) là thì được dùng để mô tả các hành động sẽ xảy ra trong tương lai với một thời điểm cụ thể.',
        ),
      ),
      quote(
        para(
          bold('Ví dụ: '),
          italic('At this time tomorrow, we will be doing homework.'),
          txt(' (Vào tầm này ngày mai, chúng tôi sẽ đang làm bài tập về nhà.)'),
        ),
      ),

      h('h2', txt('2. Cách dùng và cấu trúc')),
      h('h3', txt('a. Cách dùng')),
      ol([
        [
          bold('Diễn tả hành động đang diễn ra tại một thời điểm xác định trong tương lai.'),
        ],
        [
          bold(
            'Diễn tả một hành động đang xảy ra thì hành động khác xen vào trong tương lai.',
          ),
        ],
        [
          bold('Diễn tả hành động sẽ kéo dài liên tục suốt một khoảng thời gian ở tương lai.'),
        ],
      ]),
      quote(
        para(
          italic('She will be having a meeting at this time tomorrow.'),
          txt(' (Cô ấy sẽ có một cuộc họp vào thời điểm này ngày mai.)'),
        ),
        para(
          italic(
            'When we come to the show tonight, she will be performing on the stage.',
          ),
          txt(' (Khi chúng tôi đến buổi biểu diễn tối nay, cô ấy sẽ biểu diễn trên sân khấu.)'),
        ),
        para(
          italic('I will be going on a vacation for the next 2 days.'),
          txt(' (Tôi sẽ đi nghỉ trong 2 ngày tới.)'),
        ),
      ),

      h('h3', txt('b. Cấu trúc')),
      para(bold('Khẳng định:'), txt(' S + will be + V-ing + O')),
      quote(
        para(italic('I will be doing the housework.'), txt(' — Tôi sẽ đang làm việc nhà.')),
        para(
          italic('She will be cooking when you come.'),
          txt(' — Cô ấy sẽ đang nấu ăn khi bạn đến.'),
        ),
      ),
      para(bold('Phủ định:'), txt(' S + won’t be + V-ing + O')),
      quote(
        para(
          italic('I will not be doing the housework.'),
          txt(' — Tôi sẽ đang không làm việc nhà.'),
        ),
        para(
          italic('She will not be cooking when you come.'),
          txt(' — Cô ấy sẽ đang không nấu ăn khi bạn đến.'),
        ),
      ),
      para(bold('Nghi vấn:'), txt(' Will + S + be + V-ing + O ?')),
      quote(
        para(italic('Will you be doing the housework?'), txt(' — Bạn sẽ đang làm việc nhà không?')),
        para(
          italic('Will she be cooking when you come?'),
          txt(' — Cô ấy sẽ đang nấu ăn khi bạn đến không?'),
        ),
      ),
      para(bold('Lưu ý: '), txt('có thể thay "will" bằng "shall" với chủ ngữ I, we.')),

      h('h3', txt('c. Các trạng từ thường dùng')),
      ul([
        [txt('At this time tomorrow')],
        [txt('At + thời gian + tomorrow')],
        [txt('At + thời gian + mốc thời gian tương lai (next week / month / year…)')],
        [txt('For the next + thời gian')],
      ]),

      h('h2', txt('3. Bài tập áp dụng')),
      h('h3', txt('Exercise 1. Chia động từ trong ngoặc')),
      ol([
        [txt('They are staying at a hotel in Paris. At this time next week, they (travel) in New York.')],
        [txt('My grandparents (visit) Asia at this time next month.')],
        [txt('Dory (sit) on the bus at 11 am tomorrow.')],
        [txt('At 7 o’clock this morning my friends and I (watch) a famous play at the theatre.')],
        [txt('Gary (play) with his son at 8 o’clock tonight.')],
      ]),
      para(bold('Đáp án:')),
      ol([
        [txt('will be travelling')],
        [txt('will be visiting')],
        [txt('will be sitting')],
        [txt('will be watching')],
        [txt('will be playing')],
      ]),

      h('h3', txt('Exercise 2. Chọn phương án đúng')),
      ol([
        [
          txt('At this time tomorrow, he __________ a new book.'),
          para(txt('A. will read   B. will be reading   C. reads')),
        ],
        [
          txt('Next weekend, we __________ to the beach for a vacation.'),
          para(txt('A. will go   B. will be going   C. go')),
        ],
        [
          txt('At 9 PM tonight, I __________ dinner with my family.'),
          para(txt('A. will have   B. will be having   C. have')),
        ],
        [
          txt('In five years, they __________ their own business.'),
          para(txt('A. will start   B. will be starting   C. start')),
        ],
        [
          txt('By the end of the month, she __________ English for three years.'),
          para(txt('A. will learn   B. will be learning   C. will have learned')),
        ],
      ]),
      para(bold('Đáp án:'), txt(' 1-B, 2-B, 3-B, 4-A, 5-C')),

      h('h2', txt('Kết luận')),
      para(
        txt(
          'Hy vọng kiến thức về thì tương lai tiếp diễn phía trên giúp bạn hiểu cấu trúc, cách dùng và áp dụng giải bài tập hiệu quả. Đừng quên luyện đề trên istudy để nắm chắc thì này nhé!',
        ),
      ),
    ],
  },
})

async function run() {
  const payload = await getPayload({ config })

  const slug = 'thi-tuong-lai-tiep-dien'
  const title = 'Thì tương lai tiếp diễn: Công thức, cách dùng & bài tập có đáp án'
  const excerpt =
    'Tổng hợp đầy đủ thì tương lai tiếp diễn (Future Continuous): định nghĩa, công thức 3 dạng, cách dùng, trạng từ nhận biết kèm 10 câu bài tập có đáp án.'

  const body = buildBody()

  const existing = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const data = {
    title,
    slug,
    excerpt,
    body,
    category: 'ngu-phap' as const,
    tags: ['thi-tuong-lai-tiep-dien', 'ngu-phap', 'future-continuous'],
    publishedAt: new Date().toISOString(),
    isFeatured: true,
    seoTitle: 'Thì tương lai tiếp diễn: Công thức, cách dùng & bài tập',
    seoDescription: excerpt,
    _status: 'published',
  }

  if (existing.docs.length > 0) {
    const id = existing.docs[0].id
    await payload.update({
      collection: 'posts',
      id,
      data: data as never,
    })
    console.log(`✓ Updated existing post id=${id} slug=${slug}`)
  } else {
    const created = await payload.create({
      collection: 'posts',
      data: data as never,
    })
    console.log(`✓ Created post id=${created.id} slug=${slug}`)
  }

  process.exit(0)
}

run().catch((err) => {
  console.error('Import failed:', err)
  process.exit(1)
})
