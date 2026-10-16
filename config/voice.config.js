// Voice-only provider configuration. Replace this key independently when a
// dedicated Gemini TTS key/project is available.
// Direct browser keys are for private local testing only.
globalThis.ORBIT_TYPE_VOICE_CONFIG = Object.freeze({
  enabled: true,
  defaultProvider: 'gemini',
  allowBrowserDirectApi: false,
  requestTimeoutMs: 30000,
  proxyEndpoint: '',
  maxGeminiRequestsPerDay: 0,
  futureProvider: Object.freeze({
    enabled: false,
    id: 'future',
    label: 'Nguồn giọng mới · Sắp có'
  }),
  gemini: Object.freeze({
    apiKey: '',
    model: 'gemini-3.1-flash-tts-preview',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
    voiceName: 'Kore',
    sampleRate: 24000,
    channels: 1,
    bitDepth: 16
  })
});
