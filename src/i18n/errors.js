import { normalizeUiLanguage } from './index.js';

export const APP_ERROR_MESSAGES = Object.freeze({
  vi: Object.freeze({
    FILE_REQUIRED: 'Chưa chọn tệp.',
    FILE_TYPE: 'Chỉ hỗ trợ tệp TXT, MD hoặc CSV.',
    FILE_TOO_LARGE: 'Tệp vượt quá giới hạn 2 MB.',
    FILE_READ: 'Không thể đọc tệp.',
    FILE_EMPTY: 'Tệp không có nội dung.',
    URL_INVALID: 'URL không hợp lệ.',
    URL_PROTOCOL: 'Chỉ chấp nhận URL bắt đầu bằng http:// hoặc https://.',
    URL_TOO_LONG: 'URL quá dài.',
    URL_HTTP: 'Trang web trả về lỗi HTTP {{status}}.',
    URL_TOO_LARGE: 'Nội dung URL vượt quá giới hạn 2 MB.',
    URL_JSON: 'Chưa hỗ trợ nhập nội dung JSON từ URL.',
    URL_TYPE: 'URL không trả về loại văn bản được hỗ trợ.',
    URL_EMPTY: 'Không tìm thấy nội dung có thể sử dụng trên trang này.',
    URL_TIMEOUT: 'Quá thời gian tải URL. Hãy thử lại hoặc dán nội dung trực tiếp.',
    CORS_BLOCKED: 'Trang web chặn đọc trực tiếp do CORS. Hãy dán nội dung hoặc dùng proxy backend riêng.',
    WORD_SET_INVALID: 'Danh sách tùy chỉnh không hợp lệ.',
    WORD_SET_SAVE: 'Không thể lưu danh sách. Danh sách có thể quá lớn hoặc lưu trữ trình duyệt đang bị chặn.',
    JSON_INVALID: 'Tệp JSON không hợp lệ.',
    JSON_STRUCTURE: 'JSON không đúng cấu trúc danh sách của game.',
    IMAGE_REQUIRED: 'Chưa chọn ảnh.',
    IMAGE_TYPE: 'Chỉ hỗ trợ PNG, JPG, JPEG hoặc WebP.',
    IMAGE_EMPTY: 'Ảnh đang trống.',
    IMAGE_TOO_LARGE: 'Ảnh vượt quá giới hạn 5 MB.',
    IMAGE_READ: 'Không đọc được ảnh.',
    IMAGE_PROCESS: 'Trình duyệt không hỗ trợ xử lý ảnh.',
    IMAGE_EXPORT: 'Không thể tạo ảnh OCR.',
    OCR_LIBRARY: 'Không tải được thư viện OCR. Hãy kiểm tra kết nối Internet.',
    OCR_DYNAMIC: 'Trình duyệt không hỗ trợ tải OCR động.',
    OCR_INITIALIZE: 'Thư viện OCR đã tải nhưng không thể khởi tạo.',
    OCR_CANCELLED: 'Đã hủy nhận dạng ảnh.',
    AI_NOT_CONFIGURED: 'Chưa cấu hình API {{provider}} hoặc proxy OCR.',
    AI_HTTP: 'API OCR trả về lỗi HTTP {{status}} {{message}}.',
    AI_NETWORK: 'Không thể kết nối API OCR. Hãy kiểm tra mạng hoặc proxy.',
    AI_TIMEOUT: 'API OCR xử lý quá lâu. Hãy thử lại hoặc dùng OCR tại máy.',
    AI_NO_TEXT: 'API OCR không trả về văn bản.',
    AI_RUNTIME: 'Trình duyệt không hỗ trợ mã hóa ảnh để gọi API.',
    AI_PROVIDER_LOCAL: 'OCR tại máy không dùng API.'
  }),
  en: Object.freeze({
    FILE_REQUIRED: 'No file selected.',
    FILE_TYPE: 'Only TXT, MD, and CSV files are supported.',
    FILE_TOO_LARGE: 'The file exceeds the 2 MB limit.',
    FILE_READ: 'The file could not be read.',
    FILE_EMPTY: 'The file is empty.',
    URL_INVALID: 'The URL is invalid.',
    URL_PROTOCOL: 'Only URLs beginning with http:// or https:// are accepted.',
    URL_TOO_LONG: 'The URL is too long.',
    URL_HTTP: 'The website returned HTTP {{status}}.',
    URL_TOO_LARGE: 'The URL content exceeds the 2 MB limit.',
    URL_JSON: 'Importing JSON content from a URL is not supported yet.',
    URL_TYPE: 'The URL did not return a supported text format.',
    URL_EMPTY: 'No usable content was found on this page.',
    URL_TIMEOUT: 'The URL timed out. Try again or paste the content directly.',
    CORS_BLOCKED: 'The website blocks direct reading with CORS. Paste the content or use your own backend proxy.',
    WORD_SET_INVALID: 'The custom word list is invalid.',
    WORD_SET_SAVE: 'The list could not be saved. It may be too large or browser storage may be blocked.',
    JSON_INVALID: 'The JSON file is invalid.',
    JSON_STRUCTURE: 'The JSON does not match the game word-list format.',
    IMAGE_REQUIRED: 'No image selected.',
    IMAGE_TYPE: 'Only PNG, JPG, JPEG, and WebP images are supported.',
    IMAGE_EMPTY: 'The image is empty.',
    IMAGE_TOO_LARGE: 'The image exceeds the 5 MB limit.',
    IMAGE_READ: 'The image could not be read.',
    IMAGE_PROCESS: 'This browser cannot process the image.',
    IMAGE_EXPORT: 'The OCR image could not be created.',
    OCR_LIBRARY: 'The OCR library could not load. Check your Internet connection.',
    OCR_DYNAMIC: 'This browser does not support lazy OCR loading.',
    OCR_INITIALIZE: 'The OCR library loaded but could not initialize.',
    OCR_CANCELLED: 'Image recognition was cancelled.',
    AI_NOT_CONFIGURED: '{{provider}} API or the OCR proxy is not configured.',
    AI_HTTP: 'The OCR API returned HTTP {{status}} {{message}}.',
    AI_NETWORK: 'The OCR API could not be reached. Check the network or proxy.',
    AI_TIMEOUT: 'The OCR API took too long. Try again or use local OCR.',
    AI_NO_TEXT: 'The OCR API returned no text.',
    AI_RUNTIME: 'This browser cannot encode the image for an API request.',
    AI_PROVIDER_LOCAL: 'Local OCR does not use an API.'
  }),
  id: Object.freeze({
    FILE_REQUIRED: 'Belum ada file yang dipilih.',
    FILE_TYPE: 'Hanya file TXT, MD, dan CSV yang didukung.',
    FILE_TOO_LARGE: 'File melebihi batas 2 MB.',
    FILE_READ: 'File tidak dapat dibaca.',
    FILE_EMPTY: 'File tidak berisi teks.',
    URL_INVALID: 'URL tidak valid.',
    URL_PROTOCOL: 'Hanya URL yang diawali http:// atau https:// yang diterima.',
    URL_TOO_LONG: 'URL terlalu panjang.',
    URL_HTTP: 'Situs mengembalikan HTTP {{status}}.',
    URL_TOO_LARGE: 'Konten URL melebihi batas 2 MB.',
    URL_JSON: 'Impor konten JSON dari URL belum didukung.',
    URL_TYPE: 'URL tidak mengembalikan format teks yang didukung.',
    URL_EMPTY: 'Tidak ada konten yang dapat digunakan pada halaman ini.',
    URL_TIMEOUT: 'Waktu pemuatan URL habis. Coba lagi atau tempel konten secara langsung.',
    CORS_BLOCKED: 'Situs memblokir pembacaan langsung melalui CORS. Tempel konten atau gunakan proxy backend Anda.',
    WORD_SET_INVALID: 'Daftar kata kustom tidak valid.',
    WORD_SET_SAVE: 'Daftar tidak dapat disimpan. Ukurannya mungkin terlalu besar atau penyimpanan browser diblokir.',
    JSON_INVALID: 'File JSON tidak valid.',
    JSON_STRUCTURE: 'Struktur JSON tidak sesuai dengan format daftar kata game.',
    IMAGE_REQUIRED: 'Belum ada gambar yang dipilih.',
    IMAGE_TYPE: 'Hanya gambar PNG, JPG, JPEG, dan WebP yang didukung.',
    IMAGE_EMPTY: 'Gambar kosong.',
    IMAGE_TOO_LARGE: 'Gambar melebihi batas 5 MB.',
    IMAGE_READ: 'Gambar tidak dapat dibaca.',
    IMAGE_PROCESS: 'Browser ini tidak dapat memproses gambar.',
    IMAGE_EXPORT: 'Gambar OCR tidak dapat dibuat.',
    OCR_LIBRARY: 'Pustaka OCR tidak dapat dimuat. Periksa koneksi Internet.',
    OCR_DYNAMIC: 'Browser ini tidak mendukung pemuatan OCR dinamis.',
    OCR_INITIALIZE: 'Pustaka OCR berhasil dimuat tetapi tidak dapat dimulai.',
    OCR_CANCELLED: 'Pengenalan gambar dibatalkan.',
    AI_NOT_CONFIGURED: 'API {{provider}} atau proxy OCR belum dikonfigurasi.',
    AI_HTTP: 'API OCR mengembalikan HTTP {{status}} {{message}}.',
    AI_NETWORK: 'API OCR tidak dapat dihubungi. Periksa jaringan atau proxy.',
    AI_TIMEOUT: 'API OCR terlalu lama memproses. Coba lagi atau gunakan OCR lokal.',
    AI_NO_TEXT: 'API OCR tidak mengembalikan teks.',
    AI_RUNTIME: 'Browser ini tidak dapat mengodekan gambar untuk permintaan API.',
    AI_PROVIDER_LOCAL: 'OCR lokal tidak menggunakan API.'
  })
});

function interpolate(template, replacements = {}) {
  return String(template).replace(/\{\{(\w+)\}\}/g, (_match, name) => String(replacements[name] ?? ''));
}

export function appError(code, details = {}) {
  const error = new Error(code);
  error.code = code;
  error.details = details;
  return error;
}

export function localizeError(error, language = 'vi') {
  const lang = normalizeUiLanguage(language);
  const code = String(error?.code || '');
  const template = APP_ERROR_MESSAGES[lang]?.[code] || APP_ERROR_MESSAGES.vi[code];
  return template ? interpolate(template, error?.details) : String(error?.message || error || 'Unknown error');
}
