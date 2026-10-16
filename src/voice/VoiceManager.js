import { FutureVoiceProvider } from './FutureVoiceProvider.js';
import { GeminiTtsProvider } from './GeminiTtsProvider.js';
import { loadVoiceSettings, saveVoiceSettings } from './VoiceStore.js';

export class VoiceManager {
  constructor({ geminiProvider = new GeminiTtsProvider(), futureProvider = new FutureVoiceProvider(), storage, onStatus = () => {} } = {}) {
    this.providers = new Map([
      ['gemini', geminiProvider],
      ['future', futureProvider]
    ]);
    this.storage = storage;
    this.onStatus = onStatus;
    this.settings = loadVoiceSettings(storage);
    this.abortController = null;
  }

  getSettings() {
    return { ...this.settings };
  }

  updateSettings(patch = {}) {
    this.settings = saveVoiceSettings({ ...this.settings, ...patch }, this.storage);
    if (!this.settings.enabled) this.cancel();
    this.notify('ready', { provider: this.settings.provider });
    return this.getSettings();
  }

  availability() {
    return Object.fromEntries([...this.providers].map(([id, provider]) => [id, provider.isAvailable()]));
  }

  notify(status, detail = {}) {
    this.onStatus?.({ status, ...detail });
  }

  cancel() {
    this.abortController?.abort();
    this.abortController = null;
    for (const provider of this.providers.values()) provider.cancel();
  }

  async speak(text, { language = 'vi', provider = this.settings.provider, reason = 'prompt' } = {}) {
    if (!this.settings.enabled || language !== 'vi') return { skipped: true, reason: 'disabled-or-language' };
    const transcript = String(text || '').normalize('NFC').trim();
    if (!transcript) return { skipped: true, reason: 'empty' };
    this.cancel();
    this.abortController = new AbortController();
    const options = { rate: this.settings.rate, volume: this.settings.volume, signal: this.abortController.signal };
    const selectedProvider = this.providers.get(provider) || this.providers.get('gemini');
    if (!selectedProvider || !selectedProvider.isAvailable()) {
      this.notify('unavailable', { reason });
      return { skipped: true, reason: 'unavailable' };
    }
    try {
      this.notify('loading', { provider, reason });
      const result = await selectedProvider.speak(transcript, options);
      this.notify('ready', { provider, reason });
      return result;
    } catch (error) {
      if (error?.code === 'VOICE_CANCELLED') return { skipped: true, reason: 'cancelled' };
      this.notify('error', { provider, reason, code: error?.code || 'VOICE_FAILED' });
      throw error;
    }
  }
}
