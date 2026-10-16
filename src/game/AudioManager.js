function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

const SFX_OUTPUT_BOOST = 3;

export class AudioManager {
  constructor() {
    this.context = null;
    this.enabled = true;
    this.paused = false;
    this.masterVolume = 1;
    this.sfxVolume = 1;
    this.masterGain = null;
    this.sfxGain = null;
    this.compressor = null;
    this.noiseBuffer = null;
    this.activeVoices = 0;
    this.maxPolyphony = 38;
    this.lastShotAt = 0;
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    this.updateGainValues();
  }

  setMuted(muted) {
    this.setEnabled(!muted);
  }

  setPaused(paused) {
    this.paused = Boolean(paused);
  }

  setVolume(value) {
    this.masterVolume = clamp(value);
    this.updateGainValues();
    return this.masterVolume;
  }

  setSfxVolume(value) {
    this.sfxVolume = clamp(value);
    this.updateGainValues();
    return this.sfxVolume;
  }

  getSettings() {
    return {
      enabled: this.enabled,
      masterVolume: this.masterVolume,
      sfxVolume: this.sfxVolume
    };
  }

  getAudioContextClass() {
    return globalThis.window?.AudioContext || globalThis.window?.webkitAudioContext || null;
  }

  async unlock() {
    if (!this.enabled) return false;
    const AudioContextClass = this.getAudioContextClass();
    if (!AudioContextClass) return false;
    if (!this.context) {
      this.context = new AudioContextClass();
      this.createAudioGraph();
    }
    if (this.context.state === 'suspended') {
      try { await this.context.resume(); } catch { return false; }
    }
    return this.context.state === 'running';
  }

  createAudioGraph() {
    if (!this.context) return;
    this.masterGain = this.context.createGain();
    this.sfxGain = this.context.createGain();
    this.compressor = this.context.createDynamicsCompressor();
    this.compressor.threshold.value = -14;
    this.compressor.knee.value = 14;
    this.compressor.ratio.value = 7;
    this.compressor.attack.value = 0.004;
    this.compressor.release.value = 0.18;
    this.sfxGain.connect(this.compressor);
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.context.destination);
    this.updateGainValues();
    this.noiseBuffer = this.createNoiseBuffer();
  }

  updateGainValues() {
    if (!this.context || !this.masterGain || !this.sfxGain) return;
    const now = this.context.currentTime;
    const master = this.enabled ? this.masterVolume : 0;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(master, now, 0.012);
    this.sfxGain.gain.cancelScheduledValues(now);
    // The max setting is intentionally loud; the compressor keeps stacked effects controlled.
    this.sfxGain.gain.setTargetAtTime(this.sfxVolume * SFX_OUTPUT_BOOST, now, 0.012);
  }

  createNoiseBuffer() {
    if (!this.context) return null;
    const length = Math.max(1, Math.floor(this.context.sampleRate * 1.15));
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    let previous = 0;
    for (let index = 0; index < length; index += 1) {
      const white = Math.random() * 2 - 1;
      previous = previous * 0.72 + white * 0.28;
      data[index] = previous;
    }
    return buffer;
  }

  canPlay(priority = 'normal') {
    if (!this.enabled || this.paused || !this.context || !this.sfxGain) return false;
    const reserved = priority === 'high' ? 5 : 0;
    return this.activeVoices < this.maxPolyphony + reserved;
  }

  schedule(callback, priority = 'normal') {
    if (!this.enabled || this.paused) return;
    void this.unlock().then((ready) => {
      if (!ready || !this.canPlay(priority)) return;
      try { callback(this.context.currentTime); } catch { /* Âm thanh không được làm hỏng game. */ }
    }).catch(() => {});
  }

  connectVoice(node, gain, { pan = 0 } = {}) {
    if (!this.context || !this.sfxGain) return;
    if (typeof this.context.createStereoPanner === 'function') {
      const panner = this.context.createStereoPanner();
      panner.pan.value = clamp(pan, -1, 1);
      node.connect(gain);
      gain.connect(panner);
      panner.connect(this.sfxGain);
    } else {
      node.connect(gain);
      gain.connect(this.sfxGain);
    }
  }

  registerVoice(source) {
    this.activeVoices += 1;
    const finish = () => { this.activeVoices = Math.max(0, this.activeVoices - 1); };
    source.addEventListener?.('ended', finish, { once: true });
    if (!source.addEventListener) source.onended = finish;
  }

  oscillator({
    start,
    frequency,
    endFrequency = frequency,
    duration = 0.1,
    type = 'sine',
    volume = 0.2,
    attack = 0.004,
    filterType = null,
    filterFrequency = 1800,
    pan = 0
  }) {
    if (!this.context || !this.sfxGain) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(1, frequency), start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), start + Math.max(0.001, attack));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    if (filterType) {
      const filter = this.context.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.value = filterFrequency;
      oscillator.connect(filter);
      this.connectVoice(filter, gain, { pan });
    } else {
      this.connectVoice(oscillator, gain, { pan });
    }

    this.registerVoice(oscillator);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.025);
  }

  noise({
    start,
    duration = 0.25,
    volume = 0.22,
    filterType = 'lowpass',
    filterFrequency = 900,
    q = 0.8,
    pan = 0
  }) {
    if (!this.context || !this.sfxGain || !this.noiseBuffer) return;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = this.noiseBuffer;
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFrequency, start);
    filter.Q.value = q;
    gain.gain.setValueAtTime(Math.max(0.0001, volume), start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    this.connectVoice(filter, gain, { pan });
    this.registerVoice(source);
    source.start(start, Math.random() * 0.2, duration + 0.03);
    source.stop(start + duration + 0.04);
  }

  click() {
    this.typingKey();
  }

  correct() {
    this.targetHit();
  }

  typingKey() {
    this.schedule((now) => this.oscillator({
      start: now, frequency: 420, endFrequency: 510, duration: 0.065,
      type: 'triangle', volume: 0.16, attack: 0.002
    }));
  }

  targetHit() {
    this.schedule((now) => {
      this.oscillator({ start: now, frequency: 980, endFrequency: 980, duration: 0.14, type: 'sine', volume: 0.28, attack: 0.003 });
      this.oscillator({ start: now + 0.045, frequency: 1470, endFrequency: 1470, duration: 0.075, type: 'sine', volume: 0.12, attack: 0.002 });
    });
  }

  wordComplete() {
    this.schedule((now) => {
      this.oscillator({ start: now, frequency: 680, endFrequency: 680, duration: 0.22, type: 'triangle', volume: 0.3, attack: 0.003 });
      this.oscillator({ start: now + 0.075, frequency: 1020, endFrequency: 1020, duration: 0.14, type: 'sine', volume: 0.18, attack: 0.003 });
    }, 'high');
  }

  fruitBasket() {
    this.schedule((now) => {
      this.oscillator({ start: now, frequency: 980, endFrequency: 720, duration: 0.2, type: 'triangle', volume: 0.3, attack: 0.002 });
      this.oscillator({ start: now + 0.035, frequency: 1960, endFrequency: 1480, duration: 0.12, type: 'sine', volume: 0.16, attack: 0.002 });
      this.noise({ start: now, duration: 0.12, volume: 0.11, filterType: 'lowpass', filterFrequency: 780, q: 0.8 });
    }, 'high');
  }

  shot({ final = false, pan = 0 } = {}) {
    const timestamp = globalThis.performance?.now?.() ?? Date.now();
    const interval = timestamp - this.lastShotAt;
    this.lastShotAt = timestamp;
    const densityGain = interval < 28 ? 0.72 : interval < 55 ? 0.86 : 1;
    this.schedule((now) => {
      const level = densityGain * (final ? 1 : 0.86);
      this.oscillator({
        start: now,
        frequency: final ? 860 : 760,
        endFrequency: final ? 210 : 315,
        duration: final ? 0.18 : 0.115,
        type: 'sawtooth',
        volume: 0.24 * level,
        attack: 0.002,
        filterType: 'bandpass',
        filterFrequency: final ? 1280 : 1650,
        pan
      });
      this.oscillator({
        start: now + 0.002,
        frequency: final ? 255 : 390,
        endFrequency: final ? 120 : 225,
        duration: final ? 0.17 : 0.09,
        type: 'triangle',
        volume: (final ? 0.17 : 0.09) * level,
        attack: 0.002,
        pan
      });
      this.noise({
        start: now,
        duration: final ? 0.085 : 0.055,
        volume: (final ? 0.08 : 0.045) * level,
        filterType: 'highpass',
        filterFrequency: 2100,
        q: 1.6,
        pan
      });
    }, final ? 'high' : 'normal');
  }

  characterHit({ final = false, pan = 0 } = {}) {
    this.schedule((now) => {
      this.noise({
        start: now,
        duration: final ? 0.16 : 0.085,
        volume: final ? 0.18 : 0.105,
        filterType: 'bandpass',
        filterFrequency: final ? 1550 : 2650,
        q: 2.4,
        pan
      });
      this.oscillator({
        start: now,
        frequency: final ? 1060 : 1380,
        endFrequency: final ? 470 : 820,
        duration: final ? 0.16 : 0.08,
        type: 'triangle',
        volume: final ? 0.14 : 0.075,
        attack: 0.001,
        pan
      });
      if (final) {
        this.oscillator({ start: now + 0.018, frequency: 410, endFrequency: 160, duration: 0.19, type: 'sawtooth', volume: 0.11, pan });
      }
    }, final ? 'high' : 'normal');
  }

  explosion({ boss = false, pan = 0 } = {}) {
    this.schedule((now) => {
      const power = boss ? 1.18 : 1;
      this.oscillator({
        start: now,
        frequency: boss ? 105 : 88,
        endFrequency: boss ? 27 : 34,
        duration: boss ? 0.68 : 0.48,
        type: 'sine',
        volume: 0.34 * power,
        attack: 0.003,
        pan
      });
      this.oscillator({
        start: now + 0.012,
        frequency: boss ? 250 : 205,
        endFrequency: 52,
        duration: boss ? 0.54 : 0.39,
        type: 'triangle',
        volume: 0.23 * power,
        attack: 0.002,
        pan
      });
      this.noise({
        start: now,
        duration: boss ? 0.82 : 0.58,
        volume: 0.32 * power,
        filterType: 'lowpass',
        filterFrequency: boss ? 1080 : 920,
        q: 0.7,
        pan
      });
      this.noise({
        start: now + 0.025,
        duration: boss ? 0.46 : 0.32,
        volume: 0.16 * power,
        filterType: 'bandpass',
        filterFrequency: 2400,
        q: 1.9,
        pan
      });
      const crackCount = boss ? 7 : 5;
      for (let index = 0; index < crackCount; index += 1) {
        const delay = 0.025 + Math.random() * (boss ? 0.19 : 0.12);
        const pitch = 720 + Math.random() * 1700;
        this.oscillator({
          start: now + delay,
          frequency: pitch,
          endFrequency: pitch * (0.42 + Math.random() * 0.2),
          duration: 0.055 + Math.random() * 0.085,
          type: index % 2 ? 'square' : 'triangle',
          volume: (boss ? 0.07 : 0.055) * power,
          attack: 0.001,
          pan: clamp(pan + (Math.random() - 0.5) * 0.42, -1, 1)
        });
      }
    }, 'high');
  }

  error() {
    this.schedule((now) => {
      this.oscillator({ start: now, frequency: 205, endFrequency: 116, duration: 0.12, type: 'square', volume: 0.105 });
      this.noise({ start: now, duration: 0.07, volume: 0.035, filterType: 'bandpass', filterFrequency: 620 });
    });
  }

  damage() {
    this.schedule((now) => {
      this.oscillator({ start: now, frequency: 145, endFrequency: 48, duration: 0.38, type: 'triangle', volume: 0.25 });
      this.noise({ start: now, duration: 0.31, volume: 0.19, filterType: 'bandpass', filterFrequency: 780, q: 1.2 });
      this.oscillator({ start: now + 0.035, frequency: 590, endFrequency: 210, duration: 0.24, type: 'sawtooth', volume: 0.09 });
    }, 'high');
  }

  lockOn({ pan = 0 } = {}) {
    this.schedule((now) => {
      this.oscillator({ start: now, frequency: 720, endFrequency: 1040, duration: 0.07, type: 'sine', volume: 0.06, pan });
      this.oscillator({ start: now + 0.055, frequency: 980, endFrequency: 1240, duration: 0.055, type: 'sine', volume: 0.05, pan });
    });
  }

  levelUp() {
    this.schedule((now) => {
      [440, 660, 880].forEach((frequency, index) => {
        this.oscillator({ start: now + index * 0.09, frequency, endFrequency: frequency * 1.14, duration: 0.14, volume: 0.09 + index * 0.012 });
      });
    }, 'high');
  }

  close() {
    try { void this.context?.close?.(); } catch { /* Audio cleanup is best effort. */ }
    this.context = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.compressor = null;
    this.activeVoices = 0;
  }
}
