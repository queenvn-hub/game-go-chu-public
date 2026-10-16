import { VoiceCache } from './VoiceCache.js';
import { canUseGeminiVoice, recordGeminiVoiceRequest } from './VoiceQuotaStore.js';

const DEFAULT_TIMEOUT = 30_000;

function voiceError(code, message = '') {
  const error = new Error(message || code);
  error.code = code;
  return error;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function endpointWithModel(endpoint, model) {
  return String(endpoint || '').replace('{model}', encodeURIComponent(model));
}

export function getGeminiTtsConfig() {
  const config = globalThis.ORBIT_TYPE_VOICE_CONFIG || {};
  const gemini = config.gemini || {};
  return {
    enabled: config.enabled !== false,
    allowBrowserDirectApi: config.allowBrowserDirectApi === true,
    requestTimeoutMs: Math.max(5_000, Number(config.requestTimeoutMs) || DEFAULT_TIMEOUT),
    proxyEndpoint: String(config.proxyEndpoint || '').trim(),
    maxRequestsPerDay: Math.max(0, Number(config.maxGeminiRequestsPerDay) || 0),
    apiKey: String(gemini.apiKey || '').trim(),
    model: String(gemini.model || 'gemini-3.1-flash-tts-preview').trim(),
    endpoint: String(gemini.endpoint || 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent').trim(),
    voiceName: String(gemini.voiceName || 'Kore').trim(),
    sampleRate: Math.max(8_000, Number(gemini.sampleRate) || 24_000),
    channels: Math.max(1, Number(gemini.channels) || 1),
    bitDepth: Number(gemini.bitDepth) === 8 ? 8 : 16
  };
}

export function isGeminiTtsConfigured() {
  const config = getGeminiTtsConfig();
  if (!config.enabled) return false;
  if (config.proxyEndpoint) return true;
  return Boolean(config.allowBrowserDirectApi && config.apiKey && config.model && config.endpoint);
}

function paceInstruction(rate) {
  if (Number(rate) <= 0.85) return 'slowly and distinctly';
  if (Number(rate) >= 1.15) return 'briskly but clearly';
  return 'at a natural learning pace';
}

export function buildGeminiTtsRequest(text, { rate = 1, voiceName = 'Kore' } = {}) {
  const transcript = String(text || '').normalize('NFC').trim();
  return {
    contents: [{ parts: [{ text: `Read the Vietnamese transcript exactly once, ${paceInstruction(rate)}. Do not add or omit words. Transcript: ${transcript}` }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } }
    }
  };
}

function base64ToBytes(base64) {
  const binary = typeof globalThis.atob === 'function'
    ? globalThis.atob(base64)
    : globalThis.Buffer?.from(base64, 'base64')?.toString('binary');
  if (typeof binary !== 'string') throw voiceError('VOICE_AUDIO_DECODE');
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function writeAscii(view, offset, value) {
  for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index));
}

export function pcmBytesToWavBlob(bytes, { sampleRate = 24_000, channels = 1, bitDepth = 16 } = {}) {
  const pcm = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || 0);
  const headerSize = 44;
  const buffer = new ArrayBuffer(headerSize + pcm.byteLength);
  const view = new DataView(buffer);
  const blockAlign = channels * (bitDepth / 8);
  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcm.byteLength, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, pcm.byteLength, true);
  new Uint8Array(buffer, headerSize).set(pcm);
  return new Blob([buffer], { type: 'audio/wav' });
}

export function extractGeminiAudio(data, config = getGeminiTtsConfig()) {
  const directPart = data?.candidates?.[0]?.content?.parts?.find((part) => part?.inlineData?.data || part?.inline_data?.data);
  const inline = directPart?.inlineData || directPart?.inline_data || {};
  const base64 = String(data?.audioBase64 || data?.audio?.base64 || inline.data || '').trim();
  if (!base64) throw voiceError('VOICE_NO_AUDIO');
  const mimeType = String(data?.mimeType || data?.audio?.mimeType || inline.mimeType || inline.mime_type || 'audio/L16;codec=pcm;rate=24000');
  const rateMatch = mimeType.match(/rate=(\d+)/i);
  const sampleRate = Number(data?.sampleRate || rateMatch?.[1] || config.sampleRate);
  const bytes = base64ToBytes(base64);
  return mimeType.toLowerCase().includes('wav')
    ? new Blob([bytes], { type: 'audio/wav' })
    : pcmBytesToWavBlob(bytes, { sampleRate, channels: config.channels, bitDepth: config.bitDepth });
}

async function requestJson(url, options, { signal, timeoutMs }) {
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  if (signal?.aborted) throw voiceError('VOICE_CANCELLED');
  signal?.addEventListener?.('abort', abort, { once: true });
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    let data = null;
    try { data = await response.json(); } catch { data = null; }
    if (!response.ok) throw voiceError('VOICE_API_HTTP', `${response.status}: ${data?.error?.message || data?.message || ''}`);
    return data;
  } catch (error) {
    if (error?.code) throw error;
    if (error?.name === 'AbortError') throw voiceError(timedOut ? 'VOICE_API_TIMEOUT' : 'VOICE_CANCELLED');
    throw voiceError('VOICE_API_NETWORK');
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener?.('abort', abort);
  }
}

export class GeminiTtsProvider {
  constructor({ cache = new VoiceCache(), storage, AudioClass = globalThis.Audio, URLApi = globalThis.URL } = {}) {
    this.cache = cache;
    this.storage = storage;
    this.AudioClass = AudioClass;
    this.URLApi = URLApi;
    this.abortController = null;
    this.audio = null;
  }

  isAvailable() {
    return isGeminiTtsConfigured();
  }

  cancel() {
    this.abortController?.abort();
    this.abortController = null;
    if (this.audio) {
      try { this.audio.pause(); this.audio.currentTime = 0; } catch { /* ignored */ }
      this.audio = null;
    }
  }

  async generate(text, { rate = 1, signal } = {}) {
    const config = getGeminiTtsConfig();
    const transcript = String(text || '').normalize('NFC').trim();
    if (!transcript) throw voiceError('VOICE_EMPTY');
    if (!this.isAvailable()) throw voiceError('VOICE_GEMINI_UNAVAILABLE');
    const key = [config.model, config.voiceName, clamp(rate, 0.6, 1.4), transcript].join('|');
    const cached = this.cache.get(key);
    if (cached) return { blob: cached, provider: 'gemini', cached: true };
    if (!canUseGeminiVoice(config.maxRequestsPerDay, this.storage)) throw voiceError('VOICE_QUOTA');
    this.abortController?.abort();
    this.abortController = new AbortController();
    const abort = () => this.abortController?.abort();
    signal?.addEventListener?.('abort', abort, { once: true });
    const request = buildGeminiTtsRequest(transcript, { rate, voiceName: config.voiceName });
    try {
      const data = config.proxyEndpoint
        ? await requestJson(config.proxyEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ task: 'tts', provider: 'gemini', text: transcript, language: 'vi', model: config.model, voiceName: config.voiceName, request })
        }, { signal: this.abortController.signal, timeoutMs: config.requestTimeoutMs })
        : await requestJson(endpointWithModel(config.endpoint, config.model), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.apiKey },
          body: JSON.stringify(request)
        }, { signal: this.abortController.signal, timeoutMs: config.requestTimeoutMs });
      const blob = extractGeminiAudio(data, config);
      recordGeminiVoiceRequest(config.maxRequestsPerDay, this.storage);
      this.cache.set(key, blob);
      return { blob, provider: 'gemini', cached: false };
    } finally {
      signal?.removeEventListener?.('abort', abort);
      this.abortController = null;
    }
  }

  async speak(text, { rate = 1, volume = 0.9, signal } = {}) {
    const generated = await this.generate(text, { rate, signal });
    if (!this.AudioClass || !this.URLApi?.createObjectURL) throw voiceError('VOICE_AUDIO_UNAVAILABLE');
    const url = this.URLApi.createObjectURL(generated.blob);
    const audio = new this.AudioClass(url);
    this.audio = audio;
    audio.volume = clamp(volume, 0, 1);
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        try { this.URLApi.revokeObjectURL(url); } catch { /* ignored */ }
        if (this.audio === audio) this.audio = null;
      };
      const abort = () => {
        try { audio.pause(); } catch { /* ignored */ }
        cleanup();
        reject(voiceError('VOICE_CANCELLED'));
      };
      audio.onended = () => { signal?.removeEventListener?.('abort', abort); cleanup(); resolve({ ...generated, transcript: String(text) }); };
      audio.onerror = () => { signal?.removeEventListener?.('abort', abort); cleanup(); reject(voiceError('VOICE_AUDIO_PLAYBACK')); };
      if (signal?.aborted) return abort();
      signal?.addEventListener?.('abort', abort, { once: true });
      Promise.resolve(audio.play()).catch(() => {
        signal?.removeEventListener?.('abort', abort);
        cleanup();
        reject(voiceError('VOICE_AUDIO_BLOCKED'));
      });
    });
  }
}

export const GEMINI_TTS_INFO = Object.freeze({ language: 'vi', output: 'PCM/WAV', needsApiKey: true });

