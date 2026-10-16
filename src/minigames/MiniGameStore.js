export const MINI_GAME_STORAGE_KEY = 'orbit_type_trilingual_minigames_v1';
export const MINI_GAME_IDS = Object.freeze(['truth-check', 'meaning-choice', 'word-climb']);

const EMPTY_GAME = Object.freeze({
  plays: 0,
  correct: 0,
  answered: 0,
  bestScore: 0,
  bestStreak: 0,
  lastScore: 0,
  lastAccuracy: 0,
  lastChapter: 0,
  completedChapters: 0,
  updatedAt: 0
});

function clone(value) {
  return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function resolveStorage(storage) {
  if (storage) return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function sanitizeGame(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    ...EMPTY_GAME,
    plays: Math.max(0, Number(source.plays || 0)),
    correct: Math.max(0, Number(source.correct || 0)),
    answered: Math.max(0, Number(source.answered || 0)),
    bestScore: Math.max(0, Number(source.bestScore || 0)),
    bestStreak: Math.max(0, Number(source.bestStreak || 0)),
    lastScore: Math.max(0, Number(source.lastScore || 0)),
    lastAccuracy: Math.max(0, Math.min(100, Number(source.lastAccuracy || 0))),
    lastChapter: Math.max(0, Number(source.lastChapter || 0)),
    completedChapters: Math.max(0, Number(source.completedChapters || 0)),
    updatedAt: Math.max(0, Number(source.updatedAt || 0))
  };
}

export function createEmptyMiniGameState() {
  return { version: 2, games: {}, topics: {} };
}

function sanitizeTopics(value) {
  const topics = {};
  if (!value || typeof value !== 'object') return topics;
  for (const topicKey of Object.keys(value)) {
    if (!topicKey || !value[topicKey] || typeof value[topicKey] !== 'object') continue;
    topics[topicKey] = {};
    for (const id of MINI_GAME_IDS) topics[topicKey][id] = sanitizeGame(value[topicKey][id]);
  }
  return topics;
}

export function loadMiniGameState(storage) {
  const target = resolveStorage(storage);
  if (!target) return createEmptyMiniGameState();
  try {
    const parsed = JSON.parse(target.getItem(MINI_GAME_STORAGE_KEY) || '{}');
    const games = {};
    for (const id of MINI_GAME_IDS) games[id] = sanitizeGame(parsed?.games?.[id]);
    return { version: 2, games, topics: sanitizeTopics(parsed?.topics) };
  } catch {
    return createEmptyMiniGameState();
  }
}

export function saveMiniGameState(state, storage) {
  const target = resolveStorage(storage);
  const next = { version: 2, games: {}, topics: {} };
  for (const id of MINI_GAME_IDS) next.games[id] = sanitizeGame(state?.games?.[id]);
  for (const topicKey of Object.keys(state?.topics || {})) {
    if (!topicKey || !state.topics[topicKey] || typeof state.topics[topicKey] !== 'object') continue;
    next.topics[topicKey] = {};
    for (const id of MINI_GAME_IDS) next.topics[topicKey][id] = sanitizeGame(state.topics[topicKey][id]);
  }
  try { target?.setItem(MINI_GAME_STORAGE_KEY, JSON.stringify(next)); } catch { /* localStorage may be blocked */ }
  return next;
}

export function recordMiniGameResult(gameId, result = {}, storage) {
  const id = MINI_GAME_IDS.includes(gameId) ? gameId : MINI_GAME_IDS[0];
  const state = loadMiniGameState(storage);
  const current = sanitizeGame(state.games[id]);
  const topicKey = String(result.topicKey || '').trim();
  const answered = Math.max(0, Number(result.answered || 0));
  const correct = Math.max(0, Math.min(answered, Number(result.correct || 0)));
  const score = Math.max(0, Number(result.score || 0));
  const updated = {
    ...current,
    plays: current.plays + 1,
    correct: current.correct + correct,
    answered: current.answered + answered,
    bestScore: Math.max(current.bestScore, score),
    bestStreak: Math.max(current.bestStreak, Number(result.bestStreak || 0)),
    lastScore: score,
    lastAccuracy: answered ? Math.round((correct / answered) * 100) : 0,
    lastChapter: Math.max(0, Number(result.chapterIndex || 0)),
    completedChapters: Math.max(current.completedChapters, Math.min(Number(result.chapterCount || 0), Number(result.chapterIndex || 0) + 1)),
    updatedAt: Date.now()
  };
  const nextTopics = { ...state.topics };
  if (topicKey) {
    const topicState = nextTopics[topicKey] || {};
    const topicCurrent = sanitizeGame(topicState[id]);
    nextTopics[topicKey] = { ...topicState, [id]: {
      ...topicCurrent,
      plays: topicCurrent.plays + 1,
      correct: topicCurrent.correct + correct,
      answered: topicCurrent.answered + answered,
      bestScore: Math.max(topicCurrent.bestScore, score),
      bestStreak: Math.max(topicCurrent.bestStreak, Number(result.bestStreak || 0)),
      lastScore: score,
      lastAccuracy: answered ? Math.round((correct / answered) * 100) : 0,
      lastChapter: Math.max(0, Number(result.chapterIndex || 0)),
      completedChapters: Math.max(topicCurrent.completedChapters, Math.min(Number(result.chapterCount || 0), Number(result.chapterIndex || 0) + 1)),
      updatedAt: Date.now()
    } };
  }
  const next = {
    ...state,
    games: {
      ...state.games,
      [id]: updated
    },
    topics: nextTopics
  };
  return saveMiniGameState(next, storage);
}

export function clearMiniGameState(storage) {
  const target = resolveStorage(storage);
  try { target?.removeItem(MINI_GAME_STORAGE_KEY); } catch { /* ignored */ }
  return createEmptyMiniGameState();
}

export function getMiniGameSummary(state, gameId, topicKey = '') {
  const game = topicKey ? state?.topics?.[topicKey]?.[gameId] : state?.games?.[gameId];
  return sanitizeGame(game);
}
