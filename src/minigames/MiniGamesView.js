import { t } from '../i18n/index.js';
import { ArcadeView, arcadeCards } from './ArcadeView.js';
import { escapeHtml } from '../game/text.js';
import { buildMiniGameQuestion, calculateMiniScore, languageLabelKey, MINI_GAME_DEFINITIONS, evaluateMiniAnswer } from './MiniGameLogic.js';
import { getMiniGameSummary, loadMiniGameState, recordMiniGameResult } from './MiniGameStore.js';
import { recordCurriculumGame } from '../progress/CurriculumProgress.js';
import { SCHOOL_VOCABULARY, SCHOOL_TOPICS, SCHOOL_LEVELS, SCHOOL_VOCABULARY_VERSION } from '../data/schoolVocabulary.js';
import { VoiceManager } from '../voice/VoiceManager.js';
import { arcadeText } from '../ui/arcade.js';

const CHAPTER_UNIQUE_SIZE = 20;

function option(value, label, selected, disabled = false) {
  return `<option value="${escapeHtml(value)}"${value === selected ? ' selected' : ''}${disabled ? ' disabled' : ''}>${escapeHtml(label)}</option>`;
}

function formatAccuracy(correct, answered) {
  return answered ? Math.round((correct / answered) * 100) : 0;
}

function buildRoundPlan(concepts, definition) {
  const uniqueCount = Math.max(0, concepts.length);
  const reviewCount = uniqueCount
    ? Math.max(Number(definition.minReviewRounds || 4), Math.ceil(uniqueCount * Number(definition.reviewRatio || 0.2)))
    : 0;
  return { uniqueCount, reviewCount, totalRounds: uniqueCount + reviewCount };
}

export class MiniGamesView {
  constructor({ root, uiLanguage = 'vi', voiceManager, sound = true, onSoundChange = () => {}, onBack = () => {}, onConsumeQuota, onQuotaStatus }) {
    this.root = root;
    this.concepts = SCHOOL_VOCABULARY;
    this.uiLanguage = uiLanguage;
    this.typingLanguage = 'vi';
    this.meaningLanguage = 'en';
    this.topicSelection = 'all';
    this.levelSelections = Object.fromEntries(Object.keys(MINI_GAME_DEFINITIONS).map(id => [id, 1]));
    this.onBack = onBack;
    this.onConsumeQuota = onConsumeQuota;
    this.onQuotaStatus = onQuotaStatus;
    this.startPending = false;
    this.quotaSessionToken = null;
    this.sound = Boolean(sound);
    this.onSoundChange = onSoundChange;
    this.progress = loadMiniGameState();
    this.session = null;
    this.timer = 0;
    this.voiceStatus = { status: 'ready', provider: '' };
    this.voiceManager = voiceManager || new VoiceManager();
    this.voiceManager.onStatus = (detail) => this.handleVoiceStatus(detail);
    this.root?.addEventListener('click', (event) => this.handleClick(event));
    this.root?.addEventListener('change', (event) => this.handleChange(event));
    this.root?.addEventListener('click', (event) => {
      const game = event.target.closest('[data-arcade-open]')?.dataset.arcadeOpen;
      if (!game) return;
      this.clearTimer(); this.voiceManager.cancel();
      this.arcade?.destroy();
      this.arcade = new ArcadeView({ root: this.root, game, language: this.uiLanguage, sound: this.sound, onConsumeQuota: this.onConsumeQuota, onQuotaStatus: this.onQuotaStatus, onSoundChange: value => {
        this.sound = value;
        this.onSoundChange(value);
      }, onBack: () => {
        this.arcade?.destroy(); this.arcade = null; this.renderLobby();
      } });
    });
    this.renderLobby();
  }

  setUiLanguage(language) {
    this.uiLanguage = language;
    if (this.mario) { this.mario.setLanguage(language); return; }
    if (this.arcade) { this.arcade.setLanguage(language); return; }
    if (this.root) this.render();
  }

  setSound(enabled) {
    this.sound = Boolean(enabled);
    this.arcade?.setSound?.(this.sound);
  }

  syncSettings({ topicSelection } = {}) {
    if (this.arcade || this.mario) return;
    if (!this.session) {
      if (topicSelection !== undefined) this.topicSelection = this.normalizeTopicSelection(topicSelection);
      this.renderLobby();
    }
  }

  setLessonContext({ topicIds = [] } = {}) {
    if (this.session) return;
    this.topicSelection = topicIds.length === 1 ? this.normalizeTopicSelection(topicIds[0]) : 'all';
    this.renderLobby();
  }

  normalizeTopicSelection(value) {
    return value === 'all' || SCHOOL_TOPICS.some((topic) => topic.id === value) ? value : 'all';
  }

  getTopic(id) {
    return SCHOOL_TOPICS.find((topic) => topic.id === id) || null;
  }

  getLabel(labels = {}) {
    return labels[this.uiLanguage] || labels.vi || labels.en || '';
  }

  getSelection({ topicSelection = this.topicSelection } = {}) {
    const topic = this.getTopic(topicSelection);
    if (topic) {
      return {
        topicIds: [topic.id],
        topicKey: `topic:${topic.id}`,
        label: this.getLabel(topic.labels)
      };
    }
    return { topicIds: [], topicKey: 'all', label: t(this.uiLanguage, 'miniAllTopics') };
  }

  getSelectionConcepts(selection = this.getSelection(), gameId, level) {
    const selected = new Set(selection.topicIds);
    return this.concepts.filter(concept => (!selected.size || selected.has(concept.topic))
      && (!gameId || concept.gameId === gameId) && (!level || concept.level === Number(level)));
  }

  destroy() {
    this.mario?.destroy();
    this.arcade?.destroy();
    this.clearTimer();
    this.voiceManager.cancel();
  }

  handleVoiceStatus(detail = {}) {
    this.voiceStatus = { ...detail };
    const status = this.root?.querySelector?.('[data-mini-voice-status]');
    if (!status) return;
    status.dataset.state = detail.status || 'ready';
    status.textContent = this.voiceStatusText(detail);
  }

  voiceStatusText(detail = this.voiceStatus) {
    const key = {
      loading: 'miniVoiceLoading',
      speaking: 'miniVoiceSpeaking',
      unavailable: 'miniVoiceUnavailable',
      error: 'miniVoiceError'
    }[detail.status] || 'miniVoiceReady';
    return t(this.uiLanguage, key);
  }

  async speakPrompt() {
    const question = this.session?.question;
    if (!question || this.typingLanguage !== 'vi') return;
    try { await this.voiceManager.speak(question.prompt, { language: 'vi', reason: 'prompt' }); }
    catch { /* status is reported by VoiceManager */ }
  }

  async speakAnswer() {
    const question = this.session?.question;
    if (!question || this.meaningLanguage !== 'vi' || !this.session?.awaitingNext) return;
    try { await this.voiceManager.speak(question.correctMeaning, { language: 'vi', reason: 'answer' }); }
    catch { /* status is reported by VoiceManager */ }
  }

  clearTimer() {
    if (this.timer) window.clearInterval(this.timer);
    this.timer = 0;
  }

  render() {
    if (this.session?.finished) this.renderResult();
    else if (this.session) this.renderGame();
    else this.renderLobby();
  }

  renderLobby() {
    if (this.mario) { this.mario.destroy(); this.mario = null; }
    if (this.arcade) { this.arcade.destroy(); this.arcade = null; }
    this.clearTimer();
    this.root.innerHTML = `<section class="mini-games-shell" aria-labelledby="mini-games-title">
      <header class="mini-games-header">
        <div>
          <span class="step-label">${escapeHtml(t(this.uiLanguage, 'miniEyebrow'))}</span>
          <h1 id="mini-games-title">${escapeHtml(t(this.uiLanguage, 'miniTitle'))}</h1>
        </div>
        <button class="secondary-button" type="button" data-mini-action="back-home">⌂ ${escapeHtml(t(this.uiLanguage, 'mainScreen'))}</button>
      </header>
      ${arcadeCards(this.uiLanguage)}
    </section>`;
    window.lucide?.createIcons({ root: this.root });
  }

  async startGame(gameId, context = {}, continueSession = false) {
    if (!MINI_GAME_DEFINITIONS[gameId]) return;
    if (this.startPending) return;
    this.clearTimer();
    this.voiceManager.cancel();
    const definition = MINI_GAME_DEFINITIONS[gameId];
    const selection = this.getSelection({ topicSelection: context.topicSelection ?? this.topicSelection });
    const level = Math.max(1, Math.min(5, Number(context.level || this.levelSelections[gameId])));
    this.levelSelections[gameId] = level;
    const concepts = this.getSelectionConcepts(selection, gameId, level);
    if (!concepts.length) {
      this.renderLobby();
      return;
    }
    const topicKey = `${SCHOOL_VOCABULARY_VERSION}::${selection.topicKey}::level:${level}::vi::en`;
    const chapterCount = concepts.length > CHAPTER_UNIQUE_SIZE * 2
      ? Math.ceil(concepts.length / CHAPTER_UNIQUE_SIZE)
      : 1;
    const savedSummary = getMiniGameSummary(this.progress, gameId, topicKey);
    const requestedChapter = context.chapterIndex === undefined
      ? (savedSummary.completedChapters > 0 && savedSummary.completedChapters < chapterCount ? savedSummary.completedChapters : 0)
      : Number(context.chapterIndex || 0);
    const chapterIndex = Math.max(0, Math.min(chapterCount - 1, requestedChapter));
    this.startPending = true;
    let quota;
    try {
      quota = await this.onConsumeQuota?.({
        scope: 'mini', key: gameId, count: !continueSession,
        sessionToken: continueSession ? this.quotaSessionToken : null,
        step: chapterIndex + 1, maxSteps: chapterCount
      });
    } catch {
      quota = { allowed: false };
    } finally {
      this.startPending = false;
    }
    if (quota && !quota.allowed) return;
    if (!continueSession) this.quotaSessionToken = quota?.sessionToken || null;
    const chapterConcepts = chapterCount > 1
      ? concepts.slice(chapterIndex * CHAPTER_UNIQUE_SIZE, (chapterIndex + 1) * CHAPTER_UNIQUE_SIZE)
      : concepts;
    const plan = buildRoundPlan(chapterConcepts, definition);
    this.session = {
      gameId,
      level,
      definition,
      round: 0,
      totalRounds: plan.totalRounds,
      uniqueCount: plan.uniqueCount,
      reviewCount: plan.reviewCount,
      uniqueConcepts: chapterConcepts,
      reviewConcepts: [],
      reviewPrepared: false,
      missedConceptIds: [],
      score: 0,
      streak: 0,
      bestStreak: 0,
      correct: 0,
      answered: 0,
      timedOut: false,
      awaitingNext: false,
      feedback: '',
      question: null,
      concepts: chapterConcepts,
      fullConcepts: concepts,
      chapterIndex,
      chapterCount,
      chapterStart: chapterIndex * CHAPTER_UNIQUE_SIZE,
      fullUniqueCount: concepts.length,
      topicIds: selection.topicIds,
      topicKey,
      selectionLabel: `${selection.label} · Cấp ${level}/5`,
      topicSelection: context.topicSelection ?? this.topicSelection,
      remainingMs: definition.seconds * 1000,
      finished: false,
      startedAt: Date.now()
    };
    this.advanceRound();
  }

  advanceRound() {
    const session = this.session;
    if (!session) return;
    if (!session.reviewPrepared && session.round >= session.uniqueCount) {
      const missed = session.uniqueConcepts.filter((concept) => session.missedConceptIds.includes(concept.id));
      const fallback = session.uniqueConcepts.filter((concept) => !session.missedConceptIds.includes(concept.id));
      const reviewPool = [...missed, ...fallback];
      session.reviewConcepts = Array.from({ length: session.reviewCount }, (_, index) => reviewPool[index % reviewPool.length]);
      session.reviewPrepared = true;
    }
    if (session.round >= session.totalRounds) {
      this.finishGame();
      return;
    }
    const queue = session.round < session.uniqueCount ? session.uniqueConcepts : session.reviewConcepts;
    const scheduledConcept = queue[session.round < session.uniqueCount ? session.round : session.round - session.uniqueCount];
    session.question = buildMiniGameQuestion({
      concepts: session.concepts,
      distractorConcepts: this.concepts.filter(item => item.gameId === session.gameId),
      typingLanguage: this.typingLanguage,
      meaningLanguage: this.meaningLanguage,
      topicIds: session.topicIds,
      conceptId: scheduledConcept?.id,
      round: session.round,
      type: session.definition.type
    });
    session.remainingMs = session.definition.seconds * 1000;
    session.awaitingNext = false;
    session.feedback = '';
    session.timedOut = false;
    this.renderGame();
    this.startTimer();
    if (this.voiceManager.getSettings().autoSpeak && this.typingLanguage === 'vi') void this.speakPrompt();
  }

  startTimer() {
    this.clearTimer();
    this.timer = window.setInterval(() => {
      const session = this.session;
      if (!session || session.paused || session.awaitingNext || session.finished || document.hidden || !document.hasFocus() || !this.root.getClientRects().length) return;
      session.remainingMs -= 100;
      if (session.remainingMs <= 0) {
        session.remainingMs = 0;
        this.answer(null, true);
        return;
      }
      const fill = this.root.querySelector('.mini-timer-fill');
      const label = this.root.querySelector('.mini-timer-label');
      const total = session.definition.seconds * 1000;
      const percent = Math.max(0, Math.min(100, (session.remainingMs / total) * 100));
      if (fill) fill.style.width = `${percent}%`;
      if (label) label.textContent = `${(session.remainingMs / 1000).toFixed(1)}s`;
    }, 100);
  }

  answer(rawAnswer, timedOut = false) {
    const session = this.session;
    if (!session || session.paused || session.awaitingNext) return;
    this.clearTimer();
    const answer = session.definition.type === 'truth'
      ? rawAnswer === true || rawAnswer === 'true'
      : Number(rawAnswer);
    const correct = !timedOut && evaluateMiniAnswer(session.question, answer);
    if (!correct && session.question?.conceptId && !session.missedConceptIds.includes(session.question.conceptId)) {
      session.missedConceptIds.push(session.question.conceptId);
    }
    session.answered += 1;
    if (correct) {
      session.correct += 1;
      session.streak += 1;
      session.bestStreak = Math.max(session.bestStreak, session.streak);
    } else {
      session.streak = 0;
    }
    session.score += calculateMiniScore({ correct, streak: session.streak, timedOut });
    session.timedOut = timedOut;
    session.feedback = correct ? 'correct' : timedOut ? 'timeout' : 'wrong';
    session.awaitingNext = true;
    this.renderGame();
    if (this.voiceManager.getSettings().autoSpeak && this.meaningLanguage === 'vi') void this.speakAnswer();
  }

  nextRound() {
    if (!this.session?.awaitingNext) return;
    this.voiceManager.cancel();
    this.session.round += 1;
    this.advanceRound();
  }

  finishGame() {
    const session = this.session;
    if (!session) return;
    this.clearTimer();
    this.voiceManager.cancel();
    this.progress = recordMiniGameResult(session.gameId, {
      score: session.score,
      correct: session.correct,
      answered: session.answered,
      bestStreak: session.bestStreak,
      topicKey: session.topicKey,
      typingLanguage: this.typingLanguage,
      meaningLanguage: this.meaningLanguage,
      chapterIndex: session.chapterIndex,
      chapterCount: session.chapterCount
    });
    recordCurriculumGame({
      language: this.typingLanguage,
      gameId: session.gameId,
      score: session.score,
      accuracy: formatAccuracy(session.correct, session.answered),
      topicKey: session.topicKey,
      chapterIndex: session.chapterIndex,
      chapterCount: session.chapterCount,
      storage: undefined
    });
    session.finished = true;
    this.renderResult();
  }

  renderTimer() {
    const session = this.session;
    const total = session.definition.seconds * 1000;
    const percent = Math.max(0, Math.min(100, (session.remainingMs / total) * 100));
    return `<div class="mini-timer" aria-label="${escapeHtml(t(this.uiLanguage, 'miniTime'))}"><span class="mini-timer-label">${(session.remainingMs / 1000).toFixed(1)}s</span><i><b class="mini-timer-fill" style="width:${percent}%"></b></i></div>`;
  }

  renderAnswerButtons() {
    const session = this.session;
    const question = session.question;
    const disabled = session.awaitingNext || session.paused ? ' disabled' : '';
    if (session.definition.type === 'truth') {
      return `<div class="mini-answer-grid truth-answers">
        <button class="mini-answer-button is-true" type="button" data-mini-action="answer" data-mini-answer="true"${disabled}>✓ ${escapeHtml(t(this.uiLanguage, 'miniTrue'))}</button>
        <button class="mini-answer-button is-false" type="button" data-mini-action="answer" data-mini-answer="false"${disabled}>✕ ${escapeHtml(t(this.uiLanguage, 'miniFalse'))}</button>
      </div>`;
    }
    return `<div class="mini-answer-grid">${question.choices.map((choice, index) => `<button class="mini-answer-button${session.awaitingNext && evaluateMiniAnswer(question, index) ? ' is-correct' : ''}" type="button" data-mini-action="answer" data-mini-answer="${index}"${disabled}>${String.fromCharCode(65 + index)}. ${escapeHtml(choice)}</button>`).join('')}</div>`;
  }

  renderFeedback() {
    const session = this.session;
    if (!session.awaitingNext) return '';
    const correct = session.feedback === 'correct';
    const timeout = session.feedback === 'timeout';
    const feedbackKey = correct ? 'miniCorrect' : timeout ? 'miniTimeout' : 'miniWrong';
    const answerNote = `<small>${escapeHtml(session.question.prompt)} → ${escapeHtml(session.question.correctMeaning)}</small><small class="mini-answer-ipa">${escapeHtml(session.question.ipa || 'IPA: chưa xác minh')}</small>`;
    const answerVoice = this.meaningLanguage === 'vi'
      ? `<button class="mini-voice-inline" type="button" data-mini-action="speak-answer">${escapeHtml(t(this.uiLanguage, 'miniVoiceHearAnswer'))}</button>`
      : '';
    const nextLabel = session.round + 1 >= session.totalRounds ? 'miniFinish' : 'miniNext';
    return `<div class="mini-feedback ${correct ? 'is-correct' : 'is-wrong'}" role="status"><strong>${escapeHtml(t(this.uiLanguage, feedbackKey))}</strong>${answerNote}${answerVoice}<button class="primary-button" type="button" data-mini-action="next">${escapeHtml(t(this.uiLanguage, nextLabel))} →</button></div>`;
  }

  renderGame() {
    const session = this.session;
    const question = session.question;
    if (!session || !question) return;
    const definition = session.definition;
    const topic = this.getTopic(question.topic)?.labels.vi || question.topic;
    const chapter = session.chapterCount > 1
      ? ` · ${escapeHtml(t(this.uiLanguage, 'miniChapter', { current: session.chapterIndex + 1, total: session.chapterCount }))}`
      : '';
    const meaningBlock = definition.type === 'truth'
      ? `<span class="mini-meaning-label">${escapeHtml(t(this.uiLanguage, 'miniMeaningIn', { language: t(this.uiLanguage, languageLabelKey(question.meaningLanguage)) }))}</span><strong class="mini-meaning-value">${escapeHtml(question.meaning)}</strong>`
      : '';
    const progress = Math.round(session.correct / session.totalRounds * 100);
    const character = definition.type === 'climb' ? 'dino' : definition.type === 'truth' ? 'ship' : 'crystal';
    const instruction = arcadeText(this.uiLanguage, definition.type === 'climb' ? 'climb' : definition.type === 'truth' ? 'trueFalse' : 'chooseMeaning');
    const scene = `<aside class="mini-scene-3d scene-${character} feedback-${session.feedback || 'idle'}" aria-label="${escapeHtml(instruction)}">
      <div class="scene-orbit" aria-hidden="true"></div>
      <div class="scene-character sprite-3d sprite-${character}" style="--ascent:${progress * 0.8}px" aria-hidden="true"></div>
      <div class="scene-caption"><strong>${escapeHtml(instruction)}</strong><progress max="${session.totalRounds}" value="${session.correct}" aria-label="${escapeHtml(t(this.uiLanguage, 'miniCorrectCount'))}"></progress><span>${session.correct} / ${session.totalRounds}</span></div>
    </aside>`;
    const locked = session.awaitingNext ? ' is-locked' : '';
    const promptVoice = this.typingLanguage === 'vi'
      ? `<button class="mini-voice-inline" type="button" data-mini-action="speak-prompt">${escapeHtml(t(this.uiLanguage, 'miniVoiceRepeat'))}</button>`
      : '';
    this.root.innerHTML = `<section class="mini-games-shell mini-session-shell" aria-labelledby="mini-session-title">
      <header class="mini-games-header">
        <div><span class="step-label">${escapeHtml(t(this.uiLanguage, 'miniEyebrow'))}</span><h1 id="mini-session-title">${escapeHtml(t(this.uiLanguage, definition.titleKey))}</h1><p>${escapeHtml(t(this.uiLanguage, 'miniRound', { current: session.round + 1, total: session.totalRounds }))} · ${escapeHtml(t(this.uiLanguage, 'miniTopic'))}: ${escapeHtml(session.selectionLabel)} · ${escapeHtml(topic)}</p></div>
        <button class="secondary-button" type="button" data-mini-action="lobby">← ${escapeHtml(t(this.uiLanguage, 'miniBackToGames'))}</button>
      </header>
      <div class="mini-session-toolbar"><span>${escapeHtml(t(this.uiLanguage, 'miniScore'))}: <b>${session.score}</b></span><span>${escapeHtml(t(this.uiLanguage, 'miniStreak'))}: <b>${session.streak}</b></span><span class="mini-chapter-label">${escapeHtml(chapter.replace(/^ · /, ''))}</span>${promptVoice}<small class="mini-voice-status" data-mini-voice-status data-state="${escapeHtml(this.voiceStatus.status || 'ready')}">${escapeHtml(this.voiceStatusText())}</small><button type="button" class="mini-voice-inline" data-mini-action="pause" aria-pressed="${Boolean(session.paused)}">${escapeHtml(t(this.uiLanguage, session.paused ? 'resume' : 'pause'))}</button>${this.renderTimer()}</div>
      <div class="mini-playfield">${scene}<div class="mini-play-content">
      <article class="mini-question-card">
        <span class="mini-question-kicker">${escapeHtml(t(this.uiLanguage, 'miniPrompt'))}</span>
        <strong class="mini-prompt-word">${escapeHtml(question.prompt)}</strong>
        ${meaningBlock}
      </article>
      <div class="mini-session-answers${locked}">${this.renderAnswerButtons()}</div>
      ${this.renderFeedback()}
      </div></div>
    </section>`;
  }

  renderResult() {
    const session = this.session;
    const summary = getMiniGameSummary(this.progress, session.gameId, session.topicKey);
    const accuracy = formatAccuracy(session.correct, session.answered);
    const hasNextChapter = session.chapterIndex + 1 < session.chapterCount;
    const resultTitle = hasNextChapter ? 'miniChapterComplete' : 'miniComplete';
    const nextAction = hasNextChapter
      ? `<button class="primary-button" type="button" data-mini-action="next-chapter">${escapeHtml(t(this.uiLanguage, 'miniNextChapter'))} →</button>`
      : '';
    this.root.innerHTML = `<section class="mini-games-shell mini-result-shell" aria-labelledby="mini-result-title">
      <header class="mini-games-header"><div><span class="step-label">${escapeHtml(t(this.uiLanguage, 'miniEyebrow'))}</span><h1 id="mini-result-title">${escapeHtml(t(this.uiLanguage, resultTitle))}</h1><p>${escapeHtml(t(this.uiLanguage, session.definition.titleKey))} · ${escapeHtml(session.selectionLabel)}${hasNextChapter ? ` · ${escapeHtml(t(this.uiLanguage, 'miniChapter', { current: session.chapterIndex + 1, total: session.chapterCount }))}` : ''}</p></div><span class="mini-result-icon">✦</span></header>
      <div class="mini-result-score"><strong>${session.score}</strong><span>${escapeHtml(t(this.uiLanguage, 'miniPoints'))}</span></div>
      <div class="mini-result-grid"><div><span>${escapeHtml(t(this.uiLanguage, 'miniAccuracy'))}</span><b>${accuracy}%</b></div><div><span>${escapeHtml(t(this.uiLanguage, 'miniCorrectCount'))}</span><b>${session.correct}/${session.answered}</b></div><div><span>${escapeHtml(t(this.uiLanguage, 'miniBestScoreLabel'))}</span><b>${summary.bestScore}</b></div><div><span>${escapeHtml(t(this.uiLanguage, 'miniBestStreak'))}</span><b>${session.bestStreak}</b></div></div>
      <div class="mini-result-actions">${nextAction}<button class="primary-button" type="button" data-mini-action="restart">↻ ${escapeHtml(t(this.uiLanguage, 'miniPlayAgain'))}</button><button class="secondary-button" type="button" data-mini-action="lobby">${escapeHtml(t(this.uiLanguage, 'miniBackToGames'))}</button></div>
    </section>`;
  }

  handleChange(event) {
    const setting = event.target.closest?.('[data-mini-setting]')?.dataset?.miniSetting;
    if (!setting) return;
    if (setting.startsWith('voice-')) {
      const patch = {};
      if (setting === 'voice-enabled') patch.enabled = event.target.checked;
      if (setting === 'voice-auto-speak') patch.autoSpeak = event.target.checked;
      if (setting === 'voice-provider') patch.provider = event.target.value;
      if (setting === 'voice-rate') patch.rate = Number(event.target.value);
      if (setting === 'voice-volume') patch.volume = Number(event.target.value) / 100;
      this.voiceManager.updateSettings(patch);
      this.renderLobby();
      return;
    }
    if (setting === 'topic') {
      this.topicSelection = this.normalizeTopicSelection(event.target.value);
    }
    if (setting === 'level') {
      const gameId = event.target.dataset.miniGame;
      if (MINI_GAME_DEFINITIONS[gameId]) this.levelSelections[gameId] = Math.max(1, Math.min(5, Number(event.target.value) || 1));
    }
    this.renderLobby();
  }

  handleClick(event) {
    const actionElement = event.target.closest?.('[data-mini-action]');
    if (!actionElement) return;
    const action = actionElement.dataset.miniAction;
    if (action === 'choose') this.startGame(actionElement.dataset.miniGame);
    else if (action === 'pause' && this.session) { this.session.paused = !this.session.paused; this.voiceManager.cancel(); this.renderGame(); }
    else if (action === 'answer') this.answer(actionElement.dataset.miniAnswer);
    else if (action === 'next') this.nextRound();
    else if (action === 'speak-prompt') void this.speakPrompt();
    else if (action === 'speak-answer') void this.speakAnswer();
    else if (action === 'test-voice') void this.voiceManager.speak(t(this.uiLanguage, 'miniVoiceTestPhrase'), { language: 'vi', reason: 'test' }).catch(() => {});
    else if (action === 'restart') {
      const session = this.session;
      this.topicSelection = session?.topicSelection || this.topicSelection;
      this.startGame(session?.gameId, { chapterIndex: session.chapterIndex, level: session.level });
    }
    else if (action === 'next-chapter') {
      const session = this.session;
      if (!session || session.chapterIndex + 1 >= session.chapterCount) return;
      this.topicSelection = session.topicSelection || this.topicSelection;
      this.startGame(session.gameId, { chapterIndex: session.chapterIndex + 1, level: session.level }, true);
    }
    else if (action === 'lobby') { this.clearTimer(); this.voiceManager.cancel(); this.session = null; this.quotaSessionToken = null; this.renderLobby(); }
    else if (action === 'back-home') { this.clearTimer(); this.voiceManager.cancel(); this.session = null; this.quotaSessionToken = null; this.renderLobby(); this.onBack(); }
  }
}
