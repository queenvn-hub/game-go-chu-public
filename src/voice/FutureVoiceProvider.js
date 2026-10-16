function voiceError(code, message = '') {
  const error = new Error(message || code);
  error.code = code;
  return error;
}

export class FutureVoiceProvider {
  constructor({ config = globalThis.ORBIT_TYPE_VOICE_CONFIG?.futureProvider } = {}) {
    this.config = config || {};
  }

  getInfo() {
    return {
      id: 'future',
      label: String(this.config.label || 'Nguồn giọng mới · Sắp có'),
      enabled: this.config.enabled === true
    };
  }

  isAvailable() {
    // This slot stays disabled until a real provider is deliberately added.
    return false;
  }

  cancel() {}

  speak() {
    return Promise.reject(voiceError('VOICE_FUTURE_UNAVAILABLE'));
  }
}
