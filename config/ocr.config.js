// OCR-only provider configuration. This key is independent from voice.config.js.
// Direct browser keys are for private local testing only.
globalThis.ORBIT_TYPE_OCR_CONFIG = Object.freeze({
  activeProvider: 'gemini',
  allowBrowserDirectApi: false,
  requestTimeoutMs: 45000,
  proxyEndpoint: '',
  gemini: Object.freeze({
    apiKey: '',
    model: 'gemini-3.6-flash',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent'
  }),
  openai: Object.freeze({
    apiKey: '',
    model: 'gpt-5-mini',
    endpoint: 'https://api.openai.com/v1/responses'
  })
});
