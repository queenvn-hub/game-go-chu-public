import { normalizeText } from './text.js';
import { transformTelexText } from './telex.js';
import { transformVNIText } from './vni.js';


export class InputEngine {
  constructor({ input, onValue, onPreview = () => {}, onEscape, getKeyboardMode, getGameMode, getLanguageMode, getTargetText = () => '', getCaseSensitive = () => false }) {
    this.input = input;
    this.onValue = onValue;
    this.onPreview = onPreview;
    this.onEscape = onEscape;
    this.getKeyboardMode = getKeyboardMode || (() => 'telex');
    this.getLanguageMode = getLanguageMode || getGameMode || (() => 'vietnamese');
    this.getCaseSensitive = getCaseSensitive;
    this.getTargetText = getTargetText;
    this.active = false;
    this.isComposing = false;
    this.rawBuffer = '';
    this.lastCommittedValue = '';
    this.skipNextInput = false;

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onBeforeInput = this.onBeforeInput.bind(this);
    this.onInput = this.onInput.bind(this);
    this.onCompositionStart = this.onCompositionStart.bind(this);
    this.onCompositionUpdate = this.onCompositionUpdate.bind(this);
    this.onCompositionEnd = this.onCompositionEnd.bind(this);
    this.onCanvasPointer = this.onCanvasPointer.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onPaste = this.onPaste.bind(this);

    input.addEventListener('keydown', this.onKeyDown);
    input.addEventListener('beforeinput', this.onBeforeInput);
    input.addEventListener('input', this.onInput);
    input.addEventListener('compositionstart', this.onCompositionStart);
    input.addEventListener('compositionupdate', this.onCompositionUpdate);
    input.addEventListener('compositionend', this.onCompositionEnd);
    input.addEventListener('blur', this.onBlur);
    input.addEventListener('paste', this.onPaste);
    document.addEventListener('pointerdown', this.onCanvasPointer);
  }

  destroy() {
    this.input.removeEventListener('keydown', this.onKeyDown);
    this.input.removeEventListener('beforeinput', this.onBeforeInput);
    this.input.removeEventListener('input', this.onInput);
    this.input.removeEventListener('compositionstart', this.onCompositionStart);
    this.input.removeEventListener('compositionupdate', this.onCompositionUpdate);
    this.input.removeEventListener('compositionend', this.onCompositionEnd);
    this.input.removeEventListener('blur', this.onBlur);
    this.input.removeEventListener('paste', this.onPaste);
    document.removeEventListener('pointerdown', this.onCanvasPointer);
  }

  isLatinDirect() { return ['english', 'indonesian'].includes(this.getLanguageMode()); }

  locale() {
    return this.getLanguageMode() === 'english' ? 'en' : this.getLanguageMode() === 'indonesian' ? 'id' : 'vi';
  }

  setActive(active) {
    this.active = Boolean(active);
    if (this.active) this.focus();
  }

  focus() {
    if (!this.active) return;
    requestAnimationFrame(() => {
      try {
        this.input.focus({ preventScroll: true });
        const end = this.input.value.length;
        this.input.setSelectionRange(end, end);
      } catch { /* ignored */ }
    });
  }

  clear({ notify = false } = {}) {
    this.isComposing = false;
    this.rawBuffer = '';
    this.lastCommittedValue = '';
    this.input.value = '';
    if (notify) this.onValue('', { source: 'clear', composing: false });
    this.focus();
  }

  setValue(value, { rawValue = null, notify = false } = {}) {
    const normalized = normalizeText(value, this.locale(), this.getLanguageMode() === 'english' && this.getCaseSensitive());
    this.input.value = normalized;
    this.lastCommittedValue = normalized;
    if (rawValue !== null) this.rawBuffer = rawValue;
    if (notify) this.onValue(normalized, { source: 'programmatic', composing: false });
  }

  onCanvasPointer(event) {
    if (!this.active) return;
    if (event.target.closest('button, select, input:not(#typing-input):not(#arcade-typing), textarea, dialog')) return;
    this.focus();
  }

  onBeforeInput(event) {
    if (!this.active) return;
    if (event.inputType === 'insertFromPaste' || event.inputType === 'insertFromDrop' || event.inputType === 'insertLineBreak') {
      event.preventDefault();
      return;
    }
    if (this.isLatinDirect()) {
      if (event.inputType?.startsWith('insert') || event.inputType === 'deleteContentBackward') event.preventDefault();
      return;
    }
    if (['telex', 'vni'].includes(this.getKeyboardMode())) { event.preventDefault(); return; }
  }

  onPaste(event) {
    if (!this.active) return;
    event.preventDefault();
  }

  onBlur() {
    if (!this.active) return;
    window.setTimeout(() => { if (!document.activeElement?.closest?.('.guide-scheme select')) this.focus(); }, 0);
  }

  onCompositionStart() {
    if (!this.active || this.isLatinDirect()) return;
    if (['telex', 'vni'].includes(this.getKeyboardMode())) return;
    this.isComposing = true;
  }

  onCompositionUpdate() {
    // Intentionally do not commit intermediate IME text. The DOM input owns the
    // composition until compositionend, preventing EVKey/UniKey resets.
  }

  onCompositionEnd() {
    if (!this.active || this.isLatinDirect()) return;
    if (['telex', 'vni'].includes(this.getKeyboardMode())) return;
    this.isComposing = false;
    this.onPreview(null);
    this.commitSystemValue('compositionend');
    this.skipNextInput = true;
    queueMicrotask(() => { this.skipNextInput = false; });
  }

  onInput() {
    if (!this.active || this.isLatinDirect() || this.getKeyboardMode() !== 'system') return;
    if (this.isComposing) { this.onPreview(this.input.value); return; }
    if (this.skipNextInput) return;
    this.commitSystemValue('input');
  }

  commitSystemValue(source) {
    const value = normalizeText(this.input.value, 'vi');
    if (value !== this.input.value) this.input.value = value;
    if (value === this.lastCommittedValue) return;
    this.lastCommittedValue = value;
    this.onValue(value, { source, composing: false, language: 'vietnamese' });
  }

  onKeyDown(event) {
    if (!this.active) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.onEscape();
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    if (this.isLatinDirect()) {
      this.handleLatinKey(event);
      return;
    }

    if (this.getKeyboardMode() === 'system') {
      if (event.key === 'Enter' || event.key === 'ArrowUp' || event.key === 'ArrowDown') event.preventDefault();
      return;
    }

    // Built-in telex/vni: ignore IME-generated keystrokes (EVKey/UniKey sends
    // synthetic Backspaces and composition keys that corrupt rawBuffer).
    if (event.isComposing || event.keyCode === 229) {
      event.preventDefault();
      return;
    }

    if (event.key === 'Backspace') {
      event.preventDefault();
      this.rawBuffer = this.rawBuffer.slice(0, -1);
      this.commitBuiltIn('backspace');
      return;
    }
    if (event.key === ' ') {
      event.preventDefault();
      if (!event.repeat && this.rawBuffer && !this.rawBuffer.endsWith(' ')) {
        this.rawBuffer += ' ';
        this.commitBuiltIn('space');
      }
      return;
    }
    if (event.key === 'Enter') { event.preventDefault(); return; }
    if (event.key.length !== 1 || event.repeat) return;
    if (/[\s<>]/u.test(event.key)) { event.preventDefault(); return; }
    event.preventDefault();
    this.rawBuffer += /^[a-zA-Z]$/.test(event.key) ? event.key.toLocaleLowerCase('vi') : event.key;
    this.commitBuiltIn('keydown');
  }

  handleLatinKey(event) {
    if (event.isComposing || event.keyCode === 229) return;
    if (event.key === 'Backspace') {
      event.preventDefault();
      this.rawBuffer = this.rawBuffer.slice(0, -1);
      this.commitLatin('backspace');
      return;
    }
    if (event.key === ' ') {
      event.preventDefault();
      if (!event.repeat && this.rawBuffer && !this.rawBuffer.endsWith(' ')) {
        this.rawBuffer += ' ';
        this.commitLatin('space');
      }
      return;
    }
    if (event.key === 'Enter' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      return;
    }
    if (event.key.length !== 1 || event.repeat) return;
    if (/[\s<>]/u.test(event.key)) { event.preventDefault(); return; }
    event.preventDefault();
    this.rawBuffer += this.getLanguageMode() === 'english' && this.getCaseSensitive() ? event.key : event.key.toLocaleLowerCase(this.locale());
    this.commitLatin('keydown');
  }

  commitLatin(source) {
    const language = this.getLanguageMode();
    const locale = language === 'indonesian' ? 'id' : 'en';
    const value = normalizeText(this.rawBuffer, locale, language === 'english' && this.getCaseSensitive());
    this.input.value = value;
    this.lastCommittedValue = value;
    this.onValue(value, { source, composing: false, raw: this.rawBuffer, language });
  }

  commitBuiltIn(source) {
    const isVNI = typeof this.getKeyboardMode === 'function' ? this.getKeyboardMode() === 'vni' : this.getKeyboardMode === 'vni';
    const transform = isVNI ? transformVNIText : transformTelexText;
    const value = normalizeText(transform(this.rawBuffer, this.getTargetText()), 'vi');
    this.input.value = value;
    this.lastCommittedValue = value;
    this.onValue(value, { source, composing: false, raw: this.rawBuffer, language: 'vietnamese' });
  }
}
