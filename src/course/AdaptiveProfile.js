import { DEFAULT_COURSE_SPEED, normalizeCourseSpeed } from './CourseConfig.js';
import { PROGRESSION_TOTAL_SCREENS } from './CourseProgression.js';

const STORAGE_PREFIX = 'orbit_type_trilingual';

const languageCode = (value) => value === 'vi' || value === 'vietnamese' ? 'vi' : value === 'id' || value === 'indonesian' ? 'id' : 'en';
const languageName = (value) => languageCode(value) === 'vi' ? 'vietnamese' : languageCode(value) === 'id' ? 'indonesian' : 'english';
const profileKey = (language) => `${STORAGE_PREFIX}.courseProfile.${languageCode(language)}`;
const progressKey = (language) => `${STORAGE_PREFIX}.courseProgress.${languageCode(language)}`;
const emptyLanguage = () => ({ keys: {}, sessions: 0, totalMinutes: 0, lastLessonId: '', updatedAt: 0 });
const defaultProfile = (language = 'en') => ({ version: 2, language: languageCode(language), [languageName(language)]: emptyLanguage() });
const defaultProgress = (language = 'en') => ({ version: 2, language: languageCode(language), completed: {}, stars: {}, variants: {}, screens: {}, currentLessonId: languageCode(language) === 'en' ? 'home-fj' : 'grade5-01-family-school', courseSpeed: DEFAULT_COURSE_SPEED, updatedAt: 0 });

function clone(value) { return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value)); }
function safeParse(value, fallback) { try { return value ? JSON.parse(value) : clone(fallback); } catch { return clone(fallback); } }
function safeStorage(storage) { return storage || globalThis.localStorage; }
function resolveLanguageStorage(languageOrStorage, maybeStorage, fallbackLanguage = 'en') {
  if (typeof languageOrStorage === 'string') return { language: languageCode(languageOrStorage), storage: safeStorage(maybeStorage) };
  return { language: languageCode(fallbackLanguage), storage: safeStorage(languageOrStorage) };
}

export function loadAdaptiveProfile(languageOrStorage = 'en', maybeStorage = globalThis.localStorage) {
  const { language, storage } = resolveLanguageStorage(languageOrStorage, maybeStorage);
  const fallback = defaultProfile(language);
  const raw = safeParse(storage?.getItem(profileKey(language)), fallback);
  const bucketName = languageName(language);
  const legacyBucket = raw[bucketName] || (language === 'en' ? raw.english : null) || {};
  return { ...fallback, ...raw, version: 2, language, [bucketName]: { ...emptyLanguage(), ...legacyBucket } };
}

export function saveAdaptiveProfile(profile, languageOrStorage = null, maybeStorage = globalThis.localStorage) {
  const inferred = profile?.language || 'en';
  const { language, storage } = typeof languageOrStorage === 'string'
    ? resolveLanguageStorage(languageOrStorage, maybeStorage, inferred)
    : { language: languageCode(inferred), storage: safeStorage(languageOrStorage || maybeStorage) };
  const next = { ...profile, version: 2, language };
  try { storage?.setItem(profileKey(language), JSON.stringify(next)); } catch { /* storage may be blocked */ }
  return next;
}

export function calculateMastery(metric = {}) {
  const attempts = Math.max(0, Number(metric.attempts || 0));
  if (!attempts) return 0;
  const correct = Math.max(0, Number(metric.correct || 0));
  const accuracy = Math.min(1, correct / attempts);
  const reaction = Number(metric.averageReactionMs || 1400);
  const reactionScore = Math.max(0, Math.min(1, 1 - (reaction - 450) / 2200));
  const confidence = Math.min(1, attempts / 24);
  return Math.round((accuracy * 72 + reactionScore * 18 + confidence * 10) * confidence);
}

export function recordAdaptiveSession(profile, language, result) {
  const code = languageCode(language);
  const name = languageName(code);
  const next = clone(profile || defaultProfile(code));
  const bucket = { ...emptyLanguage(), ...(next[name] || {}) };
  const mistakeWords = { ...(bucket.mistakeWords || {}) };
  for (const word of result?.mistakeWords || []) {
    const text = String(word?.text || '').normalize('NFC').trim().toLocaleLowerCase(code);
    if (text) mistakeWords[text] = Number(mistakeWords[text] || 0) + 1;
  }
  bucket.mistakeWords = mistakeWords;
  for (const [key, metric] of Object.entries(result?.keyMetrics || {})) {
    if (!/^[a-z]$/.test(key)) continue;
    const current = bucket.keys[key] || { attempts: 0, correct: 0, mistakes: 0, totalReactionMs: 0, averageReactionMs: 0, mastery: 0 };
    current.attempts += Math.max(0, Number(metric.attempts || 0));
    current.correct += Math.max(0, Number(metric.correct || 0));
    current.mistakes += Math.max(0, Number(metric.mistakes || 0));
    current.totalReactionMs += Math.max(0, Number(metric.totalReactionMs || 0));
    current.averageReactionMs = current.correct ? Math.round(current.totalReactionMs / current.correct) : 0;
    current.mastery = calculateMastery(current);
    bucket.keys[key] = current;
  }
  bucket.sessions += 1;
  bucket.totalMinutes += Math.max(0, Number(result?.elapsed || 0)) / 60;
  bucket.lastLessonId = String(result?.courseLessonId || bucket.lastLessonId || '');
  bucket.updatedAt = Date.now();
  next.version = 2;
  next.language = code;
  next[name] = bucket;
  return next;
}

export function getWeakKeys(profile, allowedKeys = [], limit = 6, language = 'en') {
  const metrics = profile?.[languageName(language)]?.keys || {};
  return [...new Set(allowedKeys.map((key) => String(key).toLowerCase()).filter((key) => /^[a-z]$/.test(key)))]
    .map((key) => ({ key, mastery: Number(metrics[key]?.mastery || 0), attempts: Number(metrics[key]?.attempts || 0) }))
    .sort((a, b) => ((a.attempts > 0 ? 0 : 1) - (b.attempts > 0 ? 0 : 1)) || (a.mastery - b.mastery) || (a.attempts - b.attempts) || a.key.localeCompare(b.key))
    .slice(0, limit)
    .map((item) => item.key);
}

export function loadCourseProgress(languageOrStorage = 'en', maybeStorage = globalThis.localStorage) {
  const { language, storage } = resolveLanguageStorage(languageOrStorage, maybeStorage);
  const fallback = defaultProgress(language);
  const raw = safeParse(storage?.getItem(progressKey(language)), fallback);
  return { ...fallback, ...raw, version: 2, language, courseSpeed: normalizeCourseSpeed(raw.courseSpeed), completed: { ...(raw.completed || {}) }, stars: { ...(raw.stars || {}) }, variants: { ...(raw.variants || {}) }, screens: { ...(raw.screens || {}) } };
}

export function saveCourseProgress(progress, languageOrStorage = null, maybeStorage = globalThis.localStorage) {
  const inferred = progress?.language || 'en';
  const { language, storage } = typeof languageOrStorage === 'string'
    ? resolveLanguageStorage(languageOrStorage, maybeStorage, inferred)
    : { language: languageCode(inferred), storage: safeStorage(languageOrStorage || maybeStorage) };
  const next = { ...progress, version: 2, language, updatedAt: Date.now() };
  try { storage?.setItem(progressKey(language), JSON.stringify(next)); } catch { /* keep game running */ }
  return next;
}

export function calculateStars(result, template) {
  if (!result?.lessonComplete || !Number(result.completed)) return 0;
  const accuracy = Number(result.accuracy || 0);
  const mistakes = Math.max(0, Number(result.mistakes || 0));
  if (accuracy >= (template?.stars?.[2] ?? 95) && mistakes <= Math.max(1, Number(result.completed) * 0.08)) return 3;
  if (accuracy >= (template?.stars?.[1] ?? 85)) return 2;
  return 1;
}

export function recordCourseResult(progress, lesson, result, stars) {
  if (!result?.lessonComplete) return progress;
  const next = clone(progress || defaultProgress(lesson?.languageCode || 'en'));
  const id = lesson.templateId || lesson.id;
  next.stars[id] = Math.max(Number(next.stars[id] || 0), Number(stars || 0));
  next.variants[id] = Math.max(Number(next.variants[id] || 0), Number(lesson.variant || 1));
  if (lesson?.progression?.screenIndex) {
    const screenIndex = Number(lesson.progression.screenIndex);
    const totalScreens = lesson.progression.totalScreensPerBlock || PROGRESSION_TOTAL_SCREENS;
    const nextScreen = Math.min(totalScreens + 1, screenIndex + 1);
    next.screens[id] = Math.max(Number(next.screens[id] || 1), nextScreen);
    if (screenIndex >= totalScreens) next.completed[id] = 1;
  } else {
    next.completed[id] = Number(next.completed[id] || 0) + 1;
  }
  if (id !== 'adaptive-practice') next.currentLessonId = id;
  next.updatedAt = Date.now();
  return next;
}

export function resetCourseLessonProgress(progress, lesson) {
  if (!lesson?.progression?.screenIndex) return progress;
  const next = clone(progress || defaultProgress(lesson?.languageCode || 'en'));
  const id = lesson.templateId || lesson.id;
  next.screens = { ...(next.screens || {}), [id]: 1 };
  next.currentLessonId = id;
  next.updatedAt = Date.now();
  return next;
}

export function clearCourseStorage(languageOrStorage = null, maybeStorage = globalThis.localStorage) {
  const storage = typeof languageOrStorage === 'string' ? safeStorage(maybeStorage) : safeStorage(languageOrStorage || maybeStorage);
  const specific = typeof languageOrStorage === 'string' ? languageCode(languageOrStorage) : null;
  try {
    const codes = specific ? [specific] : ['vi','en','id'];
    for (const code of codes) {
      storage?.removeItem(profileKey(code));
      storage?.removeItem(progressKey(code));
    }
  } catch { /* ignored */ }
}
