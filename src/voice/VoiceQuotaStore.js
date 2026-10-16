export const VOICE_QUOTA_STORAGE_KEY = 'orbit_type_trilingual_voice_quota_v1';

function resolveStorage(storage) {
  if (storage) return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function getVoiceQuota(maxRequestsPerDay = 0, storage) {
  const target = resolveStorage(storage);
  const limit = Math.max(0, Number(maxRequestsPerDay) || 0);
  let source = {};
  try { source = JSON.parse(target?.getItem(VOICE_QUOTA_STORAGE_KEY) || '{}'); } catch { source = {}; }
  const used = source.date === today() ? Math.max(0, Number(source.used) || 0) : 0;
  return { date: today(), used, limit, remaining: limit ? Math.max(0, limit - used) : Infinity };
}

export function canUseGeminiVoice(maxRequestsPerDay = 0, storage) {
  return getVoiceQuota(maxRequestsPerDay, storage).remaining > 0;
}

export function recordGeminiVoiceRequest(maxRequestsPerDay = 0, storage) {
  const target = resolveStorage(storage);
  const quota = getVoiceQuota(maxRequestsPerDay, target);
  const next = { date: quota.date, used: quota.used + 1 };
  try { target?.setItem(VOICE_QUOTA_STORAGE_KEY, JSON.stringify(next)); } catch { /* storage may be blocked */ }
  return getVoiceQuota(maxRequestsPerDay, target);
}

