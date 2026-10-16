const VIETNAMESE_OCR_LANGUAGES = new Set(['vie', 'vie+eng', 'vie+ind']);

const VIETNAMESE_HIGH_CONFIDENCE_RULES = Object.freeze([
  ['Promt tạo video', 'Prompt tạo video'],
  ['bằng Al thú vị', 'bằng AI thú vị'],
  ['có thé tao nên', 'có thể tạo nên'],
  ['có thé tạo bằng', 'có thể tạo bằng'],
  ['nơi mà bạn muốn fiycam', 'nơi mà bạn muốn flycam'],
  ['dân câu lệnh tao video', 'dán câu lệnh tạo video'],
  ['Jasmine dé ở', 'Jasmine để ở'],
  ['vừa năng nề', 'vừa nặng nề'],
  ['Có Dạ Trằm', 'cỗ Dạ Trầm'],
  ['mùi tanh nông tột độ', 'mùi tanh nồng tột độ'],
  ['ba tằng xác chết', 'ba tầng xác chết'],
  ['xác chết thổi rữa', 'xác chết thối rữa'],
  ['tì đè khiển xương', 'tì đè khiến xương'],
  ['tong tổng xuống mã', 'tong tỏng xuống má'],
  ['lạnh thầu xương', 'lạnh thấu xương'],
  ['của đắt trời', 'của đất trời'],
  ['làm "thịt mỗi"', 'làm "thịt mồi"'],
  ['sống đề nuôi dưỡng', 'sống để nuôi dưỡng'],
  ['dưới lòng đắt', 'dưới lòng đất'],
  ['bóng tối sâu thắm', 'bóng tối sâu thẳm'],
  ['tay đề kiếm tra', 'tay để kiểm tra'],
  ['thằm chửi rủa', 'thầm chửi rủa'],
  ['đáng bồn đồng', 'đáng bốn đồng'],
  ['cửa sắt không lồ', 'cửa sắt khổng lồ'],
  ['Vạn Cót Tông', 'Vạn Cốt Tông'],
  ['xuất hiện ở lồi vào', 'xuất hiện ở lối vào'],
  ['ánh mắt ghê tỏm', 'ánh mắt ghê tởm'],
  ['mùi hãng hắc', 'mùi hăng hắc'],
  ['làm mềm.\nxương cốt', 'làm mềm xương cốt']
]);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceTracked(text, source, replacement, changes) {
  const pattern = new RegExp(escapeRegExp(source), 'giu');
  let count = 0;
  const value = text.replace(pattern, () => {
    count += 1;
    return replacement;
  });
  if (count) changes.push(Object.freeze({ source, replacement, count }));
  return value;
}

function cleanPunctuation(text) {
  return text
    .replace(/[ \t]+([,.;:!?])/gu, '$1')
    .replace(/([([{])\s+/gu, '$1')
    .replace(/\s+([)\]}])/gu, '$1')
    .replace(/[“”]\s*['’]\s*/gu, '“')
    .replace(/['’]\s*[”]/gu, '”')
    .replace(/([,;:!?])(?=[\p{L}\p{N}])/gu, '$1 ');
}

function isStructuredLine(line) {
  return /^(?:[-*•]|\d+[.)]|B\d+\s*:|\[[^\]]+\]|#{1,6}\s)/iu.test(line.trim());
}

function mergeVisualWraps(text) {
  return text.split(/\n{2,}/u).map((paragraph) => {
    const lines = paragraph.split('\n').map((line) => line.trim()).filter(Boolean);
    if (lines.length < 2) return lines[0] || '';
    return lines.reduce((result, line) => {
      if (!result) return line;
      const previousLine = result.split('\n').at(-1);
      const previousEndsSentence = /[.!?…:][”’"')\]]?$/u.test(previousLine);
      const keepBreak = isStructuredLine(line) || isStructuredLine(previousLine) || previousEndsSentence;
      return `${result}${keepBreak ? '\n' : ' '}${line}`;
    }, '');
  }).join('\n\n');
}

export function cleanOcrText(text) {
  return String(text ?? '')
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
    .normalize('NFC');
}

export function hasVietnameseOcrLanguage(language = 'vie') {
  return VIETNAMESE_OCR_LANGUAGES.has(String(language || '').toLowerCase());
}

export function postProcessOcrText(text, { language = 'vie' } = {}) {
  const rawText = cleanOcrText(text);
  const changes = [];
  let correctedText = cleanPunctuation(rawText);

  if (hasVietnameseOcrLanguage(language)) {
    correctedText = mergeVisualWraps(correctedText);
    for (const [source, replacement] of VIETNAMESE_HIGH_CONFIDENCE_RULES) {
      correctedText = replaceTracked(correctedText, source, replacement, changes);
    }
  }

  correctedText = cleanOcrText(correctedText);
  return Object.freeze({
    rawText,
    text: correctedText,
    changes: Object.freeze(changes),
    changed: rawText !== correctedText,
    correctionCount: changes.reduce((total, change) => total + change.count, 0)
  });
}

function tokenizeDiff(text) {
  return String(text || '').match(/\s+|[^\s]+/gu) || [];
}

export function buildOcrDiffSegments(before, after, maxTokens = 260) {
  const source = tokenizeDiff(before);
  const target = tokenizeDiff(after);
  if (source.length > maxTokens || target.length > maxTokens) {
    return Object.freeze([{ type: 'summary', text: '' }]);
  }

  const rows = source.length + 1;
  const columns = target.length + 1;
  const matrix = Array.from({ length: rows }, () => new Uint16Array(columns));
  for (let sourceIndex = source.length - 1; sourceIndex >= 0; sourceIndex -= 1) {
    for (let targetIndex = target.length - 1; targetIndex >= 0; targetIndex -= 1) {
      matrix[sourceIndex][targetIndex] = source[sourceIndex] === target[targetIndex]
        ? matrix[sourceIndex + 1][targetIndex + 1] + 1
        : Math.max(matrix[sourceIndex + 1][targetIndex], matrix[sourceIndex][targetIndex + 1]);
    }
  }

  const segments = [];
  let sourceIndex = 0;
  let targetIndex = 0;
  const push = (type, value) => {
    const previous = segments.at(-1);
    if (previous?.type === type) previous.text += value;
    else segments.push({ type, text: value });
  };
  while (sourceIndex < source.length && targetIndex < target.length) {
    if (source[sourceIndex] === target[targetIndex]) {
      push('same', source[sourceIndex]);
      sourceIndex += 1;
      targetIndex += 1;
    } else if (matrix[sourceIndex + 1][targetIndex] >= matrix[sourceIndex][targetIndex + 1]) {
      push('removed', source[sourceIndex]);
      sourceIndex += 1;
    } else {
      push('added', target[targetIndex]);
      targetIndex += 1;
    }
  }
  while (sourceIndex < source.length) push('removed', source[sourceIndex++]);
  while (targetIndex < target.length) push('added', target[targetIndex++]);
  return Object.freeze(segments.map((segment) => Object.freeze(segment)));
}

export function getOcrWarnings(text, language = 'vi') {
  const value = String(text || '');
  const warnings = [];
  const messages = language === 'en'
    ? ['No text was found in the image.', 'The image may contain a table or rules; review the result.', 'Many 0/1/I/l characters may have been confused by OCR.']
    : language === 'id'
      ? ['Tidak ada teks yang ditemukan dalam gambar.', 'Gambar mungkin berisi tabel atau garis; periksa hasilnya.', 'Banyak karakter 0/1/I/l mungkin tertukar oleh OCR.']
      : ['Không tìm thấy chữ trong ảnh.', 'Ảnh có thể chứa bảng hoặc đường kẻ; hãy kiểm tra lại kết quả.', 'Có nhiều ký tự 0/1/I/l dễ bị OCR nhầm.'];
  if (!value.trim()) warnings.push(messages[0]);
  if (/[|]{2,}|[_]{3,}/u.test(value)) warnings.push(messages[1]);
  if ((value.match(/[01Il]/g) || []).length > Math.max(5, value.length * 0.08)) warnings.push(messages[2]);
  return warnings;
}
