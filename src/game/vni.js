import { TONE_TABLE, BASE_VOWEL, isRawVowel, tonePosition, removeAllMarks } from './telex.js';

const TONE_KEYS_VNI = new Map([
  ['1', 1],
  ['2', 2],
  ['3', 3],
  ['4', 4],
  ['5', 5]
]);

export function shapeWordVNI(raw) {
  const result = [];
  for (let index = 0; index < raw.length;) {
    const rest = raw.slice(index);
    if (rest.startsWith('uo7') || rest.startsWith('u7o7')) {
      result.push('ư', 'ơ');
      index += rest.startsWith('u7o7') ? 4 : 3;
      continue;
    }
    const pair = raw.slice(index, index + 2);
    if (pair === 'd9') {
      result.push('đ');
      index += 2;
      continue;
    }
    if (pair === 'a6') {
      result.push('â');
      index += 2;
      continue;
    }
    if (pair === 'e6') {
      result.push('ê');
      index += 2;
      continue;
    }
    if (pair === 'o6') {
      result.push('ô');
      index += 2;
      continue;
    }
    if (pair === 'o7') {
      result.push('ơ');
      index += 2;
      continue;
    }
    if (pair === 'u7') {
      result.push('ư');
      index += 2;
      continue;
    }
    if (pair === 'a8') {
      result.push('ă');
      index += 2;
      continue;
    }
    result.push(raw[index]);
    index += 1;
  }
  return result.join('');
}

export function transformVNI(rawValue) {
  const raw = String(rawValue ?? '').toLocaleLowerCase('vi');
  let seenVowel = false;
  let tone = 0;
  let clearMarks = false;
  const body = [];

  for (const char of raw) {
    if (isRawVowel(char)) seenVowel = true;
    if (char === '0' && seenVowel) {
      clearMarks = true;
      tone = 0;
      continue;
    }
    if (TONE_KEYS_VNI.has(char) && seenVowel) {
      tone = TONE_KEYS_VNI.get(char);
      continue;
    }
    body.push(char);
  }

  let shaped = shapeWordVNI(body.join(''));
  if (clearMarks) return removeAllMarks(shaped);
  if (!tone) return shaped.normalize('NFC');

  const chars = Array.from(shaped.normalize('NFC'));
  const index = tonePosition(chars);
  if (index < 0) return shaped.normalize('NFC');
  const base = BASE_VOWEL.get(chars[index]);
  if (!base || !TONE_TABLE[base]) return shaped.normalize('NFC');
  chars[index] = TONE_TABLE[base][tone];
  return chars.join('').normalize('NFC');
}

export function transformVNIText(rawValue, targetText = '') {
  const raw = String(rawValue ?? '').normalize('NFC');
  const targets = String(targetText).toLocaleLowerCase('vi').trim().split(/\s+/u);
  let word = 0;
  return raw.trimStart().split(/(\s+)/u).map((part) => {
    if (/\s/u.test(part)) return ' ';
    const target = targets[word++];
    // If target has numbers and matches raw input directly, preserve it
    if (target && /^[a-z0-9\p{P}]+$/u.test(target) && target.startsWith(part.toLocaleLowerCase('vi'))) return part.toLocaleLowerCase('vi');
    return transformVNI(part);
  }).join('').replace(/\s+/g, ' ').normalize('NFC');
}
