const DEFAULT_CONFIG = Object.freeze({
  publicMode: false,
  enabled: true,
  paidLessonsLocked: true,
  freeCourseLessonCount: 9,
  freeCourseScreenCount: 5,
  freeVietnameseLessonCount: 9,
  freeVietnameseScreenCount: 15,
  freeVietnameseLessonIds: [
    'grade5-01-family-school', 'grade5-02-classroom-home', 'grade5-03-clothes-body',
    'grade5-04-health-animals', 'grade5-05-pets-food', 'grade5-06-drinks-colors',
    'grade5-07-numbers-time', 'grade5-08-calendar-weather', 'grade5-09-nature-places'
  ],
  freeIndonesianLessonCount: 21,
  freeEnglishLessonCount: 6,
  ownerMode: false,
  ownerCourseLessonCount: 33,
  ownerCourseScreenCount: 15,
  freePasteSessions: 10,
  freePasteWordsPerSession: 16,
  indonesiaUnlimitedBeta: true,
  showPaidPreview: true,
  customQuotaSources: ['paste', 'file', 'url', 'ocr', 'manual', 'custom', 'import']
});

function configuredValue() {
  const configured = globalThis.ORBIT_TYPE_BETA_CONFIG;
  if (!configured || typeof configured !== 'object') return DEFAULT_CONFIG;
  return configured;
}

export function getBetaConfig() {
  const configured = configuredValue();
  const ownerMode = Boolean(configured.ownerMode || globalThis.ORBIT_TYPE_ACCOUNT?.owner === true);
  const configuredLessonCount = ownerMode
    ? configured.ownerCourseLessonCount
    : configured.freeCourseLessonCount ?? DEFAULT_CONFIG.freeCourseLessonCount;
  const freeCourseLessonCount = Math.max(0, Number(configuredLessonCount ?? DEFAULT_CONFIG.freeCourseLessonCount));
  const configuredScreenCount = ownerMode ? configured.ownerCourseScreenCount : configured.freeCourseScreenCount;
  const freeVietnameseLessonCount = Math.max(0, Number(configured.freeVietnameseLessonCount ?? DEFAULT_CONFIG.freeVietnameseLessonCount));
  const freeVietnameseScreenCount = Math.max(1, Number(configured.freeVietnameseScreenCount ?? DEFAULT_CONFIG.freeVietnameseScreenCount));
  return {
    ...DEFAULT_CONFIG,
    ...configured,
    ownerMode,
    freeCourseLessonCount,
    freeCourseScreenCount: Math.max(1, Number(configuredScreenCount ?? DEFAULT_CONFIG.freeCourseScreenCount)),
    freeVietnameseLessonCount,
    freeVietnameseScreenCount,
    freeIndonesianLessonCount: Math.max(0, Number(configured.freeIndonesianLessonCount ?? DEFAULT_CONFIG.freeIndonesianLessonCount)),
    freeEnglishLessonCount: Math.max(0, Number(configured.freeEnglishLessonCount ?? DEFAULT_CONFIG.freeEnglishLessonCount)),
    freePasteSessions: Math.max(0, Number(configured.freePasteSessions ?? DEFAULT_CONFIG.freePasteSessions)),
    freePasteWordsPerSession: configured.publicMode
      ? Number.POSITIVE_INFINITY
      : Math.max(1, Number(configured.freePasteWordsPerSession ?? DEFAULT_CONFIG.freePasteWordsPerSession)),
    freeVietnameseLessonIds: Array.isArray(configured.freeVietnameseLessonIds) ? [...configured.freeVietnameseLessonIds] : [...DEFAULT_CONFIG.freeVietnameseLessonIds],
    customQuotaSources: Array.isArray(configured.customQuotaSources) ? [...configured.customQuotaSources] : [...DEFAULT_CONFIG.customQuotaSources]
  };
}

export function normalizeLanguageCode(value) {
  if (value === 'vietnamese' || value === 'vi') return 'vi';
  if (value === 'indonesian' || value === 'id') return 'id';
  return 'en';
}

export function getCourseFreeLessonCount(language = 'en', totalLessons = Infinity) {
  const config = getBetaConfig();
  const code = normalizeLanguageCode(language);
  const configuredCount = config.ownerMode
    ? config.ownerCourseLessonCount
    : code === 'vi'
      ? config.freeVietnameseLessonCount
      : code === 'id'
        ? config.freeIndonesianLessonCount
        : config.freeEnglishLessonCount;
  return Math.min(Math.max(0, Number(configuredCount) || 0), Math.max(0, Number(totalLessons)));
}

export function getCourseLessonAccess({ language = 'en', lessonId = '', lessonIndex = -1, screenIndex = -1, progressionMode = '', adaptive = false } = {}) {
  const config = getBetaConfig();
  const code = normalizeLanguageCode(language);
  if (config.ownerMode) {
    return { allowed: true, locked: false, reason: 'owner-mode', language: code };
  }
  if (adaptive) {
    return { allowed: false, locked: true, reason: 'adaptive-paid', language: code };
  }
  const progressionScreen = Number.isInteger(screenIndex) && screenIndex > 0 ? screenIndex : 1;
  const grade5 = /^grade5-(\d{2})-/.exec(String(lessonId));
  const grade5Number = grade5 ? Number(grade5[1]) : 0;
  const freeVietnameseTopic = code === 'vi' && config.freeVietnameseLessonIds.includes(lessonId);
  const freeIndonesianTopic = code === 'id' && grade5Number >= 1 && grade5Number <= config.freeIndonesianLessonCount;
  const basicKeyboardLesson = new Set(['home-fj', 'home-dk', 'home-sl', 'home-a', 'home-gh', 'home-review']).has(lessonId);
  if (freeVietnameseTopic && progressionMode && progressionScreen <= config.freeVietnameseScreenCount) {
    return { allowed: true, locked: false, reason: 'free-foundation-screen', language: code, screenIndex: progressionScreen };
  }
  if (freeIndonesianTopic && progressionMode && progressionScreen <= config.freeCourseScreenCount) {
    return { allowed: true, locked: false, reason: 'free-foundation-screen', language: code, screenIndex: progressionScreen };
  }
  if (basicKeyboardLesson && !progressionMode && progressionScreen === 1) {
    return { allowed: true, locked: false, reason: 'free-foundation-lesson', language: code, screenIndex: 1 };
  }
  if ((freeVietnameseTopic && progressionScreen > config.freeVietnameseScreenCount)
    || (freeIndonesianTopic && progressionScreen > config.freeCourseScreenCount)) {
    return { allowed: false, locked: true, reason: 'paid-vocabulary-screen', language: code, screenIndex: progressionScreen };
  }
  return { allowed: false, locked: true, reason: 'paid-lesson', language: code };
}

export function getFreePlanSummary() {
  const config = getBetaConfig();
  return Object.freeze({
    freeCourseLessonCount: config.freeCourseLessonCount,
    freeCourseScreenCount: config.freeCourseScreenCount,
    freePasteSessions: config.freePasteSessions,
    freePasteWordsPerSession: config.freePasteWordsPerSession,
    indonesiaUnlimitedBeta: config.indonesiaUnlimitedBeta,
    paidLessonsLocked: config.paidLessonsLocked
  });
}

export function canStartCourseLesson(options = {}) {
  return getCourseLessonAccess(options).allowed;
}

export function isQuotaSource(source) {
  return getBetaConfig().customQuotaSources.includes(String(source || 'paste'));
}
