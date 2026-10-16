export const MINI_GAME_DEFINITIONS = Object.freeze({
  'truth-check': Object.freeze({
    titleKey: 'miniTruthTitle',
    descriptionKey: 'miniTruthDescription',
    icon: '✓?',
    reviewRatio: 0.2,
    minReviewRounds: 4,
    seconds: 6,
    type: 'truth'
  }),
  'meaning-choice': Object.freeze({
    titleKey: 'miniChoiceTitle',
    descriptionKey: 'miniChoiceDescription',
    icon: '✦',
    reviewRatio: 0.2,
    minReviewRounds: 4,
    seconds: 10,
    type: 'choice'
  }),
  'word-climb': Object.freeze({
    titleKey: 'miniClimbTitle',
    descriptionKey: 'miniClimbDescription',
    icon: '▲',
    reviewRatio: 0.2,
    minReviewRounds: 4,
    seconds: 10,
    type: 'climb'
  })
});

export function languageLabelKey(language) {
  return language === 'en' ? 'miniEnglish' : language === 'id' ? 'miniIndonesian' : 'miniVietnamese';
}

export function normalizeMiniLanguage(value, fallback = 'vi') {
  return ['vi', 'en', 'id'].includes(value) ? value : fallback;
}

export function resolveMeaningLanguage(typingLanguage, meaningLanguage) {
  if (['vi', 'en', 'id'].includes(meaningLanguage)) return meaningLanguage;
  return typingLanguage === 'vi' ? 'en' : 'vi';
}

function randomItem(items, random = Math.random) {
  return items[Math.floor(random() * items.length)];
}

function shuffle(items, random = Math.random) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

export function buildMiniGameQuestion({ concepts, distractorConcepts = concepts, typingLanguage = 'vi', meaningLanguage = 'en', topicIds = [], conceptId = '', round = 0, type = 'choice', random = Math.random } = {}) {
  const selectedTopics = new Set(Array.isArray(topicIds) ? topicIds.filter(Boolean) : []);
  const pool = Array.isArray(concepts)
    ? concepts.filter((concept) => concept?.texts?.[typingLanguage]
      && concept?.texts?.[resolveMeaningLanguage(typingLanguage, meaningLanguage)]
      && (!selectedTopics.size || selectedTopics.has(concept.topic)))
    : [];
  if (!pool.length) return null;
  const concept = conceptId
    ? pool.find((item) => item.id === conceptId) || pool[round % pool.length]
    : pool[round % pool.length] || randomItem(pool, random);
  const meaningCode = resolveMeaningLanguage(typingLanguage, meaningLanguage);
  const correctMeaning = concept.texts[meaningCode];
  // Equivalent prompts/translations must never be offered as an incorrect answer.
  const normalize = value => String(value || '').normalize('NFC').toLowerCase().trim();
  const candidates = Array.isArray(distractorConcepts) ? distractorConcepts : pool;
  const equivalents = new Set(candidates.filter(item => normalize(item.texts?.[typingLanguage]) === normalize(concept.texts[typingLanguage])).map(item => normalize(item.texts?.[meaningCode])));
  equivalents.add(normalize(correctMeaning));
  const distractors = shuffle(candidates.filter(item => item?.texts?.[meaningCode] && !equivalents.has(normalize(item.texts[meaningCode]))), random)
    .map((item) => item.texts[meaningCode])
    .filter((value, index, values) => value && values.indexOf(value) === index)
    .slice(0, 3);
  const choices = shuffle([correctMeaning, ...distractors], random);
  const correctIndex = choices.indexOf(correctMeaning);
  const truthValue = !distractors.length || round % 3 !== 1;
  const displayedMeaning = truthValue ? correctMeaning : (distractors[0] || correctMeaning);

  return {
    conceptId: concept.id,
    topic: concept.topic,
    topicIds: [...selectedTopics],
    prompt: concept.texts[typingLanguage],
    meaning: displayedMeaning,
    correctMeaning,
    ipa: concept.ipa || '',
    meaningLanguage: meaningCode,
    choices,
    correctIndex,
    truthValue,
    type
  };
}

export function evaluateMiniAnswer(question, answer) {
  if (!question) return false;
  if (question.type === 'truth') return Boolean(answer) === Boolean(question.truthValue);
  return Number(answer) === Number(question.correctIndex);
}

export function calculateMiniScore({ correct = false, streak = 0, timedOut = false } = {}) {
  if (!correct || timedOut) return 0;
  return 10 + Math.max(0, Number(streak) - 1) * 2;
}
