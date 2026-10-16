import { calculateWordDifficulty, shuffleWords } from './WordFilter.js';

export const WORD_ORDER_MODES = Object.freeze(['original', 'shuffle', 'alphabetical', 'difficulty']);

function normalizeWordLanguage(language) {
  if (language === 'english' || language === 'indonesian') return language;
  return 'vietnamese';
}

function localeForLanguage(language) {
  if (language === 'english') return 'en';
  if (language === 'indonesian') return 'id';
  return 'vi';
}

export function createOriginalWordSequence(words, { source = 'custom', sentenceIndexes = [] } = {}) {
  return (Array.isArray(words) ? words : []).map((word, index) => {
    const text = typeof word === 'string' ? word : String(word?.text || '');
    const language = normalizeWordLanguage(word?.language);
    return {
      id: typeof word === 'object' && word?.id ? String(word.id) : `sequence-${index + 1}`,
      text: text.normalize('NFC'),
      originalIndex: Number.isFinite(word?.originalIndex) ? Number(word.originalIndex) : index,
      sourceIndex: Number.isFinite(word?.sourceIndex) ? Number(word.sourceIndex) : index,
      sourceSentenceIndex: Number.isFinite(word?.sourceSentenceIndex)
        ? Number(word.sourceSentenceIndex)
        : Number(sentenceIndexes[index] || 0),
      manual: Boolean(word?.manual),
      source: String(word?.source || source),
      language,
      meaningVi: String(word?.meaningVi || ''),
      translationText: String(word?.translationText || word?.meaningVi || ''),
      level: ['easy', 'medium', 'hard'].includes(word?.level) ? word.level : calculateWordDifficulty(text, language)
    };
  });
}

export function cloneSequence(entries) {
  return (Array.isArray(entries) ? entries : []).map((entry) => ({ ...entry }));
}

export function restoreOriginalOrder(entries) {
  return cloneSequence(entries).sort((a, b) => a.originalIndex - b.originalIndex || a.sourceIndex - b.sourceIndex);
}

export function deduplicateSequence(entries, caseSensitive = false) {
  const seen = new Set();
  const result = [];
  for (const entry of restoreOriginalOrder(entries)) {
    const key = caseSensitive
      ? entry.text.normalize('NFC')
      : entry.text.normalize('NFC').toLocaleLowerCase(localeForLanguage(entry.language));
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ ...entry });
  }
  return result;
}

export function applyWordOrder(entries, mode = 'original', random = Math.random) {
  const safeMode = WORD_ORDER_MODES.includes(mode) ? mode : 'original';
  const original = restoreOriginalOrder(entries);
  if (safeMode === 'shuffle') {
    const shuffledTexts = shuffleWords(original.map((entry) => entry.id), random);
    const byId = new Map(original.map((entry) => [entry.id, entry]));
    return shuffledTexts.map((id) => ({ ...byId.get(id) }));
  }
  if (safeMode === 'alphabetical') {
    return original.sort((a, b) => a.text.localeCompare(b.text, localeForLanguage(a.language)) || a.originalIndex - b.originalIndex);
  }
  if (safeMode === 'difficulty') {
    const rank = { easy: 0, medium: 1, hard: 2 };
    return original.sort((a, b) => rank[a.level] - rank[b.level] || a.originalIndex - b.originalIndex);
  }
  return original;
}

export function splitSourceIntoSentences(sourceText) {
  const normalized = String(sourceText ?? '').normalize('NFC').replace(/\r\n?/g, '\n');
  const chunks = normalized
    .split(/(?<=[.!?…])\s+|\n+/u)
    .map((part) => part.trim())
    .filter(Boolean);
  return chunks.length ? chunks : normalized.trim() ? [normalized.trim()] : [];
}

export function createLearningQueue(words) {
  return (Array.isArray(words) ? words : []).map((word, queueIndex) => ({
    ...word,
    queueIndex,
    originalIndex: Number.isFinite(word.originalIndex) ? word.originalIndex : queueIndex,
    sourceIndex: Number.isFinite(word.sourceIndex) ? word.sourceIndex : queueIndex
  }));
}

export function getLessonProgress({ currentIndex = 0, totalWords = 0 } = {}) {
  const total = Math.max(0, Number(totalWords) || 0);
  const current = Math.max(0, Math.min(total, Number(currentIndex) || 0));
  return {
    current,
    total,
    percent: total ? Math.round((current / total) * 100) : 0
  };
}
