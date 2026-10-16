export class VoiceCache {
  constructor(maxEntries = 80) {
    this.maxEntries = Math.max(8, Number(maxEntries) || 80);
    this.entries = new Map();
  }

  get(key) {
    if (!this.entries.has(key)) return null;
    const value = this.entries.get(key);
    this.entries.delete(key);
    this.entries.set(key, value);
    return value;
  }

  set(key, value) {
    if (!key || !value) return value;
    this.entries.delete(key);
    this.entries.set(key, value);
    while (this.entries.size > this.maxEntries) this.entries.delete(this.entries.keys().next().value);
    return value;
  }

  clear() {
    this.entries.clear();
  }
}

