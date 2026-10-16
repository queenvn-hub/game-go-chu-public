export const VOICE_SETTINGS_STORAGE_KEY = 'orbit_type_trilingual_voice_settings_v1';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function resolveStorage(storage) {
  if (storage) return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

export const VOICE_PROVIDER_IDS = Object.freeze(['gemini', 'future']);

export function normalizeVoiceProvider(value, fallback = 'gemini') {
  // Migrate settings from the previous browser/automatic voice implementation.
  if (value === 'auto' || value === 'browser') return 'gemini';
  return VOICE_PROVIDER_IDS.includes(value) ? value : fallback;
}

export function defaultVoiceSettings() {
  const configured = globalThis.ORBIT_TYPE_VOICE_CONFIG?.defaultProvider;
  return {
    enabled: globalThis.ORBIT_TYPE_VOICE_CONFIG?.enabled !== false,
    autoSpeak: true,
    provider: normalizeVoiceProvider(configured, 'gemini'),
    rate: 1,
    volume: 0.9
  };
}

export function sanitizeVoiceSettings(value) {
  const defaults = defaultVoiceSettings();
  const source = value && typeof value === 'object' ? value : {};
  return {
    enabled: source.enabled === undefined ? defaults.enabled : Boolean(source.enabled),
    autoSpeak: source.autoSpeak === undefined ? defaults.autoSpeak : Boolean(source.autoSpeak),
    provider: normalizeVoiceProvider(source.provider, defaults.provider),
    rate: clamp(source.rate ?? defaults.rate, 0.6, 1.4),
    volume: clamp(source.volume ?? defaults.volume, 0, 1)
  };
}

export function loadVoiceSettings(storage) {
  const target = resolveStorage(storage);
  if (!target) return defaultVoiceSettings();
  try { return sanitizeVoiceSettings(JSON.parse(target.getItem(VOICE_SETTINGS_STORAGE_KEY) || '{}')); }
  catch { return defaultVoiceSettings(); }
}

export function saveVoiceSettings(value, storage) {
  const target = resolveStorage(storage);
  const settings = sanitizeVoiceSettings(value);
  try { target?.setItem(VOICE_SETTINGS_STORAGE_KEY, JSON.stringify(settings)); } catch { /* storage may be blocked */ }
  return settings;
}
