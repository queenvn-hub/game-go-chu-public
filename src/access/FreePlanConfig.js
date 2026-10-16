export const FREE_PLAN_CONFIG = Object.freeze({
  freeLessonCount: 20,
  freeCoreWordCount: 640,
  freeGames: Object.freeze(['meteor', 'truth-check', 'meaning-choice', 'word-climb']),
  freeSpeeds: Object.freeze(['very-slow', 'slow', 'medium', 'fast', 'very-fast']),
  freePasteSessions: 10,
  freePasteWordsPerSession: 16,
  paidPreviewEnabled: true,
  indonesianBetaUnlimited: true
});

export function isFreeGame(gameId) {
  return FREE_PLAN_CONFIG.freeGames.includes(String(gameId));
}

export function isFreeSpeed(speed) {
  return FREE_PLAN_CONFIG.freeSpeeds.includes(String(speed));
}
