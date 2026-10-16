import { CONCEPTS } from '../data/multilingualConcepts.js';
import { installPlayMenu } from './play-menu.js';
import { installNeonGame } from './neon-game.js';

export const ARCADE_COPY = Object.freeze({
  vi: { badge: 'TRẠM KHỞI HÀNH', title: 'Sẵn sàng cất cánh?', intro: 'Chọn ngôn ngữ. Gõ từng chữ. Khám phá từng chủ đề.', play: 'Chơi ngay', course: 'Chọn bài học', resume: 'Học tiếp', settings: 'Tùy chỉnh cách chơi', tip: 'Gõ đúng để bắn · Backspace để sửa · Esc để nghỉ', effects: 'Hiệu ứng hình ảnh', low: 'Nhẹ', medium: 'Vừa', high: 'Đầy đủ', next: 'Học tiếp', choose: 'Chọn chủ đề', done: 'Hoàn thành chủ đề!', boundary: 'Bạn đã hoàn thành phần đang mở. Chọn chủ đề khác để luyện tiếp.', metrics: 'WPM: tốc độ gõ quy đổi theo phút. Độ chính xác: tỷ lệ ký tự gõ đúng.', progress: 'Tiến độ được lưu trên trình duyệt này.', error: 'Chưa khớp, em dùng Backspace để sửa nhé.', screens: 'màn', targets: 'mục tiêu', overview: 'Chọn một chủ đề và tiếp tục từ màn đã lưu.', chooseMeaning: 'Chọn nghĩa đúng bên dưới.', trueFalse: 'Hai phần này có cùng nghĩa không?', climb: 'Trả lời đúng để leo cao hơn.' },
  en: { badge: 'LAUNCH STATION', title: 'Ready for takeoff?', intro: 'Choose a language. Type each letter. Explore a new topic.', play: 'Play now', course: 'Choose a lesson', resume: 'Continue learning', settings: 'Customize your game', tip: 'Type to fire · Backspace to correct · Esc to pause', effects: 'Visual effects', low: 'Low', medium: 'Medium', high: 'Full', next: 'Continue learning', choose: 'Choose a topic', done: 'Topic complete!', boundary: 'You finished the available screens. Choose another topic to keep practicing.', metrics: 'WPM: typing speed in words per minute. Accuracy: the share of correctly typed characters.', progress: 'Progress is saved in this browser.', error: 'Not quite. Use Backspace to try again.', screens: 'screens', targets: 'targets', overview: 'Choose a topic and continue from your saved screen.', chooseMeaning: 'Choose the correct meaning below.', trueFalse: 'Do these have the same meaning?', climb: 'Answer correctly to climb higher.' },
  id: { badge: 'STASIUN PELUNCURAN', title: 'Siap lepas landas?', intro: 'Pilih bahasa. Ketik setiap huruf. Jelajahi topik baru.', play: 'Main sekarang', course: 'Pilih pelajaran', resume: 'Lanjut belajar', settings: 'Sesuaikan permainan', tip: 'Ketik untuk menembak · Backspace untuk memperbaiki · Esc untuk jeda', effects: 'Efek visual', low: 'Ringan', medium: 'Sedang', high: 'Lengkap', next: 'Lanjut belajar', choose: 'Pilih topik', done: 'Topik selesai!', boundary: 'Layar yang tersedia sudah selesai. Pilih topik lain untuk berlatih.', metrics: 'WPM: kecepatan mengetik per menit. Akurasi: persentase karakter yang benar.', progress: 'Progres disimpan di browser ini.', error: 'Belum tepat. Gunakan Backspace untuk memperbaiki.', screens: 'layar', targets: 'target', overview: 'Pilih topik dan lanjutkan dari layar yang tersimpan.', chooseMeaning: 'Pilih arti yang benar di bawah.', trueFalse: 'Apakah keduanya memiliki arti yang sama?', climb: 'Jawab dengan benar untuk mendaki lebih tinggi.' }
});

export function arcadeText(language, key) { return (ARCADE_COPY[language] || ARCADE_COPY.vi)[key]; }

export function installArcadeUi({ onPlay, onCourse, onResume, onEffects }) {
  const hero = document.querySelector('.hero-card');
  hero.querySelector('.hero-metrics strong').textContent = CONCEPTS.length;
  hero.querySelector('.hero-visual').classList.add('arcade-hero-visual');
  hero.querySelector('.hero-visual').innerHTML = '<img class="play-ship" src="./assets/play-menu/ship.png" alt=""/><img class="play-red" src="./assets/play-menu/meteor-red.png" alt=""/><img class="play-blue" src="./assets/play-menu/meteor-blue.png" alt=""/><img class="play-explorer" src="./assets/play-menu/explorer.png" alt=""/><span class="play-laser"></span>';
  const actions = document.createElement('div');
  actions.className = 'launch-actions';
  actions.innerHTML = '<button type="button" class="primary-button" data-arcade="play"></button><button type="button" class="secondary-button" data-arcade="resume"></button><button type="button" class="inline-link-button" data-arcade="course"></button><p data-arcade-copy="tip"></p>';
  hero.querySelector('.hero-copy').after(actions);
  actions.querySelector('[data-arcade="play"]').addEventListener('click', onPlay);
  actions.querySelector('[data-arcade="course"]').addEventListener('click', onCourse);
  actions.querySelector('[data-arcade="resume"]').addEventListener('click', onResume);

  const playMenu = installPlayMenu();
  installNeonGame();
  const effects = document.createElement('label');
  effects.className = 'effects-control';
  effects.innerHTML = '<span data-arcade-copy="effects"></span><select id="visual-effects"><option value="low" data-arcade-copy="low"></option><option value="medium" data-arcade-copy="medium"></option><option value="high" data-arcade-copy="high"></option></select>';
  document.querySelector('.sound-mixer').append(effects);
  effects.querySelector('select').addEventListener('change', event => onEffects(event.target.value));
  const note = document.createElement('p');
  note.className = 'result-explanation';
  note.dataset.arcadeCopy = 'metrics';
  document.querySelector('.result-grid').after(note);

  // Keep focus inside an open dialog and return it when the dialog closes.
  let previousFocus = null;
  for (const dialog of document.querySelectorAll('.overlay[role="dialog"]')) {
    new MutationObserver(() => {
      if (!dialog.classList.contains('hidden')) {
        previousFocus = document.activeElement;
        dialog.querySelector('button:not([disabled])')?.focus();
      } else if (previousFocus?.isConnected && !previousFocus.closest('.hidden')) previousFocus.focus();
    }).observe(dialog, { attributes: true, attributeFilter: ['class'] });
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const nodes = [...dialog.querySelectorAll('button:not([disabled]), input, select, summary, a[href]')].filter(node => node.getClientRects().length);
      const first = nodes[0], last = nodes.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
  }
  return {
    render(language, effectLevel) {
      const copy = ARCADE_COPY[language] || ARCADE_COPY.vi;
      playMenu.render(language);
      document.querySelectorAll('[data-arcade-copy]').forEach(node => { node.textContent = copy[node.dataset.arcadeCopy]; });
      actions.querySelectorAll('[data-arcade]').forEach(node => { node.textContent = copy[node.dataset.arcade]; });
      effects.querySelector('select').value = effectLevel;
      document.documentElement.dataset.effects = effectLevel;
    }
  };
}
