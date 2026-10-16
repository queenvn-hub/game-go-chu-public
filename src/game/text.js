export function normalizeText(value, locale = 'vi', preserveCase = false) {
  const normalized = String(value ?? '')
    .normalize('NFC')
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trimStart();
  if (preserveCase) return normalized;
  return ['en','id'].includes(locale) ? normalized.toLocaleLowerCase(locale) : normalized.toLocaleLowerCase('vi');
}

// Legacy helper retained for modules that intentionally work with one token.
export function normalizeSingleWord(value, locale = 'vi', preserveCase = false) {
  return normalizeText(value, locale, preserveCase).replace(/\s+/g, '');
}

// Gameplay targets may be a single word or a short learning phrase (e.g. "bầu trời").
export function normalizeGameText(value, locale = 'vi', preserveCase = false) {
  return normalizeText(value, locale, preserveCase).trimEnd();
}

export function isValidGameTarget(value, { maxLength = 48 } = {}) {
  const normalized = String(value ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();
  if (!normalized || Array.from(normalized).length > maxLength) return false;
  if (/[<>\p{C}]/u.test(normalized)) return false;
  return !/\s{2,}/u.test(normalized);
}

export function isValidSingleSyllableWord(value) {
  const normalized = String(value ?? '').normalize('NFC').trim();
  return normalized.length > 0 && !/\s/u.test(normalized) && !normalized.includes('-');
}

export function isValidEnglishWord(value) {
  const normalized = String(value ?? '').normalize('NFC').trim();
  return /^[A-Za-z]+$/.test(normalized);
}

export function stripVietnameseDiacritics(value) {
  return normalizeText(value, 'vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .normalize('NFC');
}

export function comparisonText(value, languageMode = 'vietnamese', preserveCase = false) {
  const locale = languageMode === 'english' ? 'en' : languageMode === 'indonesian' ? 'id' : 'vi';
  const normalized = normalizeGameText(value, locale, preserveCase);
  return languageMode === 'plain' ? stripVietnameseDiacritics(normalized) : normalized;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a, b, amount) {
  return a + (b - a) * amount;
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
