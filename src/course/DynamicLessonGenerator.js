import { CORE_LESSON_TEMPLATES, getCourseTemplate, getLessonTemplate, normalizeCourseSpeed } from './CourseConfig.js';
import { getWeakKeys } from './AdaptiveProfile.js';
import { getLessonScreenCount, getLessonScreenSpec } from './LessonSequence.js';
import {
  buildGrade5ProgressionSupplement,
  getGrade5SentencePack,
  getGrade5VietnameseProgressionScript,
  getGrade5VietnameseProgressionTranslation
} from '../data/grade5Curriculum.js';
import { countWordCharacters, getProgressionSpec, getProgressionWordsBefore, isProgressionMode, isProgressionSentence, isProgressionSingleWord, normalizeWordKey, PROGRESSION_TOTAL_SCREENS } from './CourseProgression.js';

function hashSeed(value) {
  let hash = 2166136261;
  for (const char of String(value)) { hash ^= char.codePointAt(0); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}

function seededRandom(seedValue) {
  let state = hashSeed(seedValue) || 1;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(items, random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function normalizeKey(value) { return String(value || '').toLowerCase(); }
function isEnglishWord(value) { return /^[a-z]+$/i.test(String(value || '')); }
function canBuild(value, allowedKeys) {
  const text = String(value || '').toLowerCase();
  return isEnglishWord(text) && [...text].every((char) => allowedKeys.has(char));
}

function buildPattern(pool, length, random, requiredKeys = []) {
  const safe = pool.length ? pool : ['f', 'j'];
  const chars = [];
  if (requiredKeys.length) chars.push(requiredKeys[Math.floor(random() * requiredKeys.length)]);
  while (chars.length < length) {
    let next = safe[Math.floor(random() * safe.length)];
    const lastTwo = chars.slice(-2);
    if (lastTwo.length === 2 && lastTwo.every((char) => char === next) && safe.length > 1) {
      next = safe.find((char) => char !== next) || next;
    }
    chars.push(next);
  }
  return shuffle(chars, random).join('');
}

function makeItem(text, index, metadata = {}, source = {}) {
  return {
    id: `course-${metadata.templateId || 'lesson'}-${metadata.variant || 1}-${index}`,
    conceptId: source.conceptId || '',
    text,
    meaningVi: source.meaningVi || '',
    translationText: source.translationText || '',
    level: source.level || (text.length <= 3 ? 'easy' : text.length >= 8 ? 'hard' : 'medium'),
    topic: source.topic || 'course',
    language: source.language || 'english',
    originalIndex: index,
    sourceIndex: index,
    source: 'dynamic-course',
    focusKeys: metadata.focusKeys || []
  };
}

function weightedKeyPool(template, profile) {
  const reviewKeys = template.reviewKeys.map(normalizeKey).filter((key) => /^[a-z]$/.test(key));
  const newKeys = template.newKeys.map(normalizeKey).filter((key) => /^[a-z]$/.test(key));
  const learned = [...new Set([...reviewKeys, ...newKeys])];
  const weak = getWeakKeys(profile, learned, 6);
  const pool = [];
  for (const key of learned) {
    const baseWeight = newKeys.includes(key) ? 4 : 2;
    const adaptiveWeight = weak.includes(key) ? 2 : 0;
    for (let index = 0; index < baseWeight + adaptiveWeight; index += 1) pool.push(key);
  }
  return { learned, newKeys, weak, pool: pool.length ? pool : ['f', 'j'] };
}

function chooseWords(wordBank, allowedKeys, weakKeys, random) {
  const candidates = wordBank.filter((word) => canBuild(word.text, allowedKeys));
  return candidates.sort((left, right) => {
    const leftWeak = weakKeys.some((key) => left.text.toLowerCase().includes(key)) ? 1 : 0;
    const rightWeak = weakKeys.some((key) => right.text.toLowerCase().includes(key)) ? 1 : 0;
    return (rightWeak - leftWeak) || (random() - 0.5);
  });
}


function languageName(code) {
  return code === 'vi' ? 'vietnamese' : code === 'id' ? 'indonesian' : 'english';
}

function uniqueProgressionWords(items = [], { singleWordOnly = false } = {}) {
  const seen = new Set();
  return items.filter((item) => {
    if (singleWordOnly && !isProgressionSingleWord(item?.text)) return false;
    const key = normalizeWordKey(item?.text);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hasExactProgressionCoverage(pool, screenIndex) {
  const needed = new Map();
  for (let index = 1; index <= screenIndex; index += 1) {
    const spec = getProgressionSpec(index);
    if (spec.targetKind === 'sentence') continue;
    needed.set(spec.wordLength, (needed.get(spec.wordLength) || 0) + spec.screenWordCount);
  }
  for (const [length, count] of needed) {
    const available = uniqueProgressionWords(pool, { singleWordOnly: true })
      .filter((item) => countWordCharacters(item.text) === length).length;
    if (available < count) return false;
  }
  return true;
}

function makeAuthoredProgressionItem(text, pool, translationLanguage) {
  const normalized = normalizeWordKey(text);
  const existing = pool.find((item) => normalizeWordKey(item?.text) === normalized);
  if (existing) return existing;
  const translation = getGrade5VietnameseProgressionTranslation(text, translationLanguage);
  return {
    id: `grade5-authored-${normalized.replace(/[^\p{L}\p{N}]+/gu, '-')}`,
    conceptId: `grade5-authored-${normalized}`,
    text,
    translationText: translation.translationText,
    meaningVi: translation.meaningVi,
    level: 'easy',
    topic: 'authored-course',
    gradeBand: '1-5',
    language: 'vietnamese',
    source: 'grade5-authored-progression'
  };
}

function selectAuthoredProgressionScreen({ script, pool, sentenceBank, screenIndex, translationLanguage, templateId }) {
  const targetSpec = getLessonScreenSpec(templateId, 'vi', screenIndex);
  const texts = script?.[targetSpec.screenIndex - 1] || [];
  const words = targetSpec.targetKind === 'sentence'
    ? texts.map((text) => sentenceBank.find((item) => normalizeWordKey(item.text) === normalizeWordKey(text)) || makeAuthoredProgressionItem(text, pool, translationLanguage)).filter(Boolean)
    : texts.map((text) => makeAuthoredProgressionItem(text, pool, translationLanguage));
  const exactLengthCount = targetSpec.targetKind === 'sentence'
    ? words.length
    : words.filter((item) => countWordCharacters(item.text) === targetSpec.wordLength).length;
  return {
    spec: targetSpec,
    words,
    requestedWordCount: targetSpec.screenWordCount,
    shortfall: Math.max(0, targetSpec.screenWordCount - words.length),
    earlierShortfall: 0,
    exactLengthCount,
    lengthFallbackCount: 0,
    availableUniqueWords: uniqueProgressionWords(pool, { singleWordOnly: true }).length,
    targetKind: targetSpec.targetKind,
    pairCount: targetSpec.pairCount || 0,
    sentenceCount: targetSpec.sentenceCount || 0
  };
}

function selectProgressionScreen({ pool, priorityPool = [], sentenceBank = [], screenIndex, random }) {
  const targetSpec = getProgressionSpec(screenIndex);
  const priorityKeys = new Set(priorityPool.map((item) => normalizeWordKey(item.text)));
  const ordered = [
    ...shuffle(priorityPool, random),
    ...shuffle(pool.filter((item) => !priorityKeys.has(normalizeWordKey(item.text))), random)
  ];
  const used = new Set();
  let current = [];
  let earlierShortfall = 0;

  for (let index = 1; index <= targetSpec.screenIndex; index += 1) {
    const spec = getProgressionSpec(index);
    let selected;
    let exact;
    if (spec.targetKind === 'sentence') {
      const sentenceTarget = sentenceBank[index - 12];
      selected = sentenceTarget ? [sentenceTarget] : [];
      exact = selected;
    } else {
      const remaining = ordered.filter((item) => !used.has(normalizeWordKey(item.text)));
      exact = remaining.filter((item) => isProgressionSingleWord(item.text) && countWordCharacters(item.text) === spec.wordLength);
      selected = exact.slice(0, spec.screenWordCount);
      selected.forEach((item) => used.add(normalizeWordKey(item.text)));
    }
    if (selected.length < spec.screenWordCount) earlierShortfall += spec.screenWordCount - selected.length;
    if (index === targetSpec.screenIndex) current = selected;
  }

  return {
    spec: targetSpec,
    words: current,
    requestedWordCount: targetSpec.screenWordCount,
    shortfall: Math.max(0, current.length < targetSpec.screenWordCount ? targetSpec.screenWordCount - current.length : 0),
    earlierShortfall,
    exactLengthCount: targetSpec.targetKind === 'sentence' ? current.length : current.filter((item) => countWordCharacters(item.text) === targetSpec.wordLength).length,
    lengthFallbackCount: 0,
    availableUniqueWords: uniqueProgressionWords(pool, { singleWordOnly: true }).length,
    targetKind: targetSpec.targetKind,
    pairCount: targetSpec.pairCount || 0,
    sentenceCount: targetSpec.sentenceCount || 0
  };
}

function generateConceptLesson({ templateId, variant = 1, wordBank = [], speed = null, language = 'vi', uiLanguage = 'vi', translationLanguage = 'en', screenIndex = 1 } = {}) {
  const template = getCourseTemplate(templateId, language, uiLanguage);
  const selectedSpeed = normalizeCourseSpeed(speed || template.speed);
  const progressionEnabled = isProgressionMode(template.progressionMode);
  const safeScreenIndex = progressionEnabled ? Math.min(getLessonScreenCount(template.id, language), Math.max(1, Number(screenIndex) || 1)) : 1;
  const random = seededRandom(progressionEnabled ? `${template.id}:progression:${language}` : `${template.id}:${variant}:${language}`);
  const supplement = progressionEnabled ? buildGrade5ProgressionSupplement(language, translationLanguage) : [];
  const courseWordBank = [...wordBank, ...supplement];
  const authoredScript = progressionEnabled && language === 'vi'
    ? getGrade5VietnameseProgressionScript(template.id)
    : null;
  const topicIds = Array.isArray(template.topicIds) && template.topicIds.length ? new Set(template.topicIds) : null;
  const topicMatches = (word) => topicIds ? topicIds.has(word.topic) : (template.topic === 'all' || word.topic === template.topic);
  let pool = courseWordBank.filter((word) => topicMatches(word) && (template.level === 'all' || word.level === template.level));
  if (pool.length < 4) pool = courseWordBank.filter((word) => topicMatches(word));
  if (!pool.length) pool = [...courseWordBank];
  let progressionScope = 'topic';
  if (progressionEnabled) {
    const spec = getProgressionSpec(safeScreenIndex);
    const required = getProgressionWordsBefore(safeScreenIndex) + spec.screenWordCount;
    const topicUniqueCount = uniqueProgressionWords(pool, { singleWordOnly: true }).length;
    if ((topicUniqueCount < required || !hasExactProgressionCoverage(pool, safeScreenIndex)) && courseWordBank.length > pool.length) {
      // Keep the topic first, then widen to the same-language bank so later
      // paid screens never repeat or silently start with an empty sequence.
      pool = [...pool, ...courseWordBank.filter((word) => !topicMatches(word))];
      progressionScope = 'expanded-bank';
    }
    // Keep one stable pool for every screen in a sequence. Without this,
    // screen 1 could use the narrow topic pool while screen 4 widened it,
    // causing the deterministic sequence to choose an earlier word again.
    if (courseWordBank.length > pool.length) {
      pool = [...pool, ...courseWordBank.filter((word) => !pool.includes(word))];
      progressionScope = 'expanded-bank';
    }
  }
  const progressionPool = uniqueProgressionWords(pool, { singleWordOnly: true });
  const progressionPriorityPool = uniqueProgressionWords(courseWordBank.filter((word) => topicMatches(word)), { singleWordOnly: true });
  const sentenceBank = progressionEnabled
    ? getGrade5SentencePack(template.id).map((source, index) => {
      const text = source.texts?.[language] || source.texts?.vi || '';
      const translationText = translationLanguage === 'none' ? '' : source.texts?.[translationLanguage] || source.texts?.vi || '';
      return { ...source, id: `course-${language}-${template.id}-sentence-${index}`, text, translationText, meaningVi: source.texts?.vi || '', language: languageName(language), topic: 'course-sentence', source: 'grade5-sentence' };
    }).filter((item) => isProgressionSentence(item.text))
    : [];
  const shuffled = shuffle(progressionPool, random);
  const progressionSelection = progressionEnabled
    ? authoredScript
      ? selectAuthoredProgressionScreen({ script: authoredScript, pool: courseWordBank, sentenceBank, screenIndex: safeScreenIndex, translationLanguage, templateId: template.id })
      : selectProgressionScreen({ pool: progressionPool, priorityPool: progressionPriorityPool, sentenceBank, screenIndex: safeScreenIndex, random })
    : null;
  const count = progressionEnabled ? progressionSelection.requestedWordCount : Math.max(10, Number(template.targetCount || 16));
  const selectedWords = progressionEnabled
    ? progressionSelection.words
    : Array.from({ length: count }, (_, index) => shuffled[index % Math.max(1, shuffled.length)] || wordBank[index % Math.max(1, wordBank.length)]).filter((item) => item?.text);
  const words = selectedWords.map((source, index) => ({
    ...source,
    id: `course-${language}-${template.id}-${variant}-s${safeScreenIndex}-${index}`,
    originalIndex: index,
    sourceIndex: index,
    source: 'concept-course',
    language: languageName(language),
    targetKind: progressionSelection?.spec.targetKind || 'word',
    pairId: progressionSelection?.spec.targetKind === 'pair' ? `screen-${safeScreenIndex}-pair-${Math.floor(index / 2) + 1}` : '',
    pairPosition: progressionSelection?.spec.targetKind === 'pair' ? (index % 2) + 1 : 0
  }));
  const progression = progressionSelection ? {
    ...progressionSelection.spec,
    requestedWordCount: progressionSelection.requestedWordCount,
    wordCount: words.length,
    shortfall: progressionSelection.shortfall,
    earlierShortfall: progressionSelection.earlierShortfall,
    exactLengthCount: progressionSelection.exactLengthCount,
    lengthFallbackCount: 0,
    availableUniqueWords: progressionSelection.availableUniqueWords,
    scope: authoredScript ? 'authored-script' : progressionScope,
    status: progressionSelection.shortfall || progressionSelection.earlierShortfall
      ? 'vocabulary-shortfall'
      : 'ready'
  } : null;
  return {
    id: `${template.id}-v${variant}-s${safeScreenIndex}-${language}`,
    templateId: template.id,
    variant,
    language: languageName(language),
    languageCode: language,
    title: template.title,
    stage: template.stage,
    objective: template.description,
    newKeys: [],
    reviewKeys: [],
    weakKeys: [],
    words,
    progression,
    settings: { difficulty: selectedSpeed, courseMode: true, noDamage: true, maxTargets: template.maxTargets, caseSensitive: false, lessonId: template.id, progressionMode: template.progressionMode || '', courseScreen: safeScreenIndex, freeScreenCount: template.freeScreenCount || 5 },
    pass: { minAccuracy: template.minAccuracy, stars: [...template.stars] },
    generatedAt: Date.now()
  };
}

export function generateDynamicLesson({ templateId, variant = 1, wordBank = [], profile = null, speed = null, language = 'en', uiLanguage = 'vi', translationLanguage = 'en', screenIndex = 1 } = {}) {
  if (language !== 'en') return generateConceptLesson({ templateId, variant, wordBank, speed, language, uiLanguage, translationLanguage, screenIndex });
  const template = getLessonTemplate(templateId, uiLanguage);
  const selectedSpeed = normalizeCourseSpeed(speed || template.speed);
  const random = seededRandom(`${template.id}:${variant}:english`);
  const keyData = weightedKeyPool(template, profile);
  const allowedKeys = new Set(keyData.learned);
  const count = Math.max(10, Number(template.targetCount || 20));
  const words = [];
  const candidates = chooseWords(wordBank, allowedKeys, keyData.weak, random);

  if (template.targetType === 'words') {
    const source = candidates.length ? candidates : wordBank.filter((word) => isEnglishWord(word.text));
    for (let index = 0; index < count; index += 1) {
      const picked = source[index % Math.max(1, source.length)] || { text: buildPattern(keyData.pool, 3 + Math.floor(random() * 3), random), meaningVi: '' };
      words.push(makeItem(String(picked.text).toLowerCase(), index, { templateId: template.id, variant, focusKeys: keyData.weak }, picked));
    }
  } else {
    for (let index = 0; index < count; index += 1) {
      const introduction = index < Math.ceil(count * template.newKeyRatio);
      const required = introduction && keyData.newKeys.length ? keyData.newKeys : keyData.weak;
      const length = index < 10 ? 1 : 2 + (index % 2);
      words.push(makeItem(buildPattern(keyData.pool, length, random, required), index, { templateId: template.id, variant, focusKeys: [...new Set([...keyData.newKeys, ...keyData.weak])] }));
    }
  }

  return {
    id: `${template.id}-v${variant}`,
    templateId: template.id,
    variant,
    language: 'english',
    title: template.title,
    stage: template.stage,
    objective: template.description || `Luyện ${template.newKeys.join(', ') || 'các phím đã học'}`,
    newKeys: [...template.newKeys],
    reviewKeys: [...template.reviewKeys],
    weakKeys: keyData.weak,
    words,
    settings: {
      difficulty: selectedSpeed,
      courseMode: true,
      noDamage: template.noDamage,
      maxTargets: template.maxTargets,
      caseSensitive: false,
      lessonId: template.id
    },
    pass: { minAccuracy: template.minAccuracy, stars: [...template.stars] },
    generatedAt: Date.now()
  };
}

export function generateAdaptiveLesson({ wordBank = [], profile = null, variant = 1, speed = null, language = 'en', uiLanguage = 'vi' } = {}) {
  if (language !== 'en') {
    const mistakes = profile?.[languageName(language)]?.mistakeWords || {};
    const key = text => String(text).normalize('NFC').trim().toLocaleLowerCase(language);
    const random = seededRandom(`adaptive:${variant}:${language}`);
    const pool = shuffle(wordBank.filter(word => word?.text), random);
    pool.sort((a, b) => Number(mistakes[key(b.text)] || 0) - Number(mistakes[key(a.text)] || 0));
    const reviewing = pool.some(word => Number(mistakes[key(word.text)] || 0) > 0);
    const labels = {
      vi: reviewing ? 'Ôn những từ cần luyện thêm' : 'Ôn tập tổng hợp',
      en: reviewing ? 'Review words needing practice' : 'Mixed vocabulary review',
      id: reviewing ? 'Ulangi kata yang perlu latihan' : 'Ulasan kosakata campuran'
    };
    return {
      id: `adaptive-${language}-v${variant}`, templateId: 'adaptive-practice', variant,
      language: languageName(language), languageCode: language, title: labels[uiLanguage] || labels.vi,
      stage: 'words', newKeys: [], reviewKeys: [], weakKeys: [],
      words: pool.slice(0, 30).map((source, index) => makeItem(source.text, index, {templateId: 'adaptive-practice', variant}, source)),
      settings: {difficulty: normalizeCourseSpeed(speed), courseMode: true, noDamage: true, maxTargets: 2, caseSensitive: false, lessonId: 'adaptive-practice'},
      pass: {minAccuracy: 88, stars: [0, 88, 96]}, generatedAt: Date.now()
    };
  }
  const allLetters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const selectedSpeed = normalizeCourseSpeed(speed);
  const weak = getWeakKeys(profile, allLetters, 8);
  const random = seededRandom(`adaptive:${variant}:english`);
  const candidates = chooseWords(wordBank, new Set(allLetters), weak, random);
  const words = Array.from({ length: 30 }, (_, index) => {
    const picked = candidates[index % Math.max(1, candidates.length)] || { text: buildPattern(allLetters, 4, random, weak), meaningVi: '' };
    return makeItem(String(picked.text).toLowerCase(), index, { templateId: 'adaptive-practice', variant, focusKeys: weak }, picked);
  });
  return {
    id: `adaptive-v${variant}`,
    templateId: 'adaptive-practice',
    variant,
    language: 'english',
    title: uiLanguage === 'en' ? 'Adaptive weak-key practice' : uiLanguage === 'id' ? 'Latihan adaptif tombol lemah' : 'Bài thích nghi theo phím yếu',
    stage: 'words',
    objective: uiLanguage === 'en'
      ? `Focus on: ${weak.join(', ') || 'the full keyboard'}`
      : uiLanguage === 'id'
        ? `Fokus pada: ${weak.join(', ') || 'seluruh papan ketik'}`
        : `Tập trung nhẹ vào: ${weak.join(', ') || 'toàn bộ bàn phím'}`,
    newKeys: [],
    reviewKeys: allLetters,
    weakKeys: weak,
    words,
    settings: { difficulty: selectedSpeed, courseMode: true, noDamage: true, maxTargets: 2, caseSensitive: false, lessonId: 'adaptive-practice' },
    pass: { minAccuracy: 88, stars: [0, 88, 96] },
    generatedAt: Date.now()
  };
}

export { CORE_LESSON_TEMPLATES };
