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

const h = (tag: 'h2' | 'h3' | 'h4', ...children: LexNode[]): LexNode => ({
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

const buildBody = (): LexNode => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      // === 1. Khái niệm ===
      h('h2', txt('Thì hiện tại đơn là gì? 🤔')),
      para(
        bold('Thì hiện tại đơn (Simple Present Tense) '),
        txt('dùng để nói về những chuyện '),
        bold('lặp đi lặp lại'),
        txt(' như thói quen, sở thích, một '),
        bold('chân lý'),
        txt(' không bao giờ đổi, hoặc '),
        bold('thời gian biểu — kế hoạch — dự đoán'),
        txt('.'),
      ),
      para(
        txt('Nói cách khác: nếu chuyện đó '),
        italic('"đúng từ hôm qua, đúng hôm nay, vẫn sẽ đúng vào ngày mai"'),
        txt(' → khả năng cao bạn cần dùng thì hiện tại đơn. Đây là thì '),
        bold('nền tảng'),
        txt(' — nắm chắc trước khi đụng tới hiện tại tiếp diễn, hoàn thành hay quá khứ.'),
      ),

      quote(
        para(bold('🔑 VIBE CHECK — Nhớ ngay 5 ý')),
        para(
          bold('1. Dùng khi nào: '),
          txt('thói quen, chân lý, lịch trình, khả năng, cảm xúc — ngắn gọn là chuyện "lặp đi lặp lại" và "hằng số".'),
        ),
        para(
          bold('2. Công thức với V thường: '),
          txt('S + V(s/es) • S + don’t/doesn’t + V • Do/Does + S + V?'),
        ),
        para(
          bold('3. Công thức với to be: '),
          txt('am / is / are — "I → am, he/she/it → is, còn lại → are".'),
        ),
        para(
          bold('4. Dấu hiệu nhận biết: '),
          txt('always, usually, often, sometimes, never, every day… — thấy là đoán ngay "hiện tại đơn".'),
        ),
        para(
          bold('5. Lỗi hay trượt: '),
          txt('quên thêm s/es cho he/she/it và dùng nhầm don’t / doesn’t.'),
        ),
      ),

      // === 2. 5 cách dùng ===
      h('h2', txt('5 cách dùng phổ biến 🎯')),
      para(
        txt('Năm '),
        italic('"use cases"'),
        txt(' bạn sẽ gặp đi gặp lại trong đề thi và đời thường:'),
      ),
      ol([
        [
          bold('📱 Thói quen — việc bạn làm hằng ngày. '),
          italic('I scroll through TikTok every night.'),
          txt(' — Tối nào tôi cũng lướt TikTok.'),
        ],
        [
          bold('🌍 Chân lý — sự thật hiển nhiên. '),
          italic('The Earth moves around the Sun.'),
          txt(' — Trái Đất quay quanh Mặt Trời.'),
        ],
        [
          bold('🚆 Lịch trình — kế hoạch cố định. '),
          italic('The train leaves at 9.00.'),
          txt(' — Tàu khởi hành lúc 9 giờ.'),
        ],
        [
          bold('💪 Khả năng — skill của ai đó. '),
          italic('She can speak English very well.'),
          txt(' — Cô ấy nói tiếng Anh siêu xịn.'),
        ],
        [
          bold('💖 Cảm xúc — tình cảm, nhận thức. '),
          italic('I love bubble tea so much.'),
          txt(' — Tôi cực kỳ mê trà sữa.'),
        ],
      ]),
      quote(
        para(
          bold('⚡ Pro tip — Quy tắc 3 giây: '),
          txt('đọc câu > nếu chuyện '),
          italic('vẫn đúng vào ngày mai'),
          txt(' > chốt: hiện tại đơn ✔️'),
        ),
      ),

      // === 3. Cấu trúc ===
      h('h2', txt('Cấu trúc đầy đủ 🏗️')),
      para(
        txt('Có 3 dạng câu phải nhớ: '),
        bold('khẳng định (+)'),
        txt(', '),
        bold('phủ định (−)'),
        txt(', '),
        bold('nghi vấn (?)'),
        txt('. Mỗi dạng lại chia 2 nhánh: '),
        italic('to be'),
        txt(' và '),
        italic('động từ thường'),
        txt('.'),
      ),

      h('h3', txt('✅ Khẳng định')),
      ul([
        [
          bold('I + am + … '),
          txt('| '),
          bold('I + V(nguyên thể) + … '),
          txt('— '),
          italic('I am a student.'),
          txt(' / '),
          italic('I like ice-cream.'),
        ],
        [
          bold('You / We / They + are + … '),
          txt('| '),
          bold('+ V(nguyên thể) + … '),
          txt('— '),
          italic('They are tall.'),
          txt(' / '),
          italic('We go to the cinema at weekend.'),
        ],
        [
          bold('She / He / It + is + … '),
          txt('| '),
          bold('+ V(s/es) + … '),
          txt('— '),
          italic('She is a nurse.'),
          txt(' / '),
          italic('He gets up at 6 every morning.'),
        ],
      ]),

      h('h3', txt('❌ Phủ định')),
      ul([
        [
          bold('I + am not + … '),
          txt('| '),
          bold('I + don’t + V '),
          txt('— '),
          italic("I'm not an engineer."),
          txt(' / '),
          italic("I don't drink coffee."),
        ],
        [
          bold('You / We / They + aren’t + … '),
          txt('| '),
          bold('+ don’t + V '),
          txt('— '),
          italic("You aren't my classmates."),
          txt(' / '),
          italic("We don't live far away."),
        ],
        [
          bold('She / He / It + isn’t + … '),
          txt('| '),
          bold('+ doesn’t + V '),
          txt('— '),
          italic("It isn't a ruler."),
          txt(' / '),
          italic("She doesn't like him."),
        ],
      ]),

      h('h3', txt('❓ Nghi vấn')),
      ul([
        [
          bold('Am + I + …? '),
          txt('| '),
          bold('Do + I/you/we/they + V? '),
          txt('— '),
          italic('Who am I?'),
          txt(' / '),
          italic('Do you live here?'),
        ],
        [
          bold('Are + you/we/they + …? '),
          txt('| '),
          bold('Do + … + V? '),
          txt('— '),
          italic('Are you a student?'),
          txt(' / '),
          italic('Do they speak Vietnamese?'),
        ],
        [
          bold('Is + she/he/it + …? '),
          txt('| '),
          bold('Does + … + V(nguyên thể)? '),
          txt('— '),
          italic('Is he your boyfriend?'),
          txt(' / '),
          italic('What does he do?'),
        ],
      ]),

      quote(
        para(
          bold('🧠 Mẹo "ghi đè" trong đầu: '),
          txt('sau '),
          italic("don't / doesn't / Do / Does"),
          txt(' → động từ phải về '),
          bold('nguyên thể'),
          txt(' (bare verb), KHÔNG thêm s/es nữa. Ví dụ: '),
          italic('Does she '),
          bold('like'),
          italic(' him?'),
          txt(' (không phải '),
          italic('likes'),
          txt(').'),
        ),
      ),

      // === 4. Quy tắc thêm s/es ===
      h('h2', txt('Quy tắc thêm s/es 📝')),
      para(
        txt('Với chủ ngữ '),
        bold('ngôi 3 số ít'),
        txt(' (he / she / it / tên riêng / 1 danh từ số ít), phải thêm '),
        bold('s'),
        txt(' hoặc '),
        bold('es'),
        txt(' sau động từ:'),
      ),
      ul([
        [
          bold('Kết thúc bằng o, ch, sh, s, x → thêm "-es": '),
          txt('watch → '),
          bold('watches'),
          txt(', kiss → '),
          bold('kisses'),
          txt(', go → '),
          bold('goes'),
        ],
        [
          bold('Phụ âm + y → đổi y → ies: '),
          txt('study → '),
          bold('studies'),
          txt(', fly → '),
          bold('flies'),
          txt(', try → '),
          bold('tries'),
        ],
        [
          bold('Nguyên âm + y → giữ nguyên + s: '),
          txt('play → '),
          bold('plays'),
          txt(', buy → '),
          bold('buys'),
          txt(', enjoy → '),
          bold('enjoys'),
        ],
        [
          bold('Các trường hợp còn lại → thêm "-s": '),
          txt('look → '),
          bold('looks'),
          txt(', visit → '),
          bold('visits'),
          txt(', run → '),
          bold('runs'),
        ],
        [
          bold('Bất quy tắc: '),
          txt('have → '),
          bold('has'),
        ],
      ]),

      // === 5. Phát âm ===
      h('h2', txt('Phát âm đuôi "s/es" 🔊')),
      para(
        txt('Đuôi '),
        italic('-s/-es'),
        txt(' được phát âm thành '),
        bold('3 kiểu'),
        txt(' tuỳ vào âm cuối của động từ gốc — không phải lúc nào cũng đọc là /s/ đâu nha 😉'),
      ),
      ul([
        [
          bold('/iz/ '),
          txt('— khi động từ kết thúc bằng '),
          bold('ch / sh / s / x / z. '),
          txt('Ví dụ: watches '),
          italic('/wɒtʃiz/'),
        ],
        [
          bold('/s/ '),
          txt('— khi động từ kết thúc bằng '),
          bold('k / p / t / f. '),
          txt('Ví dụ: picks '),
          italic('/pɪks/'),
        ],
        [
          bold('/z/ '),
          txt('— các trường hợp còn lại ('),
          bold('b / d / g / nguyên âm'),
          txt('). Ví dụ: runs '),
          italic('/rʌnz/'),
        ],
      ]),

      // === 6. Dấu hiệu nhận biết ===
      h('h2', txt('Dấu hiệu nhận biết 🔍')),
      para(
        txt('Cứ thấy mấy "key words" này trong câu là khả năng cao đáp án nằm ở thì hiện tại đơn:'),
      ),
      ul([
        [bold('always '), txt('— luôn luôn')],
        [bold('usually '), txt('— thường xuyên')],
        [bold('often '), txt('— thường')],
        [bold('sometimes '), txt('— đôi khi')],
        [bold('rarely / seldom '), txt('— hiếm khi')],
        [bold('never '), txt('— không bao giờ')],
        [bold('every day / week '), txt('— mỗi ngày / tuần')],
        [bold('once / twice a week '), txt('— 1 / 2 lần / tuần')],
        [bold('on Mondays '), txt('— vào thứ Hai')],
      ]),
      para(bold('Ví dụ thực tế:')),
      ul([
        [italic('She always wakes up early.'), txt(' — Cô ấy luôn dậy sớm.')],
        [italic('He usually eats breakfast at 7.'), txt(' — Cậu ấy thường ăn sáng lúc 7h.')],
        [italic('I sometimes forget my homework.'), txt(' — Đôi khi tôi quên bài tập.')],
        [italic('They never drink coffee.'), txt(' — Họ không bao giờ uống cà phê.')],
        [italic('My dad exercises every morning.'), txt(' — Bố tôi tập thể dục mỗi sáng.')],
        [italic('We sweep the floor twice a week.'), txt(' — Bọn mình quét nhà 2 lần/tuần.')],
      ]),

      // === 7. Lỗi hay mắc ===
      h('h2', txt('Lỗi hay mắc ⚠️')),
      para(
        txt('Đây là 5 lỗi "kinh điển" mà ai cũng từng dính ít nhất một lần — soi kỹ để né nha:'),
      ),
      ol([
        [
          bold('❌ SAI: '),
          txt('She '),
          italic("don't like"),
          txt(' coffee.  →  '),
          bold('✅ ĐÚNG: '),
          txt('She '),
          italic("doesn't like"),
          txt(' coffee. '),
          bold('👉 Vì sao: '),
          txt('He / She / It đi với '),
          italic("doesn't"),
          txt(', không phải '),
          italic("don't"),
          txt('.'),
        ],
        [
          bold('❌ SAI: '),
          txt('He '),
          italic('go'),
          txt(' to school every day.  →  '),
          bold('✅ ĐÚNG: '),
          txt('He '),
          italic('goes'),
          txt(' to school every day. '),
          bold('👉 Vì sao: '),
          txt('Ngôi 3 số ít phải thêm '),
          italic('s/es'),
          txt(' vào động từ.'),
        ],
        [
          bold('❌ SAI: '),
          txt('They '),
          italic('are go'),
          txt(' to school.  →  '),
          bold('✅ ĐÚNG: '),
          txt('They '),
          italic('go'),
          txt(' to school. '),
          bold('👉 Vì sao: '),
          txt('Không dùng '),
          italic('am / is / are'),
          txt(' chung với động từ thường.'),
        ],
        [
          bold('❌ SAI: '),
          txt('Does she '),
          italic('likes'),
          txt(' him?  →  '),
          bold('✅ ĐÚNG: '),
          txt('Does she '),
          italic('like'),
          txt(' him? '),
          bold('👉 Vì sao: '),
          txt('Sau '),
          italic('does'),
          txt(', động từ luôn về nguyên thể.'),
        ],
        [
          bold('❌ SAI: '),
          txt('The sun '),
          italic('rise'),
          txt(' in the east.  →  '),
          bold('✅ ĐÚNG: '),
          txt('The sun '),
          italic('rises'),
          txt(' in the east. '),
          bold('👉 Vì sao: '),
          txt('Chân lý → hiện tại đơn, và "the sun" là ngôi 3 số ít → cần thêm '),
          italic('s'),
          txt('.'),
        ],
      ]),

      // === 8. Mini Quiz ===
      h('h2', txt('Mini Quiz — Thử sức nào! ✏️')),
      para(
        txt('Điền dạng đúng của động từ trong ngoặc. Làm nhanh trong đầu rồi đối chiếu đáp án bold ngay sau câu nha 👇'),
      ),
      ol([
        [
          txt('She _____ (watch) TV every evening.  →  '),
          bold('watches'),
        ],
        [
          txt('They _____ (not / eat) meat.  →  '),
          bold("don't eat"),
        ],
        [
          txt('_____ he _____ (speak) French?  →  '),
          bold('Does … speak'),
        ],
        [
          txt('The bus _____ (leave) at 7 a.m.  →  '),
          bold('leaves'),
        ],
        [
          txt('I _____ (not / like) waking up early.  →  '),
          bold("don't like"),
        ],
      ]),

      // === 9. Cheat sheet ===
      h('h2', txt('Cheat sheet — In ra dán bàn học 📌')),
      para(bold('Thì hiện tại đơn — bản gói gọn:')),
      ul([
        [
          bold('✅ Khẳng định: '),
          txt('To be → '),
          italic('am / is / are'),
          txt('. Động từ thường → '),
          italic('V'),
          txt(' hoặc '),
          italic('V(s/es)'),
          txt('.'),
        ],
        [
          bold('❌ Phủ định: '),
          txt('To be → '),
          italic("am not / isn't / aren't"),
          txt('. Động từ thường → '),
          italic("don't / doesn't + V"),
          txt('.'),
        ],
        [
          bold('❓ Nghi vấn: '),
          txt('To be → '),
          italic('Am / Is / Are + S ?'),
          txt('. Động từ thường → '),
          italic('Do / Does + S + V ?'),
        ],
      ]),

      quote(
        para(
          bold('🔜 Học tiếp theo: '),
          txt('Thì hiện tại tiếp diễn — khi nào dùng "I am doing" thay vì "I do"?'),
        ),
      ),

      // === 10. Bài tập mở rộng ===
      h('h2', txt('Bài tập mở rộng — Flex level lên 📝')),
      para(
        txt('Quiz ở trên là warm-up rồi, giờ thử thêm vài câu nữa xem mình đã '),
        italic('chốt'),
        txt(' chưa nhé:'),
      ),

      h('h3', txt('📝 Bài 1. Chia động từ trong ngoặc')),
      ol([
        [txt('My father _____ (work) at a hospital.')],
        [txt('They _____ (not / go) to school on Sundays.')],
        [txt('_____ Linh _____ (like) ice cream?')],
        [txt('Water _____ (boil) at 100°C.')],
        [txt('I usually _____ (have) breakfast at 6:30.')],
        [txt('She _____ (study) English every day.')],
        [txt('The shop _____ (open) at 8 a.m. and _____ (close) at 10 p.m.')],
        [txt('My brother and I _____ (not / watch) horror movies.')],
      ]),
      para(bold('Đáp án Bài 1:')),
      ol([
        [italic('works')],
        [italic("don't go")],
        [italic('Does … like')],
        [italic('boils')],
        [italic('have')],
        [italic('studies')],
        [italic('opens … closes')],
        [italic("don't watch")],
      ]),

      h('h3', txt('✍️ Bài 2. Viết lại câu sao cho nghĩa không đổi')),
      ol([
        [txt("I don't have time to call you.  →  I'm _____ _____ to call you.")],
        [txt('He goes to the gym every day.  →  He _____ the gym every day.')],
        [txt('She is a singer.  →  Her _____ is _____.')],
      ]),
      para(bold('Đáp án Bài 2:')),
      ol([
        [italic('too busy')],
        [italic('visits / attends')],
        [italic('job … singing')],
      ]),

      // === Outro ===
      h('h2', txt('Kết luận')),
      para(
        txt(
          'Nắm chắc thì hiện tại đơn là bước nền tảng đầu tiên để xử lý các thì còn lại của tiếng Anh. Hy vọng bài viết giúp bạn vibe-check công thức, cách dùng và lỗi hay mắc nhanh gọn. Đừng quên ',
        ),
        bold('luyện đề trên istudy '),
        txt('để chốt kiến thức này nhé! 🚀'),
      ),
    ],
  },
})

async function run() {
  const payload = await getPayload({ config })

  const slug = 'thi-hien-tai-don'
  const title =
    'Thì hiện tại đơn (Simple Present): Vibe check toàn tập — công thức, cách dùng, quiz đầy đủ'
  const excerpt =
    'Tất tần tật về thì hiện tại đơn — công thức (+/−/?), 5 cách dùng, quy tắc thêm s/es, phát âm đuôi s, dấu hiệu nhận biết, 5 lỗi hay mắc + quiz có đáp án. Vibe Gen Z, kiến thức cũ cũng phải mới.'

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
    tags: [
      'thi-hien-tai-don',
      'simple-present',
      'ngu-phap-co-ban',
      'lop-10',
      'thpt-qg',
      'thi-co-ban',
    ],
    publishedAt: new Date().toISOString(),
    isFeatured: true,
    seoTitle: 'Thì hiện tại đơn (Simple Present): công thức, cách dùng, quiz',
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
