import { appError } from '../i18n/errors.js';

export function validateHttpUrl(value) {
  let url;
  try { url = new URL(String(value || '').trim()); } catch { throw appError('URL_INVALID'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw appError('URL_PROTOCOL');
  if (url.href.length > 2048) throw appError('URL_TOO_LONG');
  return url;
}

export function extractReadableTextFromHtml(html) {
  if (typeof DOMParser === 'undefined') {
    return String(html || '')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  const documentNode = new DOMParser().parseFromString(String(html || ''), 'text/html');
  documentNode.querySelectorAll('script,style,nav,header,footer,iframe,noscript,form,svg').forEach((node) => node.remove());
  const root = documentNode.querySelector('article, main, [role="main"]') || documentNode.body;
  return String(root?.textContent || '').replace(/\s+/g, ' ').trim().normalize('NFC');
}

export class UrlContentProvider {
  constructor({ timeoutMs = 12000, maxBytes = 2 * 1024 * 1024 } = {}) {
    this.timeoutMs = timeoutMs;
    this.maxBytes = maxBytes;
  }

  async load(value) {
    const url = validateHttpUrl(value);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(url.href, { signal: controller.signal, mode: 'cors', credentials: 'omit', redirect: 'follow' });
      if (!response.ok) throw appError('URL_HTTP', { status: response.status });
      const length = Number(response.headers.get('content-length') || 0);
      if (length && length > this.maxBytes) throw appError('URL_TOO_LARGE');
      const contentType = String(response.headers.get('content-type') || '').toLocaleLowerCase('en');
      if (contentType.includes('application/json')) throw appError('URL_JSON');
      if (contentType && !contentType.includes('text/html') && !contentType.includes('text/plain') && !contentType.includes('text/markdown')) {
        throw appError('URL_TYPE');
      }
      const text = await response.text();
      if (new Blob([text]).size > this.maxBytes) throw appError('URL_TOO_LARGE');
      const extracted = contentType.includes('text/html') || /<html|<body|<article/i.test(text)
        ? extractReadableTextFromHtml(text)
        : text.normalize('NFC');
      if (!extracted.trim()) throw appError('URL_EMPTY');
      return { text: extracted, url: url.href, contentType: contentType || 'text/plain' };
    } catch (error) {
      if (error?.name === 'AbortError') throw appError('URL_TIMEOUT');
      if (error instanceof TypeError) {
        throw appError('CORS_BLOCKED');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
