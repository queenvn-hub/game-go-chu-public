// Optional static integrations. Leave blank to keep all trial data on the visitor's device.
// Put only public form URLs/endpoints here. Never put API keys, secrets, or private tokens in this file.
// A Formspree/Formspark-style endpoint receives JSON directly. A Google Form URL opens in a new tab.
globalThis.ORBIT_TYPE_TRIAL_FORM_ENDPOINT = '';
globalThis.ORBIT_TYPE_TRIAL_FORM_URL = '';
globalThis.ORBIT_TYPE_FEEDBACK_URL = '';
globalThis.ORBIT_TYPE_CONTACT_EMAIL = '';

// Owner Mode is local-only so the creator can test every lesson and screen.
// It is deliberately false on public hosts; a static site has no account check.
const orbitTypeLocalOwnerMode = typeof location !== 'undefined'
  && (location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');

globalThis.ORBIT_TYPE_BETA_CONFIG = Object.freeze({
  publicMode: true,
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
  ownerMode: orbitTypeLocalOwnerMode,
  ownerCourseLessonCount: 33,
  ownerCourseScreenCount: 15,
  freePasteSessions: 10,
  freePasteWordsPerSession: Number.POSITIVE_INFINITY,
  indonesiaUnlimitedBeta: true,
  showPaidPreview: true,
  customQuotaSources: ['paste', 'file', 'url', 'ocr', 'manual', 'custom', 'import']
});

// OCR and voice credentials are intentionally isolated in config/ocr.config.js
// and config/voice.config.js. Never publish either file with a real key.
