import { cleanOcrText } from './OcrTextCleaner.js';
import { resolveTesseractLanguage } from './AiOcrProvider.js';
import { appError } from '../../i18n/errors.js';

const TESSERACT_VERSION = '5.1.1';
const SCRIPT_URL = `https://cdn.jsdelivr.net/npm/tesseract.js@${TESSERACT_VERSION}/dist/tesseract.min.js`;
const WORKER_URL = `https://cdn.jsdelivr.net/npm/tesseract.js@${TESSERACT_VERSION}/dist/worker.min.js`;
const CORE_URL = `https://cdn.jsdelivr.net/npm/tesseract.js-core@${TESSERACT_VERSION}`;
const LANG_URL = 'https://tessdata.projectnaptha.com/4.0.0';

export const OCR_FILE_LIMIT = 5 * 1024 * 1024;
export const OCR_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export function validateOcrImage(file) {
  if (!file) throw appError('IMAGE_REQUIRED');
  const type = String(file.type || '').toLowerCase();
  const extension = String(file.name || '').split('.').pop()?.toLowerCase();
  const acceptedExtension = ['png', 'jpg', 'jpeg', 'webp'].includes(extension);
  if (!OCR_IMAGE_TYPES.has(type) && !acceptedExtension) throw appError('IMAGE_TYPE');
  if (Number(file.size || 0) <= 0) throw appError('IMAGE_EMPTY');
  if (file.size > OCR_FILE_LIMIT) throw appError('IMAGE_TOO_LARGE');
  return true;
}

function loadScript(url, documentObject = globalThis.document) {
  return new Promise((resolve, reject) => {
    if (globalThis.Tesseract?.createWorker) return resolve(globalThis.Tesseract);
    const existing = documentObject?.querySelector?.(`script[data-ocr-script="${url}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(globalThis.Tesseract), { once: true });
      existing.addEventListener('error', () => reject(appError('OCR_LIBRARY')), { once: true });
      return;
    }
    const script = documentObject?.createElement?.('script');
    if (!script) return reject(appError('OCR_DYNAMIC'));
    script.src = url;
    script.async = true;
    script.dataset.ocrScript = url;
    script.onload = () => globalThis.Tesseract?.createWorker
      ? resolve(globalThis.Tesseract)
      : reject(appError('OCR_INITIALIZE'));
    script.onerror = () => {
      script.remove();
      reject(appError('OCR_LIBRARY'));
    };
    documentObject.head.appendChild(script);
  });
}

export class LocalOcrProvider {
  constructor({ logger = () => {}, scriptLoader = loadScript, tesseract = null } = {}) {
    this.logger = logger;
    this.scriptLoader = scriptLoader;
    this.tesseract = tesseract;
    this.worker = null;
    this.cancelled = false;
  }

  async ensureLibrary() {
    if (this.tesseract?.createWorker) return this.tesseract;
    this.tesseract = await this.scriptLoader(SCRIPT_URL);
    return this.tesseract;
  }

  async recognize(image, { language = 'vie' } = {}) {
    this.cancelled = false;
    const Tesseract = await this.ensureLibrary();
    this.logger({ status: 'loading-worker', progress: 0 });
    const trainedLanguages = resolveTesseractLanguage(language);
    this.worker = await Tesseract.createWorker(trainedLanguages, 1, {
      workerPath: WORKER_URL,
      corePath: CORE_URL,
      langPath: LANG_URL,
      logger: (message) => this.logger(message)
    });
    if (this.cancelled) throw appError('OCR_CANCELLED');
    if (this.worker.setParameters) {
      await this.worker.setParameters({
        preserve_interword_spaces: '1',
        tessedit_pageseg_mode: '6'
      });
    }
    const result = await this.worker.recognize(image);
    const text = cleanOcrText(result?.data?.text || '');
    const confidence = Number(result?.data?.confidence || 0);
    await this.terminate();
    return { text, confidence };
  }

  async cancel() {
    this.cancelled = true;
    await this.terminate();
  }

  async terminate() {
    const worker = this.worker;
    this.worker = null;
    if (worker?.terminate) {
      try { await worker.terminate(); } catch { /* ignored */ }
    }
  }
}

export const OCR_RUNTIME_INFO = Object.freeze({
  engine: 'Tesseract.js',
  version: TESSERACT_VERSION,
  lazyLoaded: true,
  imageStaysLocal: true,
  requiresInternetForFirstLoad: true
});
