import { readTextFile } from './FileLoader.js';
import { editorIcon, renderEditorIcons } from './CustomArtwork.js';
import { UrlContentProvider } from './UrlLoader.js';
import {
  buildCustomWordItems,
  calculateWordDifficulty,
  extractWordsByLanguage
} from './WordFilter.js';
import {
  applyWordOrder,
  createOriginalWordSequence,
  deduplicateSequence,
  restoreOriginalOrder,
  splitSourceIntoSentences
} from './LearningOrder.js';
import { validateManualWord } from './CustomWordValidator.js';
import { ImageUploadView } from './ocr/ImageUploadView.js';
import { formatNumber, normalizeUiLanguage, t } from '../i18n/index.js';
import { appError, localizeError } from '../i18n/errors.js';
import { canCreateCustomLesson, consumePasteQuota, getPasteQuota } from '../access/BetaQuotaStore.js';
import { getBetaConfig } from '../access/BetaAccessPolicy.js';
import { countMissingCustomTranslations, enrichCustomTranslations, normalizeTranslationLanguage } from './CustomTranslation.js';
import {
  clearCustomWordSet,
  downloadTextFile,
  parseImportedWordSet,
  saveCustomWordSet,
  serializeWordSet
} from './CustomWordStorage.js';

const SAMPLE_TEXT_VI = 'Khám phá vũ trụ bao la là ước mơ của rất nhiều bạn nhỏ. Các nhà khoa học đang nghiên cứu những hành tinh xa xôi, tìm kiếm sự sống và hiểu thêm về nguồn gốc của Trái Đất. Công nghệ hiện đại giúp chúng ta chế tạo tàu vũ trụ, vệ tinh và kính thiên văn mạnh mẽ hơn. Trong tương lai, con người có thể sinh sống trên sao Hỏa và khám phá những thế giới mới.';
const SAMPLE_TEXT_EN = 'Today I learn English at school. I read a book, write new words and practice with my teacher.';
const SAMPLE_TEXT_ID = 'Hari ini saya belajar Bahasa Indonesia di sekolah. Saya membaca buku, menulis kata baru, dan berlatih dengan guru.';
const $$ = (root, selector) => [...root.querySelectorAll(selector)];

export class CustomLoaderView {
  constructor({ root, initialWordSet = null, initialLanguage = 'vietnamese', initialTranslationLanguage = 'vi', uiLanguage = 'vi', onCreate, onSavedChange, onToast }) {
    if (!root) throw new Error('Thiếu vùng hiển thị Tạo màn chơi.');
    this.root = root;
    this.onCreate = onCreate;
    this.onSavedChange = onSavedChange;
    this.onToast = onToast || (() => {});
    this.uiLanguage = normalizeUiLanguage(uiLanguage);
    this.translationLanguage = normalizeTranslationLanguage(initialTranslationLanguage);
    this.urlProvider = new UrlContentProvider();
    this.language = initialWordSet?.language === 'english' || initialLanguage === 'english' ? 'english' : initialWordSet?.language === 'indonesian' || initialLanguage === 'indonesian' ? 'indonesian' : 'vietnamese';
    this.sourceType = 'paste';
    this.sourceLabel = t(this.uiLanguage, 'pasteText');
    this.rawText = '';
    this.originalSequence = [];
    this.currentSequence = [];
    this.wordOrderMode = 'original';
    this.previewOrderMode = 'original';
    this.previewLimit = 100;
    this.sourceRequest = 0;
    this.sequentialLearning = true;
    this.splitBySentence = false;
    this.keepDuplicates = true;
    this.stats = this.emptyStats();
    this.debounceId = 0;
    this.manualCounter = 0;
    this.elements = this.collectElements();
    this.bindEvents();
    const ocrPanel = document.getElementById('custom-ocr-panel');
    this.ocrView = ocrPanel ? new ImageUploadView({
      root: ocrPanel,
      onToast: this.onToast,
      uiLanguage: this.uiLanguage,
      onText: (text, metadata = {}) => {
        if (!this.acceptSourceText(text)) return;
        this.language = metadata.language === 'english' ? 'english' : metadata.language === 'indonesian' ? 'indonesian' : this.language;
        this.syncLanguageUI();
        this.sourceType = 'ocr';
        this.sourceLabel = metadata.sourceLabel || t(this.uiLanguage, 'imageOcr');
        this.updateCharacterCount();
        this.analyze();
      }
    }) : null;
    this.syncLanguageUI();
    this.switchSource('paste');
    this.setOrderMode('original', { render: false, announce: false });
    if (initialWordSet?.words?.length) this.loadWordSet(initialWordSet, { announce: false });
    else this.render();
  }

  get currentWords() { return this.currentSequence.map((entry) => entry.text); }
  get originalWords() { return this.originalSequence.map((entry) => entry.text); }

  msg(key, replacements = {}) { return t(this.uiLanguage, key, replacements); }
  number(value) { return formatNumber(value, this.uiLanguage); }
  locale() { return this.language === 'english' ? 'en-US' : this.language === 'indonesian' ? 'id-ID' : 'vi-VN'; }

  setUiLanguage(language) {
    this.uiLanguage = normalizeUiLanguage(language);
    this.ocrView?.setUiLanguage?.(this.uiLanguage);
    this.switchSource(this.sourceType);
    this.syncLanguageUI();
    const file = this.elements['custom-file-input']?.files?.[0];
    if (file) this.elements['custom-file-summary'].textContent = `${file.name} · ${(file.size / 1024).toFixed(1)} KB`;
    this.render();
  }

  setTranslationLanguage(language, { render = true } = {}) {
    this.translationLanguage = normalizeTranslationLanguage(language);
    if (render) this.render();
  }

  refresh() {
    this.render();
  }

  emptyStats() {
    return { sourceCharacters: 0, tokensFound: 0, validWords: 0, rejectedWords: 0, duplicateWords: 0, easy: 0, medium: 0, hard: 0, limited: false };
  }

  collectElements() {
    const ids = [
      'custom-source-buttons', 'custom-paste-panel', 'custom-file-panel', 'custom-url-panel', 'custom-textarea',
      'custom-character-count', 'custom-use-sample', 'custom-clear-text', 'custom-analyze', 'custom-file-input',
      'custom-file-summary', 'custom-remove-file', 'custom-url-input', 'custom-url-fetch', 'custom-url-status',
      'custom-case-sensitive', 'custom-allow-symbols', 'custom-deduplicate', 'custom-shuffle', 'custom-vietnamese-only',
      'custom-length-preset', 'custom-min-length', 'custom-max-length', 'custom-preview-search', 'custom-preview-list',
      'custom-preview-more', 'custom-add-input', 'custom-add-button', 'custom-add-error', 'custom-restore-list',
      'custom-clear-list', 'custom-dedupe-list', 'custom-shuffle-list', 'custom-sort-alpha', 'custom-sort-difficulty',
      'custom-original-order', 'custom-copy-list', 'custom-export-txt', 'custom-export-json', 'custom-import-json',
      'custom-import-json-input', 'custom-delete-saved', 'custom-create-button', 'custom-create-status',
      'custom-sequence-spawn', 'custom-sequence-learning', 'custom-keep-duplicates-note', 'custom-split-sentence'
    ];
    const elements = {};
    for (const id of ids) elements[id] = document.getElementById(id);
    elements.stats = $$(this.root, '[data-custom-stat]');
    elements.orderButtons = $$(this.root, '[data-order-mode]');
    elements.languageButtons = $$(this.root, '[data-custom-language]');
    return elements;
  }

  bindEvents() {
    for (const id of ['nouns','verbs','adjectives','common','specialized','compounds']) {
      this.root.querySelector(`#custom-${id}`).addEventListener('change', () => this.analyze());
    }
    this.root.querySelector('#custom-show-difficulty').addEventListener('change', (event) => {
      this.elements['custom-preview-list'].classList.toggle('hide-difficulty', !event.target.checked);
    });
    this.root.querySelector('#custom-show-more').addEventListener('click', () => {
      this.previewLimit += 100;
      this.renderPreview();
    });
    this.root.querySelectorAll('[name="custom-learning-order"]').forEach(input => input.addEventListener('change', () => {
      this.wordOrderMode = input.value;
      this.elements['custom-shuffle'].checked = input.value === 'shuffle';
      this.render();
    }));
    this.elements.languageButtons.forEach((button) => button.addEventListener('click', () => this.setLanguage(button.dataset.customLanguage)));
    $$(this.root, '[data-custom-source]').forEach((button) => {
      button.addEventListener('click', () => this.switchSource(button.dataset.customSource));
    });
    this.elements['custom-textarea'].addEventListener('input', () => {
      this.sourceRequest += 1;
      this.rawText = this.elements['custom-textarea'].value.normalize('NFC');
      this.updateCharacterCount();
      clearTimeout(this.debounceId);
      this.elements['custom-create-button'].disabled = true;
      this.debounceId = setTimeout(() => this.analyze(), 420);
    });
    this.elements['custom-use-sample'].addEventListener('click', () => {
      this.sourceRequest += 1;
      this.rawText = this.language === 'english' ? SAMPLE_TEXT_EN : this.language === 'indonesian' ? SAMPLE_TEXT_ID : SAMPLE_TEXT_VI;
      this.elements['custom-textarea'].value = this.rawText;
      this.updateCharacterCount();
      this.analyze();
    });
    this.elements['custom-clear-text'].addEventListener('click', () => this.clearAllSource());
    this.elements['custom-analyze'].addEventListener('click', () => this.analyze());
    this.elements['custom-file-input'].addEventListener('change', (event) => this.handleFile(event.target.files?.[0]));
    const fileDrop = this.elements['custom-file-input'].closest('.file-drop-zone');
    for (const type of ['dragenter', 'dragover']) fileDrop.addEventListener(type, event => {
      event.preventDefault();
      fileDrop.classList.add('dragging');
    });
    for (const type of ['dragleave', 'drop']) fileDrop.addEventListener(type, event => {
      event.preventDefault();
      fileDrop.classList.remove('dragging');
      if (type === 'drop') void this.handleFile(event.dataTransfer?.files?.[0]);
    });
    this.elements['custom-remove-file'].addEventListener('click', () => {
      this.elements['custom-file-input'].value = '';
      this.elements['custom-file-summary'].textContent = this.msg('noFile');
      this.clearAllSource();
    });
    this.elements['custom-url-fetch'].addEventListener('click', () => this.handleUrl());
    this.elements['custom-url-input'].addEventListener('keydown', (event) => {
      if (event.key === 'Enter') { event.preventDefault(); void this.handleUrl(); }
    });

    for (const id of ['custom-case-sensitive', 'custom-allow-symbols', 'custom-vietnamese-only']) {
      this.elements[id].addEventListener('change', () => this.analyze());
    }
    this.elements['custom-deduplicate'].addEventListener('change', () => {
      this.keepDuplicates = !this.elements['custom-deduplicate'].checked;
      if (this.wordOrderMode === 'original' && !this.keepDuplicates) {
        this.onToast(this.msg('dedupeWarning'), 'warning');
      }
      this.analyze();
    });
    this.elements['custom-shuffle'].addEventListener('change', () => {
      this.wordOrderMode = this.elements['custom-shuffle'].checked ? 'shuffle' : 'original';
      this.render();
    });
    this.elements['custom-length-preset'].addEventListener('change', () => {
      const [min, max] = this.lengthPreset(this.elements['custom-length-preset'].value);
      this.elements['custom-min-length'].value = min;
      this.elements['custom-max-length'].value = max;
      const custom = this.elements['custom-length-preset'].value === 'custom';
      this.elements['custom-min-length'].disabled = !custom;
      this.elements['custom-max-length'].disabled = !custom;
      this.analyze();
    });
    this.elements['custom-min-length'].addEventListener('change', () => this.analyze());
    this.elements['custom-max-length'].addEventListener('change', () => this.analyze());
    this.elements['custom-preview-search'].addEventListener('input', () => { this.previewLimit = 100; this.renderPreview(); });
    this.elements['custom-add-button'].addEventListener('click', () => this.addManualWord());
    this.elements['custom-add-input'].addEventListener('keydown', (event) => {
      if (event.key === 'Enter') { event.preventDefault(); this.addManualWord(); }
    });
    this.elements['custom-restore-list'].addEventListener('click', () => {
      this.currentSequence = restoreOriginalOrder(this.originalSequence);
      this.setOrderMode('original', { announce: false });
      this.onToast(this.msg('restoredOrder'), 'info');
    });
    this.elements['custom-clear-list'].addEventListener('click', () => {
      clearTimeout(this.debounceId);
      this.currentSequence = [];
      this.recalculateStatsFromCurrent();
      this.render();
    });
    this.elements['custom-dedupe-list'].addEventListener('click', () => {
      if (this.wordOrderMode === 'original') this.onToast(this.msg('dedupeDone'), 'warning');
      this.currentSequence = deduplicateSequence(this.currentSequence, this.options().caseSensitive);
      this.keepDuplicates = false;
      this.elements['custom-deduplicate'].checked = true;
      this.recalculateStatsFromCurrent();
      this.render();
    });
    this.elements['custom-original-order']?.addEventListener('click', () => this.setOrderMode('original'));
    this.elements['custom-shuffle-list'].addEventListener('click', () => this.setOrderMode('shuffle'));
    this.elements['custom-sort-alpha'].addEventListener('click', () => this.setOrderMode('alphabetical'));
    this.elements['custom-sort-difficulty'].addEventListener('click', () => this.setOrderMode('difficulty'));
    this.elements['custom-sequence-spawn']?.addEventListener('change', () => {
      if (this.elements['custom-sequence-spawn'].checked) this.sequentialLearning = false;
      this.renderOrderControls();
    });
    this.elements['custom-sequence-learning']?.addEventListener('change', () => {
      if (this.elements['custom-sequence-learning'].checked) this.sequentialLearning = true;
      this.renderOrderControls();
    });
    this.elements['custom-split-sentence']?.addEventListener('change', () => {
      this.splitBySentence = this.elements['custom-split-sentence'].checked;
      const indexes = this.sentenceIndexesForWords(restoreOriginalOrder(this.currentSequence));
      restoreOriginalOrder(this.currentSequence).forEach((entry, index) => {
        this.currentSequence.find(item => item.id === entry.id).sourceSentenceIndex = indexes[index];
      });
    });
    this.elements['custom-copy-list'].addEventListener('click', () => this.copyList());
    this.elements['custom-export-txt'].addEventListener('click', () => this.exportTxt());
    this.elements['custom-export-json'].addEventListener('click', () => this.exportJson());
    this.elements['custom-import-json'].addEventListener('click', () => this.elements['custom-import-json-input'].click());
    this.elements['custom-import-json-input'].addEventListener('change', (event) => this.importJson(event.target.files?.[0]));
    this.elements['custom-delete-saved'].addEventListener('click', () => {
      clearCustomWordSet(this.language);
      this.onSavedChange(null);
      this.onToast(this.msg('deletedCustom'), 'info');
    });
    this.elements['custom-create-button'].addEventListener('click', () => this.createGame());
    this.elements['custom-preview-list'].addEventListener('click', (event) => this.handlePreviewAction(event));
  }

  clearAllSource() {
    clearTimeout(this.debounceId);
    this.debounceId = 0;
    this.sourceRequest += 1;
    this.rawText = '';
    this.elements['custom-textarea'].value = '';
    this.currentSequence = [];
    this.originalSequence = [];
    this.stats = this.emptyStats();
    this.updateCharacterCount();
    this.render();
  }

  lengthPreset(value) {
    const presets = { all: [1, 24], short: [1, 3], medium: [4, 5], long: [6, 7], extra: [8, 24], custom: [1, 24] };
    return presets[value] || presets.all;
  }

  options() {
    const preset = this.elements['custom-length-preset'].value;
    const presetRange = this.lengthPreset(preset);
    const minLength = preset === 'custom' ? Number(this.elements['custom-min-length'].value || 1) : presetRange[0];
    const maxLength = preset === 'custom' ? Number(this.elements['custom-max-length'].value || 24) : presetRange[1];
    return {
      caseSensitive: this.elements['custom-case-sensitive'].checked,
      allowNumbers: this.elements['custom-allow-symbols'].checked,
      allowSymbols: this.elements['custom-allow-symbols'].checked,
      keepPunctuation: this.elements['custom-allow-symbols'].checked,
      deduplicate: !this.keepDuplicates,
      shuffle: false,
      vietnameseOnly: this.language === 'vietnamese' && this.elements['custom-vietnamese-only'].checked,
      language: this.language,
      minLength: Math.max(1, Math.min(minLength, maxLength)),
      maxLength: Math.min(24, Math.max(minLength, maxLength)),
      maxWords: 2000,
      wordOrderMode: this.wordOrderMode,
      sequentialLearning: this.sequentialLearning,
      splitBySentence: this.splitBySentence,
      keepDuplicates: this.keepDuplicates,
      uiLanguage: this.uiLanguage,
      allowPhrases: this.root.querySelector('#custom-compounds').checked,
      nouns: this.root.querySelector('#custom-nouns').checked,
      verbs: this.root.querySelector('#custom-verbs').checked,
      adjectives: this.root.querySelector('#custom-adjectives').checked,
      removeCommon: this.root.querySelector('#custom-common').checked,
      removeSpecialized: this.root.querySelector('#custom-specialized').checked
    };
  }

  setLanguage(language, { analyze = true, announce = true } = {}) {
    this.language = language === 'english' ? 'english' : language === 'indonesian' ? 'indonesian' : 'vietnamese';
    this.syncLanguageUI();
    if (analyze && this.rawText) this.analyze();
    else this.render();
    if (announce) this.onToast(this.msg(this.language === 'english' ? 'contentEn' : this.language === 'indonesian' ? 'contentId' : 'contentVi'), 'info');
  }

  syncLanguageUI() {
    this.elements.languageButtons?.forEach((button) => {
      const selected = button.dataset.customLanguage === this.language;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    if (this.elements['custom-vietnamese-only']) {
      const disabled = this.language !== 'vietnamese';
      this.elements['custom-vietnamese-only'].disabled = disabled;
      this.elements['custom-vietnamese-only'].closest('label')?.classList.toggle('disabled', disabled);
    }
    const ocrLanguage = document.getElementById('custom-ocr-language');
    if (ocrLanguage) ocrLanguage.value = this.language === 'english' ? 'eng' : this.language === 'indonesian' ? 'ind' : 'vie';
    const textarea = this.elements['custom-textarea'];
    if (textarea) textarea.placeholder = this.msg(this.language === 'vietnamese' ? 'pastePlaceholder' : 'pasteLatinPlaceholder');
  }

  setOrderMode(mode, { render = true, announce = true } = {}) {
    this.previewOrderMode = ['original', 'shuffle', 'alphabetical', 'difficulty'].includes(mode) ? mode : 'original';
    this.currentSequence = applyWordOrder(this.currentSequence, this.previewOrderMode);
    this.renderOrderControls();
    if (render) this.render();
    if (announce) {
      const labels = { original: this.msg('originalOrder'), shuffle: this.msg('shuffleOrder'), alphabetical: this.msg('alphabetical'), difficulty: this.msg('byDifficulty') };
      this.onToast(this.msg('selectedOrder', { order: labels[this.previewOrderMode] }), 'info');
    }
  }

  renderOrderControls() {
    this.elements.orderButtons.forEach((button) => {
      const selected = button.dataset.orderMode === this.previewOrderMode;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    this.root.querySelectorAll('[name="custom-learning-order"]').forEach(input => { input.checked = input.value === this.wordOrderMode; });
    if (this.elements['custom-sequence-learning']) this.elements['custom-sequence-learning'].checked = this.sequentialLearning;
    if (this.elements['custom-sequence-spawn']) this.elements['custom-sequence-spawn'].checked = !this.sequentialLearning;
    if (this.elements['custom-split-sentence']) this.elements['custom-split-sentence'].checked = this.splitBySentence;
    if (this.elements['custom-keep-duplicates-note']) {
      this.elements['custom-keep-duplicates-note'].textContent = this.wordOrderMode === 'original' && this.keepDuplicates
        ? this.msg('sequenceKeep')
        : this.wordOrderMode === 'original'
          ? this.msg('sequenceRemoved')
          : this.msg('sequenceSwitch');
    }
  }

  switchSource(source) {
    this.sourceRequest += 1;
    this.sourceType = ['paste', 'file', 'url', 'ocr'].includes(source) ? source : 'paste';
    const labels = { paste: this.msg('pasteText'), file: this.msg('uploadTxt'), url: this.msg('enterUrl'), ocr: this.msg('imageOcr') };
    this.sourceLabel = labels[this.sourceType];
    $$(this.root, '[data-custom-source]').forEach((button) => {
      const selected = button.dataset.customSource === this.sourceType;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    for (const type of ['paste', 'file', 'url', 'ocr']) {
      const panel = this.elements[`custom-${type}-panel`] || document.getElementById(`custom-${type}-panel`);
      panel?.classList.toggle('hidden', this.sourceType !== type);
    }
  }

  updateCharacterCount() {
    this.elements['custom-character-count'].textContent = this.msg('characters', { count: this.number(Array.from(this.rawText).length) });
    this.root.querySelector('#custom-input-count').textContent = `${this.number(Array.from(this.rawText).length)} / ${this.number(100000)}`;
  }

  sentenceIndexesForWords(words) {
    if (!this.splitBySentence) return words.map(() => 0);
    const sentences = splitSourceIntoSentences(this.rawText);
    const result = [];
    let searchStart = 0;
    for (const wordEntry of words) {
      const word = typeof wordEntry === 'string' ? wordEntry : wordEntry.text;
      let assigned = 0;
      for (let sentenceIndex = searchStart; sentenceIndex < sentences.length; sentenceIndex += 1) {
        if (sentences[sentenceIndex].toLocaleLowerCase(this.locale()).includes(word.toLocaleLowerCase(this.locale()))) {
          assigned = sentenceIndex;
          searchStart = sentenceIndex;
          break;
        }
      }
      result.push(assigned);
    }
    return result;
  }

  analyze() {
    clearTimeout(this.debounceId);
    this.debounceId = 0;
    this.previewLimit = 100;
    const options = this.options();
    const result = extractWordsByLanguage(this.rawText, { ...options, shuffle: false, language: this.language });
    const sentenceIndexes = this.sentenceIndexesForWords(result.words);
    this.originalSequence = createOriginalWordSequence(result.words, { source: this.sourceType, sentenceIndexes });
    this.currentSequence = applyWordOrder(this.originalSequence, this.previewOrderMode);
    this.stats = result.stats;
    this.render();
  }

  async handleFile(file) {
    if (!file) return;
    const request = ++this.sourceRequest;
    try {
      this.setStatus(this.msg('readingFile'), 'loading');
      const text = await readTextFile(file);
      if (request !== this.sourceRequest || !this.acceptSourceText(text)) return;
      this.sourceType = 'file';
      this.sourceLabel = file.name;
      this.elements['custom-file-summary'].textContent = `${file.name} · ${(file.size / 1024).toFixed(1)} KB`;
      this.analyze();
      this.onToast(this.msg('readFile', { name: file.name }), 'info');
    } catch (error) {
      if (request !== this.sourceRequest) return;
      this.setStatus(localizeError(error, this.uiLanguage), 'error');
      this.elements['custom-file-input'].value = '';
    }
  }

  async handleUrl() {
    const request = ++this.sourceRequest;
    const button = this.elements['custom-url-fetch'];
    button.disabled = true;
    this.elements['custom-url-status'].textContent = this.msg('loadingContent');
    this.elements['custom-url-status'].className = 'loader-inline-status loading';
    try {
      const result = await this.urlProvider.load(this.elements['custom-url-input'].value);
      if (request !== this.sourceRequest || !this.acceptSourceText(result.text)) return;
      this.sourceType = 'url';
      this.sourceLabel = new URL(result.url).hostname;
      this.elements['custom-url-status'].textContent = this.msg('loadedFrom', { source: this.sourceLabel });
      this.elements['custom-url-status'].className = 'loader-inline-status success';
      this.analyze();
    } catch (error) {
      if (request !== this.sourceRequest) return;
      const message = localizeError(error, this.uiLanguage);
      this.elements['custom-url-status'].textContent = message;
      this.elements['custom-url-status'].className = `loader-inline-status ${error.code === 'CORS_BLOCKED' ? 'warning' : 'error'}`;
      this.setStatus(message, error.code === 'CORS_BLOCKED' ? 'warning' : 'error');
    } finally {
      button.disabled = false;
    }
  }

  acceptSourceText(text) {
    const normalized = String(text || '').normalize('NFC');
    if (Array.from(normalized).length > 100000) {
      this.setStatus('Nội dung vượt quá 100.000 ký tự. Hãy chọn một đoạn ngắn hơn.', 'error');
      return false;
    }
    this.rawText = normalized;
    this.elements['custom-textarea'].value = normalized;
    return true;
  }

  recalculateStatsFromCurrent() {
    const levels = { easy: 0, medium: 0, hard: 0 };
    this.currentSequence.forEach((entry) => { levels[entry.level || calculateWordDifficulty(entry.text, this.language)] += 1; });
    this.stats = { ...this.stats, validWords: this.currentSequence.length, easy: levels.easy, medium: levels.medium, hard: levels.hard };
  }

  render() {
    renderEditorIcons(this.root);
    this.root.querySelector('#custom-list-count').textContent = `(${this.number(this.currentSequence.length)})`;
    this.updateCharacterCount();
    this.recalculateStatsFromCurrent();
    for (const element of this.elements.stats) {
      const key = element.dataset.customStat;
      element.textContent = this.number(this.stats[key] || 0);
    }
    this.renderOrderControls();
    this.renderPreview();
    const enough = this.currentSequence.length >= 10;
    const access = canCreateCustomLesson({ language: this.language, wordCount: this.currentSequence.length, source: this.sourceType });
    this.elements['custom-create-button'].disabled = !enough || !access.allowed;
    const modeLabel = this.wordOrderMode === 'original'
      ? this.msg(this.sequentialLearning ? 'originalSequential' : 'originalSpawn')
      : this.wordOrderMode === 'shuffle' ? this.msg('shuffled') : this.wordOrderMode === 'alphabetical' ? this.msg('alphabetical') : this.msg('byDifficulty');
    let statusMessage;
    let statusType = 'warning';
    if (getBetaConfig().publicMode && access.reason === 'quota-exhausted') {
      statusMessage = this.msg('publicQuotaExhausted');
    } else if (getBetaConfig().publicMode && !access.quota.unlimited) {
      statusMessage = this.msg('publicQuota', { count: this.number(this.currentSequence.length), remaining: this.number(access.quota.remaining), limit: this.number(access.quota.limit) });
      statusType = enough && access.allowed ? 'success' : 'warning';
    } else if (access.reason === 'word-limit') {
      statusMessage = this.msg('betaWordLimit', { count: this.number(this.currentSequence.length), limit: this.number(access.quota.wordLimit) });
    } else if (access.reason === 'quota-exhausted') {
      statusMessage = this.msg('betaQuotaExhausted', { limit: this.number(access.quota.limit) });
    } else if (!enough) {
      statusMessage = this.msg('needTen', { count: this.number(this.currentSequence.length) });
      if (!access.quota.unlimited && access.reason === 'beta-quota') {
        statusMessage += ` ${this.msg('betaQuota', { remaining: this.number(access.quota.remaining), limit: this.number(access.quota.limit), wordLimit: this.number(access.quota.wordLimit) })}`;
      }
    } else if (!access.quota.unlimited && access.reason === 'beta-quota') {
      statusMessage = this.msg('betaReady', { count: this.number(this.currentSequence.length), mode: modeLabel, remaining: this.number(access.quota.remaining) });
      statusType = 'success';
    } else {
      statusMessage = this.msg('readyList', { count: this.number(this.currentSequence.length), mode: modeLabel });
      statusType = 'success';
    }
    const missingMeaningCount = countMissingCustomTranslations(this.currentSequence, {
      language: this.language,
      translationLanguage: this.translationLanguage
    });
    if (missingMeaningCount > 0) {
      statusMessage += this.language === 'vietnamese' && this.uiLanguage === 'vi'
        ? ` ${this.number(missingMeaningCount)} mục chưa có bản dịch trong từ điển cục bộ.`
        : ` ${this.msg('missingMeaningHint', { count: this.number(missingMeaningCount) })}`;
      if (statusType === 'success') statusType = 'warning';
    }
    if (this.stats.limited) statusMessage += ' Danh sách đã giới hạn ở 2.000 mục.';
    this.elements['custom-create-status'].textContent = statusMessage;
    this.elements['custom-create-status'].className = `custom-create-status ${statusType}`;
  }

  renderPreview() {
    const query = this.elements['custom-preview-search'].value.trim().toLocaleLowerCase(this.locale());
    const filtered = query
      ? this.currentSequence.filter((entry) => entry.text.toLocaleLowerCase(this.locale()).includes(query))
      : this.currentSequence;
    const visible = filtered.slice(0, this.previewLimit);
    const displayEntries = enrichCustomTranslations(this.currentSequence, {
      language: this.language,
      translationLanguage: this.translationLanguage
    });
    const displayById = new Map(displayEntries.map((entry) => [entry.id, entry]));
    const fragment = document.createDocumentFragment();
    for (const entry of visible) {
      const currentIndex = this.currentSequence.findIndex((item) => item.id === entry.id);
      const displayEntry = displayById.get(entry.id) || entry;
      const chip = document.createElement('span');
      chip.className = `word-chip ${entry.level || calculateWordDifficulty(entry.text)}`;
      chip.dataset.originalIndex = String(entry.originalIndex);
      if (displayEntry.translationText) chip.title = `${entry.text}: ${displayEntry.translationText}`;
      const order = document.createElement('small');
      order.className = 'word-chip-order';
      order.textContent = String(currentIndex + 1);
      const text = document.createElement('span');
      text.textContent = entry.text;
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.dataset.action = 'edit';
      edit.dataset.entryId = entry.id;
      edit.setAttribute('aria-label', this.msg('editWord', { word: entry.text }));
      edit.title = edit.getAttribute('aria-label');
      edit.append(editorIcon('Pencil'));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.dataset.action = 'remove';
      remove.dataset.entryId = entry.id;
      remove.setAttribute('aria-label', this.msg('removeWord', { word: entry.text }));
      remove.title = remove.getAttribute('aria-label');
      remove.append(editorIcon('X'));
      chip.append(order, text, edit, remove);
      fragment.appendChild(chip);
    }
    this.elements['custom-preview-list'].replaceChildren(fragment);
    if (!visible.length) {
      const empty = document.createElement('p');
      empty.className = 'loader-note';
      empty.textContent = query ? 'Không tìm thấy từ phù hợp.' : 'Chưa có từ trong danh sách.';
      this.elements['custom-preview-list'].append(empty);
    }
    const hiddenCount = Math.max(0, filtered.length - visible.length);
    this.elements['custom-preview-more'].textContent = hiddenCount ? this.msg('otherWords', { count: this.number(hiddenCount) }) : '';
    this.root.querySelector('#custom-show-more').classList.toggle('hidden', !hiddenCount);
  }

  handlePreviewAction(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const index = this.currentSequence.findIndex((entry) => entry.id === button.dataset.entryId);
    if (index < 0) return;
    const entry = this.currentSequence[index];
    if (button.dataset.action === 'remove') {
      this.currentSequence.splice(index, 1);
      this.render();
      return;
    }
    const supportsMeaningPair = this.language !== 'vietnamese';
    const edited = window.prompt(`${this.msg('editWord', { word: entry.text })}${supportsMeaningPair ? ' (word = meaning)' : ''}`, supportsMeaningPair && entry.meaningVi ? `${entry.text} = ${entry.meaningVi}` : entry.text);
    if (edited === null) return;
    const [editedWord, ...meaningParts] = supportsMeaningPair ? edited.split(/\s*(?:=|:|—|–)\s*/u) : [edited];
    const validation = validateManualWord(editedWord, this.options());
    if (!validation.valid) return this.onToast(validation.message, 'error');
    entry.text = validation.value;
    if (supportsMeaningPair && meaningParts.length) {
      entry.meaningVi = meaningParts.join(' = ').trim();
      entry.translationText = entry.meaningVi;
    }
    entry.language = this.language;
    entry.level = calculateWordDifficulty(validation.value, this.language);
    this.render();
  }

  addManualWord() {
    if (this.currentSequence.length >= 2000) return this.onToast(this.msg('maxWords'), 'error');
    const input = this.elements['custom-add-input'];
    const supportsMeaningPair = this.language !== 'vietnamese';
    const [manualWord, ...meaningParts] = supportsMeaningPair ? input.value.split(/\s*(?:=|:|—|–)\s*/u) : [input.value];
    const validation = validateManualWord(manualWord, this.options());
    this.elements['custom-add-error'].textContent = validation.message;
    if (!validation.valid) return;
    const maxOriginalIndex = Math.max(-1, ...this.originalSequence.map((entry) => entry.originalIndex));
    const entry = createOriginalWordSequence([{
      id: `manual-${Date.now()}-${this.manualCounter += 1}`,
      text: validation.value,
      meaningVi: supportsMeaningPair ? meaningParts.join(' = ').trim() : '',
      translationText: supportsMeaningPair ? meaningParts.join(' = ').trim() : '',
      language: this.language,
      level: this.root.querySelector('#custom-add-level').value,
      originalIndex: maxOriginalIndex + 1,
      sourceIndex: maxOriginalIndex + 1,
      manual: true,
      source: 'manual'
    }], { source: 'manual' })[0];
    this.originalSequence.push({ ...entry });
    this.currentSequence.push({ ...entry });
    input.value = '';
    this.render();
  }

  async copyList() {
    try {
      const entries = enrichCustomTranslations(this.currentSequence, {
        language: this.language,
        translationLanguage: this.translationLanguage
      });
      await navigator.clipboard.writeText(entries.map((entry) => this.language !== 'vietnamese' && entry.translationText ? `${entry.text} = ${entry.translationText}` : entry.text).join('\n'));
      this.onToast(this.msg('copiedList'), 'info');
    } catch {
      this.onToast(this.msg('copyBlocked'), 'error');
    }
  }

  buildWordSet() {
    const ordered = applyWordOrder(this.currentSequence, this.wordOrderMode);
    const translated = enrichCustomTranslations(ordered, {
      language: this.language,
      translationLanguage: this.translationLanguage
    });
    return {
      version: 3,
      language: this.language,
      label: `${this.sourceLabel} · ${ordered.length}`,
      source: this.sourceType,
      createdAt: Date.now(),
      rawText: this.rawText,
      translationLanguage: this.translationLanguage,
      options: this.options(),
      words: buildCustomWordItems(translated, this.sourceType, this.language)
    };
  }

  exportTxt() {
    if (!this.currentSequence.length) return this.onToast(this.msg('emptyList'), 'error');
    const filename = this.language === 'english' ? 'orbit-type-english-lesson.txt' : this.language === 'indonesian' ? 'orbit-type-indonesian-lesson.txt' : 'orbit-type-bai-hoc-tieng-viet.txt';
    const entries = enrichCustomTranslations(this.currentSequence, {
      language: this.language,
      translationLanguage: this.translationLanguage
    });
    downloadTextFile(filename, entries.map((entry) => this.language !== 'vietnamese' && entry.translationText ? `${entry.text} = ${entry.translationText}` : entry.text).join('\n'));
  }

  exportJson() {
    if (!this.currentSequence.length) return this.onToast(this.msg('emptyList'), 'error');
    downloadTextFile(`orbit-type-${this.language}-lesson.json`, serializeWordSet(this.buildWordSet()), 'application/json;charset=utf-8');
  }

  async importJson(file) {
    if (!file) return;
    try {
      if (file.size > 2 * 1024 * 1024) throw appError('FILE_TOO_LARGE');
      const wordSet = parseImportedWordSet(await file.text());
      this.loadWordSet(wordSet);
      this.onToast(this.msg('loadedWords', { count: this.number(wordSet.words.length) }), 'info');
    } catch (error) {
      this.onToast(localizeError(error, this.uiLanguage), 'error');
    } finally {
      this.elements['custom-import-json-input'].value = '';
    }
  }

  loadWordSet(wordSet, { announce = true } = {}) {
    clearTimeout(this.debounceId);
    this.sourceRequest += 1;
    this.language = wordSet.language === 'english' || wordSet.words?.every((item) => item.language === 'english') ? 'english' : wordSet.language === 'indonesian' || wordSet.words?.every((item) => item.language === 'indonesian') ? 'indonesian' : 'vietnamese';
    this.syncLanguageUI();
    this.sourceType = wordSet.source || 'custom';
    this.sourceLabel = wordSet.label || this.msg('customList');
    this.rawText = wordSet.rawText || wordSet.words.map((item) => item.text).join(' ');
    this.elements['custom-textarea'].value = this.rawText;
    this.wordOrderMode = wordSet.options?.wordOrderMode || 'original';
    this.sequentialLearning = wordSet.options?.sequentialLearning !== false;
    this.splitBySentence = Boolean(wordSet.options?.splitBySentence);
    this.keepDuplicates = wordSet.options?.keepDuplicates !== false;
    const options = wordSet.options || {};
    for (const [id, key] of Object.entries({ compounds:'allowPhrases', nouns:'nouns', verbs:'verbs', adjectives:'adjectives', common:'removeCommon', specialized:'removeSpecialized' })) {
      this.root.querySelector(`#custom-${id}`).checked = Boolean(options[key]);
    }
    this.elements['custom-case-sensitive'].checked = Boolean(options.caseSensitive);
    this.elements['custom-vietnamese-only'].checked = options.vietnameseOnly !== false;
    this.elements['custom-length-preset'].value = 'custom';
    this.elements['custom-min-length'].value = options.minLength || 1;
    this.elements['custom-max-length'].value = options.maxLength || 24;
    this.elements['custom-min-length'].disabled = false;
    this.elements['custom-max-length'].disabled = false;
    if (this.elements['custom-allow-symbols']) this.elements['custom-allow-symbols'].checked = Boolean(wordSet.options?.allowSymbols);
    this.elements['custom-deduplicate'].checked = !this.keepDuplicates;
    this.elements['custom-shuffle'].checked = this.wordOrderMode === 'shuffle';
    this.originalSequence = createOriginalWordSequence(wordSet.words, { source: this.sourceType });
    this.currentSequence = applyWordOrder(this.originalSequence, this.wordOrderMode);
    this.previewOrderMode = this.wordOrderMode;
    this.stats = extractWordsByLanguage(this.rawText, this.options()).stats;
    this.recalculateStatsFromCurrent();
    this.render();
    if (announce) this.onToast(this.msg('loadedWords', { count: this.number(this.currentSequence.length) }), 'info');
  }

  createGame() {
    if (this.debounceId) this.analyze();
    if (this.currentSequence.length < 10) {
      this.setStatus(this.msg('needTen', { count: this.number(this.currentSequence.length) }), 'error');
      return;
    }
    const access = canCreateCustomLesson({ language: this.language, wordCount: this.currentSequence.length, source: this.sourceType });
    if (!access.allowed) {
      const message = access.reason === 'word-limit'
        ? this.msg('betaWordLimit', { count: this.number(this.currentSequence.length), limit: this.number(access.quota.wordLimit) })
        : getBetaConfig().publicMode ? this.msg('publicQuotaExhausted') : this.msg('betaQuotaExhausted', { limit: this.number(access.quota.limit) });
      this.setStatus(message, 'error');
      return;
    }
    // Public mode has no application-level word-count cap; storage remains subject to browser limits.
    if (!getBetaConfig().publicMode) this.currentSequence = this.currentSequence.slice(0, 2000);
    const wordSet = this.buildWordSet();
    try {
      const saved = saveCustomWordSet(wordSet);
      if (!access.quota.unlimited && access.reason === 'beta-quota') {
        const consumed = consumePasteQuota({ language: this.language, wordCount: saved.words.length, source: this.sourceType });
        if (!consumed.allowed) {
          this.setStatus(this.msg('betaQuotaExhausted', { limit: this.number(access.quota.limit) }), 'error');
          return;
        }
      }
      this.onSavedChange(saved);
      this.onCreate(saved);
      this.setStatus(this.msg('createdWords', { count: this.number(saved.words.length) }), 'success');
    } catch (error) {
      this.setStatus(localizeError(error, this.uiLanguage), 'error');
    }
  }

  setStatus(message, type = 'info') {
    this.elements['custom-create-status'].textContent = message;
    this.elements['custom-create-status'].className = `custom-create-status ${type}`;
  }
}
