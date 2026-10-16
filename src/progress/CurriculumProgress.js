const STORAGE_KEY = 'orbit_type_trilingual_curriculum_v1';

function resolveStorage(storage) {
  if (storage) return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function emptyLanguage() {
  return { completed: {}, stars: {}, games: {}, gameContexts: {}, updatedAt: 0 };
}

export function createEmptyCurriculumProgress() {
  return { version: 1, languages: { vi: emptyLanguage(), en: emptyLanguage(), id: emptyLanguage() } };
}

export function loadCurriculumProgress(storage) {
  const target = resolveStorage(storage);
  if (!target) return createEmptyCurriculumProgress();
  try {
    const parsed = JSON.parse(target.getItem(STORAGE_KEY) || '{}');
    const empty = createEmptyCurriculumProgress();
    return {
      version: 1,
      languages: Object.fromEntries(Object.keys(empty.languages).map((code) => [code, {
        ...empty.languages[code],
        ...(parsed?.languages?.[code] || {})
      }]))
    };
  } catch {
    return createEmptyCurriculumProgress();
  }
}

function saveProgress(state, storage) {
  const target = resolveStorage(storage);
  try { target?.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* localStorage may be blocked */ }
  return state;
}

export function recordCurriculumLesson({ language = 'vi', lessonId, completed = false, stars = 0, storage } = {}) {
  const code = ['vi', 'en', 'id'].includes(language) ? language : 'en';
  if (!lessonId) return loadCurriculumProgress(storage);
  const state = loadCurriculumProgress(storage);
  const current = state.languages[code] || emptyLanguage();
  const nextStars = Math.max(0, Math.min(3, Number(stars || 0)));
  state.languages[code] = {
    ...current,
    completed: { ...current.completed, ...(completed ? { [lessonId]: 1 } : {}) },
    stars: { ...current.stars, [lessonId]: Math.max(Number(current.stars?.[lessonId] || 0), nextStars) },
    updatedAt: Date.now()
  };
  return saveProgress(state, storage);
}

export function recordCurriculumGame({ language = 'vi', gameId, topicKey = '', score = 0, accuracy = 0, storage } = {}) {
  const code = ['vi', 'en', 'id'].includes(language) ? language : 'en';
  if (!gameId) return loadCurriculumProgress(storage);
  const state = loadCurriculumProgress(storage);
  const current = state.languages[code] || emptyLanguage();
  const old = current.games?.[gameId] || {};
  const contextId = topicKey ? `${gameId}::${topicKey}` : '';
  const oldContext = contextId ? current.gameContexts?.[contextId] || {} : null;
  const contextResult = contextId ? {
    plays: Number(oldContext.plays || 0) + 1,
    bestScore: Math.max(Number(oldContext.bestScore || 0), Number(score || 0)),
    lastAccuracy: Number(accuracy || 0),
    updatedAt: Date.now()
  } : null;
  state.languages[code] = {
    ...current,
    games: { ...current.games, [gameId]: { plays: Number(old.plays || 0) + 1, bestScore: Math.max(Number(old.bestScore || 0), Number(score || 0)), lastAccuracy: Number(accuracy || 0), updatedAt: Date.now() } },
    gameContexts: contextId ? { ...current.gameContexts, [contextId]: contextResult } : current.gameContexts,
    updatedAt: Date.now()
  };
  return saveProgress(state, storage);
}

export function clearCurriculumProgress(storage) {
  const target = resolveStorage(storage);
  try { target?.removeItem(STORAGE_KEY); } catch { /* ignored */ }
  return createEmptyCurriculumProgress();
}

export { STORAGE_KEY as CURRICULUM_PROGRESS_STORAGE_KEY };
