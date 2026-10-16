export const PROGRESSION_TOTAL_SCREENS = 15;
export const PROGRESSION_TOTAL_TARGETS = 37;
export const PROGRESSION_FREE_SCREENS = 5;

export function isFreeCourseAttemptFinal({ completed = false, screenIndex = 0, ownerMode = false, freeScreenCount = PROGRESSION_FREE_SCREENS } = {}) {
  return Boolean(completed && !ownerMode && Number(screenIndex) >= Number(freeScreenCount));
}

// Compatibility names are kept for older callers. The course now has one
// fifteen-screen topic sequence instead of repeated six-screen blocks.
export const PROGRESSION_SCREENS_PER_BLOCK = PROGRESSION_TOTAL_SCREENS;
export const PROGRESSION_BASE_QUOTA = PROGRESSION_TOTAL_TARGETS;

const SCREEN_SPECS = Object.freeze([
  { screenIndex: 1, targetKind: 'word', wordLength: 1, screenWordCount: 3 },
  { screenIndex: 2, targetKind: 'word', wordLength: 2, screenWordCount: 3 },
  { screenIndex: 3, targetKind: 'word', wordLength: 3, screenWordCount: 3 },
  { screenIndex: 4, targetKind: 'word', wordLength: 4, screenWordCount: 3 },
  { screenIndex: 5, targetKind: 'word', wordLength: 5, screenWordCount: 3 },
  { screenIndex: 6, targetKind: 'word', wordLength: 6, screenWordCount: 3 },
  { screenIndex: 7, targetKind: 'pair', wordLength: 2, screenWordCount: 3, pairCount: 3 },
  { screenIndex: 8, targetKind: 'pair', wordLength: 3, screenWordCount: 3, pairCount: 3 },
  { screenIndex: 9, targetKind: 'pair', wordLength: 4, screenWordCount: 3, pairCount: 3 },
  { screenIndex: 10, targetKind: 'pair', wordLength: 5, screenWordCount: 3, pairCount: 3 },
  { screenIndex: 11, targetKind: 'pair', wordLength: 6, screenWordCount: 3, pairCount: 3 },
  { screenIndex: 12, targetKind: 'sentence', wordLength: null, screenWordCount: 1, sentenceCount: 1 },
  { screenIndex: 13, targetKind: 'sentence', wordLength: null, screenWordCount: 1, sentenceCount: 1 },
  { screenIndex: 14, targetKind: 'sentence', wordLength: null, screenWordCount: 1, sentenceCount: 1 },
  { screenIndex: 15, targetKind: 'sentence', wordLength: null, screenWordCount: 1, sentenceCount: 1 }
].map((spec) => Object.freeze({
  ...spec,
  targetCount: spec.screenWordCount,
  isFoundation: spec.screenIndex <= PROGRESSION_FREE_SCREENS,
  isVocabulary: spec.screenIndex > PROGRESSION_FREE_SCREENS,
  isFinal: spec.screenIndex === PROGRESSION_TOTAL_SCREENS
})));

export const PROGRESSION_SCREEN_SPECS = Object.freeze(SCREEN_SPECS);

export function isProgressionMode(mode) {
  return mode === 'six-screen' || mode === 'fifteen-screen';
}

function safeScreenIndex(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 1;
  return Math.min(PROGRESSION_TOTAL_SCREENS, Math.max(1, Math.floor(number)));
}

export function getProgressionBlock(screenIndex = 1) {
  return Math.floor((safeScreenIndex(screenIndex) - 1) / PROGRESSION_TOTAL_SCREENS);
}

export function getProgressionBlockQuota(block = 0) {
  const safeBlock = Math.max(0, Math.floor(Number(block) || 0));
  return PROGRESSION_TOTAL_TARGETS * (2 ** safeBlock);
}

export function getProgressionScreenCount(block = 0) {
  // The block argument remains accepted for compatibility, but every topic
  // uses the same fifteen-screen specification from the source curriculum.
  void block;
  return PROGRESSION_SCREEN_SPECS.map((spec) => spec.screenWordCount);
}

export function getProgressionSpec(screenIndex = 1) {
  const safeIndex = safeScreenIndex(screenIndex);
  const source = PROGRESSION_SCREEN_SPECS[safeIndex - 1];
  return Object.freeze({
    ...source,
    screenIndex: safeIndex,
    block: getProgressionBlock(safeIndex),
    blockNumber: getProgressionBlock(safeIndex) + 1,
    withinBlock: safeIndex,
    totalScreensPerBlock: PROGRESSION_TOTAL_SCREENS,
    blockQuota: PROGRESSION_TOTAL_TARGETS,
    totalTargets: PROGRESSION_TOTAL_TARGETS,
    screenCounts: Object.freeze(getProgressionScreenCount())
  });
}

export function getProgressionWordsBefore(screenIndex = 1) {
  const safeIndex = Math.min(PROGRESSION_TOTAL_SCREENS + 1, Math.max(1, Math.floor(Number(screenIndex) || 1)));
  return PROGRESSION_SCREEN_SPECS
    .slice(0, Math.max(0, safeIndex - 1))
    .reduce((total, spec) => total + spec.screenWordCount, 0);
}

export function getProgressionTargetsBefore(screenIndex = 1) {
  return getProgressionWordsBefore(screenIndex);
}

export function getProgressionLabel(spec, language = 'vi') {
  const labels = {
    vi: spec?.isFoundation ? 'C\u01a1 b\u1ea3n mi\u1ec5n ph\u00ed' : 'T\u1eeb v\u1ef1ng n\u00e2ng cao',
    en: spec?.isFoundation ? 'Free foundation' : 'Advanced vocabulary',
    id: spec?.isFoundation ? 'Dasar gratis' : 'Kosakata lanjutan'
  };
  return labels[language] || labels.vi;
}

export function countWordCharacters(value) {
  const compact = String(value ?? '').normalize('NFC').replace(/\s+/gu, '');
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(compact)].length;
  }
  return Array.from(compact).length;
}

export function normalizeWordKey(value) {
  return String(value ?? '').normalize('NFC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase();
}

export function isProgressionWord(value) {
  const text = String(value ?? '').normalize('NFC').trim();
  return Boolean(text) && /^[\p{L}]+(?:\s+[\p{L}]+)*$/u.test(text);
}

export function isProgressionSingleWord(value) {
  const text = String(value ?? '').normalize('NFC').trim();
  return Boolean(text) && /^\p{L}+$/u.test(text);
}

export function isProgressionSentence(value) {
  const text = String(value ?? '').normalize('NFC').replace(/\s+/gu, ' ').trim();
  return Boolean(text) && text.length <= 160 && !/[<>\p{C}]/u.test(text) && /[\p{L}]/u.test(text);
}
