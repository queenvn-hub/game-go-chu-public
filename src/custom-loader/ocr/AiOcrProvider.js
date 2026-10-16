import { cleanOcrText } from './OcrTextCleaner.js';
import { appError } from '../../i18n/errors.js';

export const OCR_PROVIDER_IDS = Object.freeze(['local', 'gemini', 'openai']);

export const OCR_LANGUAGE_IDS = Object.freeze(['vie', 'vie+eng', 'vie+ind', 'eng', 'ind', 'ind+eng']);

const DEFAULT_TIMEOUT = 45_000;

function runtimeConfig() {
  const config = globalThis.ORBIT_TYPE_OCR_CONFIG || {};
  return {
    activeProvider: OCR_PROVIDER_IDS.includes(config.activeProvider) ? config.activeProvider : 'local',
    allowBrowserDirectApi: config.allowBrowserDirectApi === true,
    requestTimeoutMs: Math.max(5_000, Number(config.requestTimeoutMs) || DEFAULT_TIMEOUT),
    proxyEndpoint: String(config.proxyEndpoint || config.proxy?.endpoint || '').trim(),
    gemini: {
      apiKey: String(config.gemini?.apiKey || '').trim(),
      model: String(config.gemini?.model || 'gemini-2.5-flash').trim(),
      endpoint: String(config.gemini?.endpoint || 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent').trim()
    },
    openai: {
      apiKey: String(config.openai?.apiKey || '').trim(),
      model: String(config.openai?.model || 'gpt-5-mini').trim(),
      endpoint: String(config.openai?.endpoint || 'https://api.openai.com/v1/responses').trim()
    }
  };
}

function directProviderConfigured(provider, config) {
  if (!config.allowBrowserDirectApi || !['gemini', 'openai'].includes(provider)) return false;
  return Boolean(config[provider]?.apiKey && config[provider]?.model && config[provider]?.endpoint);
}

export function getOcrProviderAvailability() {
  const config = runtimeConfig();
  return Object.freeze({
    local: true,
    gemini: Boolean(config.proxyEndpoint) || directProviderConfigured('gemini', config),
    openai: Boolean(config.proxyEndpoint) || directProviderConfigured('openai', config)
  });
}

export function getDefaultOcrProvider() {
  const config = runtimeConfig();
  return getOcrProviderAvailability()[config.activeProvider] ? config.activeProvider : 'local';
}

export function resolveTesseractLanguage(language = 'vie') {
  const value = String(language || 'vie').toLowerCase();
  if (OCR_LANGUAGE_IDS.includes(value)) return value;
  return 'eng';
}

export function buildOcrPrompt(language = 'vie') {
  const value = String(language || 'vie').toLowerCase();
  const languageHint = {
    vie: 'The image contains Vietnamese only.',
    'vie+eng': 'The image may contain Vietnamese and English.',
    'vie+ind': 'The image may contain Vietnamese and Indonesian.',
    eng: 'The image contains English only.',
    ind: 'The image contains Indonesian only.',
    'ind+eng': 'The image may contain Indonesian and English.'
  }[value] || 'The image contains English only.';
  return [
    'Transcribe every visible printed character in this image as faithfully as possible.',
    languageHint,
    'Preserve Vietnamese diacritics exactly, including ă â ê ô ơ ư đ and all tone marks.',
    'Keep the original line breaks, capitalization, numbers, punctuation, arrows, and symbols.',
    'Use sentence context only to resolve obvious visual recognition confusions such as missing Vietnamese tone marks or similar-looking letters.',
    'Do not rewrite the author, translate, summarize, modernize spelling, or change a proper name when the image is uncertain.',
    'Return only the extracted text.'
  ].join(' ');
}

export function buildOcrProofreadPrompt(text, language = 'vie') {
  const value = String(language || 'vie').toLowerCase();
  const languageHint = {
    vie: 'The text is Vietnamese.',
    'vie+eng': 'The text may contain Vietnamese and English.',
    'vie+ind': 'The text may contain Vietnamese and Indonesian.',
    eng: 'The text is English.',
    ind: 'The text is Indonesian.',
    'ind+eng': 'The text may contain Indonesian and English.'
  }[value] || 'The text may contain Vietnamese.';
  return [
    'Proofread this text after OCR.',
    languageHint,
    'Correct only high-confidence OCR mistakes, spelling mistakes, missing Vietnamese diacritics, and obvious punctuation errors.',
    'Preserve the meaning, author style, paragraph breaks, line breaks, capitalization, numbers, symbols, headings, quotations, and every proper name or fictional term.',
    'Do not summarize, translate, rewrite, modernize, or add information. If a word is uncertain, keep the original word.',
    'Return only the corrected text with no explanation, labels, or Markdown fences.',
    'Text to proofread:',
    String(text ?? '')
  ].join('\n');
}

async function blobToBase64(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  if (typeof globalThis.btoa === 'function') return globalThis.btoa(binary);
  if (globalThis.Buffer) return globalThis.Buffer.from(bytes).toString('base64');
  throw appError('AI_RUNTIME');
}

function imageDataUrl(mimeType, base64) {
  return `data:${mimeType || 'image/png'};base64,${base64}`;
}

async function requestJson(url, options, { signal, timeoutMs }) {
  const controller = new AbortController();
  let timedOut = false;
  let timeoutId = 0;
  const abortFromCaller = () => controller.abort();
  if (signal) {
    if (signal.aborted) throw appError('OCR_CANCELLED');
    signal.addEventListener('abort', abortFromCaller, { once: true });
  }
  timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    let data = null;
    try { data = await response.json(); } catch { data = null; }
    if (!response.ok) throw appError('AI_HTTP', { status: response.status, message: data?.error?.message || data?.message || '' });
    return data;
  } catch (error) {
    if (error?.code === 'AI_HTTP') throw error;
    if (error?.name === 'AbortError') throw appError(timedOut ? 'AI_TIMEOUT' : 'OCR_CANCELLED');
    throw appError('AI_NETWORK');
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener?.('abort', abortFromCaller);
  }
}

function endpointWithModel(endpoint, model) {
  return endpoint.replace('{model}', encodeURIComponent(model));
}

async function callGemini({ config, prompt, mimeType, base64, signal, onProgress }) {
  onProgress?.({ status: 'ai-sending', progress: 0.35 });
  return requestJson(endpointWithModel(config.gemini.endpoint, config.gemini.model), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.gemini.apiKey },
    body: JSON.stringify({
      contents: [{ parts: [
        { text: prompt },
        { inline_data: { mime_type: mimeType || 'image/png', data: base64 } }
      ] }],
      generationConfig: { temperature: 0 }
    })
  }, { signal, timeoutMs: config.requestTimeoutMs });
}

async function callOpenAi({ config, prompt, mimeType, base64, signal, onProgress }) {
  onProgress?.({ status: 'ai-sending', progress: 0.35 });
  return requestJson(config.openai.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.openai.apiKey}` },
    body: JSON.stringify({
      model: config.openai.model,
      input: [{
        role: 'user',
        content: [
          { type: 'input_text', text: prompt },
          { type: 'input_image', image_url: imageDataUrl(mimeType, base64), detail: 'high' }
        ]
      }]
    })
  }, { signal, timeoutMs: config.requestTimeoutMs });
}

async function callProxy({ config, provider, prompt, mimeType, base64, signal, onProgress }) {
  onProgress?.({ status: 'ai-sending', progress: 0.35 });
  return requestJson(config.proxyEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      task: 'ocr',
      provider,
      prompt,
      image: { mimeType: mimeType || 'image/png', base64 }
    })
  }, { signal, timeoutMs: config.requestTimeoutMs });
}

async function callGeminiText({ config, prompt, signal, onProgress }) {
  onProgress?.({ status: 'ai-sending', progress: 0.35 });
  return requestJson(endpointWithModel(config.gemini.endpoint, config.gemini.model), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.gemini.apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0 }
    })
  }, { signal, timeoutMs: config.requestTimeoutMs });
}

async function callOpenAiText({ config, prompt, signal, onProgress }) {
  onProgress?.({ status: 'ai-sending', progress: 0.35 });
  return requestJson(config.openai.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.openai.apiKey}` },
    body: JSON.stringify({
      model: config.openai.model,
      input: [{
        role: 'user',
        content: [{ type: 'input_text', text: prompt }]
      }]
    })
  }, { signal, timeoutMs: config.requestTimeoutMs });
}

async function callProofreadProxy({ config, provider, prompt, signal, onProgress }) {
  onProgress?.({ status: 'ai-sending', progress: 0.35 });
  return requestJson(config.proxyEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ task: 'ocr-proofread', provider, prompt })
  }, { signal, timeoutMs: config.requestTimeoutMs });
}

function extractResponseText(data) {
  if (typeof data?.text === 'string') return data.text;
  if (typeof data?.output_text === 'string') return data.output_text;
  const candidates = data?.candidates || [];
  const candidateText = candidates
    .flatMap((candidate) => candidate?.content?.parts || [])
    .map((part) => part?.text)
    .filter(Boolean)
    .join('');
  if (candidateText) return candidateText;
  return (data?.output || [])
    .flatMap((item) => item?.content || [])
    .map((part) => part?.text)
    .filter(Boolean)
    .join('');
}

function removeMarkdownFence(text) {
  return String(text || '')
    .replace(/^\s*```(?:text|plaintext)?\s*/iu, '')
    .replace(/\s*```\s*$/u, '')
    .trim();
}

export async function recognizeImageWithAi(image, { provider = getDefaultOcrProvider(), language = 'vie', signal, onProgress } = {}) {
  const config = runtimeConfig();
  const chosenProvider = OCR_PROVIDER_IDS.includes(provider) ? provider : getDefaultOcrProvider();
  if (chosenProvider === 'local') throw appError('AI_PROVIDER_LOCAL');
  if (!getOcrProviderAvailability()[chosenProvider]) throw appError('AI_NOT_CONFIGURED', { provider: chosenProvider });
  if (!image?.arrayBuffer) throw appError('IMAGE_READ');

  onProgress?.({ status: 'ai-preparing', progress: 0.1 });
  const mimeType = String(image.type || 'image/png');
  const base64 = await blobToBase64(image);
  const prompt = buildOcrPrompt(language);
  const data = config.proxyEndpoint
    ? await callProxy({ config, provider: chosenProvider, prompt, mimeType, base64, signal, onProgress })
    : chosenProvider === 'gemini'
      ? await callGemini({ config, prompt, mimeType, base64, signal, onProgress })
      : await callOpenAi({ config, prompt, mimeType, base64, signal, onProgress });
  const text = cleanOcrText(removeMarkdownFence(extractResponseText(data)));
  if (!text) throw appError('AI_NO_TEXT');
  onProgress?.({ status: 'ai-complete', progress: 1 });
  return { text, confidence: Number(data?.confidence || 0), provider: chosenProvider };
}

export async function correctOcrTextWithAi(text, { provider = getDefaultOcrProvider(), language = 'vie', signal, onProgress } = {}) {
  const config = runtimeConfig();
  const chosenProvider = OCR_PROVIDER_IDS.includes(provider) ? provider : getDefaultOcrProvider();
  if (chosenProvider === 'local') throw appError('AI_PROVIDER_LOCAL');
  if (!getOcrProviderAvailability()[chosenProvider]) throw appError('AI_NOT_CONFIGURED', { provider: chosenProvider });

  const sourceText = cleanOcrText(text);
  if (!sourceText) throw appError('AI_NO_TEXT');
  onProgress?.({ status: 'ai-preparing', progress: 0.1 });
  const prompt = buildOcrProofreadPrompt(sourceText, language);
  const data = config.proxyEndpoint
    ? await callProofreadProxy({ config, provider: chosenProvider, prompt, signal, onProgress })
    : chosenProvider === 'gemini'
      ? await callGeminiText({ config, prompt, signal, onProgress })
      : await callOpenAiText({ config, prompt, signal, onProgress });
  const correctedText = cleanOcrText(removeMarkdownFence(extractResponseText(data)));
  if (!correctedText) throw appError('AI_NO_TEXT');
  onProgress?.({ status: 'ai-complete', progress: 1 });
  return { text: correctedText, provider: chosenProvider };
}

export const AI_OCR_RUNTIME_INFO = Object.freeze({
  supports: ['gemini', 'openai'],
  browserDirectKeysAreUnsafe: true,
  proxySupported: true
});
