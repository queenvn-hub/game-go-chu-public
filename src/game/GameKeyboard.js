import { GAME_KEYBOARD_ROWS, GAME_FUNCTION_KEYS, GAME_NAV_KEYS, GAME_NUMPAD_KEYS, nextKeyGuide, shiftedLabel } from './KeyboardGuide.js';
import { fingerForKey, mountHandGuide } from './HandGuide.js';
import { updateKeyboardHands, showKeyboardHands } from './AnimatedKeyboardHands.js';

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function normalizeLanguage(code) {
  return ['vi', 'en', 'id'].includes(code) ? code : 'en';
}

const UI = {
  vi: { nextKey: 'PHÍM TIẾP THEO', waiting: 'Chờ khóa mục tiêu' },
  en: { nextKey: 'NEXT KEY', waiting: 'Waiting for target' },
  id: { nextKey: 'TOMBOL BERIKUTNYA', waiting: 'Menunggu target' }
};

export function renderGameKeyboard(container, {
  active = false,
  target = '',
  input = '',
  confirmedProgress,
  caseSensitive = false,
  mode = 'vietnamese',
  keyboard = 'telex',
  systemInput = false,
  onGuideSchemeChange,
  focusKeys = [],
  uiLanguage = 'vi'
} = {}) {
  if (!container) return;
  container.classList.toggle('hidden', !active);
  const panel = document.getElementById(container.dataset.guidePanelId || 'typing-guide-panel')
    || document.getElementById('arcade-guide-panel');
  panel?.classList.toggle('hidden', !active);
  showKeyboardHands(container, active && panel?.dataset.hands !== 'off');
  if (!active) return;
  const { next, key: physicalKey, shift } = nextKeyGuide({ target, input, confirmedProgress, caseSensitive, mode, keyboard });
  const signature = JSON.stringify([next, physicalKey, shift, mode, keyboard, systemInput, focusKeys, uiLanguage]);
  // Keep the scheme selector and illustration stable during periodic HUD updates.
  if (container.dataset.guideSignature === signature && container.firstElementChild && panel?.firstElementChild) return;
  container.dataset.guideSignature = signature;
  const focus = new Set(focusKeys.map(key => String(key).toLowerCase()));
  const ui = UI[normalizeLanguage(uiLanguage)] || UI.vi;
  const keycap = (key, cluster = '') => !key ? '<span></span>' : `<i data-key="${escapeHtml(cluster + key)}" class="${!cluster && (key === physicalKey || (key === 'Shift' && shift)) ? 'next' : ''} ${focus.has(key) && !cluster ? 'focus' : ''} ${key.length > 1 ? 'key-special' : ''} ${key === 'Space' ? 'key-space' : ''} ${cluster === 'num-' ? `num-${key === '+' ? 'plus' : key.toLowerCase()}` : ''}">${!cluster && shiftedLabel(key) ? `<small>${escapeHtml(shiftedLabel(key))}</small>` : ''}<b>${escapeHtml(key.length === 1 ? key.toUpperCase() : key)}</b></i>`;
  if (!container.querySelector('.keyboard-full')) container.innerHTML = `<div class="keyboard-full"><div class="game-keyboard-rows"><div class="function-row">${GAME_FUNCTION_KEYS.map(key => keycap(key)).join('')}</div>${GAME_KEYBOARD_ROWS.map(row => `<div>${row.map(key => keycap(key)).join('')}</div>`).join('')}</div><div class="keyboard-nav">${GAME_NAV_KEYS.map(key => keycap(key, 'nav-')).join('')}</div><div class="keyboard-numpad">${GAME_NUMPAD_KEYS.map(key => keycap(key, 'num-')).join('')}</div></div>`;
  container.querySelectorAll('.keyboard-full [data-key]').forEach(cap => {
    cap.classList.toggle('next', cap.dataset.key === physicalKey || (cap.dataset.key === 'Shift' && shift));
    cap.classList.toggle('focus', focus.has(cap.dataset.key));
  });
  if (!panel) return;
  const finger = fingerForKey(physicalKey);
  const names = {
    vi: ['Ngón út trái', 'Ngón áp út trái', 'Ngón giữa trái', 'Ngón trỏ trái', 'Ngón cái trái', 'Ngón trỏ phải', 'Ngón giữa phải', 'Ngón áp út phải', 'Ngón út phải'],
    en: ['Left little finger', 'Left ring finger', 'Left middle finger', 'Left index finger', 'Left thumb', 'Right index finger', 'Right middle finger', 'Right ring finger', 'Right little finger'],
    id: ['Kelingking kiri', 'Jari manis kiri', 'Jari tengah kiri', 'Telunjuk kiri', 'Ibu jari kiri', 'Telunjuk kanan', 'Jari tengah kanan', 'Jari manis kanan', 'Kelingking kanan']
  };
  const lang = normalizeLanguage(uiLanguage), fingerNames = names[lang] || names.vi;
  const tones = ['\u0301', '\u0300', '\u0309', '\u0303', '\u0323'];
  const toneIndex = tones.findIndex((mark, i) => next.normalize('NFD').includes(mark) && physicalKey === (keyboard === 'vni' ? '12345'[i] : 'sfrxj'[i]));
  const toneNames = {
    vi: ['Dấu sắc', 'Dấu huyền', 'Dấu hỏi', 'Dấu ngã', 'Dấu nặng'],
    en: ['Acute tone', 'Grave tone', 'Hook tone', 'Tilde tone', 'Dot tone'],
    id: ['Nada akut', 'Nada rendah', 'Nada kait', 'Nada tilde', 'Nada titik']
  };
  const caption = { vi: 'Hướng dẫn tay', en: 'Hand guide', id: 'Panduan tangan' }[lang];
  const schemeLabel = { vi: 'Hướng dẫn phím', en: 'Key guide', id: 'Panduan tombol' }[lang];
  const shiftName = shift && finger >= 0 ? ` + Shift: ${fingerNames[finger < 4 ? 8 : 0]}` : '';
  panel.innerHTML = `<div class="guide-heading"><span>${escapeHtml(caption)}</span><button type="button" class="hand-guide-toggle" aria-label="${escapeHtml(caption)}" aria-pressed="${panel.dataset.hands !== 'off'}">${panel.dataset.hands !== 'off' ? '●' : '○'}</button></div><div class="game-keyboard-label"><strong>${escapeHtml(physicalKey ? physicalKey.toUpperCase() : '—')}</strong><span>${escapeHtml(toneIndex >= 0 ? toneNames[lang][toneIndex] : physicalKey ? ui.nextKey : ui.waiting)}</span></div><div class="finger-caption" aria-live="polite">${escapeHtml(finger >= 0 ? fingerNames[finger] + shiftName : '—')}</div>${systemInput && mode === 'vietnamese' ? `<label class="guide-scheme">${escapeHtml(schemeLabel)}<select aria-label="${escapeHtml(schemeLabel)}"><option value="telex" ${keyboard !== 'vni' ? 'selected' : ''}>Telex</option><option value="vni" ${keyboard === 'vni' ? 'selected' : ''}>VNI</option></select></label>` : ''}<div class="hand-picture"></div>`;
  panel.querySelector('.hand-guide-toggle').onclick = event => {
    event.stopPropagation();
    panel.dataset.hands = panel.dataset.hands === 'off' ? 'on' : 'off';
    showKeyboardHands(container, panel.dataset.hands !== 'off');
    event.currentTarget.setAttribute('aria-pressed', String(panel.dataset.hands !== 'off'));
    event.currentTarget.textContent = panel.dataset.hands !== 'off' ? '●' : '○';
  };
  const select = panel.querySelector('select');
  if (select) select.onchange = () => onGuideSchemeChange?.(select.value);
  mountHandGuide(container, physicalKey, shift, panel);
  updateKeyboardHands(container, physicalKey, shift);
  showKeyboardHands(container, panel.dataset.hands !== 'off');
}
