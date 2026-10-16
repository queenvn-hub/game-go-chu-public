// A deliberately bounded local lexicon, not a statistical POS tagger.
const entries = (text) => new Set(text.split('|'));
const dictionaries = {
  vietnamese: {
    nouns: entries('vũ trụ|hành tinh|khoa học|công nghệ|tàu vũ trụ|vệ tinh|kính thiên văn|tương lai|con người|sao hỏa|thế giới|nguồn gốc|trái đất|sự sống|ước mơ|nhà khoa học|bàn phím|gia đình|trường học|học sinh|giáo viên|quyển sách|bài học|tiếng việt|máy tính|ngôi nhà|bầu trời|mặt trời|mặt trăng|sách|bút|bàn|ghế|em|bé|mẹ|bố|anh|chị|trường|nhà|cây|hoa|nước|mèo|chó|chim|bài|từ|chữ'),
    verbs: entries('khám phá|nghiên cứu|tìm kiếm|sinh sống|chế tạo|luyện tập|luyện gõ|học tập|đọc sách|học|đọc|viết|gõ|chạy|đi|ăn|uống|ngủ|chơi|hiểu|nhớ|giúp|tạo|tìm|nhìn|nghe|nói'),
    adjectives: entries('bao la|hiện đại|mạnh mẽ|xa xôi|chính xác|xinh đẹp|thông minh|vui vẻ|nhanh|chậm|đẹp|tốt|mới|cũ|lớn|nhỏ|cao|thấp|xanh|đỏ|vàng|trắng|đen|khó|dễ'),
    common: entries('là|và|của|có|các|những|một|ở|trên|để|với|đã|đang|sẽ|rất|nhiều|trong|này|đó|thì|mà'),
    specialized: entries('thuật toán|quang phổ|lượng tử|điện tử|protein|enzyme|dna|rna|api|cpu|gpu|javascript')
  },
  english: {
    nouns: entries('space|planet|science|technology|satellite|telescope|future|world|earth|school|book|teacher|student|family|house|keyboard|computer|cat|dog|water|sun|moon'),
    verbs: entries('explore|study|research|find|live|create|learn|read|write|type|run|walk|eat|drink|sleep|play|understand|remember|help|see|hear|speak|practice'),
    adjectives: entries('modern|strong|distant|accurate|beautiful|smart|happy|fast|slow|good|new|old|big|small|tall|short|green|red|yellow|white|black|hard|easy'),
    common: entries('the|a|an|and|of|to|in|on|at|for|with|is|are|was|were|be|it|this|that|as|or'),
    specialized: entries('algorithm|quantum|spectrum|protein|enzyme|dna|rna|api|cpu|gpu|javascript')
  },
  indonesian: {
    nouns: entries('sekolah|buku|guru|siswa|keluarga|rumah|komputer|dunia|bumi|air'),
    verbs: entries('belajar|membaca|menulis|bermain|makan|minum|tidur|berlatih'),
    adjectives: entries('baru|lama|baik|besar|kecil|cepat|lambat|mudah|sulit'),
    common: entries('di|dan|yang|ke|dari|untuk|dengan|ini|itu|adalah'),
    specialized: entries('algoritma|kuantum|protein|enzim|dna|rna|api|cpu|gpu')
  }
};

export function passesLexicalFilters(word, options) {
  const dictionary = dictionaries[options.language] || dictionaries.vietnamese;
  const key = word.toLocaleLowerCase(options.language === 'english' ? 'en' : options.language === 'indonesian' ? 'id' : 'vi');
  const selected = ['nouns','verbs','adjectives'].filter(type => options[type]);
  if (selected.length && !selected.some(type => dictionary[type].has(key))) return false;
  if (options.removeCommon && dictionary.common.has(key)) return false;
  if (options.removeSpecialized && dictionary.specialized.has(key)) return false;
  return true;
}

export function joinVietnameseCompounds(tokens) {
  const dictionary = dictionaries.vietnamese;
  const phrases = new Set(Object.values(dictionary).flatMap(set => [...set]).filter(word => word.includes(' ')));
  const result = [];
  for (let i = 0; i < tokens.length; i += 1) {
    let joined = tokens[i];
    for (let size = 3; size >= 2; size -= 1) {
      const slice = tokens.slice(i, i + size);
      if (slice.length !== size || slice.slice(0, -1).some(token => /[.!?,;:]$/u.test(token))) continue;
      const candidate = slice.join(' ').replace(/^[\p{P}]+|[\p{P}]+$/gu, '');
      if (phrases.has(candidate.toLocaleLowerCase('vi'))) {
        joined = candidate;
        i += size - 1;
        break;
      }
    }
    result.push(joined);
  }
  return result;
}
