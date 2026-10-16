import { buildConceptWords } from '../data/multilingualConcepts.js';

// Small offline vocabulary for common custom English words. Arbitrary text still
// needs an explicit `word = meaning` pair because this app does not call a translator.
const OFFLINE_TRANSLATIONS = Object.freeze({
  en: Object.freeze({
    vi: Object.freeze({
      energy: 'năng lượng',
      vents: 'cửa xả / lỗ thông',
      charge: 'sạc / nạp',
      up: 'lên',
      again: 'lại',
      in: 'trong',
      stages: 'giai đoạn',
      blue: 'xanh dương',
      white: 'trắng',
      whiteout: 'trắng xóa',
      explosive: 'bùng nổ',
      jet: 'phản lực',
      blast: 'vụ nổ'
    })
  })
});

function normalizeTypingLanguage(language) {
  return language === 'english' || language === 'en'
    ? 'english'
    : language === 'indonesian' || language === 'id'
      ? 'indonesian'
      : 'vietnamese';
}

function normalizeTranslationLanguage(language) {
  return ['none', 'vi', 'en', 'id'].includes(language) ? language : 'vi';
}

function localeForTypingLanguage(language) {
  return normalizeTypingLanguage(language) === 'english'
    ? 'en'
    : normalizeTypingLanguage(language) === 'indonesian'
      ? 'id'
      : 'vi';
}

function lookupKey(value, locale) {
  return String(value || '')
    .normalize('NFC')
    .toLocaleLowerCase(locale)
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
}

function translationLookup(language, translationLanguage) {
  const target = normalizeTranslationLanguage(translationLanguage);
  if (target === 'none') return new Map();
  const typingCode = normalizeTypingLanguage(language) === 'english'
    ? 'en'
    : normalizeTypingLanguage(language) === 'indonesian'
      ? 'id'
      : 'vi';
  const locale = localeForTypingLanguage(language);
  const lookup = new Map(buildConceptWords(typingCode, target)
    .filter((word) => word.text && word.translationText)
    .map((word) => [lookupKey(word.text, locale), word.translationText]));
  for (const [word, translation] of Object.entries(OFFLINE_TRANSLATIONS[typingCode]?.[target] || {})) {
    if (!lookup.has(lookupKey(word, locale))) lookup.set(lookupKey(word, locale), translation);
  }
  return lookup;
}

function explicitTranslation(entry) {
  return String(entry?.translationText || entry?.meaningVi || '').trim();
}

export function enrichCustomTranslations(words, { language = 'vietnamese', translationLanguage = 'vi' } = {}) {
  const lookup = translationLookup(language, translationLanguage);
  const locale = localeForTypingLanguage(language);
  return (Array.isArray(words) ? words : []).map((entry) => {
    const text = String(entry?.text || '').normalize('NFC');
    const explicit = explicitTranslation(entry);
    const fallback = lookup.get(lookupKey(text, locale)) || '';
    return {
      ...entry,
      translationText: explicit || fallback
    };
  });
}

export function countMissingCustomTranslations(words, options = {}) {
  const translationLanguage = normalizeTranslationLanguage(options.translationLanguage);
  if (translationLanguage === 'none') return 0;
  if (translationLanguage === localeForTypingLanguage(options.language)) return 0;
  return enrichCustomTranslations(words, options)
    .filter((entry) => !String(entry.translationText || '').trim())
    .length;
}

export { normalizeTypingLanguage, normalizeTranslationLanguage };
