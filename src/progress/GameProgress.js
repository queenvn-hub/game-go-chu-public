const STORAGE_KEY = 'orbit_type_trilingual_game_progress_v1';

function resolveStorage(storage) {
  if (storage) return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

export function normalizeGameResult(result = {}) {
  const answered = Math.max(0, Number(result.answered || result.total || 0));
  const correct = Math.max(0, Math.min(answered, Number(result.correct || 0)));
  return Object.freeze({
    gameId: String(result.gameId || 'meteor'),
    lessonId: String(result.lessonId || ''),
    typingLanguage: ['vi', 'en', 'id'].includes(result.typingLanguage) ? result.typingLanguage : 'vi',
    meaningLanguage: ['vi', 'en', 'id', 'none'].includes(result.meaningLanguage) ? result.meaningLanguage : 'none',
    score: Math.max(0, Number(result.score || 0)),
    correct,
    total: answered,
    accuracy: answered ? Math.round((correct / answered) * 100) : Math.max(0, Math.min(100, Number(result.accuracy || 0))),
    bestStreak: Math.max(0, Number(result.bestStreak || 0)),
    durationMs: Math.max(0, Number(result.durationMs || 0)),
    completed: Boolean(result.completed),
    completedAt: result.completedAt || new Date().toISOString(),
    engineVersion: String(result.engineVersion || 'trilingual-free-beta-v1')
  });
}

export function loadGameProgress(storage) {
  const target = resolveStorage(storage);
  if (!target) return { version: 1, sessions: [] };
  try {
    const parsed = JSON.parse(target.getItem(STORAGE_KEY) || '{}');
    return { version: 1, sessions: Array.isArray(parsed.sessions) ? parsed.sessions.slice(-100) : [] };
  } catch {
    return { version: 1, sessions: [] };
  }
}

export function saveGameResult(result, storage) {
  const target = resolveStorage(storage);
  const state = loadGameProgress(target);
  const next = { version: 1, sessions: [...state.sessions, normalizeGameResult(result)].slice(-100) };
  try { target?.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* localStorage may be blocked */ }
  return next;
}

export { STORAGE_KEY as GAME_PROGRESS_STORAGE_KEY };
