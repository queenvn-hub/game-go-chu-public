const TONE_KEYS = new Map([
  ['s', 1],
  ['f', 2],
  ['r', 3],
  ['x', 4],
  ['j', 5]
]);

export const TONE_TABLE = {
  a: ['a', 'á', 'à', 'ả', 'ã', 'ạ'],
  ă: ['ă', 'ắ', 'ằ', 'ẳ', 'ẵ', 'ặ'],
  â: ['â', 'ấ', 'ầ', 'ẩ', 'ẫ', 'ậ'],
  e: ['e', 'é', 'è', 'ẻ', 'ẽ', 'ẹ'],
  ê: ['ê', 'ế', 'ề', 'ể', 'ễ', 'ệ'],
  i: ['i', 'í', 'ì', 'ỉ', 'ĩ', 'ị'],
  o: ['o', 'ó', 'ò', 'ỏ', 'õ', 'ọ'],
  ô: ['ô', 'ố', 'ồ', 'ổ', 'ỗ', 'ộ'],
  ơ: ['ơ', 'ớ', 'ờ', 'ở', 'ỡ', 'ợ'],
  u: ['u', 'ú', 'ù', 'ủ', 'ũ', 'ụ'],
  ư: ['ư', 'ứ', 'ừ', 'ử', 'ữ', 'ự'],
  y: ['y', 'ý', 'ỳ', 'ỷ', 'ỹ', 'ỵ']
};

export const BASE_VOWEL = new Map();
for (const [base, row] of Object.entries(TONE_TABLE)) {
  for (const char of row) BASE_VOWEL.set(char, base);
}

export function isRawVowel(char) {
  return 'aeiouy'.includes(char);
}


function shapeWord(raw) {
  const result = [];
  for (let index = 0; index < raw.length;) {
    const rest = raw.slice(index);
    if (rest.startsWith('uow')) {
      result.push('ư', 'ơ');
      index += 3;
      continue;
    }
    const pair = raw.slice(index, index + 2);
    if (pair === 'dd') {
      result.push('đ');
      index += 2;
      continue;
    }
    if (pair === 'aa') {
      result.push('â');
      index += 2;
      continue;
    }
    if (pair === 'aw') {
      result.push('ă');
      index += 2;
      continue;
    }
    if (pair === 'ee') {
      result.push('ê');
      index += 2;
      continue;
    }
    if (pair === 'oo') {
      result.push('ô');
      index += 2;
      continue;
    }
    if (pair === 'ow') {
      result.push('ơ');
      index += 2;
      continue;
    }
    if (pair === 'uw') {
      result.push('ư');
      index += 2;
      continue;
    }
    result.push(raw[index]);
    index += 1;
  }
  return result.join('');
}

export function tonePosition(chars) {
  let indices = chars
    .map((char, index) => (BASE_VOWEL.has(char) ? index : -1))
    .filter((index) => index >= 0);

  if (indices.length > 1 && chars[0] === 'q' && chars[1] === 'u') {
    indices = indices.filter((index) => index !== 1);
  }
  if (indices.length > 1 && chars[0] === 'g' && chars[1] === 'i') {
    indices = indices.filter((index) => index !== 1);
  }
  if (indices.length === 0) return -1;
  if (indices.length === 1) return indices[0];

  const preferred = indices.filter((index) => ['ê', 'ơ'].includes(BASE_VOWEL.get(chars[index])));
  if (preferred.length) return preferred.at(-1);

  const lastVowel = indices.at(-1);
  const lastLetter = chars.findLastIndex(char => /\p{L}/u.test(char));
  const endsWithVowel = lastVowel === lastLetter;
  if (indices.length === 2) return endsWithVowel ? indices[0] : indices[1];
  return indices[1];
}

export function removeAllMarks(value) {

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .normalize('NFC');
}

export function transformTelex(rawValue) {
  const raw = String(rawValue ?? '').toLocaleLowerCase('vi');
  let seenVowel = false;
  let tone = 0;
  let clearMarks = false;
  const body = [];

  for (const char of raw) {
    if (isRawVowel(char)) seenVowel = true;
    if (char === 'z' && seenVowel) {
      clearMarks = true;
      tone = 0;
      continue;
    }
    if (TONE_KEYS.has(char) && seenVowel) {
      tone = TONE_KEYS.get(char);
      continue;
    }
    body.push(char);
  }

  let shaped = shapeWord(body.join(''));
  if (clearMarks) return removeAllMarks(shaped);
  if (!tone) return shaped.normalize('NFC');

  const chars = Array.from(shaped.normalize('NFC'));
  const index = tonePosition(chars);
  if (index < 0) return shaped.normalize('NFC');
  const base = BASE_VOWEL.get(chars[index]);
  chars[index] = TONE_TABLE[base][tone];
  return chars.join('').normalize('NFC');
}

export function transformTelexText(rawValue, targetText = '') {
  const raw = String(rawValue ?? '').normalize('NFC');
  const targets = String(targetText).toLocaleLowerCase('vi').trim().split(/\s+/u);
  let word = 0;
  return raw.trimStart().split(/(\s+)/u).map((part) => {
    if (/\s/u.test(part)) return ' ';
    const target = targets[word++];
    // Literal ASCII words such as "sofa" must not consume f as a tone key.
    if (target && /^[a-z\p{P}]+$/u.test(target) && target.startsWith(part.toLocaleLowerCase('vi'))) return part.toLocaleLowerCase('vi');
    return transformTelex(part);
  }).join('').replace(/\s+/g, ' ').normalize('NFC');
}
