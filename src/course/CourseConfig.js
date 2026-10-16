import { GRADE5_LESSON_TEMPLATES } from '../data/grade5Curriculum.js';

export const FINGER_BY_KEY = Object.freeze({
  q: 'left-pinky', a: 'left-pinky', z: 'left-pinky',
  w: 'left-ring', s: 'left-ring', x: 'left-ring',
  e: 'left-middle', d: 'left-middle', c: 'left-middle',
  r: 'left-index', f: 'left-index', v: 'left-index', t: 'left-index', g: 'left-index', b: 'left-index',
  y: 'right-index', h: 'right-index', n: 'right-index', u: 'right-index', j: 'right-index', m: 'right-index',
  i: 'right-middle', k: 'right-middle',
  o: 'right-ring', l: 'right-ring',
  p: 'right-pinky'
});

export const COURSE_SPEED_OPTIONS = Object.freeze([
  { value: 'slowest', label: 'Chậm nhất · 50 giây', description: '50 giây để hoàn thành một thiên thạch.' },
  { value: 'very-slow', label: 'Rất chậm', description: 'Làm quen bàn phím, có nhiều thời gian quan sát.' },
  { value: 'slow', label: 'Chậm', description: 'Nhịp luyện nhẹ cho người đã quen các phím cơ bản.' },
  { value: 'medium', label: 'Vừa', description: 'Nhịp cân bằng để luyện tập chủ động hơn.' },
  { value: 'fast', label: 'Nhanh', description: 'Dành cho người gõ nhanh, không phải chờ mục tiêu rơi.' },
  { value: 'very-fast', label: 'Rất nhanh', description: 'Dành cho người gõ rất nhanh, mục tiêu rơi dồn nhịp hơn.' }
]);

export const DEFAULT_COURSE_SPEED = 'very-slow';

export function normalizeCourseSpeed(value) {
  return COURSE_SPEED_OPTIONS.some((option) => option.value === value) ? value : DEFAULT_COURSE_SPEED;
}

export const COURSE_STAGES = Object.freeze([
  { id: 'home', title: 'Hàng cơ sở', icon: '01', description: 'Đặt tay đúng vị trí và làm quen các phím trung tâm.' },
  { id: 'top', title: 'Hàng trên', icon: '02', description: 'Vươn ngón lên hàng QWERTY rồi quay về hàng cơ sở.' },
  { id: 'bottom', title: 'Hàng dưới', icon: '03', description: 'Hoàn thành các phím ZXCVBNM bằng nhịp gõ chậm.' },
  { id: 'words', title: 'Ghép từ', icon: '04', description: 'Dùng toàn bộ phím đã học để gõ từ tiếng Anh thật.' }
]);

const lesson = (id, stage, title, newKeys, reviewKeys, options = {}) => ({
  id,
  stage,
  title,
  newKeys,
  reviewKeys,
  targetCount: options.targetCount ?? 20,
  newKeyRatio: options.newKeyRatio ?? 0.55,
  speed: 'very-slow',
  maxTargets: options.maxTargets ?? 1,
  targetType: options.targetType ?? 'patterns',
  minAccuracy: options.minAccuracy ?? 80,
  stars: options.stars ?? [0, 85, 95],
  noDamage: true,
  description: options.description ?? ''
});

export const CORE_LESSON_TEMPLATES = Object.freeze([
  lesson('home-fj', 'home', 'Hai điểm tựa F và J', ['f', 'j'], [], { targetCount: 16, newKeyRatio: 1, description: 'Đặt hai ngón trỏ lên F và J.' }),
  lesson('home-dk', 'home', 'Mở rộng D và K', ['d', 'k'], ['f', 'j'], { targetCount: 20 }),
  lesson('home-sl', 'home', 'Mở rộng S và L', ['s', 'l'], ['f', 'j', 'd', 'k'], { targetCount: 22 }),
  lesson('home-a', 'home', 'Ngón út trái A', ['a'], ['s', 'd', 'f', 'j', 'k', 'l'], { targetCount: 22, newKeyRatio: 0.5 }),
  lesson('home-gh', 'home', 'G và H', ['g', 'h'], ['a', 's', 'd', 'f', 'j', 'k', 'l'], { targetCount: 24, targetType: 'patterns' }),
  lesson('home-review', 'home', 'Ôn hàng cơ sở', [], ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], { targetCount: 26, newKeyRatio: 0, maxTargets: 2 }),
  lesson('top-ru', 'top', 'Vươn lên R và U', ['r', 'u'], ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], { targetCount: 22 }),
  lesson('top-ty', 'top', 'Cặp trung tâm T và Y', ['t', 'y'], ['r', 'u', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], { targetCount: 24 }),
  lesson('top-ei', 'top', 'Ngón giữa E và I', ['e', 'i'], ['r', 'u', 't', 'y', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], { targetCount: 24 }),
  lesson('top-wo', 'top', 'Ngón áp út W và O', ['w', 'o'], ['e', 'i', 'r', 'u', 't', 'y', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], { targetCount: 26, maxTargets: 2 }),
  lesson('top-qp', 'top', 'Hai góc Q và P', ['q', 'p'], ['w', 'o', 'e', 'i', 'r', 'u', 't', 'y', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], { targetCount: 26, maxTargets: 2 }),
  lesson('top-review', 'top', 'Ôn hàng trên và cơ sở', [], ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], { targetCount: 28, newKeyRatio: 0, maxTargets: 2 }),
  lesson('bottom-vm', 'bottom', 'Hàng dưới V và M', ['v', 'm'], ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], { targetCount: 24 }),
  lesson('bottom-bn', 'bottom', 'Trung tâm B và N', ['b', 'n'], ['v', 'm', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], { targetCount: 26 }),
  lesson('bottom-cx', 'bottom', 'C và X', ['c', 'x'], ['v', 'm', 'b', 'n', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], { targetCount: 26, maxTargets: 2 }),
  lesson('bottom-z', 'bottom', 'Phím cuối Z', ['z'], ['x', 'c', 'v', 'b', 'n', 'm', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], { targetCount: 26, newKeyRatio: 0.35, maxTargets: 2 }),
  lesson('words-az', 'words', 'Từ vựng A đến Z', [], ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'], { targetCount: 30, newKeyRatio: 0, targetType: 'words', maxTargets: 2, minAccuracy: 88, description: 'Gõ các từ tiếng Anh ngắn bằng toàn bộ bàn phím đã học.' })
]);

export const KEYBOARD_ROWS = Object.freeze([
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm']
]);

export function getLessonTemplate(id, uiLanguage = 'vi') {
  const template = CORE_LESSON_TEMPLATES.find((item) => item.id === id) || CORE_LESSON_TEMPLATES[0];
  return localizeTemplate(template, 'en', uiLanguage);
}

const conceptLesson = (id, title, topic, level = 'easy', options = {}) => ({
  id,
  stage: options.stage || 'words',
  title,
  topic,
  level,
  newKeys: [],
  reviewKeys: [],
  targetCount: options.targetCount ?? 16,
  speed: 'very-slow',
  maxTargets: options.maxTargets ?? 2,
  targetType: 'concepts',
  minAccuracy: options.minAccuracy ?? 80,
  stars: options.stars ?? [0, 85, 95],
  noDamage: true,
  description: options.description || `Luyện từ vựng chủ đề ${title.toLocaleLowerCase('vi')}.`
});

export const CONCEPT_LESSON_TEMPLATES = Object.freeze([
  conceptLesson('concept-family', 'Gia đình', 'family'),
  conceptLesson('concept-school', 'Trường học', 'school'),
  conceptLesson('concept-objects', 'Đồ vật', 'objects'),
  conceptLesson('concept-animals-1', 'Động vật quen thuộc', 'animals'),
  conceptLesson('concept-colors', 'Màu sắc', 'colors'),
  conceptLesson('concept-food', 'Đồ ăn và thức uống', 'food'),
  conceptLesson('concept-nature', 'Thiên nhiên', 'nature'),
  conceptLesson('concept-body', 'Cơ thể', 'body'),
  conceptLesson('concept-actions-1', 'Hành động cơ bản', 'actions'),
  conceptLesson('concept-numbers', 'Số đếm', 'numbers'),
  conceptLesson('concept-time', 'Thời gian', 'time'),
  conceptLesson('concept-adjectives', 'Tính từ cơ bản', 'adjectives'),
  conceptLesson('concept-feelings', 'Cảm xúc', 'feelings'),
  conceptLesson('concept-places', 'Địa điểm', 'places'),
  conceptLesson('concept-review-easy', 'Ôn tập nền tảng', 'all', 'easy', { targetCount: 20, maxTargets: 2 }),
  conceptLesson('concept-review-medium', 'Ôn tập mở rộng', 'all', 'medium', { targetCount: 22, maxTargets: 2, minAccuracy: 85 }),
  conceptLesson('concept-final', 'Thử thách tổng hợp', 'all', 'all', { targetCount: 26, maxTargets: 3, minAccuracy: 88 })
]);

const KEYBOARD_LESSON_TITLES = Object.freeze({
  'home-fj': { vi: 'Hai điểm tựa F và J', en: 'F and J anchors', id: 'Tumpuan F dan J' },
  'home-dk': { vi: 'Mở rộng D và K', en: 'Add D and K', id: 'Tambah D dan K' },
  'home-sl': { vi: 'Mở rộng S và L', en: 'Add S and L', id: 'Tambah S dan L' },
  'home-a': { vi: 'Ngón út trái A', en: 'Left pinky A', id: 'Kelingking kiri A' },
  'home-gh': { vi: 'G và H', en: 'G and H', id: 'G dan H' },
  'home-review': { vi: 'Ôn hàng cơ sở', en: 'Home row review', id: 'Ulasan baris dasar' },
  'top-ru': { vi: 'Vươn lên R và U', en: 'Reach R and U', id: 'Raih R dan U' },
  'top-ty': { vi: 'Cặp trung tâm T và Y', en: 'Center pair T and Y', id: 'Pasangan tengah T dan Y' },
  'top-ei': { vi: 'Ngón giữa E và I', en: 'Middle fingers E and I', id: 'Jari tengah E dan I' },
  'top-wo': { vi: 'Ngón áp út W và O', en: 'Ring fingers W and O', id: 'Jari manis W dan O' },
  'top-qp': { vi: 'Hai góc Q và P', en: 'Corners Q and P', id: 'Dua sudut Q dan P' },
  'top-review': { vi: 'Ôn hàng trên và cơ sở', en: 'Top and home row review', id: 'Ulasan baris atas dan dasar' },
  'bottom-vm': { vi: 'Hàng dưới V và M', en: 'Bottom row V and M', id: 'Baris bawah V dan M' },
  'bottom-bn': { vi: 'Trung tâm B và N', en: 'Center B and N', id: 'Tengah B dan N' },
  'bottom-cx': { vi: 'C và X', en: 'C and X', id: 'C dan X' },
  'bottom-z': { vi: 'Phím cuối Z', en: 'Final key Z', id: 'Tombol terakhir Z' },
  'words-az': { vi: 'Từ vựng A đến Z', en: 'A-to-Z words', id: 'Kosakata A hingga Z' }
});

const CONCEPT_LESSON_TITLES = Object.freeze({
  'concept-family': { vi: 'Gia đình', en: 'Family', id: 'Keluarga' },
  'concept-school': { vi: 'Trường học', en: 'School', id: 'Sekolah' },
  'concept-objects': { vi: 'Đồ vật', en: 'Objects', id: 'Benda' },
  'concept-animals-1': { vi: 'Động vật quen thuộc', en: 'Familiar animals', id: 'Hewan sehari-hari' },
  'concept-colors': { vi: 'Màu sắc', en: 'Colors', id: 'Warna' },
  'concept-food': { vi: 'Đồ ăn và thức uống', en: 'Food and drink', id: 'Makanan dan minuman' },
  'concept-nature': { vi: 'Thiên nhiên', en: 'Nature', id: 'Alam' },
  'concept-body': { vi: 'Cơ thể', en: 'Body', id: 'Tubuh' },
  'concept-actions-1': { vi: 'Hành động cơ bản', en: 'Basic actions', id: 'Aktivitas dasar' },
  'concept-numbers': { vi: 'Số đếm', en: 'Numbers', id: 'Angka' },
  'concept-time': { vi: 'Thời gian', en: 'Time', id: 'Waktu' },
  'concept-adjectives': { vi: 'Tính từ cơ bản', en: 'Basic adjectives', id: 'Kata sifat dasar' },
  'concept-feelings': { vi: 'Cảm xúc', en: 'Feelings', id: 'Perasaan' },
  'concept-places': { vi: 'Địa điểm', en: 'Places', id: 'Tempat' },
  'concept-review-easy': { vi: 'Ôn tập nền tảng', en: 'Foundation review', id: 'Ulasan dasar' },
  'concept-review-medium': { vi: 'Ôn tập mở rộng', en: 'Extended review', id: 'Ulasan lanjutan' },
  'concept-final': { vi: 'Thử thách tổng hợp', en: 'Final mixed challenge', id: 'Tantangan akhir' }
});

function normalizedUiLanguage(value) { return ['vi', 'en', 'id'].includes(value) ? value : 'vi'; }

function localizeTemplate(template, language, uiLanguage = 'vi') {
  const ui = normalizedUiLanguage(uiLanguage);
  const titles = language === 'en' ? KEYBOARD_LESSON_TITLES : CONCEPT_LESSON_TITLES;
  const title = template.titles?.[ui] || titles[template.id]?.[ui] || template.title;
  let description;
  if (language === 'en') {
    const keyText = [...(template.newKeys || []), ...(template.reviewKeys || [])].join(', ').toUpperCase();
    if (template.targetType === 'words') {
      description = ui === 'en' ? 'Type real English words with all learned keys.' : ui === 'id' ? 'Ketik kata bahasa Inggris dengan semua tombol yang telah dipelajari.' : 'Gõ từ tiếng Anh thật bằng toàn bộ phím đã học.';
    } else if (ui === 'en') description = `Practice ${keyText || 'the learned keys'} with a steady rhythm.`;
    else if (ui === 'id') description = `Latih ${keyText || 'tombol yang telah dipelajari'} dengan ritme stabil.`;
    else description = `Luyện ${keyText || 'các phím đã học'} với nhịp gõ ổn định.`;
  } else if (template.description) description = template.description;
  else if (ui === 'en') description = `Practice vocabulary: ${title}.`;
  else if (ui === 'id') description = `Latih kosakata: ${title}.`;
  else description = `Luyện từ vựng chủ đề ${title.toLocaleLowerCase('vi')}.`;
  return { ...template, title, description };
}

export function getCourseTemplates(language = 'en', uiLanguage = 'vi') {
  const code = ['vi', 'en', 'id'].includes(language) ? language : 'en';
  const templates = code === 'en' ? CORE_LESSON_TEMPLATES : GRADE5_LESSON_TEMPLATES;
  return templates.map((template) => localizeTemplate(template, code, uiLanguage));
}

export function getCourseTemplate(id, language = 'en', uiLanguage = 'vi') {
  const templates = getCourseTemplates(language, uiLanguage);
  return templates.find((item) => item.id === id)
    || CONCEPT_LESSON_TEMPLATES.find((item) => item.id === id && language !== 'en')
    || templates[0];
}
