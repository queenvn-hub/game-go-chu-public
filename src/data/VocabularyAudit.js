import { countWordCharacters, normalizeWordKey, isProgressionWord } from '../course/CourseProgression.js';

const SUPPORTED_LANGUAGES = Object.freeze(['vi', 'en', 'id']);

function getText(item, language) {
  if (item?.texts && typeof item.texts === 'object') return item.texts[language] || '';
  if (language === item?.languageCode || language === item?.language) return item.text || '';
  return item?.text || '';
}

function topicKey(item) {
  return String(item?.topic || 'unassigned');
}

export function auditVocabularyBank(items = [], { languages = SUPPORTED_LANGUAGES } = {}) {
  const rows = Array.isArray(items) ? items : [];
  const checks = {};
  const allDuplicates = [];
  const allMissing = [];
  const allInvalid = [];

  for (const language of languages) {
    const seen = new Map();
    const topicCounts = {};
    const missing = [];
    const invalid = [];

    rows.forEach((item, index) => {
      const text = String(getText(item, language) || '').normalize('NFC').trim();
      const key = normalizeWordKey(text);
      const topic = topicKey(item);
      topicCounts[topic] = (topicCounts[topic] || 0) + (key ? 1 : 0);
      if (!key) {
        missing.push({ index, id: item?.id || item?.conceptId || '', topic, reason: 'missing-text' });
        return;
      }
      const prior = seen.get(key) || [];
      prior.push(item?.id || item?.conceptId || `row-${index}`);
      seen.set(key, prior);
      if (!isProgressionWord(text)) invalid.push({ index, id: item?.id || item?.conceptId || '', topic, text, reason: 'not-a-word' });
      if (!countWordCharacters(text)) invalid.push({ index, id: item?.id || item?.conceptId || '', topic, text, reason: 'empty-after-normalization' });
    });

    const duplicates = [...seen.entries()]
      .filter(([, ids]) => ids.length > 1)
      .map(([key, ids]) => ({ key, ids: [...ids] }));
    checks[language] = Object.freeze({
      total: rows.length,
      unique: seen.size,
      duplicateGroups: duplicates.length,
      duplicateRows: duplicates.reduce((sum, item) => sum + item.ids.length - 1, 0),
      duplicates: Object.freeze(duplicates),
      missing: Object.freeze(missing),
      invalid: Object.freeze(invalid),
      topicCounts: Object.freeze(topicCounts)
    });
    allDuplicates.push(...duplicates.map((item) => ({ language, ...item })));
    allMissing.push(...missing.map((item) => ({ language, ...item })));
    allInvalid.push(...invalid.map((item) => ({ language, ...item })));
  }

  return Object.freeze({
    total: rows.length,
    languages: Object.freeze([...languages]),
    checks: Object.freeze(checks),
    duplicates: Object.freeze(allDuplicates),
    missing: Object.freeze(allMissing),
    invalid: Object.freeze(allInvalid),
    hasIssues: Boolean(allDuplicates.length || allMissing.length || allInvalid.length)
  });
}

export function uniqueVocabulary(items = [], language = 'vi') {
  const seen = new Set();
  return (Array.isArray(items) ? items : []).filter((item) => {
    const key = normalizeWordKey(getText(item, language));
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getVocabularyCoverage(items = [], language = 'vi', lengths = [2, 3, 4, 5, 6, 7]) {
  const rows = uniqueVocabulary(items, language);
  return Object.freeze(Object.fromEntries(lengths.map((length) => [length, rows.filter((item) => countWordCharacters(getText(item, language)) === length).length])));
}

export { SUPPORTED_LANGUAGES };

