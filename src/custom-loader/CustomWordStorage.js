import { appError } from '../i18n/errors.js';
import { isValidGameWord, normalizeCustomWord } from './CustomWordValidator.js';

export const CUSTOM_WORD_STORAGE_KEY = 'orbit_type_trilingual_custom_words_v1';
export const CUSTOM_ORDER_STORAGE_KEY = 'orbit_type_trilingual_custom_order_v1';
export const CUSTOM_WORD_STORAGE_KEYS = Object.freeze({
  vietnamese: 'orbit_type_trilingual_custom_words_vi_v1',
  english: 'orbit_type_trilingual_custom_words_en_v1',
  indonesian: 'orbit_type_trilingual_custom_words_id_v1'
});
const MAX_STORED_WORDS = Number.POSITIVE_INFINITY;

function normalizeLanguage(value) {
  return value === 'english' ? 'english' : value === 'indonesian' ? 'indonesian' : 'vietnamese';
}

function resolveStorage(languageOrStorage, maybeStorage) {
  const language = typeof languageOrStorage === 'string' ? normalizeLanguage(languageOrStorage) : null;
  const storage = typeof languageOrStorage === 'string'
    ? maybeStorage
    : (languageOrStorage || globalThis.localStorage);
  return { language, storage };
}

function readStoredWordSet(storage, key, language) {
  const raw = storage?.getItem(key);
  if (!raw) return null;
  const parsed = sanitizeStoredSet(JSON.parse(raw));
  return !language || parsed?.language === language ? parsed : null;
}

export function sanitizeStoredSet(value) {
  if (!value || typeof value !== 'object' || !Array.isArray(value.words)) return null;
  const language = value.language === 'english' ? 'english' : value.language === 'indonesian' ? 'indonesian' : 'vietnamese';
  const options = value.options && typeof value.options === 'object' ? value.options : {};
  const validationOptions = {
    ...options,
    language,
    vietnameseOnly: language === 'vietnamese' ? options.vietnameseOnly !== false : false
  };
  const words = value.words
    .filter((item) => item && typeof item.text === 'string')
    .slice(0, MAX_STORED_WORDS)
    .map((item, index) => ({
      id: String(item.id || `custom-${index + 1}`),
      text: normalizeCustomWord(item.text, { ...validationOptions, caseSensitive: true }),
      meaningVi: String(item.meaningVi || ''),
      translationText: String(item.translationText || item.meaningVi || ''),
      language: item.language === 'english' || value.language === 'english' ? 'english' : item.language === 'indonesian' || value.language === 'indonesian' ? 'indonesian' : 'vietnamese',
      level: ['easy', 'medium', 'hard'].includes(item.level) ? item.level : 'medium',
      topic: 'custom',
      source: String(item.source || value.source || 'custom'),
      originalIndex: Number.isFinite(item.originalIndex) ? Number(item.originalIndex) : index,
      sourceIndex: Number.isFinite(item.sourceIndex) ? Number(item.sourceIndex) : index,
      sourceSentenceIndex: Number.isFinite(item.sourceSentenceIndex) ? Number(item.sourceSentenceIndex) : 0,
      manual: Boolean(item.manual)
    }))
    .filter((item) => isValidGameWord(item.text, validationOptions));
  if (!words.length) return null;
  return {
    version: 3,
    language,
    translationLanguage: ['none', 'vi', 'en', 'id'].includes(value.translationLanguage) ? value.translationLanguage : 'vi',
    label: String(value.label || 'Danh sách tùy chỉnh'),
    source: String(value.source || 'custom'),
    createdAt: Number(value.createdAt || Date.now()),
    rawText: typeof value.rawText === 'string' ? value.rawText : '',
    words,
    options: {
      ...options,
      wordOrderMode: ['original', 'shuffle', 'alphabetical', 'difficulty'].includes(options.wordOrderMode)
        ? options.wordOrderMode
        : 'original',
      sequentialLearning: options.sequentialLearning !== false,
      splitBySentence: Boolean(options.splitBySentence),
      keepDuplicates: options.keepDuplicates !== false
    }
  };
}

export function loadCustomWordSet(languageOrStorage = null, maybeStorage = globalThis.localStorage) {
  const { language, storage } = resolveStorage(languageOrStorage, maybeStorage);
  try {
    const keys = language
      ? [CUSTOM_WORD_STORAGE_KEYS[language], CUSTOM_WORD_STORAGE_KEY, CUSTOM_ORDER_STORAGE_KEY]
      : [...Object.values(CUSTOM_WORD_STORAGE_KEYS), CUSTOM_WORD_STORAGE_KEY, CUSTOM_ORDER_STORAGE_KEY];
    for (const key of keys) {
      const parsed = readStoredWordSet(storage, key, language);
      if (!parsed) continue;
      if (language && key === CUSTOM_WORD_STORAGE_KEYS[language]) {
        try { storage?.setItem(key, JSON.stringify(parsed)); } catch { /* cleanup is best effort */ }
      }
      if (language && key !== CUSTOM_WORD_STORAGE_KEYS[language]) {
        try { storage?.setItem(CUSTOM_WORD_STORAGE_KEYS[language], JSON.stringify(parsed)); } catch { /* migration is best effort */ }
      }
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveCustomWordSet(wordSet, storage = globalThis.localStorage) {
  const sanitized = sanitizeStoredSet(wordSet);
  if (!sanitized) throw appError('WORD_SET_INVALID');
  try {
    const serialized = JSON.stringify(sanitized);
    const languageKey = CUSTOM_WORD_STORAGE_KEYS[sanitized.language];
    storage?.setItem(languageKey, serialized);
    return sanitized;
  } catch {
    throw appError('WORD_SET_SAVE');
  }
}

export function clearCustomWordSet(languageOrStorage = null, maybeStorage = globalThis.localStorage) {
  const { language, storage } = resolveStorage(languageOrStorage, maybeStorage);
  try {
    if (language) {
      storage?.removeItem(CUSTOM_WORD_STORAGE_KEYS[language]);
    } else {
      storage?.removeItem(CUSTOM_WORD_STORAGE_KEYS.vietnamese);
      storage?.removeItem(CUSTOM_WORD_STORAGE_KEYS.english);
      storage?.removeItem(CUSTOM_WORD_STORAGE_KEYS.indonesian);
    }
  } catch { /* ignored */ }
}

export function serializeWordSet(wordSet) {
  const sanitized = sanitizeStoredSet(wordSet);
  if (!sanitized) throw appError('WORD_SET_INVALID');
  return JSON.stringify(sanitized, null, 2);
}

export function parseImportedWordSet(text) {
  let parsed;
  try { parsed = JSON.parse(String(text || '')); } catch { throw appError('JSON_INVALID'); }
  const sanitized = sanitizeStoredSet(parsed);
  if (!sanitized) throw appError('JSON_STRUCTURE');
  return sanitized;
}

export function downloadTextFile(filename, content, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
