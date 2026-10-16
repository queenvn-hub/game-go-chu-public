import { getGrade5VietnameseProgressionScript } from '../data/grade5Curriculum.js';
import { getProgressionSpec, PROGRESSION_TOTAL_SCREENS } from './CourseProgression.js';

export function getLessonScreenCount(lessonId, language = 'vi') {
  const script = language === 'vi' ? getGrade5VietnameseProgressionScript(lessonId) : null;
  return script?.length || PROGRESSION_TOTAL_SCREENS;
}

export function getLessonScreenSpec(lessonId, language, screenIndex = 1) {
  const script = language === 'vi' ? getGrade5VietnameseProgressionScript(lessonId) : null;
  if (!script?.length) return getProgressionSpec(screenIndex);
  const index = Math.max(1, Math.min(script.length, Math.floor(Number(screenIndex) || 1)));
  const texts = script[index - 1];
  const lengths = texts.map(text => Array.from(text.normalize('NFC')).length);
  const sentences = texts.every(text => /[.!?]$/.test(text.trim()));
  return {
    ...getProgressionSpec(index), screenIndex: index,
    targetKind: sentences ? 'sentence' : script.length === PROGRESSION_TOTAL_SCREENS && getProgressionSpec(index).targetKind === 'pair' ? 'pair' : texts.some(text => /\s/.test(text)) ? 'phrase' : 'word',
    wordLength: lengths.every(n => n === lengths[0]) ? lengths[0] : null,
    screenWordCount: texts.length, targetCount: texts.length,
    sentenceCount: sentences ? texts.length : 0, pairCount: !sentences && script.length === PROGRESSION_TOTAL_SCREENS ? getProgressionSpec(index).pairCount : 0,
    totalScreensPerBlock: script.length,
    totalTargets: script.reduce((sum, screen) => sum + screen.length, 0),
    screenCounts: script.map(screen => screen.length),
    isFinal: index === script.length, authored: true
  };
}
