import { COURSE_SPEED_OPTIONS, DEFAULT_COURSE_SPEED, FINGER_BY_KEY, KEYBOARD_ROWS, getCourseTemplates, normalizeCourseSpeed } from './CourseConfig.js';
import { generateAdaptiveLesson, generateDynamicLesson } from './DynamicLessonGenerator.js';
import { clearCourseStorage, loadAdaptiveProfile, loadCourseProgress, saveCourseProgress } from './AdaptiveProfile.js';
import { getBetaConfig, getCourseFreeLessonCount, getCourseLessonAccess } from '../access/BetaAccessPolicy.js';
import { t, formatSpeedLabel } from '../i18n/index.js';
import { getProgressionLabel, getProgressionSpec, isProgressionMode, PROGRESSION_TOTAL_SCREENS } from './CourseProgression.js';
import { getLessonScreenCount, getLessonScreenSpec } from './LessonSequence.js';
import { arcadeText } from '../ui/arcade.js';
import { GAME_KEYBOARD_ROWS, GAME_FUNCTION_KEYS, GAME_NAV_KEYS, GAME_NUMPAD_KEYS, nextKeyGuide, shiftedLabel } from '../game/KeyboardGuide.js';
import { fingerForKey, mountHandGuide } from '../game/HandGuide.js';
import { updateKeyboardHands, showKeyboardHands } from '../game/AnimatedKeyboardHands.js';
import { getGrade5VietnameseProgressionScript } from '../data/grade5Curriculum.js';
import { GAME_CONFIG } from '../game/gameConfig.js';

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function normalizeLanguage(code) { return ['vi', 'en', 'id'].includes(code) ? code : 'en'; }
function profileBucket(code) { return code === 'vi' ? 'vietnamese' : code === 'id' ? 'indonesian' : 'english'; }
function languageLabel(code) { return code === 'vi' ? 'TIẾNG VIỆT' : code === 'id' ? 'BAHASA INDONESIA' : 'ENGLISH'; }
function speedLabel(option, uiLanguage = 'vi') {
  return formatSpeedLabel(uiLanguage,option?.value);
}

const UI = {
  vi: {
    badge: 'KHÓA HỌC NỀN TẢNG', title: 'Lộ trình luyện gõ đa ngôn ngữ',
    description: '9 chủ đề cơ bản, mỗi chủ đề có 15 màn và 10 lượt miễn phí. Các bài 10–33 bị khóa.',
    completed: 'bài đã hoàn thành', mastery: 'tiến độ trung bình', speed: 'TỐC ĐỘ BÀI HỌC', adaptive: 'Sinh bài thích nghi', reset: 'Xóa tiến độ',
    lesson: 'BÀI', targets: 'Mục tiêu', pass: 'Qua bài', start: 'SINH VÀ BẮT ĐẦU BÀI', vocabulary: 'Chủ đề', allOpen: 'Bài miễn phí mở; bài trả phí hiển thị để xem trước.', keys: 'Phím', review: 'Ôn tập',
    groupsEnglish: ['01 · Hàng cơ sở', '02 · Hàng trên', '03 · Hàng dưới', '04 · Ghép từ'], groupsConcept: ['01 · Cơ bản', '02 · Từ vựng', '03 · Thực hành', '04 · Ôn tập'],
    screen: 'Màn', screenTarget: 'từ trong màn', length: 'độ dài', foundation: 'CƠ BẢN', advanced: 'NÂNG CAO', shortfall: 'Kho từ hiện có chưa đủ cho quota màn này',
    resetAsk: 'Xóa tiến độ khóa học của ngôn ngữ đang gõ?', resetDone: 'Đã xóa tiến độ khóa học của ngôn ngữ này.', nextKey: 'PHÍM TIẾP THEO', waiting: 'Chờ khóa mục tiêu'
  },
  en: {
    badge: 'FOUNDATION COURSE', title: 'Multilingual typing course',
    description: 'The English home-row foundation stays open. Concept topics include five free foundation screens before advanced vocabulary is locked.',
    completed: 'lessons completed', mastery: 'average progress', speed: 'LESSON SPEED', adaptive: 'Generate adaptive lesson', reset: 'Reset progress',
    lesson: 'LESSON', targets: 'Targets', pass: 'Pass', start: 'GENERATE & START', vocabulary: 'Topic', allOpen: 'Free lessons are open; paid lessons are preview-only.', keys: 'Keys', review: 'Review',
    groupsEnglish: ['01 · Home row', '02 · Top row', '03 · Bottom row', '04 · Words'], groupsConcept: ['01 · Basics', '02 · Vocabulary', '03 · Practice', '04 · Review'],
    screen: 'Screen', screenTarget: 'words in screen', length: 'length', foundation: 'FREE FOUNDATION', advanced: 'ADVANCED VOCABULARY', shortfall: 'The current word bank is below this screen quota',
    resetAsk: 'Reset course progress for the current typing language?', resetDone: 'Course progress for this language was reset.', nextKey: 'NEXT KEY', waiting: 'Waiting for target'
  },
  id: {
    badge: 'KURSUS DASAR', title: 'Jalur latihan mengetik multibahasa',
    description: 'Setiap topik memiliki 15 layar dan 37 target. Lima layar pertama adalah dasar gratis; kosakata lanjutan dikunci.',
    completed: 'pelajaran selesai', mastery: 'rata-rata progres', speed: 'KECEPATAN PELAJARAN', adaptive: 'Buat latihan adaptif', reset: 'Hapus progres',
    lesson: 'PELAJARAN', targets: 'Target', pass: 'Lulus', start: 'BUAT & MULAI', vocabulary: 'Topik', allOpen: 'Pelajaran gratis terbuka; pelajaran berbayar hanya pratinjau.', keys: 'Tombol', review: 'Ulasan',
    groupsEnglish: ['01 · Baris dasar', '02 · Baris atas', '03 · Baris bawah', '04 · Kata'], groupsConcept: ['01 · Dasar', '02 · Kosakata', '03 · Latihan', '04 · Ulasan'],
    screen: 'Layar', screenTarget: 'kata di layar', length: 'panjang', foundation: 'DASAR GRATIS', advanced: 'KOSAKATA LANJUTAN', shortfall: 'Bank kata saat ini belum cukup untuk kuota layar ini',
    resetAsk: 'Hapus progres kursus untuk bahasa ketik saat ini?', resetDone: 'Progres kursus bahasa ini telah dihapus.', nextKey: 'TOMBOL BERIKUT', waiting: 'Menunggu target'
  }
};

const COURSE_DESCRIPTION = Object.freeze({
  vi: '9 ch\u1ee7 \u0111\u1ec1 c\u01a1 b\u1ea3n, m\u1ed7i ch\u1ee7 \u0111\u1ec1 c\u00f3 15 m\u00e0n v\u00e0 10 l\u01b0\u1ee3t mi\u1ec5n ph\u00ed. C\u00e1c b\u00e0i 10\u201333 b\u1ecb kh\u00f3a.',
  en: 'Each topic has 15 screens and 37 targets. The first five are free foundation screens; advanced vocabulary is locked.',
  id: 'Setiap topik memiliki 15 layar dan 37 target. Lima layar pertama adalah dasar gratis; kosakata lanjutan dikunci.'
});

function isCourseProgression(item) { return isProgressionMode(item?.progressionMode); }

function progressionDetail(spec, language = 'vi') {
  if (!spec) return '';
  if (spec.authored) return `${spec.screenWordCount} ${arcadeText(language, 'targets')}`;
  if (spec.targetKind === 'sentence') return language === 'en' ? '1 complete sentence' : language === 'id' ? '1 kalimat lengkap' : '1 c\u00e2u ho\u00e0n ch\u1ec9nh';
  if (spec.targetKind === 'pair') {
    return language === 'en'
      ? `${spec.pairCount || 3} pairs \u00b7 ${spec.screenWordCount} phrases \u00b7 component length ${spec.wordLength}`
      : language === 'id'
        ? `${spec.pairCount || 3} pasangan \u00b7 ${spec.screenWordCount} frasa \u00b7 panjang komponen ${spec.wordLength}`
        : `${spec.pairCount || 3} c\u1eb7p \u00b7 ${spec.screenWordCount} c\u1ee5m t\u1eeb \u00b7 d\u00e0i th\u00e0nh ph\u1ea7n ${spec.wordLength}`;
  }
  return language === 'en'
    ? `${spec.screenWordCount} words \u00b7 length ${spec.wordLength}`
    : language === 'id'
      ? `${spec.screenWordCount} kata \u00b7 panjang ${spec.wordLength}`
      : `${spec.screenWordCount} t\u1eeb \u00b7 d\u00e0i ${spec.wordLength} k\u00fd t\u1ef1`;
}

export class CourseView {
  constructor({ root, wordBank = [], language = 'en', uiLanguage = 'vi', translationLanguage = 'en', onStart, onToast, onLanguageChange, onQuotaStatus }) {
    this.root = root;
    this.wordBank = wordBank;
    this.language = normalizeLanguage(language);
    this.uiLanguage = normalizeLanguage(uiLanguage);
    this.translationLanguage = ['vi', 'en', 'id', 'none'].includes(translationLanguage) ? translationLanguage : 'en';
    this.onStart = onStart;
    this.onToast = onToast;
    this.onLanguageChange = onLanguageChange;
    this.onQuotaStatus = onQuotaStatus;
    this.quotaStatus = null;
    this.profile = loadAdaptiveProfile(this.language);
    this.progress = loadCourseProgress(this.language);
    this.templates = getCourseTemplates(this.language, this.uiLanguage);
    this.selectedId = this.templates.some((item) => item.id === this.progress.currentLessonId)
      ? this.progress.currentLessonId
      : this.templates[0].id;
    this.bind();
    this.render();
    void this.refreshQuotaStatus();
  }

  setContext({ language = this.language, uiLanguage = this.uiLanguage, translationLanguage = this.translationLanguage, wordBank = this.wordBank, profile = null, progress = null } = {}) {
    this.language = normalizeLanguage(language);
    this.uiLanguage = normalizeLanguage(uiLanguage);
    this.translationLanguage = ['vi', 'en', 'id', 'none'].includes(translationLanguage) ? translationLanguage : 'en';
    this.wordBank = Array.isArray(wordBank) ? wordBank : [];
    this.templates = getCourseTemplates(this.language, this.uiLanguage);
    this.profile = profile || loadAdaptiveProfile(this.language);
    this.progress = progress || loadCourseProgress(this.language);
    this.progress.courseSpeed = normalizeCourseSpeed(this.progress.courseSpeed || DEFAULT_COURSE_SPEED);
    this.selectedId = this.templates.some((item) => item.id === this.progress.currentLessonId)
      ? this.progress.currentLessonId
      : this.templates[0].id;
    this.render();
    void this.refreshQuotaStatus();
  }

  bind() {
    this.root.addEventListener('click', (event) => {
      const lessonButton = event.target.closest('[data-course-lesson]');
      if (lessonButton && !lessonButton.disabled) {
        this.selectedId = lessonButton.dataset.courseLesson;
        this.progress.currentLessonId = this.selectedId;
        saveCourseProgress(this.progress, this.language);
        this.render();
        void this.refreshQuotaStatus();
        this.root.querySelector('.lesson-node.selected')?.focus({ preventScroll: true });
        if (globalThis.matchMedia?.('(max-width: 760px)').matches) this.root.querySelector('.course-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (event.target.closest('#course-start-lesson')) return this.startSelected(false);
      if (event.target.closest('#course-start-adaptive')) return this.startSelected(true);
      if (event.target.closest('#course-reset-progress')) {
        const ui = UI[this.uiLanguage] || UI.vi;
        if (globalThis.confirm?.(ui.resetAsk)) {
          clearCourseStorage(this.language);
          this.profile = loadAdaptiveProfile(this.language);
          this.progress = loadCourseProgress(this.language);
          this.templates = getCourseTemplates(this.language, this.uiLanguage);
          this.selectedId = this.templates[0].id;
          this.onToast?.(ui.resetDone, 'info');
          this.render();
        }
      }
    });
    this.root.addEventListener('change', (event) => {
      if (event.target.id === 'course-language-select') return this.onLanguageChange?.(event.target.value);
      if (event.target.id !== 'course-speed-select') return;
      this.progress.courseSpeed = normalizeCourseSpeed(event.target.value);
      saveCourseProgress(this.progress, this.language);
      this.render();
    });
  }

  refresh(profile = null, progress = null) {
    if (profile) this.profile = profile;
    if (progress) this.progress = progress;
    this.progress.courseSpeed = normalizeCourseSpeed(this.progress.courseSpeed || DEFAULT_COURSE_SPEED);
    this.templates = getCourseTemplates(this.language, this.uiLanguage);
    if (!this.templates.some((item) => item.id === this.selectedId)) this.selectedId = this.templates[0].id;
    this.render();
  }

  getVariant(id) { return Number(this.progress.variants?.[id] || 0) + 1; }
  getScreen(item) {
    if (!isCourseProgression(item)) return 1;
    const count = getLessonScreenCount(item.id, this.language);
    const saved = Math.max(1, Number(this.progress.screens?.[item.id] || 1));
    return saved > count && this.progress.completed?.[item.id] ? 1 : Math.min(count, saved);
  }
  getAccess(item, index = this.templates.indexOf(item)) {
    return getCourseLessonAccess({
      language: this.language,
      lessonId: item?.id || '',
      lessonIndex: index,
      screenIndex: this.getScreen(item),
      progressionMode: item?.progressionMode || ''
    });
  }

  isUnlocked(item, index = this.templates.indexOf(item)) {
    return this.getAccess(item, index).allowed;
  }

  selectLesson(id) {
    if (!this.templates.some((item) => item.id === id)) return false;
    this.selectedId = id;
    this.render();
    return true;
  }

  async startSelected(adaptive, { automatic = false } = {}) {
    if (this.starting) return;
    this.starting = true;
    try {
      const selected = this.templates.find((item) => item.id === this.selectedId) || this.templates[0];
      const selectedIndex = this.templates.indexOf(selected);
      const access = adaptive
        ? getCourseLessonAccess({ language: this.language, adaptive: true })
        : this.getAccess(selected, selectedIndex);
      if (!access.allowed) {
        this.onToast?.(t(this.uiLanguage, adaptive ? 'betaLockedAdaptive' : 'betaLockedLesson'), 'warning');
        return;
      }
      const speed = normalizeCourseSpeed(this.progress.courseSpeed || DEFAULT_COURSE_SPEED);
      const screenIndex = this.getScreen(selected);
      if (!adaptive && this.progress.completed?.[selected.id] && Number(this.progress.screens?.[selected.id]) > getLessonScreenCount(selected.id, this.language)) {
        this.progress.screens[selected.id] = 1;
        saveCourseProgress(this.progress, this.language);
      }
      const lesson = adaptive
        ? generateAdaptiveLesson({ wordBank: this.wordBank, profile: this.profile, variant: this.getVariant('adaptive-practice'), speed, language: this.language, uiLanguage: this.uiLanguage })
        : generateDynamicLesson({ templateId: this.selectedId, variant: this.getVariant(this.selectedId), wordBank: this.wordBank, profile: this.profile, speed, language: this.language, uiLanguage: this.uiLanguage, translationLanguage: this.translationLanguage, screenIndex });
      await this.onStart?.(lesson, { automatic });
    } catch {
      this.onToast?.(t(this.uiLanguage, 'quotaUnavailable'), 'warning');
    } finally {
      this.starting = false;
    }
  }

  renderKeyboard(keys = []) {
    const focus = new Set(keys.map((key) => String(key).toLowerCase()));
    return KEYBOARD_ROWS.map((row) => `<div class="course-key-row">${row.map((key) => `<span class="course-key ${focus.has(key) ? 'focus' : ''}" data-finger="${FINGER_BY_KEY[key] || ''}">${escapeHtml(key.toUpperCase())}</span>`).join('')}</div>`).join('');
  }

  courseQuotaLabel(lessonId) {
    const owner = getBetaConfig().ownerMode || globalThis.ORBIT_TYPE_ACCOUNT?.owner === true || this.quotaStatus?.unlimited;
    if (owner) return t(this.uiLanguage, 'quotaUnlimited');
    const used = this.quotaStatus?.allowed ? (this.quotaStatus.course?.[lessonId] ?? 0) : undefined;
    if (!Number.isInteger(used)) return t(this.uiLanguage, 'quotaStatusLoading', { limit: 10 });
    const remaining = 10 - Math.min(10, Math.max(0, used));
    return t(this.uiLanguage, 'quotaCourseUsage', { remaining, limit: 10 });
  }

  async refreshQuotaStatus() {
    if (!this.onQuotaStatus || this.language !== 'vi' || !getBetaConfig().freeVietnameseLessonIds.includes(this.selectedId)) return;
    const lessonId = this.selectedId;
    try {
      const status = await this.onQuotaStatus();
      if (!status || status.allowed === false || lessonId !== this.selectedId || this.language !== 'vi') return;
      this.quotaStatus = status;
      const meter = this.root.querySelector('[data-course-quota]');
      if (meter?.dataset.courseQuota === lessonId) meter.textContent = this.courseQuotaLabel(lessonId);
    } catch { /* Keep the pending meter if the quota service is unavailable. */ }
  }

  setCourseUsage(lessonId, used) {
    if (!Number.isInteger(used)) return;
    this.quotaStatus = { ...(this.quotaStatus || {}), course: { ...(this.quotaStatus?.course || {}), [lessonId]: used } };
    const meter = this.root.querySelector('[data-course-quota]');
    if (meter?.dataset.courseQuota === lessonId) meter.textContent = this.courseQuotaLabel(lessonId);
  }

  renderLessonGroups(selected) {
    const templates = this.templates;
    const ui = UI[this.uiLanguage] || UI.vi;
    if (this.language === 'en') {
      const groups = [
        { title: ui.groupsEnglish[0], items: templates.slice(0, 6) },
        { title: ui.groupsEnglish[1], items: templates.slice(6, 12) },
        { title: ui.groupsEnglish[2], items: templates.slice(12, 16) },
        { title: ui.groupsEnglish[3], items: templates.slice(16) }
      ];
      return groups.map((group) => this.renderGroup(group.title, group.items, selected, templates)).join('');
    }
    const groupSize = Math.ceil(templates.length / 4);
    const groups = ui.groupsConcept.map((title, index) => ({
      title,
      items: templates.slice(index * groupSize, (index + 1) * groupSize)
    })).filter((group) => group.items.length);
    return groups.map((group) => this.renderGroup(group.title, group.items, selected, templates)).join('');
  }

  renderGroup(title, items, selected, allTemplates) {
    const ui = UI[this.uiLanguage] || UI.vi;
    const freeLessonCount = getCourseFreeLessonCount(this.language, this.templates.length);
    const summary = getBetaConfig().ownerMode
      ? ({ vi: 'Chế độ chủ web: mở bài để kiểm tra.', en: 'Owner preview: lessons open for testing.', id: 'Pratinjau pemilik: pelajaran terbuka untuk diuji.' })[this.uiLanguage] || 'Owner preview'
      : t(this.uiLanguage, 'betaAccessSummary', { count: freeLessonCount });
    const [number, heading] = title.split(' · ');
    const finished = items.filter(item => this.progress.completed?.[item.id]).length;
    return `<article class="skill-stage"><header><span>${escapeHtml(number)}</span><div><strong>${escapeHtml(heading || title)}</strong><small>${escapeHtml(summary || ui.allOpen)}</small></div><small class="course-group-progress">${finished}/${items.length} ${escapeHtml(ui.completed)}</small></header><div class="lesson-node-grid">${items.map((item) => {
      const index = allTemplates.indexOf(item);
      const stars = Math.max(0, Math.min(3, Number(this.progress.stars?.[item.id] || 0)));
      const locked = !this.isUnlocked(item, index);
      const title = locked ? t(this.uiLanguage, 'betaLockedLesson') : item.title;
      const screen = this.getScreen(item);
      const progressionLabel = isCourseProgression(item) ? `${escapeHtml(ui.screen)} ${screen}/${getLessonScreenCount(item.id, this.language)}` : '';
      const subLabel = item.targetType === 'concepts'
        ? progressionLabel
        : (item.newKeys?.length ? `${escapeHtml(ui.keys)}: ${escapeHtml(item.newKeys.join(' · ').toUpperCase())}` : escapeHtml(ui.review));
      const done = Boolean(this.progress.completed?.[item.id]);
      const state = locked ? 'lock' : done ? 'check' : 'play';
      return `<button type="button" data-course-lesson="${item.id}" aria-pressed="${item.id === selected.id}" title="${escapeHtml(title)}" class="lesson-node ${item.id === selected.id ? 'selected' : ''}${locked ? ' locked' : ''}${done ? ' completed' : ''}"><span class="lesson-card-label"><i data-course-icon="${state}"></i>${escapeHtml(ui.lesson)} ${index + 1}</span><span class="lesson-card-copy"><b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.description || '')}</small></span><span class="lesson-card-footer"><span><i data-course-icon="target"></i> ≥ ${item.minAccuracy}%<small>${subLabel}</small></span><em>${locked ? escapeHtml(t(this.uiLanguage, 'betaLockedShort')) : done ? `${'★'.repeat(stars) || '✓'}` : escapeHtml(ui.start === UI.vi.start ? 'Luyện tập' : ui.review)}</em></span></button>`;
    }).join('')}</div></article>`;
  }

  render() {
    const ui = UI[this.uiLanguage] || UI.vi;
    const selected = this.templates.find((item) => item.id === this.selectedId) || this.templates[0];
    const selectedIndex = this.templates.indexOf(selected);
    const selectedScreen = this.getScreen(selected);
    const selectedSpec = isCourseProgression(selected) ? getLessonScreenSpec(selected.id, this.language, selectedScreen) : null;
    const selectedAccess = this.getAccess(selected, selectedIndex);
    const startLabel = this.uiLanguage === 'vi'
      ? selectedScreen > 1 ? 'TIẾP TỤC BÀI' : this.progress.completed?.[selected.id] ? 'HỌC LẠI BÀI' : 'BẮT ĐẦU BÀI'
      : arcadeText(this.uiLanguage, selectedScreen > 1 ? 'resume' : 'play');
    const adaptiveAccess = getCourseLessonAccess({ language: this.language, adaptive: true });
    const freeLessonCount = getCourseFreeLessonCount(this.language, this.templates.length);
    const visibleLessons = this.templates.slice(0, freeLessonCount);
    const totalScreens = visibleLessons.reduce((sum, item) => sum + (isCourseProgression(item) ? getLessonScreenCount(item.id, this.language) : 1), 0);
    const finishedScreens = visibleLessons.reduce((sum, item) => {
      const count = isCourseProgression(item) ? getLessonScreenCount(item.id, this.language) : 1;
      return sum + (this.progress.completed?.[item.id] ? count : Math.min(count, Math.max(0, Number(this.progress.screens?.[item.id] || 1) - 1)));
    }, 0);
    const averageMastery = totalScreens ? Math.round(finishedScreens / totalScreens * 1000) / 10 : 0;
    const completed = this.templates.slice(0, freeLessonCount).filter((item) => this.progress.completed?.[item.id]).length;
    const selectedSpeed = normalizeCourseSpeed(this.progress.courseSpeed || DEFAULT_COURSE_SPEED);
    const speedOption = COURSE_SPEED_OPTIONS.find((item) => item.value === selectedSpeed) || COURSE_SPEED_OPTIONS[0];
    const previewWords = this.language === 'vi' ? getGrade5VietnameseProgressionScript(selected.id)?.[selectedScreen - 1] || [] : [];
    const decomposed = previewWords.join('').normalize('NFD').replace(/đ/g, 'd').toLowerCase();
    const markKeys = {'\u0301':'s','\u0300':'f','\u0309':'r','\u0303':'x','\u0323':'j','\u0306':'w','\u031b':'w'};
    const previewKeys = [...new Set([...(decomposed.match(/[a-z]/g) || []), ...[...decomposed].map(char => markKeys[char]).filter(Boolean)])];
    const wordPreview = previewWords.length ? `<div class="course-word-preview" aria-label="${escapeHtml(ui.targets)}">${previewWords.map(word => `<span>${escapeHtml(word)}</span>`).join('')}</div><div class="course-keyboard-preview">${this.renderKeyboard(previewKeys)}</div>` : '';
    const keyboardPreview = !selectedAccess.allowed
      ? `<div class="course-access-locked"><strong>${escapeHtml(t(this.uiLanguage, 'betaLockedLesson'))}</strong><span>${escapeHtml(t(this.uiLanguage, 'betaAccessSummary', { count: freeLessonCount }))}</span></div>`
      : selected.targetType === 'concepts'
      ? `${wordPreview}<div class="course-adaptive-note"><b>${escapeHtml(selectedSpec ? getProgressionLabel(selectedSpec, this.language) : languageLabel(this.language))}</b>${this.language === 'vi' && getBetaConfig().freeVietnameseLessonIds.includes(selected.id) ? `<strong class="course-free-quota" data-course-quota="${escapeHtml(selected.id)}">${escapeHtml(this.courseQuotaLabel(selected.id))}</strong>` : selectedSpec ? `<small>${escapeHtml(ui.screen)} ${selectedSpec.screenIndex} · ${escapeHtml(progressionDetail(selectedSpec, this.uiLanguage))} · ${selectedSpec.totalTargets} ${escapeHtml(ui.targets)}</small>` : ''}</div>`
      : `<div class="course-keyboard-preview">${this.renderKeyboard([...(selected.newKeys || []), ...(selected.reviewKeys || [])])}</div>`;
    this.root.innerHTML = `
      <section class="course-header">
        <img class="course-mascot" src="./assets/course/explorer.png" alt="" width="240" height="240" />
        <div><span class="step-label">${escapeHtml(ui.badge)} · ${escapeHtml(languageLabel(this.language))}</span><h1>${escapeHtml(ui.title)}</h1><p>${escapeHtml(arcadeText(this.uiLanguage, 'overview'))}</p></div>
        <div class="course-summary"><div class="course-progress-ring" style="--progress:${averageMastery}%" aria-hidden="true"><i data-course-icon="rocket"></i></div><div><strong>${completed}/${freeLessonCount}</strong><span> ${escapeHtml(ui.completed)}</span><progress max="100" value="${averageMastery}" aria-label="${escapeHtml(ui.mastery)}"></progress><b>${averageMastery}% ${escapeHtml(ui.mastery)}</b></div></div>
      </section>
      <section class="course-toolbar">
        <label class="course-language-badge"><i data-course-icon="globe"></i><select id="course-language-select" aria-label="${escapeHtml(t(this.uiLanguage, 'courseLabel'))}">${['vi','en','id'].map(code => `<option value="${code}" ${code === this.language ? 'selected' : ''}>${languageLabel(code)}</option>`).join('')}</select></label>
        <label class="course-speed-control" for="course-speed-select"><span>${escapeHtml(ui.speed)}</span><select id="course-speed-select">${COURSE_SPEED_OPTIONS.map((option) => `<option value="${option.value}" ${option.value === selectedSpeed ? 'selected' : ''}>${escapeHtml(speedLabel(option, this.uiLanguage))}</option>`).join('')}</select></label>
        <button id="course-start-adaptive" class="secondary-button" type="button" ${adaptiveAccess.allowed ? '' : 'disabled'}><i data-course-icon="sparkles"></i>${escapeHtml(ui.adaptive)}${adaptiveAccess.allowed ? '' : ` · ${escapeHtml(t(this.uiLanguage, 'betaLockedShort'))}`}</button>
        <button id="course-reset-progress" class="text-button" type="button"><i data-course-icon="trash-2"></i>${escapeHtml(ui.reset)}</button>
      </section>
      <section class="course-layout">
        <div class="skill-tree">${this.renderLessonGroups(selected)}</div>
        <aside class="course-detail">
          <span class="course-detail-number">${escapeHtml(ui.lesson)} ${selectedIndex + 1}${selectedSpec ? ` · ${escapeHtml(ui.screen)} ${selectedSpec.screenIndex}/${selectedSpec.totalScreensPerBlock}` : ''}</span><h2>${escapeHtml(selected.title)}</h2>
          <p>${escapeHtml(selected.description || '')}</p>
          <div class="course-detail-stats"><div><i data-course-icon="layers"></i><strong>${selectedSpec?.totalScreensPerBlock || 1}</strong><span>${escapeHtml(ui.screen)}</span></div><div><i data-course-icon="target"></i><strong>≥ ${selected.minAccuracy}%</strong><span>${escapeHtml(ui.pass)}</span></div><div><i data-course-icon="keyboard"></i><strong>${selectedSpec?.screenWordCount || selected.targetCount}</strong><span>${escapeHtml(ui.targets)}</span></div><div title="${escapeHtml(speedLabel(speedOption, this.uiLanguage))}"><i data-course-icon="timer"></i><strong>${GAME_CONFIG.targetTravelSeconds[selectedSpeed]}s</strong><span>${escapeHtml(ui.speed)}</span></div></div>
          ${keyboardPreview}
          <button id="course-start-lesson" class="primary-button" type="button" ${selectedAccess.allowed ? '' : 'disabled'}><i data-course-icon="${selectedAccess.allowed ? 'play' : 'lock'}"></i><span>${escapeHtml(selectedAccess.allowed ? startLabel : t(this.uiLanguage, 'betaLockedLesson'))}</span><b>→</b></button>
        </aside>
      </section>`;
    this.root.querySelectorAll('[data-course-icon]').forEach(node => {
      const name = node.dataset.courseIcon.replace(/(^|-)(\w)/g, (_, dash, letter) => letter.toUpperCase());
      const icon = globalThis.lucide?.icons?.[name];
      if (icon) node.replaceChildren(globalThis.lucide.createElement(icon, { 'aria-hidden': 'true', width: 22, height: 22 }));
    });
  }
}

export { renderGameKeyboard } from '../game/GameKeyboard.js';
