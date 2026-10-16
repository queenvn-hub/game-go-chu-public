import { canvasToBlob, preprocessImage } from './ImagePreprocessor.js';
import { LocalOcrProvider, validateOcrImage } from './OcrProvider.js';
import { correctOcrTextWithAi, getDefaultOcrProvider, getOcrProviderAvailability, recognizeImageWithAi } from './AiOcrProvider.js';
import { buildOcrDiffSegments, getOcrWarnings, postProcessOcrText } from './OcrTextCleaner.js';
import { normalizeUiLanguage, t } from '../../i18n/index.js';
import { localizeError } from '../../i18n/errors.js';

function getSelectedOcrLanguage(element) {
  return String(element?.value || 'vie').toLowerCase();
}

function getPrimaryContentLanguage(ocrLanguage) {
  return ocrLanguage === 'eng' ? 'english' : ocrLanguage.startsWith('ind') ? 'indonesian' : 'vietnamese';
}

function getOcrLoadingMessageKey(ocrLanguage) {
  return {
    vie: 'ocrLoadingViOnly',
    'vie+eng': 'ocrLoadingViEn',
    'vie+ind': 'ocrLoadingViId',
    eng: 'ocrLoadingEn',
    ind: 'ocrLoadingId',
    'ind+eng': 'ocrLoadingIdEn'
  }[ocrLanguage] || 'ocrLoadingEn';
}

function getOcrRecognizedMessageKey(ocrLanguage) {
  return {
    vie: 'ocrRecognizedViOnly',
    'vie+eng': 'ocrRecognizedViEn',
    'vie+ind': 'ocrRecognizedViId',
    eng: 'ocrRecognizedEn',
    ind: 'ocrRecognizedId',
    'ind+eng': 'ocrRecognizedIdEn'
  }[ocrLanguage] || 'ocrRecognizedEn';
}

export class ImageUploadView {
  constructor({ root, onText, onToast = () => {}, uiLanguage = 'vi' }) {
    this.root = root;
    this.onText = onText;
    this.onToast = onToast;
    this.uiLanguage = normalizeUiLanguage(uiLanguage);
    this.file = null;
    this.previewUrl = '';
    this.rotation = 0;
    this.rawText = '';
    this.correctedText = '';
    this.localProvider = new LocalOcrProvider({ logger: (message) => this.updateProgress(message) });
    this.abortController = null;
    this.elements = {
      input: root.querySelector('#custom-ocr-input'),
      drop: root.querySelector('#custom-ocr-drop'),
      preview: root.querySelector('#custom-ocr-preview'),
      empty: root.querySelector('#custom-ocr-empty'),
      rotateLeft: root.querySelector('#custom-ocr-rotate-left'),
      rotateRight: root.querySelector('#custom-ocr-rotate-right'),
      grayscale: root.querySelector('#custom-ocr-grayscale'),
      contrast: root.querySelector('#custom-ocr-contrast'),
      contrastValue: root.querySelector('#custom-ocr-contrast-value'),
      recognize: root.querySelector('#custom-ocr-recognize'),
      cancel: root.querySelector('#custom-ocr-cancel'),
      progress: root.querySelector('#custom-ocr-progress'),
      progressBar: root.querySelector('#custom-ocr-progress-bar'),
      status: root.querySelector('#custom-ocr-status'),
      review: root.querySelector('#custom-ocr-review'),
      result: root.querySelector('#custom-ocr-result'),
      rawResult: root.querySelector('#custom-ocr-raw-result'),
      correctionSummary: root.querySelector('#custom-ocr-correction-summary'),
      diff: root.querySelector('#custom-ocr-diff'),
      useRaw: root.querySelector('#custom-ocr-use-raw'),
      useCorrected: root.querySelector('#custom-ocr-use-corrected'),
      proofread: root.querySelector('#custom-ocr-proofread'),
      analyze: root.querySelector('#custom-ocr-analyze'),
      language: root.querySelector('#custom-ocr-language'),
      provider: root.querySelector('#custom-ocr-provider'),
      apiHint: root.querySelector('#custom-ocr-api-hint'),
      sampleButtons: [...root.querySelectorAll('[data-ocr-sample]')]
    };
    if (this.elements.provider) this.elements.provider.value = getDefaultOcrProvider();
    this.refreshProviderOptions();
    this.bind();
  }

  msg(key, replacements = {}) { return t(this.uiLanguage, key, replacements); }
  setUiLanguage(language) {
    this.uiLanguage = normalizeUiLanguage(language);
    this.refreshProviderOptions();
    if (this.elements.diff) this.elements.diff.dataset.label = this.msg('ocrDiffPreview');
  }

  refreshProviderOptions() {
    const availability = getOcrProviderAvailability();
    this.elements.provider?.querySelectorAll('option').forEach((option) => {
      if (option.value in availability) option.disabled = !availability[option.value];
    });
    if (this.elements.provider && !availability[this.elements.provider.value]) {
      this.elements.provider.value = getDefaultOcrProvider();
    }
    if (this.elements.apiHint) {
      const provider = this.elements.provider?.value || 'local';
      this.elements.apiHint.textContent = provider === 'local'
        ? this.msg('ocrLocalHint')
        : availability[provider]
          ? this.msg('ocrApiReadyHint')
          : this.msg('ocrApiConfigHint');
    }
  }

  clearReview() {
    this.rawText = '';
    this.correctedText = '';
    this.elements.result.value = '';
    this.elements.rawResult.value = '';
    this.elements.review?.classList.add('hidden');
    this.elements.diff?.classList.add('hidden');
    this.elements.diff?.replaceChildren();
    this.elements.analyze.disabled = true;
    if (this.elements.proofread) this.elements.proofread.disabled = true;
    this.setReviewButtonState('corrected');
  }

  setReviewButtonState(version) {
    this.elements.useRaw?.classList.toggle('active', version === 'raw');
    this.elements.useCorrected?.classList.toggle('active', version === 'corrected');
  }

  selectReviewVersion(version) {
    const useRaw = version === 'raw';
    this.elements.result.value = useRaw ? this.rawText : this.correctedText;
    this.elements.analyze.disabled = !this.elements.result.value.trim();
    this.setReviewButtonState(useRaw ? 'raw' : 'corrected');
  }

  renderDiff(rawText, correctedText) {
    const diff = this.elements.diff;
    if (!diff) return;
    diff.replaceChildren();
    diff.dataset.label = this.msg('ocrDiffPreview');
    if (rawText === correctedText) {
      diff.classList.add('hidden');
      return;
    }
    const segments = buildOcrDiffSegments(rawText, correctedText);
    for (const segment of segments) {
      const span = document.createElement('span');
      span.className = segment.type;
      span.textContent = segment.type === 'summary' ? this.msg('ocrDiffTooLong') : segment.text;
      diff.appendChild(span);
    }
    diff.classList.remove('hidden');
  }

  renderReview(review) {
    this.rawText = review.rawText;
    this.correctedText = review.text;
    this.elements.rawResult.value = this.rawText;
    this.elements.result.value = this.correctedText;
    this.elements.review?.classList.remove('hidden');
    this.elements.analyze.disabled = !this.correctedText;
    if (this.elements.proofread) this.elements.proofread.disabled = !this.correctedText;
    this.setReviewButtonState('corrected');
    this.renderDiff(this.rawText, this.correctedText);

    if (review.aiProofread) {
      const providerName = review.provider === 'gemini' ? 'Gemini' : 'OpenAI';
      this.elements.correctionSummary.textContent = this.msg('ocrAiProofreadSummary', { provider: providerName });
    } else if (review.provider !== 'local' && review.aiCompared) {
      const providerName = review.provider === 'gemini' ? 'Gemini' : 'OpenAI';
      this.elements.correctionSummary.textContent = this.msg('ocrAiCompared', { provider: providerName });
    } else if (review.correctionCount > 0) {
      this.elements.correctionSummary.textContent = this.msg('ocrCorrectionSummary', { count: review.correctionCount });
    } else {
      this.elements.correctionSummary.textContent = this.msg('ocrNoCorrections');
    }
  }

  bind() {
    this.elements.input.addEventListener('change', (event) => this.setFile(event.target.files?.[0]));
    for (const eventName of ['dragenter', 'dragover']) this.elements.drop.addEventListener(eventName, (event) => {
      event.preventDefault();
      this.elements.drop.classList.add('dragging');
    });
    for (const eventName of ['dragleave', 'drop']) this.elements.drop.addEventListener(eventName, (event) => {
      event.preventDefault();
      this.elements.drop.classList.remove('dragging');
    });
    this.elements.drop.addEventListener('drop', (event) => this.setFile(event.dataTransfer?.files?.[0]));
    this.elements.rotateLeft.addEventListener('click', () => { this.rotation = (this.rotation - 90 + 360) % 360; this.renderPreviewTransform(); });
    this.elements.rotateRight.addEventListener('click', () => { this.rotation = (this.rotation + 90) % 360; this.renderPreviewTransform(); });
    this.elements.contrast.addEventListener('input', () => { this.elements.contrastValue.textContent = `${Number(this.elements.contrast.value).toFixed(1)}×`; });
    this.elements.provider?.addEventListener('change', () => this.refreshProviderOptions());
    this.elements.result?.addEventListener('input', () => {
      this.correctedText = this.elements.result.value;
      this.elements.analyze.disabled = !this.elements.result.value.trim();
      this.setReviewButtonState('corrected');
    });
    this.elements.useRaw?.addEventListener('click', () => this.selectReviewVersion('raw'));
    this.elements.useCorrected?.addEventListener('click', () => this.selectReviewVersion('corrected'));
    this.elements.proofread?.addEventListener('click', () => this.proofread());
    this.elements.recognize.addEventListener('click', () => this.recognize());
    this.elements.cancel.addEventListener('click', () => this.cancel());
    this.elements.analyze.addEventListener('click', () => {
      const text = this.elements.result.value.trim();
      if (!text) return this.onToast(this.msg('ocrNoText'), 'error');
      const ocrLanguage = getSelectedOcrLanguage(this.elements.language);
      const language = getPrimaryContentLanguage(ocrLanguage);
      this.onText(text, { sourceLabel: this.file?.name || this.msg('imageOcr'), language });
    });
    this.elements.sampleButtons.forEach((button) => button.addEventListener('click', () => this.loadSample(button.dataset.ocrSample)));
  }

  async loadSample(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(this.msg('ocrSampleFailed'));
      const blob = await response.blob();
      const file = new File([blob], url.split('/').pop() || 'sample.png', { type: blob.type || 'image/png' });
      this.setFile(file);
    } catch (error) {
      this.onToast(localizeError(error, this.uiLanguage), 'error');
    }
  }

  setFile(file) {
    try {
      validateOcrImage(file);
      this.file = file;
      this.rotation = 0;
      if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = URL.createObjectURL(file);
      this.elements.preview.src = this.previewUrl;
      this.elements.preview.classList.remove('hidden');
      this.elements.empty.classList.add('hidden');
      this.elements.recognize.disabled = false;
      this.elements.status.textContent = `${file.name} · ${(file.size / 1024).toFixed(1)} KB`;
      this.clearReview();
      this.renderPreviewTransform();
    } catch (error) {
      this.onToast(localizeError(error, this.uiLanguage), 'error');
      this.elements.input.value = '';
    }
  }

  renderPreviewTransform() {
    this.elements.preview.style.transform = `rotate(${this.rotation}deg)`;
  }

  updateProgress(message) {
    const progress = Math.round(Math.max(0, Math.min(1, Number(message?.progress || 0))) * 100);
    const labels = {
      'loading tesseract core': this.msg('ocrLoadingCore'),
      'initializing tesseract': this.msg('ocrInitializing'),
      'loading language traineddata': this.msg(getOcrLoadingMessageKey(getSelectedOcrLanguage(this.elements.language))),
      'initializing api': this.msg('ocrPreparing'),
      'recognizing text': this.msg('ocrRecognizing'),
      'loading-worker': this.msg('ocrWorker'),
      'ai-preparing': this.msg('ocrAiPreparing'),
      'ai-sending': this.msg('ocrAiSending'),
      'ai-complete': this.msg('ocrAiComplete')
    };
    this.elements.progress.classList.remove('hidden');
    this.elements.progressBar.style.width = `${progress}%`;
    this.elements.status.textContent = `${labels[message?.status] || message?.status || this.msg('ocrProcessing')}${progress ? ` · ${progress}%` : ''}`;
  }

  async recognizeForReview(blob, { ocrLanguage, selectedProvider }) {
    if (selectedProvider === 'local') {
      const localResult = await this.localProvider.recognize(blob, { language: ocrLanguage });
      return {
        ...postProcessOcrText(localResult.text, { language: ocrLanguage }),
        provider: 'local',
        confidence: localResult.confidence,
        aiCompared: false,
        fallback: false
      };
    }

    const localPromise = this.localProvider.recognize(blob, { language: ocrLanguage });
    const aiPromise = recognizeImageWithAi(blob, {
      provider: selectedProvider,
      language: ocrLanguage,
      signal: this.abortController.signal,
      onProgress: (message) => this.updateProgress(message)
    });
    const [localOutcome, aiOutcome] = await Promise.allSettled([localPromise, aiPromise]);

    if (aiOutcome.status === 'fulfilled') {
      const aiReview = postProcessOcrText(aiOutcome.value.text, { language: ocrLanguage });
      const rawText = localOutcome.status === 'fulfilled' ? localOutcome.value.text : aiReview.rawText;
      return {
        ...aiReview,
        rawText,
        changed: rawText !== aiReview.text,
        provider: selectedProvider,
        confidence: localOutcome.status === 'fulfilled' ? localOutcome.value.confidence : 0,
        aiCompared: localOutcome.status === 'fulfilled',
        fallback: false
      };
    }

    if (localOutcome.status === 'fulfilled') {
      return {
        ...postProcessOcrText(localOutcome.value.text, { language: ocrLanguage }),
        provider: 'local',
        confidence: localOutcome.value.confidence,
        aiCompared: false,
        fallback: true
      };
    }
    throw aiOutcome.reason;
  }

  async recognize() {
    if (!this.file) return this.onToast(this.msg('ocrChooseFirst'), 'error');
    this.elements.recognize.disabled = true;
    if (this.elements.proofread) this.elements.proofread.disabled = true;
    this.elements.cancel.classList.remove('hidden');
    this.abortController = new AbortController();
    try {
      const canvas = await preprocessImage(this.file, {
        rotation: this.rotation,
        grayscale: this.elements.grayscale.checked,
        contrast: Number(this.elements.contrast.value || 1.25)
      });
      const blob = await canvasToBlob(canvas);
      const ocrLanguage = getSelectedOcrLanguage(this.elements.language);
      const selectedProvider = this.elements.provider?.value || 'local';
      const result = await this.recognizeForReview(blob, { ocrLanguage, selectedProvider });
      this.renderReview(result);
      const warnings = getOcrWarnings(result.text, this.uiLanguage);
      const completion = result.provider === 'local'
        ? this.msg('ocrComplete', { confidence: Math.round(result.confidence) })
        : this.msg('ocrCompleteAi', { provider: result.provider === 'gemini' ? 'Gemini' : 'OpenAI' });
      const fallback = result.fallback ? this.msg('ocrFallbackLocal') : '';
      this.elements.status.textContent = `${completion} ${fallback} ${warnings.join(' ')}`.trim();
      this.elements.progressBar.style.width = '100%';
      this.onToast(this.msg(getOcrRecognizedMessageKey(ocrLanguage)), 'info');
    } catch (error) {
      const message = localizeError(error, this.uiLanguage);
      this.elements.status.textContent = message;
      this.onToast(message, 'error');
    } finally {
      this.elements.recognize.disabled = false;
      if (this.elements.proofread) this.elements.proofread.disabled = !this.elements.result.value.trim();
      this.elements.cancel.classList.add('hidden');
      this.abortController = null;
      await this.localProvider.terminate();
    }
  }

  getProofreadProvider() {
    const availability = getOcrProviderAvailability();
    const selected = this.elements.provider?.value;
    if (selected && selected !== 'local' && availability[selected]) return selected;
    return ['gemini', 'openai'].find((provider) => availability[provider]) || '';
  }

  async proofread() {
    const sourceText = this.elements.result?.value.trim();
    if (!sourceText) return this.onToast(this.msg('ocrNoText'), 'error');
    const provider = this.getProofreadProvider();
    if (!provider) return this.onToast(this.msg('ocrProofreadUnavailable'), 'error');

    this.elements.proofread.disabled = true;
    this.elements.recognize.disabled = true;
    this.elements.cancel.classList.remove('hidden');
    this.abortController = new AbortController();
    try {
      const ocrLanguage = getSelectedOcrLanguage(this.elements.language);
      const aiResult = await correctOcrTextWithAi(sourceText, {
        provider,
        language: ocrLanguage,
        signal: this.abortController.signal,
        onProgress: (message) => this.updateProgress(message)
      });
      const localCorrections = postProcessOcrText(aiResult.text, { language: ocrLanguage });
      this.renderReview({
        ...localCorrections,
        rawText: this.rawText || sourceText,
        provider,
        aiCompared: false,
        aiProofread: true,
        fallback: false
      });
      this.elements.status.textContent = this.msg('ocrAiProofreadComplete', { provider: provider === 'gemini' ? 'Gemini' : 'OpenAI' });
      this.elements.progressBar.style.width = '100%';
    } catch (error) {
      const message = localizeError(error, this.uiLanguage);
      this.elements.status.textContent = message;
      this.onToast(message, 'error');
    } finally {
      this.elements.proofread.disabled = !this.elements.result.value.trim();
      this.elements.recognize.disabled = !this.file;
      this.elements.cancel.classList.add('hidden');
      this.abortController = null;
    }
  }

  async cancel() {
    this.abortController?.abort();
    await this.localProvider.cancel();
    this.elements.status.textContent = this.msg('ocrCancelled');
    this.elements.cancel.classList.add('hidden');
    this.elements.recognize.disabled = !this.file;
    if (this.elements.proofread) this.elements.proofread.disabled = !this.elements.result.value.trim();
  }

  destroy() {
    this.abortController?.abort();
    this.localProvider.terminate();
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
  }
}
