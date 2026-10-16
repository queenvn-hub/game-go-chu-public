import { isLikelyUrlOrEmail, isValidGameWord, normalizeCustomWord } from './CustomWordValidator.js';
import { joinVietnameseCompounds, passesLexicalFilters } from './LexicalFilters.js';

const DEFAULT_OPTIONS = Object.freeze({
  caseSensitive: false,
  allowNumbers: false,
  allowSymbols: false,
  keepPunctuation: false,
  deduplicate: true,
  shuffle: false,
  vietnameseOnly: true,
  language: 'vietnamese',
  minLength: 1,
  maxLength: 24,
  maxWords: Number.POSITIVE_INFINITY
});

export function normalizeSourceText(text) {
  return String(text ?? '')
    .normalize('NFC')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/\bwww\.\S+/gi, ' ')
    .replace(/\b[^\s@]+@[^\s@]+\.[^\s@]+\b/gu, ' ')
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .normalize('NFC');
}

export function calculateWordDifficulty(word, language = 'vietnamese') {
  const locale = language === 'english' ? 'en' : language === 'indonesian' ? 'id' : 'vi';
  const normalized = String(word || '').normalize('NFC').toLocaleLowerCase(locale);
  const length = Array.from(normalized).length;
  if (language === 'english') {
    const complex = /(tion|ough|ght|ph|wh|qu|tch|dge|str|scr|kn|wr)/.test(normalized);
    if (length <= 4 && !complex) return 'easy';
    if (length >= 8 || complex) return 'hard';
    return 'medium';
  }
  if (language === 'indonesian') {
    const complex = /^(meng|meny|mem|ber|ter|peng)|(?:kan|nya|lah)$/u.test(normalized);
    if (length <= 4 && !complex) return 'easy';
    if (length >= 9 || complex) return 'hard';
    return 'medium';
  }
  const specialCount = (normalized.match(/[ăâêôơưđ]/gu) || []).length;
  const toneCount = (normalized.match(/[àáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/gu) || []).length;
  const complex = /(ngh|ng|ch|tr|th|ph|kh|qu|gi|uyên|uyễ|ương|iêng|ươu|uỷu|uyê|ưởng)/u.test(normalized);
  const score = length + specialCount * 1.4 + toneCount * 0.7 + (complex ? 2.4 : 0);
  if (length <= 3 && score < 5.2) return 'easy';
  if (score >= 9 || length >= 7) return 'hard';
  return 'medium';
}

export function deduplicateWords(words, caseSensitive = false, language = 'vietnamese') {
  const locale = language === 'english' ? 'en' : language === 'indonesian' ? 'id' : 'vi';
  const seen = new Set();
  const result = [];
  for (const word of words) {
    const value = typeof word === 'string' ? word : word.text;
    const key = caseSensitive ? value.normalize('NFC') : value.normalize('NFC').toLocaleLowerCase(locale);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(word);
  }
  return result;
}

export function shuffleWords(words, random = Math.random) {
  const result = [...words];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function parseEnglishSource(sourceText) {
  const meanings = new Map();
  const cleanLines = String(sourceText ?? '').normalize('NFC').split(/\r?\n/);
  const tokenParts = [];
  for (const line of cleanLines) {
    const pair = line.match(/^\s*([^\s=:—–]+)\s*(?:=|:|—|–)\s*(.+?)\s*$/u);
    const numberedHeading = /^\s*\[\d+\s*:/u.test(line);
    if (pair && !numberedHeading) {
      meanings.set(pair[1].toLocaleLowerCase('en'), pair[2].trim());
      tokenParts.push(pair[1]);
    } else tokenParts.push(line);
  }
  return { normalizedSource: normalizeSourceText(tokenParts.join(' ')), meanings };
}

export function extractWordsByLanguage(sourceText, userOptions = {}) {
  const options = { ...DEFAULT_OPTIONS, ...userOptions };
  const language = options.language === 'english' ? 'english' : options.language === 'indonesian' ? 'indonesian' : 'vietnamese';
  const locale = language === 'english' ? 'en' : language === 'indonesian' ? 'id' : 'vi';
  const parsed = language === 'english' || language === 'indonesian' ? parseEnglishSource(sourceText) : { normalizedSource: normalizeSourceText(sourceText), meanings: new Map() };
  const tokens = parsed.normalizedSource ? parsed.normalizedSource.split(/\s+/u) : [];
  const rawTokens = language === 'vietnamese' && options.allowPhrases ? joinVietnameseCompounds(tokens) : tokens;
  const accepted = [];
  const rejected = [];
  const duplicateKeys = new Set();
  let duplicateCount = 0;
  let limited = false;

  for (const token of rawTokens) {
    if (!token || isLikelyUrlOrEmail(token)) { rejected.push(token); continue; }
    const word = normalizeCustomWord(token, { ...options, language });
    if (!isValidGameWord(word, { ...options, language })) { rejected.push(token); continue; }
    if (!passesLexicalFilters(word, options)) { rejected.push(token); continue; }
    const key = options.caseSensitive ? word : word.toLocaleLowerCase(locale);
    if (duplicateKeys.has(key)) {
      duplicateCount += 1;
      if (options.deduplicate) continue;
    }
    duplicateKeys.add(key);
    const meaning = language === 'english' || language === 'indonesian' ? (parsed.meanings.get(key.toLocaleLowerCase(language === 'indonesian' ? 'id' : 'en')) || '') : '';
    if (accepted.length < options.maxWords) accepted.push({ text: word, meaningVi: meaning, translationText: meaning, language });
    else limited = true;
  }

  const ordered = options.shuffle ? shuffleWords(accepted) : accepted;
  const levels = { easy: 0, medium: 0, hard: 0 };
  for (const item of ordered) levels[calculateWordDifficulty(item.text, language)] += 1;
  return {
    words: ordered,
    normalizedSource: parsed.normalizedSource,
    stats: {
      sourceCharacters: Array.from(String(sourceText ?? '')).length,
      tokensFound: rawTokens.length,
      validWords: ordered.length,
      rejectedWords: rejected.length,
      duplicateWords: duplicateCount,
      easy: levels.easy,
      medium: levels.medium,
      hard: levels.hard,
      limited
    },
    rejected
  };
}

export function extractVietnameseWords(sourceText, userOptions = {}) {
  const result = extractWordsByLanguage(sourceText, { ...userOptions, language: 'vietnamese' });
  return { ...result, words: result.words.map((item) => item.text) };
}

export function extractEnglishWords(sourceText, userOptions = {}) {
  return extractWordsByLanguage(sourceText, { ...userOptions, language: 'english', vietnameseOnly: false });
}

export function buildCustomWordItems(words, source = 'custom', language = 'vietnamese') {
  return words.map((value, index) => {
    const entry = typeof value === 'string' ? { text: value } : value;
    const text = String(entry?.text || '').normalize('NFC');
    const itemLanguage = entry?.language === 'english' || language === 'english' ? 'english' : entry?.language === 'indonesian' || language === 'indonesian' ? 'indonesian' : 'vietnamese';
    return {
      id: String(entry?.id || `custom-${itemLanguage}-${String(index + 1).padStart(4, '0')}-${text.toLocaleLowerCase(itemLanguage === 'english' ? 'en' : itemLanguage === 'indonesian' ? 'id' : 'vi')}`),
      text,
      meaningVi: String(entry?.meaningVi || ''),
      translationText: String(entry?.translationText || entry?.meaningVi || ''),
      level: ['easy', 'medium', 'hard'].includes(entry?.level) ? entry.level : calculateWordDifficulty(text, itemLanguage),
      topic: 'custom',
      source: String(entry?.source || source),
      language: itemLanguage,
      originalIndex: Number.isFinite(entry?.originalIndex) ? Number(entry.originalIndex) : index,
      sourceIndex: Number.isFinite(entry?.sourceIndex) ? Number(entry.sourceIndex) : index,
      sourceSentenceIndex: Number.isFinite(entry?.sourceSentenceIndex) ? Number(entry.sourceSentenceIndex) : 0,
      manual: Boolean(entry?.manual)
    };
  });
}
