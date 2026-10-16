const SHIFT_KEYS = Object.fromEntries([... '~!@#$%^&*()_+{}|:"<>?'].map((char, index) =>
  [char, [... '`1234567890-=[]\\;\',./'][index]]));

export const GAME_KEYBOARD_ROWS = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
  ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['Caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
  ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
  ['Ctrl', 'Win', 'Alt', 'Space', 'Alt', 'Win', 'Menu', 'Ctrl']
];

export const GAME_FUNCTION_KEYS = ['Esc', ...Array.from({ length: 12 }, (_, i) => `F${i + 1}`)];
export const GAME_NAV_KEYS = ['Print', 'Scroll', 'Pause', 'Insert', 'Home', 'PgUp', 'Delete', 'End', 'PgDn', '', '', '', '', '↑', '', '←', '↓', '→'];
export const GAME_NUMPAD_KEYS = ['Num', '/', '*', '-', '7', '8', '9', '+', '4', '5', '6', '1', '2', '3', 'Enter', '0', '.'];

export function shiftedLabel(key) {
  return Object.keys(SHIFT_KEYS).find(char => SHIFT_KEYS[char] === key) || '';
}

// Guide only: this never transforms input or changes the Telex/IME engine.
export function nextKeyGuide({ target = '', input = '', confirmedProgress, caseSensitive = false, mode = 'vietnamese', keyboard = 'telex' } = {}) {
  const units = [...target.normalize('NFC')];
  const typed = [...input.normalize('NFC')];
  const same = (a, b) => caseSensitive ? a === b : a?.toLowerCase() === b?.toLowerCase();
  const mismatch = units.findIndex((unit, i) => !same(unit, typed[i]));
  let index = mismatch < 0 ? units.length : mismatch;
  // In vowel clusters the tone can move when the coda arrives (toa -> toán).
  // Finish the syllable's letters/shapes before requesting its tone key.
  if (mode === 'vietnamese' && index < units.length) {
    const withoutTone = value => value?.normalize('NFD').replace(/[\u0300\u0301\u0303\u0309\u0323]/g, '').normalize('NFC').toLowerCase();
    let start = index, end = index;
    while (start > 0 && /\p{L}/u.test(units[start - 1])) start--;
    while (end < units.length && /\p{L}/u.test(units[end])) end++;
    const vowels = units.slice(start, end).filter(unit => /[aeiouy]/.test(unit.normalize('NFD').toLowerCase()));
    if (vowels.length > 1) {
      const nextLetter = units.findIndex((unit, i) => i >= start && i < end && withoutTone(unit) !== withoutTone(typed[i]));
      if (nextLetter >= start) index = nextLetter;
    }
  }
  const next = units[index] || '';
  if (!next) return { next, key: '', shift: false };
  if (next === ' ') return { next, key: 'Space', shift: false };
  if (SHIFT_KEYS[next]) return { next, key: SHIFT_KEYS[next], shift: true };
  let key = next.toLowerCase();
  const parts = [...key.normalize('NFD')];
  const partial = (typed[index] || '').toLowerCase();
  const toneKeys = { '\u0301': 's', '\u0300': 'f', '\u0309': 'r', '\u0303': 'x', '\u0323': 'j' };
  if (mode === 'vietnamese') {
    const base = key === 'đ' ? 'd' : parts[0];
    const shape = parts.find(char => ['\u0302', '\u0306', '\u031b'].includes(char));
    const tone = parts.find(char => toneKeys[char]);
    key = base;
    if (partial) {
      const partialBase = partial === 'đ' ? 'd' : partial.normalize('NFD')[0];
      if (partialBase !== base) return { next, key: 'Backspace', shift: false };
      const vni = keyboard === 'vni';
      if (next.toLowerCase() === 'đ' && partial === 'd') key = vni ? '9' : 'd';
      else if (shape && !partial.normalize('NFD').includes(shape)) key = vni ? ({ '\u0302':'6', '\u0306':'8', '\u031b':'7' })[shape] : shape === '\u0302' ? base : 'w';
      else if (tone && !partial.normalize('NFD').includes(tone)) key = vni ? ({ '\u0301':'1', '\u0300':'2', '\u0309':'3', '\u0303':'4', '\u0323':'5' })[tone] : toneKeys[tone];
      else key = 'Backspace';
    }
  }
  return { next, key, shift: caseSensitive && /[A-Z]/u.test(next.normalize('NFD')[0]) && !partial };
}
