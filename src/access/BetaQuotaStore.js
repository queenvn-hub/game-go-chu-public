import { getBetaConfig, isQuotaSource, normalizeLanguageCode } from './BetaAccessPolicy.js';

const STORAGE_KEY = 'orbit_type_trilingual_beta_access_v1';
const STORAGE_VERSION = 1;
const DAILY_QUOTA_KEY = 'orbit_type_public_daily_creation_v1';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function resolveStorage(storage) {
  if (storage) return storage;
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

function readState(storage) {
  const target = resolveStorage(storage);
  if (!target) return { version: STORAGE_VERSION, pasteUsesByLanguage: {} };
  try {
    const parsed = JSON.parse(target.getItem(STORAGE_KEY) || '{}');
    const state = {
      version: STORAGE_VERSION,
      pasteUsesByLanguage: parsed?.pasteUsesByLanguage && typeof parsed.pasteUsesByLanguage === 'object'
        ? parsed.pasteUsesByLanguage
        : {}
    };
    return state;
  } catch {
    return { version: STORAGE_VERSION, pasteUsesByLanguage: {} };
  }
}

function writeState(state, storage) {
  const target = resolveStorage(storage);
  if (!target) return false;
  try {
    target.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function getPasteQuota(language = 'vi', storage) {
  const config = getBetaConfig();
  const code = normalizeLanguageCode(language);
  const wordLimit = config.ownerMode || config.publicMode ? Infinity : config.freePasteWordsPerSession;
  if (config.publicMode) {
    const target = resolveStorage(storage);
    let state = { date: today(), used: 0 };
    try {
      const parsed = JSON.parse(target?.getItem(DAILY_QUOTA_KEY) || '{}');
      state = parsed?.date === today() ? { date: parsed.date, used: Math.max(0, Math.min(10, Number(parsed.used) || 0)) } : state;
    } catch { /* Fall back to a fresh daily quota. */ }
    return {
      language: code,
      unlimited: false,
      limit: 10,
      used: state.used,
      remaining: Math.max(0, 10 - state.used),
      wordLimit
    };
  }
  const unlimited = !config.enabled || code !== 'vi' || (code === 'id' && config.indonesiaUnlimitedBeta);
  if (unlimited) {
    return { language: code, unlimited: true, limit: Infinity, used: 0, remaining: Infinity, wordLimit };
  }
  const state = readState(storage);
  const used = Math.max(0, Math.min(config.freePasteSessions, Number(state.pasteUsesByLanguage[code] || 0)));
  return {
    language: code,
    unlimited: false,
    limit: config.freePasteSessions,
    used,
    remaining: Math.max(0, config.freePasteSessions - used),
    wordLimit
  };
}

export function canCreateCustomLesson({ language = 'vi', wordCount = 0, source = 'paste', storage } = {}) {
  const quota = getPasteQuota(language, storage);
  if (Number(wordCount) > quota.wordLimit) return { allowed: false, reason: 'word-limit', quota };
  if (quota.unlimited || !isQuotaSource(source)) return { allowed: true, reason: 'unlimited', quota };
  if (quota.remaining <= 0) return { allowed: false, reason: 'quota-exhausted', quota };
  return { allowed: true, reason: 'beta-quota', quota };
}

export function consumePasteQuota({ language = 'vi', wordCount = 0, source = 'paste', storage } = {}) {
  const check = canCreateCustomLesson({ language, wordCount, source, storage });
  if (!check.allowed || check.quota.unlimited) return { consumed: false, ...check };
  if (getBetaConfig().publicMode) {
    const target = resolveStorage(storage);
    if (!target) return { consumed: false, allowed: false, reason: 'storage-unavailable', quota: check.quota };
    try {
      target.setItem(DAILY_QUOTA_KEY, JSON.stringify({ date: today(), used: check.quota.used + 1 }));
      return { consumed: true, allowed: true, reason: 'consumed', quota: getPasteQuota(language, storage) };
    } catch {
      return { consumed: false, allowed: false, reason: 'storage-unavailable', quota: check.quota };
    }
  }
  const state = readState(storage);
  const code = normalizeLanguageCode(language);
  state.pasteUsesByLanguage[code] = check.quota.used + 1;
  const saved = writeState(state, storage);
  return {
    consumed: saved,
    allowed: saved,
    reason: saved ? 'consumed' : 'storage-unavailable',
    quota: getPasteQuota(language, storage)
  };
}

export function resetBetaQuota(storage) {
  const target = resolveStorage(storage);
  if (!target) return false;
  try {
    target.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export { STORAGE_KEY as BETA_QUOTA_STORAGE_KEY };
