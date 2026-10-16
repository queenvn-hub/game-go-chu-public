import { buildConceptWords } from './data/multilingualConcepts.js';
import { GRADE5_TOPICS, GRADE5_VOCABULARY, buildGrade5Words } from './data/grade5Curriculum.js';
import { applyTranslations, formatNumber, formatSpeedLabel, normalizeUiLanguage, t } from './i18n/index.js';
import { GAME_CONFIG } from './game/gameConfig.js';
import { GameEngine } from './game/GameEngine.js';
import { InputEngine } from './game/InputEngine.js';
import { escapeHtml } from './game/text.js';
import { CustomLoaderView } from './custom-loader/CustomLoaderView.js';
import { applyWordOrder } from './custom-loader/LearningOrder.js';
import { loadCustomWordSet } from './custom-loader/CustomWordStorage.js';
import { enrichCustomTranslations } from './custom-loader/CustomTranslation.js';
import { CourseView, renderGameKeyboard } from './course/CourseView.js';
import { calculateStars, loadAdaptiveProfile, loadCourseProgress, recordAdaptiveSession, recordCourseResult, resetCourseLessonProgress, saveAdaptiveProfile, saveCourseProgress } from './course/AdaptiveProfile.js';
import { getCourseTemplate } from './course/CourseConfig.js';
import { isFreeCourseAttemptFinal, PROGRESSION_FREE_SCREENS, PROGRESSION_TOTAL_SCREENS } from './course/CourseProgression.js';
import { getBetaConfig, getCourseLessonAccess } from './access/BetaAccessPolicy.js';
import { loadAccessAccount, consumeQuota, getQuotaStatus } from './access/QuotaClient.js';
import { MiniGamesView } from './minigames/MiniGamesView.js';
import { saveGameResult } from './progress/GameProgress.js';
import { installArcadeUi, arcadeText } from './ui/arcade.js';
import { appendScreenResult } from './course/SessionSummary.js';

const STORAGE_KEY = 'orbit_type_trilingual_settings_v1';
const TRIAL_STORAGE_KEY = 'orbit_type_trilingual_trialSignup_v1';
const AUDIO_MIX_VERSION = 2;
// Load before target measurement so glyph positions and projectile endpoints agree.
const gameFontsReady = document.fonts ? Promise.allSettled([
  document.fonts.load('800 32px "Baloo 2"', 'Nguyễn trường phượng ă â ê ô ơ ư đ'),
  document.fonts.load('700 18px Nunito', 'Tiếng Việt English Indonesia'),
]) : Promise.resolve();
const DEFAULT_SETTINGS = {
  mode: 'vietnamese',
  typingLanguage: 'vi',
  interfaceLanguage: 'vi',
  translationLanguage: 'en',
  englishInitialized: false,
  keyboard: 'system',
  guideKeyboard: 'telex',
  vietnameseDiacritics: 'accented',
  difficulty: 'medium',
  wordLevel: 'auto',
  topic: 'all',
  wordSource: 'default',
  sound: true,
  effects: 'medium',
  audioMixVersion: AUDIO_MIX_VERSION,
  masterVolume: 1,
  sfxVolume: 1,
  englishCaseSensitive: false,
  meaningMode: 'immediate',
  highScores: { vietnamese: 0, english: 0, indonesian: 0 },
  bestAccuracy: 0,
  plays: 0
};


function modeToTypingLanguage(mode) {
  return mode === 'english' ? 'en' : mode === 'indonesian' ? 'id' : 'vi';
}

function typingLanguageToMode(code) {
  return code === 'en' ? 'english' : code === 'id' ? 'indonesian' : 'vietnamese';
}

function engineLanguageMode() {
  if (settings.mode === 'vietnamese' && settings.vietnameseDiacritics === 'plain') return 'plain';
  return settings.mode;
}

function currentTypingCode() {
  return settings.typingLanguage || modeToTypingLanguage(settings.mode);
}

function buildDefaultWordBank(language, translationLanguage) {
  return buildGrade5Words(language, translationLanguage);
}

function buildCourseWordBank(language, translationLanguage) {
  return language === 'en' ? buildConceptWords(language, translationLanguage) : buildGrade5Words(language, translationLanguage);
}

function languageLabel(code) {
  return code === 'en' ? 'English' : code === 'id' ? 'Bahasa Indonesia' : code === 'none' ? t(settings.interfaceLanguage, 'noTranslation') : 'Tiếng Việt';
}

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const elements = {
  menuScreen: $('#menu-screen'),
  gameScreen: $('#game-screen'),
  canvas: $('#game-canvas'),
  input: $('#typing-input'),
  start: $('#start-button'),
  pause: $('#pause-button'),
  hudRestart: $('#hud-restart-button'),
  hudHome: $('#hud-home-button'),
  hudCustom: $('#hud-custom-button'),
  hudReport: $('#hud-report-button'),
  resume: $('#resume-button'),
  restart: $('#restart-button'),
  pauseHome: $('#pause-home-button'),
  pauseCustom: $('#pause-custom-button'),
  pauseFullscreen: $('#pause-fullscreen-button'),
  resultRestart: $('#result-restart-button'),
  resultEditLesson: $('#result-edit-lesson-button'),
  resultReportWord: $('#result-report-word-button'),
  resultTitle: $('#result-title'),
  resultSubtitle: $('#result-subtitle'),
  pauseOverlay: $('#pause-overlay'),
  exitConfirmOverlay: $('#exit-confirm-overlay'),
  exitCancel: $('#exit-cancel-button'),
  exitHomeConfirm: $('#exit-home-confirm-button'),
  exitCustomConfirm: $('#exit-custom-confirm-button'),
  resultOverlay: $('#result-overlay'),
  instructionsOverlay: $('#instructions-overlay'),
  instructions: $('#instructions-button'),
  closeInstructions: $('#close-instructions'),
  countdown: $('#countdown'),
  toast: $('#toast'),
  fullscreen: $('#fullscreen-button'),
  menuSound: $('#menu-sound-button'),
  gameSound: $('#game-sound-button'),
  pauseSound: $('#pause-sound-toggle'),
  masterVolume: $('#master-volume-slider'),
  masterVolumeValue: $('#master-volume-value'),
  sfxVolume: $('#sfx-volume-slider'),
  sfxVolumeValue: $('#sfx-volume-value'),
  testShot: $('#test-shot-button'),
  testExplosion: $('#test-explosion-button'),
  difficulty: $('#difficulty-select'),
  wordLevel: $('#level-select'),
  topic: $('#topic-select'),
  keyboardHint: $('#keyboard-hint'),
  keyboardSection: $('#keyboard-section'),
  englishOptionsSection: $('#english-options-section'),
  englishCaseSensitive: $('#english-case-sensitive'),
  englishMeaningMode: $('#english-meaning-mode'),
  englishMeaningHud: $('#english-meaning-hud'),
  hudMeaningWord: $('#hud-meaning-word'),
  hudMeaningText: $('#hud-meaning-text'),
  hudMeaningLabel: $('#hud-meaning-label'),
  bestScore: $('#best-score-label'),
  menuToast: $('#menu-toast'),
  playPane: $('#play-pane'),
  customPane: $('#custom-loader-pane'),
  coursePane: $('#course-pane'),
  minigamesPane: $('#minigames-pane'),
  minigamesRoot: $('#minigames-root'),
  courseKeyboardHud: $('#course-keyboard-hud'),
  courseHudItem: $('#course-hud-item'),
  hudCourseTitle: $('#hud-course-title'),
  resultCourseStars: $('#result-course-stars'),
  openCustomLoader: $('#open-custom-loader'),
  customSourceChoice: $('#custom-source-choice'),
  wordSourceSummary: $('#word-source-summary'),
  speedHelpNote: $('#speed-help-note'),
  defaultSourceChoice: $('[data-word-source="default"]'),
  levelFieldLabel: $('#level-field-label'),
  interfaceLanguage: $('#interface-language'),
  translationLanguage: $('#translation-language'),
  multilingualSettingsTitle: $('#multilingual-settings-title'),
  interfaceLanguageLabel: $('#interface-language-label'),
  translationLanguageLabel: $('#translation-language-label'),
  typingLanguageLabel: $('#typing-language-label'),
  trialSignupForm: $('#trial-signup-form'),
  trialSignupTitle: $('#trial-signup-title'),
  trialSignupSubmit: $('#trial-signup-submit'),
  trialSignupStatus: $('#trial-signup-status'),
  heroWordMain: $('#hero-word-main'),
  heroWordSmall: $('#hero-word-small'),
  hud: {
    score: $('#hud-score'),
    combo: $('#hud-combo'),
    accuracy: $('#hud-accuracy'),
    level: $('#hud-level'),
    shield: $('#hud-shield'),
    shieldBar: $('#shield-bar'),
    target: $('#hud-target'),
    input: $('#hud-input'),
    completed: $('#hud-completed'),
    mode: $('#hud-mode'),
    source: $('#hud-source'),
    lessonItem: $('#lesson-progress-item'),
    lessonProgress: $('#hud-lesson-progress'),
    lessonBar: $('#lesson-progress-bar')
  },
  result: {
    score: $('#result-score'),
    level: $('#result-level'),
    accuracy: $('#result-accuracy'),
    wpm: $('#result-wpm'),
    completed: $('#result-completed'),
    combo: $('#result-combo'),
    shotValidation: $('#shot-validation')
  }
};

function loadSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const promoteLegacyAudioDefaults = parsed.audioMixVersion !== AUDIO_MIX_VERSION
      && Number(parsed.masterVolume) === 0.78
      && Number(parsed.sfxVolume) === 0.88;
    const normalizeVolume = (value, fallback) => {
      const number = Number(value);
      return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : fallback;
    };
    const legacyMode = parsed.mode === 'indonesian' ? 'indonesian' : parsed.mode === 'english' ? 'english' : 'vietnamese';
    const typingLanguage = ['vi','en','id'].includes(parsed.typingLanguage) ? parsed.typingLanguage : modeToTypingLanguage(legacyMode);
    const migratedMode = typingLanguageToMode(typingLanguage);
    const legacyScores = parsed.highScores || {};
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      audioMixVersion: AUDIO_MIX_VERSION,
      masterVolume: promoteLegacyAudioDefaults ? 1 : normalizeVolume(parsed.masterVolume, DEFAULT_SETTINGS.masterVolume),
      sfxVolume: promoteLegacyAudioDefaults ? 1 : normalizeVolume(parsed.sfxVolume, DEFAULT_SETTINGS.sfxVolume),
      mode: migratedMode,
      typingLanguage,
      interfaceLanguage: normalizeUiLanguage(parsed.interfaceLanguage),
      translationLanguage: ['none', 'vi', 'en', 'id'].includes(parsed.translationLanguage) ? parsed.translationLanguage : 'en',
      vietnameseDiacritics: parsed.vietnameseDiacritics === 'plain' || parsed.mode === 'plain' ? 'plain' : 'accented',
      highScores: {
        vietnamese: Number(legacyScores.vietnamese ?? legacyScores.vi ?? legacyScores.accented ?? 0),
        english: Number(legacyScores.english ?? legacyScores.en ?? 0),
        indonesian: Number(legacyScores.indonesian ?? legacyScores.id ?? 0)
      }
    };
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

let settings = loadSettings();
const query = new URLSearchParams(location.search);
const queryUi = query.get('ui');
const queryTyping = query.get('typing');
const queryTranslation = query.get('translation');
if (['vi', 'en'].includes(queryUi)) settings.interfaceLanguage = queryUi;
if (['vi', 'en', 'id'].includes(queryTyping)) {
  settings.typingLanguage = queryTyping;
  settings.mode = typingLanguageToMode(queryTyping);
}
if (['none', 'vi', 'en', 'id'].includes(queryTranslation)) settings.translationLanguage = queryTranslation;
if (query.get('sound') === '0') settings.sound = false;
let toastTimer = 0;
let countdownTimer = 0;
let lastResult = null;
let inputEngine;
let customLoader;
let customWordSet = loadCustomWordSet(settings.mode);
let activeCourseLesson = null;
let courseCompletionReady = false;
let adaptiveProfile = loadAdaptiveProfile(currentTypingCode());
let courseProgress = loadCourseProgress(currentTypingCode());
let courseView;
let miniGamesView;
let exitConfirmWasPlaying = false;
let arcadeUi;
let courseSessionResult = null;
let activeCourseQuota = null;
let startGeneration = 0;
let transitionTimer = 0;

function saveSettings() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* Lưu trữ có thể bị chặn. */ }
}

function showToast(message, type = 'info') {
  clearTimeout(toastTimer);
  const menuVisible = !elements.menuScreen.classList.contains('hidden');
  const target = menuVisible ? elements.menuToast : elements.toast;
  target.textContent = message;
  target.className = menuVisible ? `menu-toast ${type}` : `game-toast ${type}`;
  target.classList.remove('hidden');
  toastTimer = window.setTimeout(() => target.classList.add('hidden'), type === 'error' ? 2200 : 1900);
}

async function requestQuota(options) {
  const result = await consumeQuota(options);
  if (!result.allowed) showToast(t(settings.interfaceLanguage, result.errorKey || 'quotaUnavailable'), 'warning');
  return result;
}

function reportCurrentWord() {
  if (engine.state === 'playing') engine.pause('feedback');
  import('./feedback.js').then(({openFeedback}) => openFeedback(engine?.getActiveTarget?.() || {text:engine?.lastCompletedWord || '', translationText:engine?.lastCompletedMeaning || ''})).catch(() => showToast('Không mở được biểu mẫu. Vui lòng tải lại trang.', 'error'));
}

const engine = new GameEngine({
  canvas: elements.canvas,
  words: { vietnamese: buildDefaultWordBank('vi', 'en'), english: buildDefaultWordBank('en', 'vi'), indonesian: buildDefaultWordBank('id', 'vi') },
  onHud: updateHud,
  onState: handleEngineState,
  onMessage: showToast,
  translate: (key, replacements) => t(settings.interfaceLanguage, key, replacements),
  onGameOver: showResult,
  onRequestInputClear: () => {
    inputEngine?.clear();
    if (elements.toast && elements.toast.classList.contains('error')) {
      elements.toast.classList.add('hidden');
    }
  }
});

// Read the actual DOM keyboard box on layout changes, not on every Canvas frame.
const cockpitObserver = new ResizeObserver(() => {
  const keyboard = elements.courseKeyboardHud?.getBoundingClientRect();
  const canvas = elements.canvas.getBoundingClientRect();
  if (canvas.width && canvas.height && (engine.width !== Math.max(320, canvas.width) || engine.height !== Math.max(420, canvas.height))) engine.resize();
  if (keyboard?.height && canvas.height) engine.setCockpitLayout({
    top: keyboard.top - canvas.top,
    centerX: keyboard.left - canvas.left + keyboard.width / 2
  });
});
cockpitObserver.observe(elements.canvas);
if (elements.courseKeyboardHud) cockpitObserver.observe(elements.courseKeyboardHud);

inputEngine = new InputEngine({
  input: elements.input,
  onPreview: value => {
    const target = engine.getGuideTarget();
    if (!target) return;
    if (value === null) delete target.previewGuideInput;
    else target.previewGuideInput = value;
    engine.emitHud(true);
  },
  onValue: (value) => {
    const target = engine.getGuideTarget();
    if (target) delete target.previewGuideInput;
    const previousMistakes = engine.stats.mistakes;
    const response = engine.handleInput(value);
    const invalid = Boolean(engine.lastInvalidValue);
    elements.input.setAttribute('aria-invalid', String(invalid));
    elements.hud.input.closest('.current-input')?.classList.toggle('is-invalid', invalid);
    if (engine.stats.mistakes > previousMistakes) showToast(arcadeText(settings.interfaceLanguage, 'error'), 'error');
    else if (!invalid && elements.toast.classList.contains('error')) elements.toast.classList.add('hidden');
    return response;
  },
  onEscape: () => engine.togglePause(),
  getKeyboardMode: () => settings.keyboard,
  getTargetText: () => engine.getGuideTarget()?.text || '',
  getLanguageMode: () => settings.mode,
  getCaseSensitive: () => settings.englishCaseSensitive
});

function updateHud(hud) {
  elements.hud.score.textContent = formatNumber(hud.score, settings.interfaceLanguage);
  elements.hud.combo.textContent = String(hud.combo);
  elements.hud.accuracy.textContent = `${hud.accuracy}%`;
  const courseScreen = activeCourseLesson?.progression?.screenIndex
    || activeCourseLesson?.settings?.courseScreen
    || hud.courseScreen;
  elements.hud.level.textContent = activeCourseLesson?.progression ? `${courseScreen}/${activeCourseLesson.progression.totalScreensPerBlock}` : String(courseScreen || hud.level);
  elements.hud.shield.textContent = String(hud.shield);
  elements.hud.shieldBar.style.width = `${Math.max(0, hud.shield)}%`;
  elements.hud.target.textContent = hud.target || t(settings.interfaceLanguage, 'waitingTarget');
  elements.hud.input.textContent = hud.input || '—';
  elements.hud.completed.textContent = String(hud.completed);
  elements.hud.mode.textContent = hud.mode === 'english' ? 'ENGLISH' : hud.mode === 'indonesian' ? 'BAHASA INDONESIA' : 'TIẾNG VIỆT';
  const showMeaningHud = !activeCourseLesson && settings.translationLanguage !== 'none' && settings.meaningMode !== 'hidden';
  elements.englishMeaningHud?.classList.toggle('hidden', !showMeaningHud);
  if (showMeaningHud) {
    elements.hudMeaningLabel.textContent = `${t(settings.interfaceLanguage, 'meaning')} · ${languageLabel(settings.translationLanguage)}`;
    elements.hudMeaningWord.textContent = hud.meaningWord || hud.target || t(settings.interfaceLanguage, 'waitingTarget');
    elements.hudMeaningText.textContent = hud.targetMeaning || t(settings.interfaceLanguage, settings.meaningMode === 'after' ? 'meaningAfter' : 'chooseTargetMeaning');
  }
  elements.hud.source.textContent = hud.source || t(settings.interfaceLanguage, 'defaultSource');
  const courseActive = Boolean(activeCourseLesson);
  elements.courseHudItem?.classList.toggle('hidden', !courseActive);
  if (elements.hudCourseTitle) elements.hudCourseTitle.textContent = courseActive ? activeCourseLesson.title : '—';
  renderGameKeyboard(elements.courseKeyboardHud, {
    active: true,
    target: hud.guideTarget || hud.target || '',
    input: hud.guideInput || '',
    confirmedProgress: hud.confirmedProgress,
    caseSensitive: settings.englishCaseSensitive,
    mode: settings.mode,
    keyboard: settings.keyboard === 'system' ? settings.guideKeyboard : 'telex',
    systemInput: settings.keyboard === 'system',
    onGuideSchemeChange: value => { settings.guideKeyboard = value; saveSettings(); engine.emitHud(true); inputEngine.focus(); },
    focusKeys: activeCourseLesson?.weakKeys || activeCourseLesson?.newKeys || [],
    uiLanguage: settings.interfaceLanguage
  });
  const lessonActive = hud.orderMode === 'original' && hud.lessonTotal > 0;
  elements.hud.lessonItem?.classList.toggle('hidden', !lessonActive);
  if (elements.hud.lessonProgress) elements.hud.lessonProgress.textContent = lessonActive ? `${hud.lessonCurrent} / ${hud.lessonTotal}` : '0 / 0';
  if (elements.hud.lessonBar) elements.hud.lessonBar.style.width = `${lessonActive ? hud.lessonPercent : 0}%`;
}

function handleEngineState(state, reason = '') {
  if (state === 'playing') {
    elements.pauseOverlay.classList.add('hidden');
    elements.exitConfirmOverlay.classList.add('hidden');
    inputEngine.setActive(true);
  } else if (state === 'paused') {
    inputEngine.setActive(false);
    if (reason !== 'exit-confirm') elements.pauseOverlay.classList.remove('hidden');
  } else if (state === 'gameover') {
    inputEngine.setActive(false);
  } else if (state === 'menu') {
    inputEngine.setActive(false);
    elements.pauseOverlay.classList.add('hidden');
    elements.exitConfirmOverlay.classList.add('hidden');
  }
}

function showMenuPane(name = 'play') {
  const selected = ['play', 'custom', 'course', 'minigames'].includes(name) ? name : 'play';
  if (selected !== 'minigames') miniGamesView?.arcade?.pause();
  if (selected !== 'minigames') miniGamesView?.mario?.pause();
  elements.playPane.classList.toggle('hidden', selected !== 'play');
  elements.customPane.classList.toggle('hidden', selected !== 'custom');
  elements.coursePane?.classList.toggle('hidden', selected !== 'course');
  elements.minigamesPane?.classList.toggle('hidden', selected !== 'minigames');
  $$('.menu-tab').forEach((button) => {
    if (button.dataset.menuTab === 'instructions') return button.classList.remove('selected');
    button.classList.toggle('selected', button.dataset.menuTab === selected);
  });
  elements.menuScreen.classList.toggle('custom-mode', selected === 'custom');
  elements.menuScreen.classList.toggle('course-mode', selected === 'course');
  elements.menuScreen.classList.toggle('minigames-mode', selected === 'minigames');
  if (selected === 'course') {
    const language = currentTypingCode();
    adaptiveProfile = loadAdaptiveProfile(language);
    courseProgress = loadCourseProgress(language);
    courseView?.setContext({
      language,
      uiLanguage: settings.interfaceLanguage,
      translationLanguage: settings.translationLanguage,
      wordBank: buildCourseWordBank(language, settings.translationLanguage),
      profile: adaptiveProfile,
      progress: courseProgress
    });
    const requestedLesson = query.get('lesson');
    if (requestedLesson) courseView?.selectLesson?.(requestedLesson);
  }
  if (selected === 'minigames') {
    miniGamesView?.syncSettings({
      typingLanguage: currentTypingCode(),
      meaningLanguage: settings.translationLanguage
    });
  }
  elements.menuScreen.scrollTo?.({ top: 0, behavior: 'smooth' });
}

function refreshCustomWordSetForCurrentLanguage({ updateLoader = false, announce = false } = {}) {
  customWordSet = loadCustomWordSet(settings.mode);
  if (customLoader && updateLoader) {
    if (customWordSet?.words?.length) customLoader.loadWordSet(customWordSet, { announce });
    else customLoader.setLanguage(settings.mode, { analyze: false, announce });
    customLoader.setTranslationLanguage(settings.translationLanguage, { render: false });
  }
  return customWordSet;
}

function applyWordSource() {
  if (activeCourseLesson?.words?.length) {
    const lessonCode = ['vi', 'en', 'id'].includes(activeCourseLesson.languageCode) ? activeCourseLesson.languageCode : currentTypingCode();
    settings.typingLanguage = lessonCode;
    settings.mode = typingLanguageToMode(lessonCode);
    settings.wordSource = 'course';
    engine.setWordSource(activeCourseLesson.words, {
      type: 'course',
      label: `${t(settings.interfaceLanguage, 'courseLabel')} · ${activeCourseLesson.title}`,
      language: settings.mode,
      orderMode: 'original',
      sequentialLearning: true,
      courseLessonId: activeCourseLesson.templateId
    });
    return;
  }
  const customMatchesLanguage = customWordSet?.language === settings.mode || customWordSet?.words?.every((item) => (item.language || 'vietnamese') === settings.mode);
  if (settings.wordSource === 'custom' && customWordSet?.words?.length >= 10 && customMatchesLanguage) {
    const customWords = enrichCustomTranslations(customWordSet.words, {
      language: settings.mode,
      translationLanguage: settings.translationLanguage
    });
    // The engine consumes a finite sequential queue; retain author order in storage.
    const orderedCustomWords = applyWordOrder(customWords, customWordSet.options?.wordOrderMode || 'original')
      .map((word, index) => ({ ...word, originalIndex: index, sourceIndex: index }));
    engine.setWordSource(orderedCustomWords, {
      type: 'custom',
      label: t(settings.interfaceLanguage, 'custom'),
      language: settings.mode,
      orderMode: 'original',
      sequentialLearning: customWordSet.options?.sequentialLearning !== false,
      splitBySentence: Boolean(customWordSet.options?.splitBySentence)
    });
    settings.topic = 'all';
    return;
  }
  settings.wordSource = 'default';
  const typingCode = currentTypingCode();
  const words = buildDefaultWordBank(typingCode, settings.translationLanguage);
  engine.setWordSource(words, { type: 'default', label: t(settings.interfaceLanguage, 'defaultBank', { count: GRADE5_VOCABULARY.length }), language: settings.mode });
}

function updateWordSourceUI() {
  const hasCustom = Boolean(customWordSet?.words?.length >= 10 && (customWordSet.language || 'vietnamese') === settings.mode);
  if (!hasCustom && settings.wordSource === 'custom') settings.wordSource = 'default';
  elements.customSourceChoice.disabled = !hasCustom;
  $$('[data-word-source]').forEach((button) => button.classList.toggle('selected', button.dataset.wordSource === settings.wordSource));
  const customLanguageLabel = settings.mode === 'english' ? 'English' : settings.mode === 'indonesian' ? 'Bahasa Indonesia' : 'Tiếng Việt';
  elements.wordSourceSummary.textContent = settings.wordSource === 'custom' && hasCustom
    ? t(settings.interfaceLanguage, 'sourceCustomSummary', { count: formatNumber(customWordSet.words.length, settings.interfaceLanguage), label: customWordSet.label })
    : hasCustom
      ? t(settings.interfaceLanguage, 'sourceCustomAvailable', { language: customLanguageLabel, count: formatNumber(customWordSet.words.length, settings.interfaceLanguage) })
      : t(settings.interfaceLanguage, 'sourceDefaultSummary', { count: GRADE5_VOCABULARY.length, language: customLanguageLabel });
  elements.topic.disabled = settings.wordSource === 'custom';
  if (settings.wordSource === 'custom') {
    const option = document.createElement('option');
    option.value = 'custom'; option.textContent = t(settings.interfaceLanguage,'customTopic');
    elements.topic.replaceChildren(option);
    elements.topic.value = 'custom';
  }
}

function renderTopicOptions() {
  const keys = { all: 'allTopics' };
  for (const topic of GRADE5_TOPICS) keys[topic.id] = `topic${topic.id[0].toUpperCase()}${topic.id.slice(1)}`;
  const topics = ['all', ...GRADE5_TOPICS.map((topic) => topic.id)].map((value) => [value, t(settings.interfaceLanguage, keys[value] || value)]);
  const current = settings.topic;
  elements.topic.replaceChildren(...topics.map(([value, label]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    return option;
  }));
  settings.topic = topics.some(([value]) => value === current) ? current : 'all';
  elements.topic.value = settings.topic;
}

function applyInterfaceLanguage() {
  const lang = normalizeUiLanguage(settings.interfaceLanguage);
  settings.interfaceLanguage = lang;
  document.documentElement.lang = lang;
  document.title = t(lang, 'pageTitle');
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute('content', t(lang, 'metaDescription'));
  applyTranslations(document, lang);
  const setButtonLabel = (selector, key) => { const node = $(selector)?.querySelector('b'); if (node) node.textContent = t(lang, key); };
  elements.typingLanguageLabel && (elements.typingLanguageLabel.textContent = `1. ${t(lang, 'typingLanguage')}`);
  elements.instructions && (elements.instructions.textContent = t(lang, 'instructions'));
  const playTab = $('[data-menu-tab="play"]'); if (playTab) playTab.textContent = t(lang, 'play');
  const courseTab = $('[data-menu-tab="course"]'); if (courseTab) courseTab.textContent = t(lang, 'course');
  const miniTab = $('[data-menu-tab="minigames"]'); if (miniTab) miniTab.textContent = t(lang, 'miniTab');
  const customTab = $('[data-menu-tab="custom"]'); if (customTab) customTab.textContent = t(lang, 'custom');
  const guideTab = $('[data-menu-tab="instructions"]'); if (guideTab) guideTab.textContent = t(lang, 'instructions').toUpperCase();
  const startSpan = elements.start?.querySelector('span'); if (startSpan) startSpan.textContent = t(lang, 'start');
  setButtonLabel('#pause-button', 'pause');
  setButtonLabel('#hud-restart-button', 'restart');
  setButtonLabel('#hud-home-button', 'home');
  setButtonLabel('#hud-custom-button', 'create');
  setButtonLabel('#hud-report-button', 'reportWord');
  const resume = $('#resume-button'); if (resume) resume.innerHTML = `<span>▶</span> ${escapeHtml(t(lang, 'resume'))}`;
  const resultReport = $('#result-report-word-button'); if (resultReport) resultReport.textContent = `! ${t(lang, 'reportWord')}`;
  const note = $('#instructions-overlay .instruction-note'); if (note) note.textContent = t(lang, 'guideNote');

  const meaningMode = $('#english-meaning-mode');
  if (meaningMode) {
    const labels = { immediate: 'immediate', after: 'after', hidden: 'hidden' };
    [...meaningMode.options].forEach((option) => { option.textContent = t(lang, labels[option.value] || option.value); });
  }
  const translationSelect = $('#translation-language');
  if (translationSelect?.options?.[0]) translationSelect.options[0].textContent = t(lang, 'noTranslation');
  const speedSelect = $('#difficulty-select');
  if (speedSelect) {
    [...speedSelect.options].forEach((option) => { option.textContent = formatSpeedLabel(lang,option.value); });
  }
  $$('[data-vietnamese-diacritics]').forEach((button) => {
    button.textContent = t(lang, button.dataset.vietnameseDiacritics === 'plain' ? 'plain' : 'accented');
  });
  const keyboardButtons = $$('[data-keyboard]');
  if (keyboardButtons[0]) keyboardButtons[0].textContent = t(lang, 'systemInput');
  if (keyboardButtons[1]) keyboardButtons[1].textContent = t(lang, 'builtinTelex');
  customLoader?.setUiLanguage?.(lang);
  miniGamesView?.setUiLanguage?.(lang);
}

function renderSelections() {
  settings.typingLanguage = modeToTypingLanguage(settings.mode);
  const heroWords = settings.mode === 'english'
    ? ['victory', 'sky']
    : settings.mode === 'indonesian'
      ? ['menang', 'langit']
      : ['đỏ', 'trường'];
  if (elements.heroWordMain) elements.heroWordMain.textContent = heroWords[0];
  if (elements.heroWordSmall) elements.heroWordSmall.textContent = heroWords[1];
  applyInterfaceLanguage();
  if (elements.interfaceLanguage) elements.interfaceLanguage.value = settings.interfaceLanguage;
  if (elements.translationLanguage) elements.translationLanguage.value = settings.translationLanguage;
  $$('.mode-card').forEach((button) => {
    const selected = button.dataset.mode === settings.mode;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  $$('[data-keyboard]').forEach((button) => {
    button.classList.toggle('selected', button.dataset.keyboard === settings.keyboard);
  });
  $$('[data-vietnamese-diacritics]').forEach((button) => {
    button.classList.toggle('selected', button.dataset.vietnameseDiacritics === settings.vietnameseDiacritics);
  });
  elements.keyboardSection?.classList.toggle('hidden', settings.mode !== 'vietnamese');
  if (elements.defaultSourceChoice) elements.defaultSourceChoice.textContent = t(settings.interfaceLanguage, 'defaultBank', { count: GRADE5_VOCABULARY.length });
  if (elements.levelFieldLabel) elements.levelFieldLabel.textContent = t(settings.interfaceLanguage, settings.mode === 'vietnamese' ? 'syllableLevel' : 'wordLevel');
  elements.englishOptionsSection?.classList.remove('hidden');
  if (elements.englishCaseSensitive) elements.englishCaseSensitive.checked = settings.englishCaseSensitive;
  if (elements.englishMeaningMode) elements.englishMeaningMode.value = settings.meaningMode;
  renderTopicOptions();
  elements.difficulty.value = settings.difficulty;
  if (elements.speedHelpNote) {
    const seconds = GAME_CONFIG.targetTravelSeconds[settings.difficulty];
    elements.speedHelpNote.textContent = seconds ? t(settings.interfaceLanguage,'meteorTime',{seconds}) : t(settings.interfaceLanguage,'speedHelp');
  }
  elements.wordLevel.value = settings.wordLevel;
  elements.topic.value = settings.topic;
  elements.keyboardHint.textContent = settings.keyboard === 'system'
    ? t(settings.interfaceLanguage, 'keyboardHintSystem')
    : t(settings.interfaceLanguage, 'keyboardHintTelex');
  const best = settings.highScores[settings.mode] || 0;
  elements.bestScore.textContent = t(settings.interfaceLanguage, 'bestScore', { score: formatNumber(best, settings.interfaceLanguage) });
  const soundIcon = settings.sound ? '🔊' : '🔇';
  elements.menuSound.textContent = soundIcon;
  elements.gameSound.querySelector('span').textContent = soundIcon;
  elements.pauseSound.textContent = soundIcon;
  elements.masterVolume.value = String(Math.round(settings.masterVolume * 100));
  elements.sfxVolume.value = String(Math.round(settings.sfxVolume * 100));
  elements.masterVolumeValue.textContent = `${Math.round(settings.masterVolume * 100)}%`;
  elements.sfxVolumeValue.textContent = `${Math.round(settings.sfxVolume * 100)}%`;
  updateWordSourceUI();
  engine.setSound(settings.sound);
  engine.setAudioLevels(settings.masterVolume, settings.sfxVolume);
  engine.effectsLevel = settings.effects || 'medium';
  arcadeUi?.render(settings.interfaceLanguage, settings.effects || 'medium');
}

function currentGameSettings() {
  return {
    mode: engineLanguageMode(),
    translationLanguage: settings.translationLanguage,
    meaningMode: settings.meaningMode,
    caseSensitive: activeCourseLesson?.settings?.caseSensitive ?? settings.englishCaseSensitive,
    keyboard: settings.keyboard,
    difficulty: activeCourseLesson?.settings?.difficulty || settings.difficulty,
    wordLevel: settings.wordSource === 'custom' ? 'auto' : settings.wordLevel,
    topic: settings.topic,
    sound: settings.sound,
    courseMode: Boolean(activeCourseLesson),
    noDamage: Boolean(activeCourseLesson?.settings?.noDamage),
    maxTargets: activeCourseLesson?.settings?.maxTargets || null,
    courseLessonId: activeCourseLesson?.templateId || '',
    courseScreen: activeCourseLesson?.progression?.screenIndex
      || activeCourseLesson?.settings?.courseScreen
      || 0
  };
}

async function startCountdown({ demo = false, immediate = false } = {}) {
  const generation = ++startGeneration;
  clearInterval(countdownTimer);
  if (!demo) {
    // Clear the previous screen before the countdown so its target cannot
    // remain visible behind the next screen's countdown overlay.
    engine.stopToMenu();
    applyWordSource();
  }
  const audioReady = await engine.unlockAudio();
  await gameFontsReady;
  if (generation !== startGeneration) return;
  if (settings.sound && !audioReady) showToast(t(settings.interfaceLanguage, 'audioUnavailable'), 'error');
  elements.menuScreen.classList.add('hidden');
  elements.gameScreen.classList.remove('hidden');
  elements.resultOverlay.classList.add('hidden');
  elements.pauseOverlay.classList.add('hidden');
  elements.exitConfirmOverlay.classList.add('hidden');
  elements.countdown.classList.remove('hidden');
  elements.input.setAttribute('aria-invalid', 'false');
  elements.hud.input.closest('.current-input')?.classList.remove('is-invalid');
  inputEngine.clear();
  inputEngine.setActive(false);

  if (immediate) {
    elements.countdown.classList.add('hidden');
    engine.start(currentGameSettings(), { demo });
    inputEngine.setActive(true);
    if (!demo && !activeCourseLesson) { settings.plays += 1; saveSettings(); }
    return;
  }

  let count = demo ? 1 : 3;
  elements.countdown.textContent = String(count);
  countdownTimer = window.setInterval(() => {
    count -= 1;
    if (count <= 0) {
      clearInterval(countdownTimer);
      elements.countdown.classList.add('hidden');
      engine.start(currentGameSettings(), { demo });
      inputEngine.setActive(true);
      settings.plays += 1;
      saveSettings();
    } else {
      elements.countdown.textContent = String(count);
    }
  }, demo ? 120 : 700);
}

function hideRuntimeOverlays() {
  elements.pauseOverlay.classList.add('hidden');
  elements.exitConfirmOverlay.classList.add('hidden');
  elements.resultOverlay.classList.add('hidden');
  elements.countdown.classList.add('hidden');
}

function clearRuntimeGameObjects() {
  startGeneration += 1;
  clearTimeout(transitionTimer);
  clearInterval(countdownTimer);
  engine.stopToMenu();
  inputEngine.clear();
  inputEngine.setActive(false);
}

function restartCurrentGame() {
  clearTimeout(transitionTimer);
  startGeneration += 1;
  courseSessionResult = null;
  const restartCourseFromStart = Boolean(courseCompletionReady && activeCourseLesson?.progression?.screenIndex);
  if (restartCourseFromStart) resetActiveCourseLessonProgress();
  lastResult = null;
  courseCompletionReady = false;
  exitConfirmWasPlaying = false;
  clearInterval(countdownTimer);
  engine.stopToMenu();
  inputEngine.clear();
  inputEngine.setActive(false);
  hideRuntimeOverlays();
  if (activeCourseLesson) {
    window.setTimeout(() => void courseView?.startSelected(false), 0);
  } else {
    void startCountdown();
  }
}

function resetActiveCourseLessonProgress() {
  if (!activeCourseLesson?.progression?.screenIndex) return false;
  const courseLanguage = ['vi', 'en', 'id'].includes(activeCourseLesson.languageCode) ? activeCourseLesson.languageCode : currentTypingCode();
  courseProgress = resetCourseLessonProgress(courseProgress, activeCourseLesson);
  saveCourseProgress(courseProgress, courseLanguage);
  activeCourseLesson = {
    ...activeCourseLesson,
    progression: { ...activeCourseLesson.progression, screenIndex: 1 },
    settings: { ...activeCourseLesson.settings, courseScreen: 1 }
  };
  courseView?.setContext({ language: courseLanguage, uiLanguage: settings.interfaceLanguage, translationLanguage: settings.translationLanguage, wordBank: buildCourseWordBank(courseLanguage, settings.translationLanguage), profile: adaptiveProfile, progress: courseProgress });
  return true;
}

function stopGameAndOpenMenu(pane = 'play') {
  exitConfirmWasPlaying = false;
  clearRuntimeGameObjects();
  hideRuntimeOverlays();
  elements.gameScreen.classList.add('hidden');
  elements.menuScreen.classList.remove('hidden');
  showMenuPane(pane);
  renderSelections();
}

function stopGameAndReturnHome() {
  courseCompletionReady = false;
  lastResult = null;
  stopGameAndOpenMenu('play');
  if (activeCourseLesson) {
    activeCourseLesson = null;
    settings.wordSource = 'default';
    applyWordSource();
    saveSettings();
    renderSelections();
  }
}

function stopGameAndOpenCustomLoader() {
  courseCompletionReady = false;
  lastResult = null;
  stopGameAndOpenMenu('custom');
  if (activeCourseLesson) {
    activeCourseLesson = null;
    settings.wordSource = 'default';
    applyWordSource();
    saveSettings();
    renderSelections();
  }
  customLoader?.refresh?.();
}

function returnToMenu() {
  stopGameAndReturnHome();
}

function pauseGame() {
  if (engine.state === 'playing') engine.pause('manual');
}

function resumeGame() {
  if (engine.state === 'paused') engine.resume();
}

function showExitConfirm(preferredAction = 'home') {
  if (engine.state !== 'playing') {
    if (preferredAction === 'custom') stopGameAndOpenCustomLoader();
    else stopGameAndReturnHome();
    return;
  }
  exitConfirmWasPlaying = true;
  engine.pause('exit-confirm');
  elements.pauseOverlay.classList.add('hidden');
  elements.exitConfirmOverlay.dataset.preferredAction = preferredAction;
  elements.exitConfirmOverlay.classList.remove('hidden');
}

function cancelExitConfirm() {
  elements.exitConfirmOverlay.classList.add('hidden');
  if (exitConfirmWasPlaying && engine.state === 'paused') engine.resume();
  exitConfirmWasPlaying = false;
}

function updateAudioVolume(kind, rawValue) {
  const normalized = Math.max(0, Math.min(1, Number(rawValue) / 100));
  if (kind === 'master') settings.masterVolume = normalized;
  else settings.sfxVolume = normalized;
  if (normalized > 0 && !settings.sound) settings.sound = true;
  saveSettings();
  renderSelections();
}

function showResult(result) {
  lastResult = result;
  const key = settings.mode === 'english' ? 'english' : settings.mode === 'indonesian' ? 'indonesian' : 'vietnamese';
  settings.highScores[key] = Math.max(settings.highScores[key] || 0, result.score);
  settings.bestAccuracy = Math.max(settings.bestAccuracy || 0, result.accuracy);
  saveGameResult({
    gameId: 'meteor',
    lessonId: activeCourseLesson?.templateId || '',
    typingLanguage: currentTypingCode(),
    meaningLanguage: settings.translationLanguage,
    score: result.score,
    correct: result.completed,
    total: result.completed,
    accuracy: result.accuracy,
    bestStreak: result.maxCombo,
    durationMs: result.durationMs,
    completed: Boolean(result.lessonComplete || result.gameOver)
  });
  if (activeCourseLesson) {
    result.courseLessonId = activeCourseLesson.templateId;
    const courseLanguage = ['vi', 'en', 'id'].includes(activeCourseLesson.languageCode) ? activeCourseLesson.languageCode : currentTypingCode();
    adaptiveProfile = recordAdaptiveSession(adaptiveProfile, courseLanguage, result);
    saveAdaptiveProfile(adaptiveProfile, courseLanguage);
    const template = activeCourseLesson.templateId === 'adaptive-practice'
      ? { stars: activeCourseLesson.pass?.stars || [0, 85, 95] }
      : getCourseTemplate(activeCourseLesson.templateId, courseLanguage, settings.interfaceLanguage);
    const stars = calculateStars(result, template);
    courseProgress = recordCourseResult(courseProgress, activeCourseLesson, result, stars);
    const currentScreen = Number(activeCourseLesson.progression?.screenIndex || 0);
    if (currentScreen) result.level = currentScreen;
    const nextScreen = currentScreen + 1;
    const totalScreens = activeCourseLesson.progression?.totalScreensPerBlock || PROGRESSION_TOTAL_SCREENS;
    result.courseFinal = Boolean(result.lessonComplete && currentScreen >= totalScreens);
    result.courseAttemptFinal = isFreeCourseAttemptFinal({
      completed: result.lessonComplete,
      screenIndex: currentScreen,
      ownerMode: getBetaConfig().ownerMode,
      freeScreenCount: courseLanguage === 'vi' ? PROGRESSION_TOTAL_SCREENS : PROGRESSION_FREE_SCREENS
    });
    courseCompletionReady = result.courseFinal || result.courseAttemptFinal;
    if (result.courseAttemptFinal) courseProgress = resetCourseLessonProgress(courseProgress, activeCourseLesson);
    saveCourseProgress(courseProgress, courseLanguage);
    courseView?.setContext({ language: courseLanguage, uiLanguage: settings.interfaceLanguage, translationLanguage: settings.translationLanguage, wordBank: buildCourseWordBank(courseLanguage, settings.translationLanguage), profile: adaptiveProfile, progress: courseProgress });
    courseSessionResult = appendScreenResult(courseSessionResult, result);
    if (result.lessonComplete && currentScreen > 0 && nextScreen <= totalScreens) {
      const lessonIndex = courseView?.templates?.findIndex((item) => item.id === activeCourseLesson.templateId) ?? -1;
      const nextAccess = getCourseLessonAccess({
        language: courseLanguage,
        lessonId: activeCourseLesson.templateId,
        lessonIndex,
        screenIndex: nextScreen,
        progressionMode: activeCourseLesson.settings?.progressionMode || ''
      });
      if (nextAccess.allowed) {
        elements.resultOverlay.classList.add('hidden');
        const nextMessage = settings.interfaceLanguage === 'en'
          ? `Screen ${nextScreen}/${totalScreens}`
          : settings.interfaceLanguage === 'id'
            ? `Layar ${nextScreen}/${totalScreens}`
            : `Màn ${nextScreen}/${totalScreens}`;
        showToast(nextMessage, 'info');
        transitionTimer = window.setTimeout(() => {
          void courseView?.startSelected(false, { automatic: true });
        }, 300);
        return;
      }
    }
    if (elements.resultCourseStars) {
      elements.resultCourseStars.classList.remove('hidden');
      elements.resultCourseStars.innerHTML = result.lessonComplete
        ? `<strong>${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</strong><span>${escapeHtml(t(settings.interfaceLanguage, 'starsSummary', { stars, accuracy: result.accuracy }))}</span>`
        : `<strong>☆ ☆ ☆</strong><span>${escapeHtml(t(settings.interfaceLanguage, 'courseIncomplete'))}</span>`;
    }
  } else if (elements.resultCourseStars) {
    elements.resultCourseStars.classList.add('hidden');
    elements.resultCourseStars.textContent = '';
  }
  saveSettings();

  if (activeCourseLesson && courseSessionResult) {
    result = { ...courseSessionResult, courseFinal: result.courseFinal, courseAttemptFinal: result.courseAttemptFinal };
    settings.highScores[key] = Math.max(settings.highScores[key] || 0, result.score);
    saveSettings();
    if (result.lessonComplete && elements.resultCourseStars) {
      const stars = calculateStars(result, activeCourseLesson.pass);
      elements.resultCourseStars.innerHTML = `<strong>${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</strong><span>${escapeHtml(t(settings.interfaceLanguage, 'starsSummary', { stars, accuracy: result.accuracy }))}</span>`;
    }
  }
  lastResult = result;
  elements.resultTitle.textContent = result.courseFinal ? arcadeText(settings.interfaceLanguage, 'done') : t(settings.interfaceLanguage, result.lessonComplete ? 'lessonCompleted' : 'missionEnded');
  elements.resultSubtitle.textContent = activeCourseLesson
    ? result.lessonComplete
      ? t(settings.interfaceLanguage, 'lessonPassed', { title: activeCourseLesson.title })
      : t(settings.interfaceLanguage, 'lessonRetry')
    : result.lessonComplete
      ? t(settings.interfaceLanguage, 'sequenceCompleted', { current: result.lessonProgress?.current || result.completed, total: result.lessonProgress?.total || result.completed })
      : t(settings.interfaceLanguage, 'missionSubtitle');
  elements.result.score.textContent = formatNumber(result.score, settings.interfaceLanguage);
  elements.result.level.textContent = String(result.level);
  elements.result.accuracy.textContent = `${result.accuracy}%`;
  elements.result.wpm.textContent = `${result.wpm} WPM`;
  elements.result.completed.textContent = String(result.completed);
  elements.result.combo.textContent = String(result.maxCombo);
  elements.result.shotValidation.textContent = `${result.shotsMatchCharacters ? '✓' : '⚠'} ${t(settings.interfaceLanguage, result.shotsMatchCharacters ? 'shotCheckOk' : 'shotCheckBad')}`;
  const courseFinal = Boolean(activeCourseLesson?.progression?.screenIndex && (result.courseFinal || result.courseAttemptFinal));
  const restartLabel = courseFinal
    ? settings.interfaceLanguage === 'en'
      ? 'PLAY SCREEN 1 AGAIN'
      : settings.interfaceLanguage === 'id'
        ? 'MAIN LAYAR 1 LAGI'
        : 'CHƠI LẠI MÀN 1'
    : t(settings.interfaceLanguage, 'replay');
  elements.resultRestart.textContent = restartLabel;
  elements.resultEditLesson?.classList.remove('hidden');
  if (elements.resultEditLesson) elements.resultEditLesson.textContent = arcadeText(settings.interfaceLanguage, activeCourseLesson ? 'next' : 'choose');
  if (activeCourseLesson && result.lessonComplete && !courseFinal && activeCourseLesson.progression) elements.resultSubtitle.textContent = arcadeText(settings.interfaceLanguage, 'boundary');
  elements.resultOverlay.classList.remove('hidden');
}

function toggleSound() {
  settings.sound = !settings.sound;
  saveSettings();
  renderSelections();
  miniGamesView?.setSound?.(settings.sound);
  if (settings.sound) void engine.unlockAudio();
}

function toggleFullscreen() {
  const stage = elements.gameScreen;
  if (!document.fullscreenElement) {
    stage.requestFullscreen?.().catch(() => showToast(t(settings.interfaceLanguage, 'fullscreenBlocked'), 'error'));
  } else {
    document.exitFullscreen?.();
  }
}

$$('.mode-card').forEach((button) => {
  button.addEventListener('click', () => {
    activeCourseLesson = null;
    settings.wordSource = 'default';
    settings.mode = button.dataset.mode === 'english' ? 'english' : button.dataset.mode === 'indonesian' ? 'indonesian' : 'vietnamese';
    settings.typingLanguage = modeToTypingLanguage(settings.mode);
    const firstEnglishVisit = settings.mode === 'english' && !settings.englishInitialized;
    if (settings.mode === 'english' || settings.mode === 'indonesian') {
      settings.keyboard = 'system';
      if (firstEnglishVisit) {
        settings.difficulty = 'very-slow';
        settings.wordLevel = 'easy';
        settings.meaningMode = 'immediate';
        settings.englishInitialized = true;
      }
    } else {
      settings.meaningMode = 'immediate';
    }
    inputEngine.clear();
    settings.topic = firstEnglishVisit ? 'basic' : 'all';
    refreshCustomWordSetForCurrentLanguage({ updateLoader: true, announce: false });
    if (settings.wordSource === 'custom' && (customWordSet?.language || 'vietnamese') !== settings.mode) settings.wordSource = 'default';
    applyWordSource();
    saveSettings();
    renderSelections();
  });
});

$$('[data-keyboard]').forEach((button) => {
  button.addEventListener('click', () => {
    settings.keyboard = button.dataset.keyboard;
    saveSettings();
    renderSelections();
  });
});

$$('[data-vietnamese-diacritics]').forEach((button) => {
  button.addEventListener('click', () => {
    settings.vietnameseDiacritics = button.dataset.vietnameseDiacritics === 'plain' ? 'plain' : 'accented';
    inputEngine.clear();
    saveSettings();
    renderSelections();
  });
});

$$('[data-menu-tab]').forEach((button) => {
  button.addEventListener('click', () => {
    if (button.dataset.menuTab === 'instructions') {
      elements.instructionsOverlay.classList.remove('hidden');
      return;
    }
    showMenuPane(button.dataset.menuTab);
  });
});

$$('.loader-back-play').forEach((button) => button.addEventListener('click', () => showMenuPane('play')));
elements.openCustomLoader.addEventListener('click', () => {
  refreshCustomWordSetForCurrentLanguage({ updateLoader: true, announce: false });
  showMenuPane('custom');
});
$$('[data-word-source]').forEach((button) => {
  button.addEventListener('click', () => {
    if (button.disabled) return;
    activeCourseLesson = null;
    settings.wordSource = button.dataset.wordSource === 'custom' ? 'custom' : 'default';
    applyWordSource();
    saveSettings();
    renderSelections();
  });
});

await loadAccessAccount();

customLoader = new CustomLoaderView({
  root: elements.customPane,
  initialWordSet: customWordSet,
  initialLanguage: settings.mode,
  initialTranslationLanguage: settings.translationLanguage,
  uiLanguage: settings.interfaceLanguage,
  onCreate: (wordSet) => {
    activeCourseLesson = null;
    customWordSet = wordSet;
    settings.mode = wordSet.language === 'english' ? 'english' : wordSet.language === 'indonesian' ? 'indonesian' : 'vietnamese';
    settings.typingLanguage = modeToTypingLanguage(settings.mode);
    settings.wordSource = 'custom';
    applyWordSource();
    saveSettings();
    renderSelections();
    showMenuPane('play');
    showToast(t(settings.interfaceLanguage, 'customSelected', { count: formatNumber(wordSet.words.length, settings.interfaceLanguage) }), 'info');
  },
  onSavedChange: (wordSet) => {
    customWordSet = wordSet;
    if (!wordSet && settings.wordSource === 'custom') {
      settings.wordSource = 'default';
      applyWordSource();
      saveSettings();
    }
    renderSelections();
  },
  onToast: showToast
});

courseView = new CourseView({
  root: elements.coursePane,
  wordBank: buildCourseWordBank(currentTypingCode(), settings.translationLanguage),
  language: currentTypingCode(),
  uiLanguage: settings.interfaceLanguage,
  translationLanguage: settings.translationLanguage,
  onLanguageChange: (language) => {
    settings.typingLanguage = language;
    settings.mode = typingLanguageToMode(language);
    if (language !== 'vi') settings.keyboard = 'system';
    settings.wordSource = 'default';
    activeCourseLesson = null;
    inputEngine.clear();
    applyWordSource();
    saveSettings();
    renderSelections();
    courseView.setContext({ language, uiLanguage: settings.interfaceLanguage, translationLanguage: settings.translationLanguage, wordBank: buildCourseWordBank(language, settings.translationLanguage) });
  },
  onQuotaStatus: getQuotaStatus,
  onStart: async (lesson, { automatic = false } = {}) => {
    const lessonCode = ['vi', 'en', 'id'].includes(lesson.languageCode) ? lesson.languageCode : currentTypingCode();
    const lessonIndex = courseView?.templates?.findIndex((item) => item.id === lesson.templateId) ?? -1;
    const access = getCourseLessonAccess({
      language: lessonCode,
      lessonId: lesson.templateId,
      lessonIndex,
      adaptive: lesson.templateId === 'adaptive-practice',
      screenIndex: lesson.progression?.screenIndex || lesson.settings?.courseScreen || -1,
      progressionMode: lesson.settings?.progressionMode || ''
    });
    if (!access.allowed) {
      showToast(t(settings.interfaceLanguage, 'betaLockedLesson'), 'warning');
      return;
    }
    const screenIndex = lesson.progression?.screenIndex || lesson.settings?.courseScreen || 1;
    const continuing = automatic && activeCourseQuota?.lessonId === lesson.templateId;
    const quota = await requestQuota({
      scope: 'course', key: lesson.templateId, language: lessonCode, screen: screenIndex,
      step: screenIndex, maxSteps: lesson.templateId.startsWith('grade5-')
        ? lessonCode === 'vi' ? PROGRESSION_TOTAL_SCREENS : PROGRESSION_FREE_SCREENS
        : 1,
      count: !continuing, sessionToken: continuing ? activeCourseQuota.sessionToken : null
    });
    if (!quota.allowed) return;
    if (!continuing && Number.isInteger(quota.used)) courseView?.setCourseUsage(lesson.templateId, quota.used);
    if (!continuing) activeCourseQuota = { lessonId: lesson.templateId, sessionToken: quota.sessionToken || null };
    // Course controls can switch language or reset storage without reopening the pane.
    adaptiveProfile = loadAdaptiveProfile(lessonCode);
    courseProgress = loadCourseProgress(lessonCode);
    activeCourseLesson = lesson;
    if (!automatic) courseSessionResult = null;
    courseCompletionReady = false;
    settings.typingLanguage = lessonCode;
    settings.mode = typingLanguageToMode(lessonCode);
    if (lessonCode !== 'vi') settings.keyboard = 'system';
    settings.wordSource = 'course';
    settings.difficulty = lesson.settings.difficulty;
    settings.wordLevel = 'auto';
    settings.topic = 'all';
    settings.englishCaseSensitive = Boolean(lesson.settings.caseSensitive);
    settings.meaningMode = 'immediate';
    applyWordSource();
    saveSettings();
    showToast(t(settings.interfaceLanguage, 'lessonGenerated', { title: lesson.title, variant: lesson.variant }), 'info');
    void startCountdown({ immediate: automatic });
  },
  onToast: showToast
});

miniGamesView = new MiniGamesView({
  root: elements.minigamesRoot,
  uiLanguage: settings.interfaceLanguage,
  sound: settings.sound,
  onConsumeQuota: requestQuota,
  onQuotaStatus: getQuotaStatus,
  onSoundChange: enabled => {
    settings.sound = Boolean(enabled);
    saveSettings();
    renderSelections();
    if (settings.sound) void engine.unlockAudio();
  },
  onBack: () => showMenuPane('play')
});

elements.interfaceLanguage?.addEventListener('change', () => { settings.interfaceLanguage = elements.interfaceLanguage.value; saveSettings(); renderSelections(); courseView?.setContext({ language: currentTypingCode(), uiLanguage: settings.interfaceLanguage, translationLanguage: settings.translationLanguage, wordBank: buildCourseWordBank(currentTypingCode(), settings.translationLanguage) }); });
elements.translationLanguage?.addEventListener('change', () => {
  settings.translationLanguage = elements.translationLanguage.value;
  customLoader?.setTranslationLanguage?.(settings.translationLanguage);
  applyWordSource();
  saveSettings();
  renderSelections();
  courseView?.setContext({ language: currentTypingCode(), uiLanguage: settings.interfaceLanguage, translationLanguage: settings.translationLanguage, wordBank: buildCourseWordBank(currentTypingCode(), settings.translationLanguage) });
});
$$('[data-language-preset]').forEach((button) => button.addEventListener('click', () => {
  const [ui, typing, translation] = button.dataset.languagePreset.split('-');
  settings.interfaceLanguage = ui;
  settings.typingLanguage = ['vi','en','id'].includes(typing) ? typing : 'vi';
  settings.mode = typingLanguageToMode(settings.typingLanguage);
  settings.translationLanguage = translation;
  settings.keyboard = settings.mode === 'vietnamese' ? settings.keyboard : 'system';
  settings.wordSource = 'default';
  settings.meaningMode = 'immediate';
  settings.difficulty = 'very-slow';
  settings.topic = 'all';
  inputEngine.clear();
  applyWordSource();
  saveSettings();
  renderSelections();
  showToast(t(settings.interfaceLanguage, 'presetApplied'), 'info');
}));

elements.trialSignupForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(elements.trialSignupForm).entries());
  if (!String(data.email || '').trim() && !String(data.messenger || '').trim()) {
    elements.trialSignupStatus.textContent = t(settings.interfaceLanguage, 'signupNeedsContact');
    showToast(t(settings.interfaceLanguage, 'signupNeedsContact'), 'error');
    return;
  }
  data.savedAt = new Date().toISOString();
  data.interfaceLanguage = settings.interfaceLanguage;
  data.typingLanguage = currentTypingCode();
  data.translationLanguage = settings.translationLanguage;
  try { localStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(data)); } catch {}
  const endpoint = String(globalThis.ORBIT_TYPE_TRIAL_FORM_ENDPOINT || '').trim();
  const trialUrl = String(globalThis.ORBIT_TYPE_TRIAL_FORM_URL || '').trim();
  const contactEmail = String(globalThis.ORBIT_TYPE_CONTACT_EMAIL || '').trim();
  elements.trialSignupSubmit.disabled = true;
  try {
    if (endpoint) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      elements.trialSignupStatus.textContent = t(settings.interfaceLanguage, 'signupSent');
      showToast(t(settings.interfaceLanguage, 'signupSent'), 'info');
    } else if (trialUrl) {
      globalThis.open(trialUrl, '_blank', 'noopener,noreferrer');
      elements.trialSignupStatus.textContent = t(settings.interfaceLanguage, 'signupOpened');
      showToast(t(settings.interfaceLanguage, 'signupOpened'), 'info');
    } else if (contactEmail) {
      const subject = encodeURIComponent('Orbit Type trial signup');
      const body = encodeURIComponent(JSON.stringify(data, null, 2));
      globalThis.location.href = `mailto:${encodeURIComponent(contactEmail)}?subject=${subject}&body=${body}`;
      elements.trialSignupStatus.textContent = t(settings.interfaceLanguage, 'signupOpened');
    } else {
      elements.trialSignupStatus.textContent = t(settings.interfaceLanguage, 'signupOffline');
      showToast(t(settings.interfaceLanguage, 'signupOffline'), 'info');
    }
  } catch {
    elements.trialSignupStatus.textContent = t(settings.interfaceLanguage, 'signupSavedLocal');
    showToast(t(settings.interfaceLanguage, 'signupSavedLocal'), 'error');
  } finally {
    elements.trialSignupSubmit.disabled = false;
  }
});

elements.englishCaseSensitive?.addEventListener('change', () => { settings.englishCaseSensitive = elements.englishCaseSensitive.checked; saveSettings(); });
elements.englishMeaningMode?.addEventListener('change', () => { settings.meaningMode = elements.englishMeaningMode.value; saveSettings(); renderSelections(); });
elements.difficulty.addEventListener('change', () => { settings.difficulty = elements.difficulty.value; saveSettings(); renderSelections(); });
elements.wordLevel.addEventListener('change', () => { settings.wordLevel = elements.wordLevel.value; saveSettings(); });
elements.topic.addEventListener('change', () => { settings.topic = elements.topic.value; saveSettings(); });
elements.start.addEventListener('click', () => void startCountdown({ immediate: settings.wordSource === 'custom' }));
elements.pause.addEventListener('click', pauseGame);
elements.hudRestart.addEventListener('click', restartCurrentGame);
elements.hudHome.addEventListener('click', () => showExitConfirm('home'));
elements.hudCustom.addEventListener('click', () => showExitConfirm('custom'));
elements.hudReport?.addEventListener('click', reportCurrentWord);
elements.resume.addEventListener('click', resumeGame);
elements.restart.addEventListener('click', restartCurrentGame);
elements.pauseHome.addEventListener('click', stopGameAndReturnHome);
elements.pauseCustom.addEventListener('click', stopGameAndOpenCustomLoader);
elements.pauseFullscreen.addEventListener('click', toggleFullscreen);
elements.exitCancel.addEventListener('click', cancelExitConfirm);
elements.exitHomeConfirm.addEventListener('click', stopGameAndReturnHome);
elements.exitCustomConfirm.addEventListener('click', stopGameAndOpenCustomLoader);
elements.resultRestart.addEventListener('click', restartCurrentGame);
elements.resultEditLesson?.addEventListener('click', () => {
  const finished = Boolean(lastResult?.courseFinal || lastResult?.courseAttemptFinal || (activeCourseLesson && !activeCourseLesson.progression && lastResult?.lessonComplete));
  const id = activeCourseLesson?.templateId;
  stopGameAndOpenMenu('course');
  if (!id) return;
  const index = courseView.templates.findIndex(item => item.id === id);
  const next = finished ? courseView.templates[index + 1] : courseView.templates[index];
  if (next) {
    courseView.selectLesson(next.id);
    if (finished && courseView.isUnlocked(next)) courseView.startSelected(false);
  }
});
elements.resultReportWord?.addEventListener('click', reportCurrentWord);
$$('.menu-return').forEach((button) => button.addEventListener('click', returnToMenu));
elements.menuSound.addEventListener('click', toggleSound);
elements.gameSound.addEventListener('click', toggleSound);
elements.pauseSound.addEventListener('click', toggleSound);
elements.masterVolume.addEventListener('input', () => updateAudioVolume('master', elements.masterVolume.value));
elements.sfxVolume.addEventListener('input', () => updateAudioVolume('sfx', elements.sfxVolume.value));
elements.testShot.addEventListener('click', async () => {
  const audioReady = await engine.unlockAudio();
  if (!audioReady) return showToast(t(settings.interfaceLanguage, 'audioUnavailable'), 'error');
  engine.previewShot(true);
});
elements.testExplosion.addEventListener('click', async () => {
  const audioReady = await engine.unlockAudio();
  if (!audioReady) return showToast(t(settings.interfaceLanguage, 'audioUnavailable'), 'error');
  engine.previewExplosion(false);
});
elements.fullscreen.addEventListener('click', toggleFullscreen);
elements.instructions.addEventListener('click', () => elements.instructionsOverlay.classList.remove('hidden'));
elements.closeInstructions.addEventListener('click', () => elements.instructionsOverlay.classList.add('hidden'));
elements.instructionsOverlay.addEventListener('pointerdown', (event) => {
  if (event.target === elements.instructionsOverlay) elements.instructionsOverlay.classList.add('hidden');
});

document.addEventListener('keydown', (event) => {
  const key = event.key.toLocaleLowerCase('vi');

  if (!elements.exitConfirmOverlay.classList.contains('hidden')) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      cancelExitConfirm();
    }
    return;
  }

  if (!elements.instructionsOverlay.classList.contains('hidden')) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      elements.instructionsOverlay.classList.add('hidden');
    }
    return;
  }

  if (!elements.resultOverlay.classList.contains('hidden')) return;

  if (engine.state === 'paused') {
    if (event.key === 'Escape' || key === 'p') {
      event.preventDefault();
      event.stopPropagation();
      resumeGame();
      return;
    }
    if (key === 'r') {
      event.preventDefault();
      event.stopPropagation();
      restartCurrentGame();
      return;
    }
    if (key === 'h') {
      event.preventDefault();
      event.stopPropagation();
      stopGameAndReturnHome();
      return;
    }
    if (key === 'c') {
      event.preventDefault();
      event.stopPropagation();
      stopGameAndOpenCustomLoader();
      return;
    }
  }

  if (engine.state === 'playing' && event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    pauseGame();
    return;
  }

  // P chỉ là phím tắt khi vùng gõ không giữ focus để tránh phá các tiếng có chữ p.
  if (engine.state === 'playing' && key === 'p' && document.activeElement !== elements.input) {
    event.preventDefault();
    event.stopPropagation();
    pauseGame();
  }
}, true);

document.addEventListener('visibilitychange', () => {
  if (document.hidden && engine.state === 'playing') engine.pause('hidden');
});
window.addEventListener('blur', () => {
  if (engine.state === 'playing') engine.pause('blur');
});
window.addEventListener('resize', () => {
  $('#mobile-warning').classList.toggle('hidden', window.innerWidth >= 769);
}, { passive: true });

arcadeUi = installArcadeUi({
  onPlay: () => elements.start.click(),
  onCourse: () => showMenuPane('course'),
  onResume: () => { showMenuPane('course'); courseView?.startSelected(false); },
  onEffects: level => { settings.effects = level; saveSettings(); renderSelections(); }
});
applyWordSource();
renderSelections();
showMenuPane(['course', 'custom', 'minigames'].includes(query.get('pane')) ? query.get('pane') : 'play');
$('#mobile-warning').classList.toggle('hidden', window.innerWidth >= 769);

if (query.get('autostart') === '1') {
  const requestedMode = query.get('mode');
  if (requestedMode) settings.mode = requestedMode === 'english' ? 'english' : requestedMode === 'indonesian' ? 'indonesian' : 'vietnamese';
  settings.typingLanguage = modeToTypingLanguage(settings.mode);
  refreshCustomWordSetForCurrentLanguage();
  applyWordSource();
  settings.keyboard = query.get('keyboard') === 'telex' ? 'telex' : 'system';
  renderSelections();
  void startCountdown({ demo: true });
}

if (query.get('autostart') === 'course') {
  showMenuPane('course');
  if (query.get('lesson')) courseView?.selectLesson?.(query.get('lesson'));
  courseView?.startSelected?.(false);
}

window.__PHI_DOI_NGON_TU__ = {
  engine,
  inputEngine,
  words: { vietnamese: buildDefaultWordBank('vi', 'en'), english: buildDefaultWordBank('en', 'vi'), indonesian: buildDefaultWordBank('id', 'vi') },
  customLoader,
  miniGamesView,
  get activeCourseLesson() { return activeCourseLesson ? structuredClone(activeCourseLesson) : null; },
  get adaptiveProfile() { return structuredClone(adaptiveProfile); },
  get courseProgress() { return structuredClone(courseProgress); },
  get customWordSet() { return customWordSet ? structuredClone(customWordSet) : null; },
  get settings() { return { ...settings }; },
  get lastResult() { return lastResult ? { ...lastResult } : null; },
  pauseGame,
  resumeGame,
  restartCurrentGame,
  stopGameAndReturnHome,
  stopGameAndOpenCustomLoader,
  showExitConfirm,
  startDemo() {
    elements.menuScreen.classList.add('hidden');
    elements.gameScreen.classList.remove('hidden');
    elements.countdown.classList.add('hidden');
    elements.resultOverlay.classList.add('hidden');
    elements.pauseOverlay.classList.add('hidden');
    elements.exitConfirmOverlay.classList.add('hidden');
    inputEngine.clear();
    engine.start({ ...currentGameSettings(), sound: false }, { demo: true });
    inputEngine.setActive(true);
  },
  debugSummary() {
    return escapeHtml(JSON.stringify({
      state: engine.state,
      targets: engine.targets.length,
      projectiles: engine.projectiles.length,
      shots: engine.stats.shots,
      completed: engine.stats.completed,
      wordSource: engine.wordSourceMetadata
    }));
  }
};
