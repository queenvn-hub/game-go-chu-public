const VIETNAMESE_LETTERS = /[A-Za-zÀ-ỹĐđ]/u;
const ONLY_VIETNAMESE_LETTERS = /^[A-Za-zÀ-ỹĐđ]+$/u;
const ONLY_ENGLISH_LETTERS = /^[A-Za-z]+$/;
const ONLY_LETTERS_OR_NUMBERS = /^[A-Za-zÀ-ỹĐđ0-9]+$/u;
const EDGE_PUNCTUATION = /^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu;
const FORBIDDEN_SYMBOL_CHARS = /[\s<>]/u;

function isTypeableSymbolTarget(value) {
  if (FORBIDDEN_SYMBOL_CHARS.test(value)) return false;
  return Array.from(value).every((char) => {
    const code = char.codePointAt(0);
    return (code >= 33 && code <= 126) || VIETNAMESE_LETTERS.test(char);
  });
}

export function normalizeCustomWord(value, options = {}) {
  const { caseSensitive = false, language = 'vietnamese', allowSymbols = false, keepPunctuation = false } = options;
  let normalized = String(value ?? '')
    .normalize('NFC')
    .replace(/<[^>]*>/g, '')
    .trim()
    .normalize('NFC');
  if (!allowSymbols && !keepPunctuation) normalized = normalized.replace(EDGE_PUNCTUATION, '').normalize('NFC');
  if (allowSymbols) normalized = normalized.replace(/^\[(\d+):$/u, '$1');
  if (!caseSensitive) normalized = normalized.toLocaleLowerCase(language === 'english' ? 'en' : language === 'indonesian' ? 'id' : 'vi');
  return normalized;
}

export function isLikelyUrlOrEmail(value) {
  const text = String(value || '').trim();
  return /^(?:https?:\/\/|www\.)/i.test(text) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(text);
}

export function isValidGameWord(value, options = {}) {
  if (options.allowPhrases && /\s/u.test(String(value).trim())) {
    const phrase = normalizeCustomWord(value, options);
    return Array.from(phrase).length <= (options.maxLength || 24)
      && Array.from(phrase).length >= (options.minLength || 1)
      && phrase.split(/\s+/u).every(part => isValidGameWord(part, { ...options, allowPhrases: false, minLength: 1 }));
  }
  const {
    caseSensitive = false,
    allowNumbers = false,
    allowSymbols = false,
    keepPunctuation = false,
    vietnameseOnly = true,
    language = 'vietnamese',
    minLength = 1,
    maxLength = 24
  } = options;
  const normalized = normalizeCustomWord(value, { caseSensitive, language, allowSymbols, keepPunctuation });
  const length = Array.from(normalized).length;
  if (!normalized || length < minLength || length > maxLength) return false;
  if (allowSymbols) {
    if (!isTypeableSymbolTarget(normalized) || isLikelyUrlOrEmail(normalized)) return false;
    if (!allowNumbers && /\d/u.test(normalized)) return false;
    return true;
  }
  if (/\s/u.test(normalized) || normalized.includes('-') || normalized.includes('_')) return false;
  if (isLikelyUrlOrEmail(normalized)) return false;
  if (language === 'english' || language === 'indonesian') {
    return allowNumbers ? /^[A-Za-z0-9]+$/.test(normalized) : ONLY_ENGLISH_LETTERS.test(normalized);
  }
  if (allowNumbers) {
    if (!ONLY_LETTERS_OR_NUMBERS.test(normalized)) return false;
  } else if (!ONLY_VIETNAMESE_LETTERS.test(normalized)) return false;
  if (vietnameseOnly && !VIETNAMESE_LETTERS.test(normalized) && !(allowNumbers && /^\d+$/u.test(normalized))) return false;
  return true;
}

export function validateManualWord(value, options = {}) {
  const normalized = normalizeCustomWord(value, options);
  const ui = options.uiLanguage === 'en' ? 'en' : options.uiLanguage === 'id' ? 'id' : 'vi';
  const messages = {
    vi: { empty: 'Hãy nhập một từ.', space: 'Mỗi mục tiêu chỉ được chứa một từ, không có khoảng trắng.', dash: 'Không hỗ trợ dấu gạch nối hoặc gạch dưới.', invalid: 'Từ này không hợp lệ với bộ lọc hiện tại.' },
    en: { empty: 'Enter one word.', space: 'Each target must contain one word without spaces.', dash: 'Hyphens and underscores are not supported.', invalid: 'This word does not match the current filter.' },
    id: { empty: 'Masukkan satu kata.', space: 'Setiap target harus berisi satu kata tanpa spasi.', dash: 'Tanda hubung dan garis bawah tidak didukung.', invalid: 'Kata ini tidak sesuai dengan filter saat ini.' }
  }[ui];
  if (!normalized) return { valid: false, value: '', message: messages.empty };
  if (/\s/u.test(normalized) && !options.allowPhrases) return { valid: false, value: normalized, message: messages.space };
  if (normalized.includes('-') || normalized.includes('_')) return { valid: false, value: normalized, message: messages.dash };
  if (!isValidGameWord(normalized, options)) return { valid: false, value: normalized, message: messages.invalid };
  return { valid: true, value: normalized, message: '' };
}
