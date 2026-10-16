import { appError } from '../i18n/errors.js';

const ALLOWED_EXTENSIONS = new Set(['txt', 'md', 'csv']);
export const DEFAULT_MAX_FILE_BYTES = 2 * 1024 * 1024;

export function getFileExtension(name) {
  return String(name || '').split('.').pop()?.toLocaleLowerCase('en') || '';
}

export function validateTextFile(file, maxBytes = DEFAULT_MAX_FILE_BYTES) {
  if (!file) throw appError('FILE_REQUIRED');
  const extension = getFileExtension(file.name);
  if (!ALLOWED_EXTENSIONS.has(extension)) throw appError('FILE_TYPE');
  if (Number(file.size || 0) > maxBytes) throw appError('FILE_TOO_LARGE');
  return true;
}

export async function readTextFile(file, maxBytes = DEFAULT_MAX_FILE_BYTES) {
  validateTextFile(file, maxBytes);
  const text = typeof file.text === 'function'
    ? await file.text()
    : await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(appError('FILE_READ'));
        reader.onload = () => resolve(String(reader.result || ''));
        reader.readAsText(file, 'utf-8');
      });
  const normalized = String(text || '').replace(/^\uFEFF/u, '').normalize('NFC');
  if (!normalized.trim()) throw appError('FILE_EMPTY');
  return normalized;
}
