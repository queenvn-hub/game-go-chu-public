import { AudioManager } from './AudioManager.js';
import { GAME_CONFIG } from './gameConfig.js';
import {
  clamp,
  comparisonText,
  isValidGameTarget,
  normalizeText,
  stripVietnameseDiacritics
} from './text.js';
import { transformTelexText } from './telex.js';
import { SpacePresentation, measureTarget, rockOutline, traceRock, targetTravelBounds } from './SpacePresentation.js';

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function hashNumber(value) {
  let hash = 2166136261;
  const text = String(value);
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function codePointLength(value) {
  return Array.from(value).length;
}

function exactPrefixLength(input, target) {
  const inputUnits = Array.from(input);
  const targetUnits = Array.from(target);
  const limit = Math.min(inputUnits.length, targetUnits.length);
  let progress = 0;
  while (progress < limit && inputUnits[progress] === targetUnits[progress]) progress += 1;
  return progress;
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

export function getDemoTargetTexts(mode) {
  if (mode === 'english') return ['red', 'cloud', 'family', 'school'];
  if (mode === 'indonesian') return ['merah', 'awan', 'keluarga', 'sekolah'];
  return ['đỏ', 'mây', 'gia đình', 'trường'];
}

export class GameEngine {
  constructor({ canvas, words, onHud, onState, onMessage, translate = (key) => key, onGameOver, onRequestInputClear }) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d', { alpha: false });
    if (!this.context) throw new Error('Trình duyệt không hỗ trợ Canvas 2D.');
    const initialWords = Array.isArray(words) ? words : (words?.vietnamese || words?.english || words?.indonesian || []);
    const invalidWords = initialWords.filter((item) => !isValidGameTarget(item?.text));
    if (invalidWords.length) {
      console.warn('Đã loại khỏi game các mục tiêu chữ không hợp lệ:', invalidWords.map((item) => item?.text));
    }
    this.words = initialWords.filter((item) => isValidGameTarget(item?.text));
    if (!this.words.length) throw new Error('Kho từ không có mục tiêu hợp lệ.');
    this.wordSourceMetadata = {
      type: 'default',
      label: 'DEFAULT',
      orderMode: 'random',
      sequentialLearning: false,
      language: 'vietnamese',
      courseLessonId: '',
      courseScreen: 0
    };
    this.learningQueue = [];
    this.learningQueueIndex = 0;
    this.learningCompleted = 0;
    this.learningFinished = false;
    this.mistakeWordIds = new Set();
    this.onHud = onHud;
    this.onState = onState;
    this.onMessage = onMessage;
    this.translate = translate;
    this.onGameOver = onGameOver;
    this.onRequestInputClear = onRequestInputClear;
    this.audio = new AudioManager();
    this.effectsLevel = 'medium';
    this.presentation = new SpacePresentation(this);

    this.state = 'menu';
    this.settings = {
      mode: 'vietnamese',
      meaningMode: 'immediate',
      caseSensitive: false,
      keyboard: 'system',
      difficulty: 'medium',
      wordLevel: 'auto',
      topic: 'all',
      sound: true,
      courseMode: false,
      noDamage: false,
      maxTargets: null,
      courseLessonId: '',
      courseScreen: 0
    };

    this.width = 1280;
    this.height = 720;
    this.dpr = 1;
    this.backgroundGradient = null;
    this.targets = [];
    this.projectiles = [];
    this.particles = [];
    this.floaters = [];
    this.activeTargetId = null;
    this.inputValue = '';
    this.lastInvalidValue = '';
    this.nextId = 1;
    this.spawnTimer = 0;
    this.elapsed = 0;
    this.level = 1;
    this.lastHudUpdate = 0;
    this.lastTimestamp = 0;
    this.rafId = 0;
    this.loopStarted = false;
    this.shakeTime = 0;
    this.damageFlash = 0;
    this.levelBanner = 0;
    this.recentWordIds = [];
    this.demoMode = false;
    this.lastCompletedMeaning = '';
    this.lastCompletedWord = '';
    this.lastCompletedTarget = null;
    this.lastMeaningUntil = 0;
    this.debugCharacterTargets = Boolean(globalThis.DEBUG_CHARACTER_TARGETS);
    this.stats = this.createStats();

    this.stars = Array.from({ length: 90 }, (_, index) => ({
      x: (index * 0.61803398875) % 1,
      y: ((index * 47) % 101) / 101,
      size: 0.7 + (index % 4) * 0.45,
      speed: 5 + (index % 6) * 3,
      alpha: 0.22 + (index % 5) * 0.12
    }));
    this.clouds = Array.from({ length: 10 }, (_, index) => ({
      x: ((index * 29) % 97) / 97,
      y: 0.08 + ((index * 19) % 70) / 100,
      scale: 0.55 + (index % 4) * 0.22,
      speed: 4 + (index % 3) * 3,
      hue: index % 2
    }));

    this.resize = this.resize.bind(this);
    this.frame = this.frame.bind(this);
    window.addEventListener('resize', this.resize, { passive: true });
    this.resize();
    this.startLoop();
  }

  createStats() {
    return {
      score: 0,
      shield: GAME_CONFIG.shield,
      combo: 0,
      maxCombo: 0,
      completed: 0,
      correctUnits: 0,
      correctCharacters: 0,
      attempts: 0,
      mistakes: 0,
      shots: 0,
      startedAt: 0,
      keyMetrics: {}
    };
  }

  message(key, replacements = {}, type = 'info') {
    this.onMessage(this.translate(key, replacements), type);
  }

  destroy() {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.resize);
  }

  setWordSource(words, metadata = {}) {
    if (this.state === 'playing' || this.state === 'paused') {
      throw new Error('Change word source before starting a game.');
    }
    const validWords = Array.isArray(words)
      ? words.filter((item) => item && isValidGameTarget(item.text))
      : [];
    if (!validWords.length) throw new Error('The word source has no valid words.');
    this.words = validWords;
    const orderMode = ['original', 'shuffle', 'alphabetical', 'difficulty'].includes(metadata.orderMode)
      ? metadata.orderMode
      : 'random';
    this.wordSourceMetadata = {
      type: ['custom', 'course'].includes(metadata.type) ? metadata.type : 'default',
      label: String(metadata.label || (metadata.type === 'custom' ? 'CUSTOM' : metadata.type === 'course' ? 'COURSE' : 'DEFAULT')),
      count: validWords.length,
      orderMode,
      sequentialLearning: orderMode === 'original' && metadata.sequentialLearning !== false,
      splitBySentence: Boolean(metadata.splitBySentence),
      language: ['english','indonesian'].includes(metadata.language) ? metadata.language : 'vietnamese',
      courseLessonId: String(metadata.courseLessonId || '')
    };
    const originalWords = [...validWords].sort((a, b) => (
      (a.originalIndex ?? 0) - (b.originalIndex ?? 0)
      || (a.sourceIndex ?? 0) - (b.sourceIndex ?? 0)
    ));
    this.learningQueue = orderMode === 'original'
      ? originalWords.map((word, queueIndex) => ({ ...word, queueIndex }))
      : [];
    this.learningQueueIndex = 0;
    this.learningCompleted = 0;
    this.learningFinished = false;
    this.mistakeWordIds = new Set();
    this.recentWordIds = [];
    return { ...this.wordSourceMetadata };
  }

  setSound(enabled) {
    this.settings.sound = Boolean(enabled);
    this.audio.setEnabled(enabled);
  }

  setAudioLevels(masterVolume, sfxVolume) {
    this.audio.setVolume(masterVolume);
    this.audio.setSfxVolume(sfxVolume);
  }

  previewShot(final = false) {
    this.audio.setPaused(false);
    this.audio.shot({ final });
  }

  previewExplosion(boss = false) {
    this.audio.setPaused(false);
    this.audio.explosion({ boss });
  }

  async unlockAudio() {
    return this.audio.unlock();
  }

  start(settings, { demo = false } = {}) {
    this.settings = { ...this.settings, ...settings };
    this.audio.setEnabled(this.settings.sound);
    this.audio.setPaused(false);
    this.targets = [];
    this.projectiles = [];
    this.particles = [];
    this.floaters = [];
    this.activeTargetId = null;
    this.inputValue = '';
    this.lastInvalidValue = '';
    this.spawnTimer = demo ? 999 : 0.5;
    this.elapsed = 0;
    this.level = 1;
    this.levelBanner = 1.7;
    this.recentWordIds = [];
    this.demoMode = demo;
    this.learningQueueIndex = 0;
    this.learningCompleted = 0;
    this.learningFinished = false;
    this.mistakeWordIds = new Set();
    this.lastCompletedMeaning = '';
    this.lastCompletedWord = '';
    this.lastCompletedTarget = null;
    this.lastMeaningUntil = 0;
    this.stats = this.createStats();
    this.stats.startedAt = performance.now();
    this.lastTimestamp = performance.now();
    this.state = 'playing';
    this.onState('playing');
    this.emitHud(true);
    const courseScreen = Number(this.settings.courseScreen) || 0;
    if (this.settings.courseMode && courseScreen > 0) {
      this.onMessage(`${this.translate('level')} ${courseScreen}`, 'info');
    } else {
      this.message('engineStart', {}, 'info');
    }

    if (demo) {
      const positions = [[0.23, 0.18], [0.52, 0.08], [0.78, 0.25], [0.38, 0.34]];
      getDemoTargetTexts(this.settings.mode).forEach((text, index) => {
        this.spawnSpecific(text, positions[index][0], positions[index][1]);
      });
    }
  }

  stopToMenu() {
    this.audio.setPaused(false);
    this.state = 'menu';
    this.targets = [];
    this.projectiles = [];
    this.particles = [];
    this.floaters = [];
    this.activeTargetId = null;
    this.inputValue = '';
    this.lastInvalidValue = '';
    this.lastCompletedMeaning = '';
    this.lastCompletedWord = '';
    this.lastCompletedTarget = null;
    this.lastMeaningUntil = 0;
    this.emitHud(true);
    this.onState('menu');
  }

  pause(reason = 'manual') {
    if (this.state !== 'playing') return;
    this.audio.setPaused(true);
    this.state = 'paused';
    this.onState('paused', reason);
    this.emitHud(true);
  }

  resume() {
    if (this.state !== 'paused') return;
    this.audio.setPaused(false);
    this.state = 'playing';
    this.lastTimestamp = performance.now();
    this.onState('playing');
  }

  togglePause() {
    if (this.state === 'playing') this.pause('manual');
    else if (this.state === 'paused') this.resume();
  }

  getActiveTarget() {
    return this.targets.find((target) => target.id === this.activeTargetId && !target.pendingDestroy) || null;
  }

  getGuideTarget() {
    const active = this.getActiveTarget();
    if (active) return active;
    const available = this.targets.filter(target => !target.pendingDestroy);
    if (this.wordSourceMetadata.sequentialLearning) return available.find(target => target.queueIndex === this.learningCompleted) || null;
    return available.length === 1 ? available[0] : null;
  }

  getActiveComparisonTarget() {
    return this.getActiveTarget()?.comparison || '';
  }

  clearActiveInput() {
    const active = this.getActiveTarget();
    if (active) {
      active.progress = 0;
      active.confirmedProgress = 0;
      active.typedUnits = 0;
      active.lastFiredProgress = 0;
      active.provisional = false;
      active.guideInput = '';
      delete active.previewGuideInput;
      active.nextCharacterHitIndex = 0;
      active.characterStates.forEach((character) => {
        character.state = 'pending';
        character.hitPulse = 0;
        character.targetPulse = 0;
      });
      this.projectiles = this.projectiles.filter((projectile) => projectile.targetId !== active.id);
      active.pendingProjectiles = 0;
    }
    this.activeTargetId = null;
    this.inputValue = '';
    this.lastInvalidValue = '';
  }

  isCompatiblePrefix(input, target, mode) {
    if (target.startsWith(input)) return true;
    if (mode === 'english' || (mode !== 'vietnamese' && mode !== 'accented')) return false;
    const targetSlice = Array.from(target).slice(0, codePointLength(input)).join('');
    return stripVietnameseDiacritics(targetSlice) === stripVietnameseDiacritics(input);
  }

  buildInputCandidates(rawValue) {
    const english = this.settings.mode === 'english';
    const indonesian = this.settings.mode === 'indonesian';
    const locale = english ? 'en' : indonesian ? 'id' : 'vi';
    const preserveCase = english && this.settings.caseSensitive;
    const normalized = normalizeText(rawValue, locale, preserveCase);
    if (!normalized) return [];
    const direct = comparisonText(normalized, this.settings.mode, preserveCase);
    if (english || (this.settings.mode !== 'accented' && this.settings.mode !== 'vietnamese')) return uniqueValues([direct]);
    const telex = normalizeText(transformTelexText(normalized, this.getGuideTarget()?.text || ''), 'vi');
    const transformed = comparisonText(telex, this.settings.mode, false);
    return uniqueValues([direct, transformed]);
  }

  handleInput(rawValue) {
    if (this.state !== 'playing') return { clear: false };
    const english = this.settings.mode === 'english';
    const indonesian = this.settings.mode === 'indonesian';
    const normalized = normalizeText(rawValue, english ? 'en' : indonesian ? 'id' : 'vi', english && this.settings.caseSensitive);
    this.inputValue = normalized;

    if (!normalized) {
      this.clearActiveInput();
      this.emitHud(true);
      return { clear: false };
    }

    const inputCandidates = this.buildInputCandidates(normalized);
    const primaryInput = inputCandidates[0] || '';

    let target = this.getActiveTarget();
    if (!target) {
      const candidates = this.targets
        .filter((item) => !item.pendingDestroy
          && (!this.wordSourceMetadata.sequentialLearning || item.queueIndex === this.learningCompleted)
          && inputCandidates.some((candidate) => this.isCompatiblePrefix(candidate, item.comparison, this.settings.mode)))
        .sort((a, b) => {
          const aExact = inputCandidates.some((candidate) => a.comparison.startsWith(candidate)) ? 1 : 0;
          const bExact = inputCandidates.some((candidate) => b.comparison.startsWith(candidate)) ? 1 : 0;
          return (bExact - aExact) || (b.y - a.y) || (a.spawnOrder - b.spawnOrder);
        });

      target = candidates[0] || null;
      if (!target) {
        const isRecentCompletion = (performance.now() - (this.justCompletedAt || 0)) < 300;
        const isWhitespaceOnly = !primaryInput || primaryInput.trim() === '';
        if (!isRecentCompletion && !isWhitespaceOnly) {
          this.registerMistake(primaryInput);
        }
        this.onRequestInputClear();
        return { clear: true };
      }
      this.activeTargetId = target.id;
      target.lockPulse = 1;
      target.lockedAt = performance.now();
      target.lastInputAt = target.lockedAt;
      this.audio.lockOn({ pan: clamp((target.x / Math.max(1, this.width)) * 2 - 1, -1, 1) });
    }

    target.guideInput = normalized;
    const acceptedInput = inputCandidates.find((candidate) => this.isCompatiblePrefix(candidate, target.comparison, this.settings.mode)) || null;
    if (!acceptedInput) {
      this.registerMistake(primaryInput, target);
      return { clear: false };
    }

    const previousConfirmed = target.confirmedProgress;
    const compatibleProgress = Math.min(codePointLength(acceptedInput), codePointLength(target.comparison));
    const confirmedProgress = exactPrefixLength(acceptedInput, target.comparison);
    target.progress = compatibleProgress;
    target.confirmedProgress = confirmedProgress;
    target.typedUnits = confirmedProgress;
    target.provisional = confirmedProgress < compatibleProgress;
    target.guideInput = acceptedInput;
    target.errorPulse = 0;
    this.lastInvalidValue = '';

    // Backspace/IME correction can move progress backwards. Cancel only the
    // projectiles for characters that are no longer confirmed, so retyping a
    // corrected character creates exactly one new shot again.
    if (confirmedProgress < previousConfirmed) {
      target.lastFiredProgress = Math.min(target.lastFiredProgress, confirmedProgress);
      target.nextCharacterHitIndex = Math.min(target.nextCharacterHitIndex, confirmedProgress);
      const cancelled = this.projectiles.filter((projectile) => (
        projectile.targetId === target.id && projectile.targetCharacterIndex >= confirmedProgress
      )).length;
      if (cancelled > 0) {
        this.projectiles = this.projectiles.filter((projectile) => !(
          projectile.targetId === target.id && projectile.targetCharacterIndex >= confirmedProgress
        ));
        target.pendingProjectiles = Math.max(0, target.pendingProjectiles - cancelled);
      }
      target.characterStates.forEach((character, index) => {
        if (index >= confirmedProgress) {
          character.state = 'pending';
          character.hitPulse = 0;
          character.targetPulse = 0;
        }
      });
    }

    const completed = acceptedInput === target.comparison;
    if (confirmedProgress > target.lastFiredProgress) {
      const fromProgress = target.lastFiredProgress;
      const gained = confirmedProgress - fromProgress;
      const newlyConfirmed = Array.from(target.comparison).slice(fromProgress, confirmedProgress);
      target.lastFiredProgress = confirmedProgress;
      this.stats.correctUnits += gained;
      this.stats.correctCharacters += newlyConfirmed.filter((unit) => !/\s/u.test(unit)).length;
      this.stats.attempts += gained;
      this.stats.score += gained * GAME_CONFIG.pointsPerCharacter;
      this.recordCorrectKeyMetrics(target, fromProgress, confirmedProgress);
      this.fireProgressShots(target, fromProgress, confirmedProgress, completed);
      this.audio.correct();
    }

    if (completed) {
      target.completed = true;
      target.pendingDestroy = true;
      this.inputValue = '';
      this.activeTargetId = null;
      this.lastInvalidValue = '';
      this.justCompletedAt = performance.now();
      this.onRequestInputClear();
      this.emitHud(true);
      return { clear: true };
    }

    this.emitHud(true);
    return { clear: false };
  }

  registerMistake(value, target = null) {
    if (value === this.lastInvalidValue) return;
    this.lastInvalidValue = value;
    this.stats.attempts += 1;
    this.stats.mistakes += 1;
    this.recordMistakeKeyMetric(target, value);
    this.stats.combo = 0;
    if (target) {
      target.errorPulse = 1;
      if (target.wordId) this.mistakeWordIds.add(target.wordId);
    }
    this.audio.error();
    this.emitHud(true);
  }

  ensureKeyMetric(key) {
    if (!this.settings.courseMode || !['english', 'indonesian'].includes(this.settings.mode)) return null;
    const normalized = String(key || '').toLocaleLowerCase('en');
    if (!/^[a-z]$/.test(normalized)) return null;
    if (!this.stats.keyMetrics[normalized]) {
      this.stats.keyMetrics[normalized] = { attempts: 0, correct: 0, mistakes: 0, totalReactionMs: 0 };
    }
    return this.stats.keyMetrics[normalized];
  }

  recordCorrectKeyMetrics(target, fromProgress, toProgress) {
    if (!this.settings.courseMode || !['english', 'indonesian'].includes(this.settings.mode)) return;
    const units = Array.from(target.comparison);
    let reference = target.lastInputAt || target.lockedAt || performance.now();
    for (let index = fromProgress; index < toProgress; index += 1) {
      const metric = this.ensureKeyMetric(units[index]);
      if (!metric) continue;
      const now = performance.now();
      metric.attempts += 1;
      metric.correct += 1;
      metric.totalReactionMs += Math.max(0, Math.min(10000, now - reference));
      reference = now;
    }
    target.lastInputAt = performance.now();
  }

  recordMistakeKeyMetric(target, typedValue) {
    if (!this.settings.courseMode || !['english', 'indonesian'].includes(this.settings.mode)) return;
    const expectedUnits = target ? Array.from(target.comparison) : [];
    const expected = expectedUnits[target?.confirmedProgress || 0] || Array.from(String(typedValue || '')).at(-1) || '';
    const metric = this.ensureKeyMetric(expected);
    if (!metric) return;
    metric.attempts += 1;
    metric.mistakes += 1;
  }

  fireProgressShots(target, fromProgress, toProgress, completed) {
    if (!target || target.destroyed) return;
    const ship = this.shipPosition();
    const targetLength = codePointLength(target.comparison);
    const units = Array.from(target.comparison);
    let shotOffset = 0;
    for (let unitIndex = fromProgress + 1; unitIndex <= toProgress; unitIndex += 1) {
      const targetCharacterIndex = unitIndex - 1;
      const unit = units[targetCharacterIndex] || '';
      if (/\s/u.test(unit)) {
        const characterState = target.characterStates[targetCharacterIndex];
        if (characterState) characterState.state = 'hit';
        continue;
      }
      const isFinal = completed && unitIndex === targetLength;
      const characterState = target.characterStates[targetCharacterIndex];
      if (characterState) {
        characterState.state = 'targeted';
        characterState.targetPulse = 1;
      }
      this.projectiles.push({
        id: this.nextId += 1,
        x: ship.x,
        y: ship.y - this.shipRadius() * 0.64,
        targetId: target.id,
        targetCharacterIndex,
        speed: isFinal ? GAME_CONFIG.finalProjectileSpeed : GAME_CONFIG.projectileSpeed,
        trail: [],
        delay: Math.max(0, shotOffset * 0.055),
        isFinal,
        hasHit: false,
        waitingForTurn: false
      });
      shotOffset += 1;
      target.pendingProjectiles += 1;
      this.stats.shots += 1;
      const pan = clamp((target.x / Math.max(1, this.width)) * 2 - 1, -1, 1);
      this.audio.shot({ final: isFinal, pan });
    }
  }

  shipPosition() {
    const top = this.cockpitLayout?.top ?? this.height - 154;
    return { x: this.cockpitLayout?.centerX ?? this.width / 2, y: top - this.shipRadius() - 6 };
  }

  shipRadius() {
    return clamp(this.height * 0.12, 48, 82) / (this.presentation.is3D ? 1.8 : 5);
  }

  setCockpitLayout(layout) {
    this.cockpitLayout = layout;
  }

  defenseY() {
    return this.shipPosition().y + this.shipRadius() * 0.65;
  }

  startLoop() {
    if (this.loopStarted) return;
    this.loopStarted = true;
    this.lastTimestamp = performance.now();
    this.rafId = requestAnimationFrame(this.frame);
  }

  frame(timestamp) {
    const deltaTime = Math.min(0.05, Math.max(0, (timestamp - this.lastTimestamp) / 1000));
    this.lastTimestamp = timestamp;
    if (this.state === 'playing') this.update(deltaTime);
    this.render(timestamp / 1000);
    this.rafId = requestAnimationFrame(this.frame);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(320, rect.width || 1280);
    this.height = Math.max(420, rect.height || 720);
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.backgroundGradient = this.context.createLinearGradient(0, 0, this.width, this.height);
    this.backgroundGradient.addColorStop(0, '#061322');
    this.backgroundGradient.addColorStop(0.42, '#0b2641');
    this.backgroundGradient.addColorStop(0.72, '#103951');
    this.backgroundGradient.addColorStop(1, '#071b31');
  }

  update(deltaTime) {
    this.flightTime = (this.flightTime || 0) + deltaTime;
    this.elapsed += deltaTime;
    this.shakeTime = Math.max(0, this.shakeTime - deltaTime);
    this.damageFlash = Math.max(0, this.damageFlash - deltaTime * 2.4);
    this.levelBanner = Math.max(0, this.levelBanner - deltaTime);

    const nextLevel = Math.min(10, Math.floor(this.elapsed / GAME_CONFIG.levelDuration) + 1);
    if (nextLevel !== this.level && !this.settings.courseMode) {
      this.level = nextLevel;
      this.levelBanner = 1.8;
      this.audio.levelUp();
      const levelName = this.translate(`levelName${Math.min(5, this.level)}`);
      this.message('engineLevel', { level: this.level, name: levelName }, 'level');
      if (this.level === 5 || this.level === 10) this.spawnBoss();
    }

    if (!this.demoMode) {
      this.spawnTimer -= deltaTime;
      const ordered = this.wordSourceMetadata.orderMode === 'original';
      const configuredMaxTargets = Number(this.settings.maxTargets) > 0
        ? Number(this.settings.maxTargets)
        : GAME_CONFIG.maxTargetsByDifficulty?.[this.settings.difficulty] || GAME_CONFIG.maxTargets;
      const targetLimit = ordered
        ? this.wordSourceMetadata.sequentialLearning ? 1 : Math.min(3, configuredMaxTargets)
        : Math.min(configuredMaxTargets, 3 + Math.floor(this.level / 2));
      const activeCount = this.targets.filter((target) => !target.pendingDestroy).length;
      if (ordered && this.learningQueueIndex >= this.learningQueue.length && activeCount === 0 && this.projectiles.length === 0) {
        this.finishLesson();
      } else if (this.spawnTimer <= 0 && activeCount < targetLimit) {
        const spawned = this.spawnTarget();
        this.spawnTimer = spawned ? (ordered ? (this.settings.difficulty === 'very-slow' ? 1.65 : 0.55) : this.currentSpawnInterval()) : 0.4;
      }
    }

    this.updateTargets(deltaTime);
    this.updateProjectiles(deltaTime);
    this.updateParticles(deltaTime);
    this.updateFloaters(deltaTime);
    this.emitHud();
  }

  currentSpawnInterval() {
    const base = GAME_CONFIG.spawn[this.settings.difficulty] || GAME_CONFIG.spawn.medium;
    if (GAME_CONFIG.targetTravelSeconds[this.settings.difficulty]) return base;
    if (this.settings.difficulty !== 'dynamic') return Math.max(0.95, base - (this.level - 1) * 0.07);
    return Math.max(0.85, base - this.elapsed * 0.012);
  }

  currentSpeedRange() {
    const [min, max] = GAME_CONFIG.speed[this.settings.difficulty] || GAME_CONFIG.speed.medium;
    const levelBoost = this.settings.difficulty === 'very-slow' ? (this.level - 1) * 0.45 : (this.level - 1) * 3.2;
    const dynamicBoost = this.settings.difficulty === 'dynamic' ? Math.min(42, this.elapsed * 0.45) : 0;
    return [min + levelBoost + dynamicBoost, max + levelBoost + dynamicBoost];
  }

  allowedLevels() {
    if (this.settings.wordLevel !== 'auto') return [this.settings.wordLevel];
    if (this.level <= 2) return ['easy'];
    if (this.level <= 5) return ['easy', 'medium'];
    if (this.level <= 8) return ['medium', 'hard'];
    return ['hard'];
  }

  chooseWord({ boss = false } = {}) {
    if (this.wordSourceMetadata.orderMode === 'original' && !boss) {
      const word = this.learningQueue[this.learningQueueIndex] || null;
      if (word) this.learningQueueIndex += 1;
      return word;
    }
    const allowed = this.allowedLevels();
    let pool = this.words.filter((item) => {
      if (this.settings.topic !== 'all' && item.topic !== this.settings.topic) return false;
      if (boss) return item.level === 'hard' && codePointLength(item.text) >= 6;
      return allowed.includes(item.level);
    });
    const activeTexts = new Set(this.targets.map((target) => target.text));
    pool = pool.filter((item) => !activeTexts.has(item.text) && !this.recentWordIds.includes(item.id));
    if (!pool.length) pool = this.words.filter((item) => !activeTexts.has(item.text));
    const chosen = pool[Math.floor(Math.random() * pool.length)] || this.words[0];
    this.recentWordIds.push(chosen.id);
    if (this.recentWordIds.length > 22) this.recentWordIds.shift();
    return chosen;
  }

  spawnSpecific(text, xRatio = 0.5, yRatio = 0.12) {
    const locale = this.settings.mode === 'english' ? 'en' : this.settings.mode === 'indonesian' ? 'id' : 'vi';
    const word = this.words.find((item) => item.text.toLocaleLowerCase(locale) === text.toLocaleLowerCase(locale)) || {
      id: `demo-${text}`, text, meaningVi: '', level: 'medium', topic: this.settings.mode === 'english' ? 'basic' : 'science', language: this.settings.mode
    };
    const target = this.createTarget(word, { x: this.width * xRatio, y: this.height * yRatio, speed: 22 });
    this.targets.push(target);
    return target;
  }

  spawnTarget() {
    const word = this.chooseWord();
    if (!word) return null;
    const [minSpeed, maxSpeed] = this.currentSpeedRange();
    const target = this.createTarget(word, {
      speed: this.wordSourceMetadata.sequentialLearning
        ? Math.min(this.settings.difficulty === 'very-slow' ? 22 : 42, minSpeed)
        : randomBetween(minSpeed, maxSpeed),
      queueIndex: Number.isFinite(word.queueIndex)
        ? word.queueIndex
        : Number.isFinite(word.originalIndex) ? word.originalIndex : this.learningQueueIndex - 1
    });
    if (!this.placeSpawn(target)) {
      if (this.wordSourceMetadata.orderMode === 'original') this.learningQueueIndex -= 1;
      else if (this.recentWordIds.at(-1) === word.id) this.recentWordIds.pop();
      return null;
    }
    this.targets.push(target);
    return target;
  }

  spawnBoss() {
    if (this.wordSourceMetadata.orderMode === 'original') return null;
    if (this.settings.difficulty === 'slowest' && this.targets.some(target => !target.pendingDestroy)) return null;
    if (this.targets.some((target) => target.type === 'boss' && !target.pendingDestroy)) return;
    const word = this.chooseWord({ boss: true });
    if (!word) return null;
    const target = this.createTarget(word, {
      x: this.width * 0.5,
      y: -90,
      speed: 30 + this.level * 2,
      type: 'boss'
    });
    target.radius *= 1.35;
    target.damage = 32;
    if (target.travelSeconds && !this.placeSpawn(target)) return null;
    this.targets.push(target);
    this.message('bossWarning', {}, 'warning');
  }

  createTarget(word, options = {}) {
    const english = this.settings.mode === 'english';
    const indonesian = this.settings.mode === 'indonesian';
    const locale = english ? 'en' : indonesian ? 'id' : 'vi';
    const preserveCase = english && this.settings.caseSensitive;
    const displayText = normalizeText(word.text, locale, preserveCase);
    const comparison = comparisonText(word.text, this.settings.mode, preserveCase);
    const radius = clamp(22 + codePointLength(word.text) * 0.48, 24, 34);
    const x = options.x ?? this.findSpawnX(radius);
    const target = {
      id: this.nextId += 1,
      wordId: word.id,
      conceptId: word.conceptId || '',
      text: displayText,
      comparison,
      meaningVi: String(word.meaningVi || ''),
      translationText: String(word.translationText || ''),
      language: word.language || this.settings.mode,
      level: word.level,
      topic: word.topic,
      x,
      y: options.y ?? -radius - 30,
      speed: options.speed ?? 60,
      travelSeconds: GAME_CONFIG.targetTravelSeconds[this.settings.difficulty] || 0,
      travelElapsed: 0,
      radius,
      rotation: randomBetween(0, Math.PI * 2),
      rotationSpeed: randomBetween(-0.25, 0.25),
      progress: 0,
      confirmedProgress: 0,
      typedUnits: 0,
      lastFiredProgress: 0,
      provisional: false,
      characterStates: Array.from(displayText).map((char, index) => ({
        char,
        index,
        state: 'pending',
        hitPulse: 0,
        targetPulse: 0,
        hitTime: 0
      })),
      characterLayout: [],
      nextCharacterHitIndex: 0,
      pendingDestroy: false,
      completed: false,
      destroyed: false,
      pendingProjectiles: 0,
      hitPulse: 0,
      errorPulse: 0,
      lockPulse: 0,
      spawnOrder: this.nextId,
      type: options.type || 'normal',
      damage: options.type === 'boss' ? 32 : GAME_CONFIG.damage,
      seed: hashNumber(`${word.id}-${this.nextId}`),
      queueIndex: Number.isFinite(options.queueIndex)
        ? options.queueIndex
        : Number.isFinite(word.queueIndex) ? word.queueIndex : Number.isFinite(word.originalIndex) ? word.originalIndex : null,
      sourceIndex: Number.isFinite(word.sourceIndex) ? word.sourceIndex : null,
      sourceSentenceIndex: Number.isFinite(word.sourceSentenceIndex) ? word.sourceSentenceIndex : 0,
      isCurrentLessonTarget: Boolean(this.wordSourceMetadata.sequentialLearning),
      isPreviewTarget: false,
      lockedAt: 0,
      lastInputAt: 0,
      hue: Math.floor(randomBetween(0, 4))
    };
    this.calculateCharacterLayout(target);
    return target;
  }

  placeSpawn(target) {
    target.travelElapsed = 0;
    target.guideInput = '';
    delete target.previewGuideInput;
    const size = target.collisionMetrics;
    target.y = size.height / 2 + 16;
    const minX = size.width / 2 + 20;
    const maxX = Math.max(minX, this.width - minX);
    for (let attempt = 0; attempt < 20; attempt += 1) {
      target.x = randomBetween(minX, maxX);
      this.calculateCharacterLayout(target);
      const box = target.labelLayout.bounds;
      const overlaps = this.targets.some(other => {
        if (other.id === target.id) return false;
        this.calculateCharacterLayout(other);
        const b = other.labelLayout.bounds;
        if (target.travelSeconds && other.travelSeconds) {
          const width = target.spaceBaseMetrics.width, otherWidth = other.spaceBaseMetrics.width;
          return Math.abs(target.x - other.x) < (width + otherWidth) / 2 + 22;
        }
        return box.x < b.x + b.width + 22 && box.x + box.width + 22 > b.x
          && box.y < b.y + b.height + 22 && box.y + box.height + 22 > b.y;
      });
      if (!overlaps) return true;
    }
    return false;
  }

  findSpawnX(radius) {
    const min = radius + 36;
    const max = Math.max(min + 1, this.width - radius - 36);
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const x = randomBetween(min, max);
      const overlaps = this.targets.some((target) => target.y < 190 && Math.abs(target.x - x) < target.radius + radius + 34);
      if (!overlaps) return x;
    }
    return randomBetween(min, max);
  }

  updateTargets(deltaTime) {
    const defenseLine = this.defenseY();
    const ahead = [];
    for (const target of [...this.targets].sort((a, b) => b.y - a.y)) {
      target.errorPulse = Math.max(0, target.errorPulse - deltaTime * 4.5);
      target.lockPulse = Math.max(0, target.lockPulse - deltaTime * 2.8);
      target.hitPulse = Math.max(0, target.hitPulse - deltaTime * 5.5);
      target.characterStates.forEach((character) => {
        character.hitPulse = Math.max(0, character.hitPulse - deltaTime * 7.5);
        character.targetPulse = Math.max(0, character.targetPulse - deltaTime * 4.5);
      });
      target.rotation += target.rotationSpeed * deltaTime;
      if (!target.pendingDestroy) {
        if (target.travelSeconds) {
          this.calculateCharacterLayout(target);
          const travel = targetTravelBounds(this, target);
          target.travelElapsed = Math.min(target.travelSeconds, target.travelElapsed + deltaTime);
          target.y = travel.start + (travel.end - travel.start) * target.travelElapsed / target.travelSeconds;
        } else target.y += target.speed * deltaTime;
      }
      this.calculateCharacterLayout(target);
      for (const other of ahead) {
        const box = target.labelLayout.bounds, front = other.labelLayout.bounds;
        if (box.x < front.x + front.width + 20 && box.x + box.width + 20 > front.x
          && box.y + box.height + 20 > front.y && !target.pendingDestroy) {
          target.y = front.y - box.height / 2 - 20;
          this.calculateCharacterLayout(target);
          // Spacing may adjust the drawing after a resize, never the typing deadline.
        }
      }
      if (!target.pendingDestroy && (target.travelSeconds ? target.travelElapsed >= target.travelSeconds - 1e-8 : target.labelLayout.bounds.y + target.labelLayout.bounds.height >= defenseLine)) {
        this.damageTargetPassed(target);
      } else {
        ahead.push(target);
      }
    }
  }

  damageTargetPassed(target) {
    if (this.settings.courseMode && this.settings.noDamage) {
      this.placeSpawn(target);
      target.progress = 0;
      target.confirmedProgress = 0;
      target.typedUnits = 0;
      target.lastFiredProgress = 0;
      target.nextCharacterHitIndex = 0;
      target.pendingProjectiles = 0;
      target.pendingDestroy = false;
      target.completed = false;
      target.destroyed = false;
      target.lockedAt = 0;
      target.lastInputAt = 0;
      target.characterStates.forEach((character) => {
        character.state = 'pending';
        character.hitPulse = 0;
        character.targetPulse = 0;
      });
      this.projectiles = this.projectiles.filter((item) => item.targetId !== target.id);
      if (this.activeTargetId === target.id) {
        this.clearActiveInput();
        this.onRequestInputClear();
      }
      this.message('courseRetryTarget', {}, 'info');
      return;
    }
    if (this.wordSourceMetadata.sequentialLearning && Number.isFinite(target.queueIndex)) {
      this.learningQueueIndex = Math.min(this.learningQueueIndex, target.queueIndex);
    }
    this.targets = this.targets.filter((item) => item.id !== target.id);
    this.projectiles = this.projectiles.filter((item) => item.targetId !== target.id);
    if (this.activeTargetId === target.id) {
      this.clearActiveInput();
      this.onRequestInputClear();
    }
    this.stats.shield = Math.max(0, this.stats.shield - target.damage);
    this.stats.combo = 0;
    this.shakeTime = 0.42;
    this.damageFlash = 1;
    this.audio.damage();
    this.createExplosion(target.x, this.defenseY(), '#ff6b78', 24);
    this.message('shieldDamage', { damage: target.damage }, 'error');
    this.emitHud(true);
    if (this.stats.shield <= 0) this.finishGame();
  }

  advanceNextCharacterHitIndex(target) {
    while (target.nextCharacterHitIndex < target.characterStates.length) {
      const state = target.characterStates[target.nextCharacterHitIndex];
      if (!state || !/\s/u.test(state.char)) break;
      state.state = 'hit';
      state.hitPulse = 0;
      state.targetPulse = 0;
      target.nextCharacterHitIndex += 1;
    }
  }

  updateProjectiles(deltaTime) {
    for (const projectile of [...this.projectiles]) {
      const target = this.targets.find((item) => item.id === projectile.targetId);
      if (!target || target.destroyed) {
        this.projectiles = this.projectiles.filter((item) => item.id !== projectile.id);
        continue;
      }
      if (projectile.delay > 0) {
        projectile.delay = Math.max(0, projectile.delay - deltaTime);
        continue;
      }

      this.advanceNextCharacterHitIndex(target);
      const targetPoint = this.getCharacterTargetPoint(target, projectile.targetCharacterIndex);
      if (!targetPoint) {
        this.projectiles = this.projectiles.filter((item) => item.id !== projectile.id);
        target.pendingProjectiles = Math.max(0, target.pendingProjectiles - 1);
        continue;
      }

      const dx = targetPoint.x - projectile.x;
      const dy = targetPoint.y - projectile.y;
      const distance = Math.hypot(dx, dy);
      const step = projectile.speed * deltaTime;
      projectile.trail.unshift({ x: projectile.x, y: projectile.y, life: 1 });
      projectile.trail = projectile.trail.slice(0, 12).map((point) => ({ ...point, life: point.life - deltaTime * 4 }));

      if (distance <= step + Math.max(5, targetPoint.width * 0.18)) {
        if (projectile.targetCharacterIndex > target.nextCharacterHitIndex) {
          projectile.waitingForTurn = true;
          projectile.x = targetPoint.x;
          projectile.y = targetPoint.y;
          continue;
        }
        if (projectile.targetCharacterIndex < target.nextCharacterHitIndex) {
          this.projectiles = this.projectiles.filter((item) => item.id !== projectile.id);
          target.pendingProjectiles = Math.max(0, target.pendingProjectiles - 1);
          continue;
        }

        this.projectiles = this.projectiles.filter((item) => item.id !== projectile.id);
        target.pendingProjectiles = Math.max(0, target.pendingProjectiles - 1);
        projectile.hasHit = true;
        this.handleProjectileCharacterHit(projectile, target, targetPoint);
        target.nextCharacterHitIndex += 1;
        this.advanceNextCharacterHitIndex(target);
        continue;
      }

      projectile.waitingForTurn = false;
      if (distance > 0) {
        projectile.x += (dx / distance) * step;
        projectile.y += (dy / distance) * step;
      }
    }
  }

  handleProjectileCharacterHit(projectile, target, targetPoint) {
    if (!target || target.destroyed) return;
    const character = target.characterStates[projectile.targetCharacterIndex];
    if (!character) return;
    character.state = projectile.isFinal ? 'final-hit' : 'hit';
    character.hitPulse = 1;
    character.targetPulse = 0;
    character.hitTime = performance.now();
    target.hitPulse = projectile.isFinal ? 1 : 0.35;
    const pan = clamp((targetPoint.x / Math.max(1, this.width)) * 2 - 1, -1, 1);
    this.audio.characterHit({ final: projectile.isFinal, pan });
    this.createExplosion(targetPoint.x, targetPoint.y, projectile.isFinal ? '#fff2a6' : '#7defff', projectile.isFinal ? 10 : 5, true);
    if (projectile.isFinal && target.completed) this.handleFinalCharacterHit(target);
  }

  handleFinalCharacterHit(target) {
    if (!target || target.destroyed) return;
    target.characterStates.forEach((character) => {
      character.state = 'final-hit';
      character.hitPulse = Math.max(character.hitPulse, 0.75);
    });
    this.destroyTarget(target);
  }

  destroyTarget(target) {
    if (!target || target.destroyed) return;
    target.destroyed = true;
    this.targets = this.targets.filter((item) => item.id !== target.id);
    this.projectiles = this.projectiles.filter((item) => item.targetId !== target.id);
    this.calculateCharacterLayout(target);
    const meteor = target.labelLayout.meteor;
    this.createExplosion(meteor.x, meteor.y, '#ffb363', target.type === 'boss' ? 50 : 28, false, clamp(meteor.size / 100, .6, 2));
    this.audio.explosion({
      boss: target.type === 'boss',
      pan: clamp((target.x / Math.max(1, this.width)) * 2 - 1, -1, 1)
    });
    this.lastCompletedMeaning = target.translationText || target.meaningVi || '';
    this.lastCompletedWord = target.text || '';
    this.lastCompletedTarget = { conceptId: target.conceptId || target.wordId || '', wordId: target.wordId || '', targetText: target.text || '', translationText: target.translationText || '', language: target.language || this.settings.mode };
    this.lastMeaningUntil = performance.now() + 650;
    this.stats.completed += 1;
    if (this.wordSourceMetadata.orderMode === 'original') {
      this.learningCompleted = Math.min(this.learningQueue.length, this.learningCompleted + 1);
    }
    this.stats.combo += 1;
    this.stats.maxCombo = Math.max(this.stats.maxCombo, this.stats.combo);
    const completionBase = GAME_CONFIG.completionBonus + codePointLength(target.comparison) * 4;
    const levelMultiplier = 1 + (this.level - 1) * 0.08;
    const comboMultiplier = Math.min(2.5, 1 + this.stats.combo * 0.06);
    const bossBonus = target.type === 'boss' ? 500 : 0;
    const points = Math.round(completionBase * levelMultiplier * comboMultiplier + bossBonus);
    this.stats.score += points;
    this.floaters.push({ x: target.x, y: target.y, text: `+${points}`, life: 1.1, color: '#fff4a8' });
    if (this.stats.combo >= 3) {
      this.floaters.push({ x: target.x, y: target.y + 32, text: `COMBO ${this.stats.combo}`, life: 1.25, color: '#ffe066' });
    }
    this.emitHud(true);
  }

  createExplosion(x, y, color, count, impact = false, scale = 1) {
    if (!impact && this.particles.length < GAME_CONFIG.particleLimit) {
      this.particles.push({ x, y, vx:0, vy:0, gravity:0, life:.6, maxLife:.6, size:110 * scale, color, shock:true });
    }
    const available = Math.max(0, GAME_CONFIG.particleLimit - this.particles.length);
    const amount = Math.min(Math.ceil(count * (impact ? 1 : scale * 1.8) * (this.effectsLevel === 'low' ? 0.25 : this.effectsLevel === 'high' ? 1 : 0.65)), available);
    for (let index = 0; index < amount; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const smoke = !impact && index % 5 === 1;
      const speed = impact ? randomBetween(18, 65) : (smoke ? randomBetween(20, 65) : randomBetween(90, 270)) * scale;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: impact ? 12 : 0,
        life: impact ? randomBetween(0.12, 0.25) : randomBetween(.85, 1.65),
        maxLife: 0,
        size: impact ? randomBetween(1, 3) : (smoke ? randomBetween(16, 30) : index % 3 === 0 ? randomBetween(9, 22) : randomBetween(1.5, 4)) * scale,
        rock: !impact && !smoke && index % 3 === 0,
        smoke, z: 1, vz: impact ? 0 : (index % 2 ? -.3 : .55),
        angle, spin: randomBetween(-3, 3), outline: rockOutline(index * 7919 + Math.floor(x)),
        color
      });
      this.particles.at(-1).maxLife = this.particles.at(-1).life;
    }
  }

  updateParticles(deltaTime) {
    for (const particle of this.particles) {
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      particle.vy += particle.gravity * deltaTime;
      particle.z = clamp((particle.z || 1) + (particle.vz || 0) * deltaTime, .35, 2);
      particle.angle = (particle.angle || 0) + (particle.spin || 0) * deltaTime;
      particle.life -= deltaTime;
    }
    this.particles = this.particles.filter((particle) => particle.life > 0);
  }

  updateFloaters(deltaTime) {
    for (const floater of this.floaters) {
      floater.y -= 34 * deltaTime;
      floater.life -= deltaTime;
    }
    this.floaters = this.floaters.filter((floater) => floater.life > 0);
  }

  finishLesson() {
    if (this.learningFinished || this.state !== 'playing') return;
    this.learningFinished = true;
    this.message('engineLessonComplete', {}, 'level');
    this.finishGame({ lessonComplete: true });
  }

  buildMistakeReviewQueue() {
    return this.learningQueue.filter((word) => this.mistakeWordIds.has(word.id));
  }

  finishGame({ lessonComplete = false } = {}) {
    if (this.state === 'gameover') return;
    this.state = 'gameover';
    const minutes = Math.max(1 / 60, this.elapsed / 60);
    const accuracy = this.accuracy();
    const result = {
      ...this.stats,
      accuracy,
      wpm: Math.round((this.stats.correctUnits / 5) / minutes),
      level: this.level,
      elapsed: this.elapsed,
      durationMs: Math.round(this.elapsed * 1000),
      mode: this.settings.mode,
      shotsMatchCharacters: this.stats.shots === this.stats.correctCharacters,
      lessonComplete,
      courseLessonId: String(this.settings.courseLessonId || this.wordSourceMetadata.courseLessonId || ''),
      sourceType: this.wordSourceMetadata.type,
      lessonProgress: { current: this.learningCompleted, total: this.learningQueue.length },
      mistakeWords: this.buildMistakeReviewQueue().map((word) => word.text)
    };
    this.onState('gameover');
    this.onGameOver(result);
  }

  accuracy() {
    return this.stats.attempts > 0 ? Math.round((this.stats.correctUnits / this.stats.attempts) * 100) : 100;
  }

  emitHud(force = false) {
    const now = performance.now();
    if (!force && now - this.lastHudUpdate < 100) return;
    this.lastHudUpdate = now;
    const active = this.getActiveTarget();
    const guide = this.getGuideTarget();
    const meaningMode = this.settings.meaningMode || 'immediate';
    const meaningVisible = this.settings.translationLanguage !== 'none' && meaningMode !== 'hidden';
    const recentMeaningVisible = now < this.lastMeaningUntil;
    const targetMeaning = !meaningVisible
      ? ''
      : meaningMode === 'immediate' && active
        ? active.translationText || active.meaningVi || this.translate('noMeaning')
        : recentMeaningVisible && (meaningMode === 'immediate' || meaningMode === 'after')
          ? this.lastCompletedMeaning || this.translate('noMeaning')
          : meaningMode === 'after'
            ? this.translate('meaningAfter')
            : this.translate('chooseTargetMeaning');
    const meaningWord = !meaningVisible
      ? ''
      : meaningMode === 'immediate' && active
        ? active.text
        : recentMeaningVisible && (meaningMode === 'immediate' || meaningMode === 'after')
          ? this.lastCompletedWord
          : active?.text || '';
    this.onHud({
      score: this.stats.score,
      shield: this.stats.shield,
      combo: this.stats.combo,
      accuracy: this.accuracy(),
      completed: this.stats.completed,
      level: this.level,
      courseScreen: Number(this.settings.courseScreen) || 0,
      levelName: this.translate(`levelName${Math.min(5, this.level)}`),
      input: this.inputValue,
      target: this.getActiveTarget()?.text || '',
      guideTarget: guide?.text || '',
      guideInput: guide?.previewGuideInput ?? guide?.guideInput ?? '',
      confirmedProgress: active?.confirmedProgress || 0,
      mode: this.settings.mode,
      targetMeaning,
      meaningWord,
      meaningMode,
      source: this.wordSourceMetadata?.label || 'DEFAULT',
      courseLessonId: this.wordSourceMetadata?.courseLessonId || '',
      orderMode: this.wordSourceMetadata?.orderMode || 'random',
      sequentialLearning: Boolean(this.wordSourceMetadata?.sequentialLearning),
      lessonCurrent: this.learningCompleted,
      lessonTotal: this.learningQueue.length,
      lessonPercent: this.learningQueue.length ? Math.round((this.learningCompleted / this.learningQueue.length) * 100) : 0,
      nextLessonWord: this.learningQueue[this.learningQueueIndex]?.text || ''
    });
  }

  targetColor(target) {
    const colors = ['#57dcff', '#ffb45b', '#ff75b5', '#81f0bc'];
    return colors[target.hue % colors.length];
  }

  render(time) {
    const ctx = this.context;
    ctx.save();
    const shakeStrength = this.effectsLevel !== 'low' && this.shakeTime > 0 ? 4 * (this.shakeTime / 0.42) : 0;
    if (shakeStrength) ctx.translate(randomBetween(-shakeStrength, shakeStrength), randomBetween(-shakeStrength, shakeStrength));
    this.drawBackground(ctx, time);
    this.drawDefenseZone(ctx, time);
    this.drawAimLine(ctx, time);
    for (const target of this.targets) this.drawTarget(ctx, target, time);
    this.drawProjectiles(ctx);
    this.drawShip(ctx, time);
    this.drawParticles(ctx);
    this.drawFloaters(ctx);
    if (this.levelBanner > 0 && this.state === 'playing') this.drawLevelBanner(ctx);
    if (this.damageFlash > 0) {
      ctx.fillStyle = `rgba(255, 52, 88, ${this.damageFlash * 0.18})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }
    ctx.restore();
  }

  drawBackground(ctx, time) {
    this.presentation.background(ctx, time);
  }

  drawDefenseZone(ctx, time) {
    const y = this.defenseY();
    ctx.save();
    const gradient = ctx.createLinearGradient(0, y - 28, 0, this.height);
    gradient.addColorStop(0, 'rgba(92,245,255,0)');
    gradient.addColorStop(1, 'rgba(17,84,133,0.34)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, y - 28, this.width, this.height - y + 28);
    ctx.strokeStyle = 'rgba(104,220,255,0.8)';
    ctx.shadowColor = '#28bfff'; ctx.shadowBlur = this.effectsLevel === 'low' ? 0 : 12;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.lineDashOffset = this.effectsLevel === 'low' ? 0 : -time * 12;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(this.width, y);
    ctx.stroke();
    ctx.restore();
  }

  drawAimLine(ctx, time) {
    const target = this.getActiveTarget();
    if (!target) return;
    const ship = this.shipPosition();
    ctx.save();
    ctx.strokeStyle = target.errorPulse > 0 ? 'rgba(255,90,110,0.65)' : 'rgba(101,234,250,0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 9]);
    ctx.lineDashOffset = this.effectsLevel === 'low' ? 0 : -time * 12;
    const nextIndex = Math.min(target.confirmedProgress, Math.max(0, target.characterStates.length - 1));
    const targetPoint = this.getCharacterTargetPoint(target, nextIndex) || { x: target.x, y: target.y };
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - this.shipRadius() * 0.64);
    ctx.lineTo(targetPoint.x, targetPoint.y);
    ctx.stroke();
    ctx.restore();
  }

  drawTarget(ctx, target, time) {
    const active = target.id === this.activeTargetId;
    const warning = target.y > this.height * 0.68;
    this.drawWordLabel(ctx, target, active, warning, time);
  }

  getWordFontSize(target) {
    const longText = target.characterStates.length > 12;
    const size = clamp(this.width / (target.characterStates.length <= 3 ? 29 : 34), longText ? 22 : 28, longText ? 38 : 44);
    return longText ? Math.min(size, Math.max(20, (this.height - 340) / 7)) : size;
  }

  calculateCharacterLayout(target, ctx = this.context) {
    return measureTarget(this, target, ctx);
  }

  getCharacterTargetPoint(target, characterIndex) {
    const layout = this.calculateCharacterLayout(target, this.context);
    const character = layout[characterIndex];
    return character ? { ...character, x: character.centerX, y: character.centerY } : null;
  }

  renderTargetCharacters(ctx, target) {
    this.presentation.characters(ctx, target);
  }

  drawWordLabel(ctx, target, active) {
    this.presentation.target(ctx, target, active);
  }


  drawProjectiles(ctx) {
    if (this.presentation.frame3D) return;
    for (const projectile of this.projectiles) {
      if (projectile.delay > 0 || projectile.hasHit) continue;
      ctx.save();
      for (let index = projectile.trail.length - 1; index >= 0; index -= 1) {
        const point = projectile.trail[index];
        ctx.globalAlpha = Math.max(0, point.life) * (1 - index / projectile.trail.length);
        ctx.fillStyle = projectile.isFinal ? '#fff0a6' : '#6de8ff';
        ctx.beginPath();
        ctx.arc(point.x, point.y, Math.max(0.6, 2.6 - index * 0.18), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (this.debugCharacterTargets) {
        const target = this.targets.find((item) => item.id === projectile.targetId);
        const point = target ? this.getCharacterTargetPoint(target, projectile.targetCharacterIndex) : null;
        if (point) {
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(projectile.x, projectile.y);
          ctx.lineTo(point.x, point.y);
          ctx.stroke();
          ctx.font = '700 10px monospace';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(String(projectile.targetCharacterIndex), projectile.x + 8, projectile.y - 7);
        }
      }
      ctx.shadowColor = projectile.isFinal ? '#ffe66d' : '#65deff';
      ctx.shadowBlur = this.effectsLevel === 'low' ? 0 : projectile.isFinal ? 14 : 9;
      ctx.fillStyle = projectile.isFinal ? '#fff3a0' : '#c1f8ff';
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, projectile.isFinal ? 4.5 : 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawShip(ctx) {
    this.presentation.ship(ctx);
  }

  drawParticles(ctx) {
    if (this.presentation.frame3D) return;
    for (const particle of [...this.particles].sort((a, b) => (a.smoke ? -2 : a.z || 1) - (b.smoke ? -2 : b.z || 1))) {
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = this.effectsLevel === 'low' ? 0 : 8;
      if (particle.shock) {
        const radius = particle.size * (1.25 - alpha);
        const glow = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, Math.max(1, radius));
        glow.addColorStop(0, '#fffef2'); glow.addColorStop(.16, '#fff6b8'); glow.addColorStop(.35, '#ffb536cc'); glow.addColorStop(.6, '#ef6a1655'); glow.addColorStop(1, '#ef6a1600');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,202,114,.28)'; ctx.lineWidth = 2 * alpha;
        ctx.beginPath(); ctx.arc(particle.x, particle.y, radius * 1.15, 0, Math.PI * 2); ctx.stroke();
        ctx.restore(); continue;
      }
      if (particle.smoke) {
        const r = particle.size * (2 - alpha) * particle.z;
        const smoke = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, r);
        smoke.addColorStop(0, '#a19b91aa'); smoke.addColorStop(.45, '#56576688'); smoke.addColorStop(1, '#30394700');
        ctx.globalAlpha = Math.sin(alpha * Math.PI) * .7; ctx.shadowBlur = 0; ctx.fillStyle = smoke;
        ctx.beginPath(); ctx.arc(particle.x, particle.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.restore(); continue;
      }
      ctx.beginPath();
      if (particle.rock) {
        const r = particle.size * particle.z;
        ctx.translate(particle.x, particle.y); ctx.rotate(particle.angle);
        traceRock(ctx, particle.outline, r * 2);
        const stone = ctx.createLinearGradient(-r, -r, r, r);
        stone.addColorStop(0, '#bdb6a6'); stone.addColorStop(.28, '#626269'); stone.addColorStop(.65, '#232933'); stone.addColorStop(1, '#ff913c');
        ctx.fillStyle = stone; ctx.shadowBlur = 0; ctx.fill();
        if (this.presentation.ready(this.presentation.sprites)) {
          const atlas = this.presentation.sprites, cell = atlas.naturalWidth / 2;
          ctx.save(); ctx.clip();
          const offset = Math.abs(particle.outline[0][0]);
          ctx.drawImage(atlas, cell + cell * (.3 + offset * .15), atlas.naturalHeight * .32,
            cell * .23, atlas.naturalHeight * .23, -r, -r, r * 2, r * 2);
          ctx.restore();
        }
        ctx.strokeStyle = `rgba(255,150,55,${alpha * .65})`; ctx.lineWidth = .8; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-r*.6, -r*.2); ctx.lineTo(r*.2, r*.1); ctx.lineTo(r*.5, r*.65); ctx.stroke();
        ctx.restore(); continue;
      } else {
        ctx.strokeStyle = particle.color; ctx.lineWidth = Math.max(1, particle.size * alpha);
        ctx.beginPath(); ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(particle.x - particle.vx * .045, particle.y - particle.vy * .045); ctx.stroke();
        ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.size * alpha * (particle.z || 1), 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();
    }
  }

  drawFloaters(ctx) {
    for (const floater of this.floaters) {
      ctx.save();
      ctx.globalAlpha = clamp(floater.life, 0, 1);
      ctx.textAlign = 'center';
      ctx.font = '800 18px Nunito, "Segoe UI", sans-serif';
      ctx.fillStyle = floater.color;
      ctx.shadowColor = '#3d2b75';
      ctx.shadowBlur = 10;
      ctx.fillText(floater.text, floater.x, floater.y);
      ctx.restore();
    }
  }

  drawLevelBanner(ctx) {
    const alpha = clamp(this.levelBanner, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(29,38,96,0.72)';
    ctx.beginPath();
    ctx.roundRect(this.width / 2 - 180, this.height * 0.43 - 48, 360, 96, 28);
    ctx.fill();
    ctx.font = '800 30px "Baloo 2", "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffffff';
    const courseScreen = Number(this.settings.courseScreen) || 0;
    const showingCourseScreen = Boolean(this.settings.courseMode && courseScreen > 0);
    const displayLevel = showingCourseScreen ? courseScreen : this.level;
    if (showingCourseScreen) {
      ctx.fillText(`${this.translate('level').toUpperCase()} ${displayLevel}`, this.width / 2, this.height * 0.43 + 10);
    } else {
      const displayName = this.translate(`levelName${Math.min(5, this.level)}`);
      ctx.fillText(`${this.translate('level').toUpperCase()} ${displayLevel}`, this.width / 2, this.height * 0.43 - 4);
      ctx.font = '700 15px Nunito, "Segoe UI", sans-serif';
      ctx.fillStyle = '#fff1a8';
      ctx.fillText(displayName, this.width / 2, this.height * 0.43 + 24);
    }
    ctx.restore();
  }
}
