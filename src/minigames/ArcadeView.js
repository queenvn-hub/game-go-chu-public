import { t } from '../i18n/index.js';
import { escapeHtml } from '../game/text.js';
import { InputEngine } from '../game/InputEngine.js';
import { renderGameKeyboard } from '../game/GameKeyboard.js';
import { ArcadeModel } from './ArcadeModel.js';
import { FruitSliceModel } from './FruitSliceModel.js';
import { drawFruitScene } from './FruitSliceScene.js';
import { ArcadeScene3D } from './ArcadeScene3D.js';
import { COURIER_JUMP_FRAMES, courierJumpFrame, COURIER_RUN_FRAMES, COURIER_RUN_RECTS, courierRunFrame } from './CourierSprites.js';
import { AudioManager } from '../game/AudioManager.js';

const ASSETS = './assets/arcade/';
const titleKey = game => ({ fruit: 'fruitTitle', shark: 'arcadeShark', race: 'arcadeRace', robot: 'arcadeRobot', monkey: 'arcadeMonkey', courier: 'arcadeCourier' })[game] || 'arcadeTitle';
const descKey = game => ({ fruit: 'fruitDesc', shark: 'arcadeSharkDesc', race: 'arcadeRaceDesc', robot: 'arcadeRobotDesc', monkey: 'arcadeMonkeyDesc', courier: 'arcadeCourierDesc' })[game];
const createModel = options => options.game === 'fruit' ? new FruitSliceModel(options) : new ArcadeModel(options);
const isRace = game => game === 'race';
const isTargets = game => !isRace(game);
const hudProgressKey = game => ({ fruit: 'fruitMarket', shark: 'arcadeDepth', robot: 'arcadeRank', monkey: 'arcadeHeight', race: 'arcadePosition', courier: 'arcadeLevel' })[game];
const hudExtraKey = game => isRace(game) ? 'arcadeTime' : 'arcadeLives';
const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;

export function arcadeCards(language) {
  const games = ['shark', 'race', 'robot', 'monkey', 'courier', 'fruit'];
  return `<section class="typing-arcade-lobby"><span class="arcade-eyebrow">${t(language, 'arcadeEyebrow')}</span><h2>${t(language, 'arcadeTitle')}</h2><div class="arcade-cards">${games.map(game => {
    const bgName = game === 'courier' ? 'postcard_rooftop_background' : `${game}-background`;
    return `<button type="button" class="arcade-card arcade-card-${game}" data-arcade-open="${game}"><img src="${ASSETS}${bgName}.png" alt=""><span class="arcade-card-copy"><strong>${t(language, titleKey(game))}</strong><span>${t(language, descKey(game))}</span><b>${icon('play')}${t(language, 'arcadePlay')}</b></span></button>`;
  }).join('')}</div></section>`;
}

export class ArcadeView {
  constructor({ root, game = 'shark', language = 'vi', onBack, sound = true, onSoundChange = () => {}, onConsumeQuota, onQuotaStatus }) {
    this.root = root;
    this.game = game;
    this.language = language;
    this.onBack = onBack;
    this.mode = 'accented';
    this.difficulty = 'easy';
    this.keyboard = 'telex';
    this.sound = Boolean(sound);
    this.onSoundChange = onSoundChange;
    this.onConsumeQuota = onConsumeQuota;
    this.onQuotaStatus = onQuotaStatus;
    this.quotaStatus = null;
    this.startPending = false;
    this.audio = new AudioManager();
    this.audio.setEnabled(this.sound);
    this.reportedErrorWords = new Set();
    this.reportingErrorWords = new Set();
    this.model = createModel({ game: this.game, mode: this.mode, difficulty: this.difficulty });
    this.images = {};

    const imageNames = [
      ...(this.game === 'fruit' ? ['fruit-background', 'fruit-sprites'] : []),
      'shark-background', 'race-background', 'robot-background', 'monkey-background',
      'shark-sprites', 'race-sprites', 'robot-sprites', 'monkey-sprites', 'monkey-mascot',
      'postcard_rooftop_background', 'obstacle_parcel_stack', 'obstacle_puddle',
      'obstacle_rooftop_vent', 'reward_envelope', 'gun_turret',
      'cat_courier_idle', 'cat_courier_run_01', 'cat_courier_run_02',
      'cat_courier_jump', 'cat_courier_land',
      ...COURIER_JUMP_FRAMES.map(frame => frame.name), ...new Set(COURIER_RUN_FRAMES)
    ];
    for (const name of imageNames) {
      const img = new Image();
      img.src = `${ASSETS}${name}.png`;
      this.images[name] = img;
    }

    this.clickHandler = e => this.click(e);
    this.changeHandler = e => this.change(e);
    this.keyDownHandler = e => {
      if (e.code === 'Space' && this.game === 'courier' && this.model.state === 'playing') {
        this.model.jump();
      }
    };
    this.visibilityHandler = () => { if (document.hidden) this.pause(); };

    this.root.addEventListener('click', this.clickHandler);
    this.root.addEventListener('change', this.changeHandler);
    window.addEventListener('keydown', this.keyDownHandler);
    document.addEventListener('visibilitychange', this.visibilityHandler);

    this.render();
    void this.refreshQuotaStatus();
    this.lastFrame = performance.now();
    this.frame = requestAnimationFrame(time => this.loop(time));
  }

  tr(key, params) { return escapeHtml(t(this.language, key, params)); }
  icons() { window.lucide?.createIcons({ root: this.root }); }
  button(action, symbol, label) {
    return `<button type="button" class="arcade-icon" data-arcade-action="${action}" title="${this.tr(label)}" aria-label="${this.tr(label)}"${action === 'sound' ? ` aria-pressed="${this.sound}"` : ''}>${icon(symbol)}</button>`;
  }

  select(name, label, options, selected) {
    if (name === 'mode' && ['robot', 'monkey'].includes(this.game)) options = options.filter(([value]) => value !== 'letters');
    return `<label><span>${this.tr(label)}</span><select data-arcade-setting="${name}">${options.map(([value, key]) => `<option value="${value}"${selected === value ? ' selected' : ''}>${this.tr(key)}</option>`).join('')}</select></label>`;
  }

  render() {
    this.scene3d?.destroy();
    this.input?.setActive(false);
    this.input?.destroy();
    const m = this.model;
    this.root.innerHTML = `<section class="typing-arcade arcade-${this.game}">
      <header class="arcade-header">${this.button('back', 'arrow-left', 'arcadeBack')}<div><span class="arcade-eyebrow">${this.tr('arcadeEyebrow')}</span><h1>${this.tr(titleKey(this.game))}</h1></div><div class="arcade-tools"><select data-arcade-setting="language" aria-label="${this.tr('arcadeLanguage')}"><option value="vi"${this.language === 'vi' ? ' selected' : ''}>VI</option><option value="en"${this.language === 'en' ? ' selected' : ''}>EN</option></select>${this.button('help', 'circle-help', 'arcadeHelp')}${this.button('sound', this.sound ? 'volume-2' : 'volume-x', 'arcadeSound')}${this.button('fullscreen', 'maximize', 'arcadeFullscreen')}</div></header>
      <div class="arcade-stage" data-arcade-stage>
        <canvas width="1200" height="660" aria-label="${this.tr(titleKey(this.game))}"></canvas>
        <div class="arcade-hud"><div><span>${this.tr('arcadeScore')}</span><b data-hud="score">0</b></div><div><span>${this.tr('arcadeCombo')}</span><b data-hud="combo">x0</b></div><div><span>${this.tr(hudProgressKey(this.game))}</span><b data-hud="progress">1</b></div><div><span>${this.tr(hudExtraKey(this.game))}</span><b data-hud="extra">3</b></div>${this.button('pause', 'pause', 'arcadePause')}</div>
        <div class="arcade-overlay" data-overlay></div>
        <div class="arcade-targets" aria-live="off"></div>
      </div>
      <div class="arcade-console"><div class="arcade-passage"></div><div class="arcade-input-row"><label for="arcade-typing">${this.tr('arcadeInput')}</label><input id="arcade-typing" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${this.tr('arcadeInput')}" ${m.state === 'playing' ? '' : 'disabled'}><div class="arcade-metric"><span>${this.tr('arcadeAccuracy')}</span><b data-hud="accuracy">100%</b></div><div class="arcade-metric"><span>${this.tr('arcadeWpm')}</span><b data-hud="wpm">0</b></div></div><div class="arcade-nitro"><span>${this.tr('arcadeNitro')}</span><progress max="100" value="0"></progress></div></div>
      <div class="arcade-keyboard-area">
        <div class="arcade-keyboard" id="arcade-keyboard-container" data-guide-panel-id="arcade-guide-panel"></div>
        <div id="arcade-guide-panel" data-hands="on" class="arcade-guide-panel"></div>
      </div>
      <p class="arcade-status" role="status"></p>
    </section>`;

    this.canvas = this.root.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.scene3d = null;
    if (this.game === 'robot') {
      this.canvas.hidden = true;
      this.scene3d = new ArcadeScene3D(this.root.querySelector('[data-arcade-stage]'), this.game);
    }
    const input = this.root.querySelector('#arcade-typing');
    this.input = new InputEngine({
      input,
      onValue: (value, meta) => this.type(value, meta),
      onEscape: () => this.pause(),
      getKeyboardMode: () => this.keyboard,
      getLanguageMode: () => this.mode === 'accented' ? 'vietnamese' : 'english',
      getTargetText: () => this.model.target
    });
    this.input.setValue(m.value, { rawValue: this.raw || '' });
    this.input.setActive(m.state === 'playing');
    this.overlay();
    this.icons();
    this.update();
    this.draw();
  }

  overlay() {
    const m = this.model;
    const area = this.root.querySelector('[data-overlay]');
    area.hidden = m.state === 'playing';
    if (m.state === 'ready') {
      area.innerHTML = `<div class="arcade-setup"><span class="arcade-eyebrow">${this.tr('arcadeReady')}</span><h2>${this.tr(titleKey(this.game))}</h2><div class="arcade-settings">${this.select('mode', 'arcadeMode', [['letters', 'arcadeLetters'], ['plain', 'arcadePlain'], ['accented', 'arcadeAccented']], this.mode)}${this.select('difficulty', 'arcadeDifficulty', [['easy', 'arcadeEasy'], ['medium', 'arcadeMedium'], ['hard', 'arcadeHard']], this.difficulty)}${this.select('keyboard', 'arcadeKeyboard', [['telex', 'arcadeTelex'], ['vni', 'arcadeVNI'], ['system', 'arcadeSystem']], this.keyboard)}</div><button type="button" class="arcade-primary" data-arcade-action="start">${icon('play')}${this.tr('arcadeStart')}</button><p>${this.tr('arcadeBest')}: ${this.best()}</p><strong class="arcade-free-quota" data-quota-usage>${this.quotaUsageLabel()}</strong></div>`;
    } else if (m.state === 'countdown') {
      area.innerHTML = `<strong class="arcade-countdown">${Math.max(1, Math.ceil(m.countdown))}</strong>`;
    } else if (m.state === 'paused') {
      area.innerHTML = `<div class="arcade-setup"><h2>${this.tr('arcadePause')}</h2><div class="arcade-result-tabs"><button class="arcade-tab is-active" type="button" data-arcade-report-tab="summary">${this.tr('arcadePause')}</button><button class="arcade-tab" type="button" data-arcade-report-tab="errors">${this.tr('arcadeErrorWords')} (${m.errorWords.length})</button></div><div class="arcade-report-panel" data-arcade-report-panel="summary"><p>${this.tr('arcadeWords')}: ${m.completed}</p></div><div class="arcade-report-panel" data-arcade-report-panel="errors" hidden>${this.errorWordList()}</div><button class="arcade-primary" data-arcade-action="resume">${icon('play')}${this.tr('arcadeResume')}</button><button class="arcade-secondary" data-arcade-action="restart">${icon('rotate-ccw')}${this.tr('arcadeRestart')}</button></div>`;
      this.root.querySelectorAll('[data-arcade-report-tab]').forEach(tab => tab.addEventListener('click', () => {
        this.root.querySelectorAll('[data-arcade-report-tab]').forEach(item => item.classList.toggle('is-active', item === tab));
        this.root.querySelectorAll('[data-arcade-report-panel]').forEach(panel => { panel.hidden = panel.dataset.arcadeReportPanel !== tab.dataset.arcadeReportTab; });
      }));
    } else if (m.state === 'finished') {
      const ranking = [...m.racers.keys()].sort((a, b) => (m.finishTimes[a] ?? Infinity) - (m.finishTimes[b] ?? Infinity) || m.racers[b] - m.racers[a]);
      area.innerHTML = `<div class="arcade-setup arcade-result"><span class="arcade-eyebrow">${this.tr(this.game === 'race' ? 'arcadeResults' : m.lives ? 'arcadeVictory' : 'arcadeGameOver')}</span><h2>${m.score.toLocaleString()} <small>${this.tr('arcadeScore')}</small></h2><div class="arcade-result-metrics"><span>${this.tr('arcadeWords')}<b>${m.completed}</b></span><span>${this.tr('arcadeAccuracy')}<b>${m.accuracy}%</b></span><span>${this.tr('arcadeCombo')}<b>x${m.bestCombo}</b></span></div>${this.game === 'race' ? `<ol class="arcade-ranking">${ranking.map(i => `<li${i === 0 ? ' class="is-player"' : ''}><span>${this.tr(i === 0 ? 'arcadeYou' : 'arcadeOpponent', { n: i })}</span><b>${m.finishTimes[i] === null ? `${Math.floor(m.racers[i] * 100)}%` : `${m.finishTimes[i].toFixed(1)}s`}</b></li>`).join('')}</ol>` : ''}<div class="arcade-result-tabs"><button class="arcade-tab is-active" type="button" data-arcade-report-tab="summary">${this.tr('arcadeResults')}</button><button class="arcade-tab" type="button" data-arcade-report-tab="errors">${this.tr('arcadeErrorWords')} (${m.errorWords.length})</button></div><div class="arcade-report-panel" data-arcade-report-panel="summary"><p>${this.tr('arcadeAccuracy')}: ${m.accuracy}%</p></div><div class="arcade-report-panel" data-arcade-report-panel="errors" hidden>${this.errorWordList()}</div><button class="arcade-primary" data-arcade-action="restart">${icon('rotate-ccw')}${this.tr('arcadeRestart')}</button><button class="arcade-secondary" data-arcade-action="back">${this.tr('arcadeBack')}</button></div>`;
      this.root.querySelectorAll('[data-arcade-report-tab]').forEach(tab => tab.addEventListener('click', () => {
        this.root.querySelectorAll('[data-arcade-report-tab]').forEach(item => item.classList.toggle('is-active', item === tab));
        this.root.querySelectorAll('[data-arcade-report-panel]').forEach(panel => { panel.hidden = panel.dataset.arcadeReportPanel !== tab.dataset.arcadeReportTab; });
      }));
    }
    this.icons();
  }

  errorWordList() {
    if (!this.model.errorWords.length) return `<p>${this.tr('arcadeErrorWordsEmpty')}</p>`;
    return `<ul>${this.model.errorWords.map((item, index) => {
      const key = this.errorWordKey(item);
      const sent = this.reportedErrorWords.has(key);
      const sending = this.reportingErrorWords.has(key);
      return `<li><div class="arcade-error-entry"><b>${escapeHtml(item.target || '—')}</b><span>${this.tr('arcadeErrorWordTyped')}: ${escapeHtml(item.typed)} · ${item.count}x</span></div>${item.target ? `<button type="button" class="arcade-report-word" data-arcade-report-word="${index}"${sent || sending ? ' disabled' : ''}>${this.tr(sent ? 'arcadeReportSent' : sending ? 'arcadeReportSending' : 'arcadeReportWord')}</button><span class="arcade-report-status" data-arcade-report-status="${index}" role="status"></span>` : ''}</li>`;
    }).join('')}</ul>`;
  }

  errorWordKey(item) { return `${item.target}\u0000${item.typed}`; }

  async reportErrorWord(index, button) {
    const item = this.model.errorWords[index];
    if (!item?.target) return;
    const key = this.errorWordKey(item);
    if (this.reportedErrorWords.has(key) || this.reportingErrorWords.has(key)) return;
    const status = this.root.querySelector(`[data-arcade-report-status="${index}"]`);
    this.reportingErrorWords.add(key);
    button.disabled = true;
    button.textContent = t(this.language, 'arcadeReportSending');
    if (status) status.textContent = '';
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'suggestion', target: item.target, translation: '',
          content: `[${this.game}] Word report: target=${item.target}; typed=${item.typed.slice(0, 300)}; count=${item.count}` })
      });
      if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'login' : 'failed');
      this.reportedErrorWords.add(key);
      button.textContent = t(this.language, 'arcadeReportSent');
    } catch (error) {
      button.disabled = false;
      button.textContent = t(this.language, 'arcadeReportWord');
      if (status) status.textContent = t(this.language, error.message === 'login' ? 'arcadeReportLogin' : 'arcadeReportFailed');
    } finally {
      this.reportingErrorWords.delete(key);
    }
  }

  bestKey() { return `phi-doi-arcade-v1:${this.game}:${this.mode}:${this.difficulty}`; }
  best() { try { return Number(localStorage.getItem(this.bestKey())) || 0; } catch { return 0; } }
  quotaUsageLabel() {
    if (this.quotaStatus?.unlimited || globalThis.ORBIT_TYPE_ACCOUNT?.owner === true) return this.tr('quotaUnlimited');
    const used = this.quotaStatus?.allowed ? (this.quotaStatus.arcade?.[this.game] ?? 0) : undefined;
    if (!Number.isInteger(used)) return this.tr('quotaStatusLoading', { limit: 8 });
    const remaining = 8 - Math.min(8, Math.max(0, used));
    return this.tr('quotaGameUsage', { remaining, limit: 8 });
  }
  async refreshQuotaStatus() {
    if (!this.onQuotaStatus) return;
    try {
      const status = await this.onQuotaStatus();
      if (status?.allowed && this.model.state === 'ready') {
        this.quotaStatus = status;
        const meter = this.root.querySelector('[data-quota-usage]');
        if (meter) meter.textContent = this.quotaUsageLabel();
      }
    } catch { /* Keep the pending label if the quota service is unavailable. */ }
  }
  setArcadeUsage(used) {
    if (!Number.isInteger(used)) return;
    this.quotaStatus = { ...(this.quotaStatus || {}), arcade: { ...(this.quotaStatus?.arcade || {}), [this.game]: used } };
    const meter = this.root.querySelector('[data-quota-usage]');
    if (meter) meter.textContent = this.quotaUsageLabel();
  }
  save() { try { localStorage.setItem(this.bestKey(), String(Math.max(this.best(), this.model.score))); } catch { this.status('arcadeStorage'); } }
  status(key) { this.root.querySelector('.arcade-status').textContent = t(this.language, key); }

  change(e) {
    const key = e.target.dataset.arcadeSetting;
    if (!key) return;
    if (key === 'language') {
      const select = document.querySelector('#interface-language');
      if (select) {
        select.value = e.target.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        this.setLanguage(e.target.value);
      }
    } else if (this.model.state === 'ready') {
      this[key] = e.target.value;
      this.model = createModel({ game: this.game, mode: this.mode, difficulty: this.difficulty });
      this.overlay();
    }
  }

  setLanguage(language) { this.language = language; this.render(); }

  setSound(enabled) {
    this.sound = Boolean(enabled);
    this.audio.setEnabled(this.sound);
    this.render();
  }

  async click(e) {
    const reportButton = e.target.closest('[data-arcade-report-word]');
    if (reportButton) { await this.reportErrorWord(Number(reportButton.dataset.arcadeReportWord), reportButton); return; }
    const action = e.target.closest('[data-arcade-action]')?.dataset.arcadeAction;
    if (!action) return;
    if (action === 'back') { this.onBack(); return; }
    if (action === 'start' || action === 'restart') {
      if (this.startPending) return;
      this.startPending = true;
      let quota;
      try { quota = await this.onConsumeQuota?.({ scope: 'arcade', key: this.game }); }
      catch { quota = { allowed: false }; }
      finally { this.startPending = false; }
      if (quota && !quota.allowed) return;
      if (Number.isInteger(quota?.used)) this.setArcadeUsage(quota.used);
      this.model = createModel({ game: this.game, mode: this.mode, difficulty: this.difficulty });
      this.reportedErrorWords.clear();
      this.reportingErrorWords.clear();
      this.raw = '';
      this.model.start();
      this.audio.setEnabled(this.sound);
      void this.audio.unlock();
      this.audio.typingKey();
      this.render();
    }
    if (action === 'pause') this.pause();
    if (action === 'resume') { this.model.resume(); this.render(); }
    if (action === 'sound') {
      this.sound = !this.sound;
      this.audio.setEnabled(this.sound);
      this.onSoundChange(this.sound);
      this.render();
      if (this.sound) void this.audio.unlock();
    }
    if (action === 'help') {
      this.pause();
      const area = this.root.querySelector('[data-overlay]');
      area.hidden = false;
      const helpKey = ({ fruit: 'fruitHelp', shark: 'arcadeSharkHelp', race: 'arcadeRaceHelp', robot: 'arcadeRobotHelp', monkey: 'arcadeMonkeyHelp', courier: 'arcadeCourierHelp' })[this.game];
      area.innerHTML = `<div class="arcade-setup"><h2>${this.tr('arcadeHelp')}</h2><p>${this.tr(helpKey)}</p><button class="arcade-primary" data-arcade-action="close-help">${this.tr('arcadeHelpClose')}</button></div>`;
    }
    if (action === 'close-help') this.overlay();
    if (action === 'fullscreen') {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await this.root.querySelector('.typing-arcade').requestFullscreen();
      } catch {
        this.status('arcadeUnavailable');
      }
    }
  }

  pause() {
    this.model.pause();
    this.input?.setActive(false);
    this.root.querySelector('#arcade-typing').disabled = true;
    this.overlay();
  }

  type(value, meta = {}) {
    const oldValue = this.model.value;
    const oldRaw = this.raw || '';
    const result = this.model.accept(value, { intermediate: this.mode === 'accented' && meta.source !== 'compositionend' });
    if (result.ignored) return;
    if (!result.accepted) {
      this.audio.error();
      this.input.setValue(oldValue, { rawValue: oldRaw });
      this.root.querySelector('.arcade-console').classList.add('mistake');
      setTimeout(() => this.root?.querySelector('.arcade-console')?.classList.remove('mistake'), 180);
    } else {
      this.raw = meta.raw ?? value;
      this.audio.click();
    }
    if (result.completed) {
      this.raw = '';
      this.input.clear();
      if (this.game === 'courier' || this.game === 'fruit') {
        this.audio.wordComplete();
      } else if (this.game === 'monkey') {
        this.audio.wordComplete();
        window.setTimeout(() => {
          if (this.destroyed || !this.sound) return;
          this.audio.fruitBasket();
        }, 590);
      } else {
        this.audio.targetHit();
        window.setTimeout(() => {
          if (this.destroyed || !this.sound) return;
          this.audio.wordComplete();
          if (this.game !== 'courier') this.audio.explosion({ boss: true });
        }, 170);
      }
    }
    this.update();
    this.checkFinished();
  }

  beep() { this.audio.correct(); }

  checkFinished() {
    if (this.model.state === 'finished' && !this.model.saved) {
      this.model.saved = true;
      this.input.setActive(false);
      this.root.querySelector('#arcade-typing').disabled = true;
      this.save();
      this.audio.levelUp();
      this.overlay();
    }
  }

  update() {
    const m = this.model;
    const progress = this.game === 'shark' ? `${m.depth} / 4`
      : this.game === 'robot' ? `${m.rank} / 4`
      : this.game === 'monkey' ? `${Math.floor(m.altitude)}m`
      : this.game === 'courier' ? `${m.level} (${m.completed}/25)`
      : this.game === 'fruit' ? `${t(this.language, m.marketKey)} x${m.multiplier}`
      : `${m.position} / 4`;

    const values = {
      score: m.score.toLocaleString(),
      combo: `x${m.combo}`,
      progress,
      extra: isRace(this.game) ? `${Math.floor(m.elapsed)}s` : '♥'.repeat(m.lives) + '♡'.repeat(3 - m.lives),
      accuracy: `${m.accuracy}%`,
      wpm: m.wpm
    };
    for (const [key, value] of Object.entries(values)) {
      const el = this.root.querySelector(`[data-hud="${key}"]`);
      if (el) el.textContent = value;
    }

    this.root.querySelector('progress').value = m.boost ? 100 : m.nitro;
    this.root.querySelector('.arcade-nitro').hidden = !isRace(this.game);
    const passage = this.root.querySelector('.arcade-passage');
    passage.hidden = !isRace(this.game);
    if (isRace(this.game)) {
      passage.innerHTML = m.words.slice(Math.max(0, m.completed - 2), m.completed + 9).map((word, i) => {
        const index = Math.max(0, m.completed - 2) + i;
        return `<span class="${index < m.completed ? 'done' : index === m.completed ? 'current' : ''}">${escapeHtml(word)}</span>`;
      }).join('');
    }

    // Target words are now drawn on canvas in drawTargetWords() for smooth 60fps rendering.
    // DOM overlay is hidden to avoid duplicate rendering.
    const targets = this.root.querySelector('.arcade-targets');
    if (targets) targets.innerHTML = '';


    // Virtual keyboard update
    const keyboardContainer = this.root.querySelector('#arcade-keyboard-container');
    if (keyboardContainer) {
      renderGameKeyboard(keyboardContainer, {
        active: m.state === 'playing',
        target: m.target,
        input: m.value,
        mode: this.mode === 'accented' ? 'vietnamese' : 'english',
        keyboard: this.keyboard,
        systemInput: this.keyboard === 'system',
        onGuideSchemeChange: scheme => {
          this.keyboard = scheme;
          const select = this.root.querySelector('[data-arcade-setting="keyboard"]');
          if (select) select.value = scheme;
        },
        uiLanguage: this.language
      });
    }
  }

  loop(time) {
    if (this.destroyed) return;
    const dt = Math.min(.05, (time - this.lastFrame) / 1000);
    this.lastFrame = time;
    const before = this.model.state;
    const lock = this.model.lock;
    const completedBefore = this.model.completed;

    this.model.tick(dt);
    if (this.game === 'fruit') {
      for (const event of this.model.events.splice(0)) {
        if (event === 'slice') this.audio.targetHit();
        else this.audio.error();
      }
    }
    if (this.game === 'courier' && this.model.completed > completedBefore) {
      this.audio.targetHit();
    }

    if (lock !== null && this.model.lock === null && this.game !== 'courier') {
      // Only clear the input if the model also reset value (target was missed/expired).
      // If accept() completed the word, type() already called clear() synchronously.
      if (!this.model.value) {
        this.raw = '';
        this.input.clear();
      }
    }
    if (before === 'countdown') {
      if (this.model.state === 'playing') {
        this.root.querySelector('#arcade-typing').disabled = false;
        this.input.setActive(true);
      }
      this.overlay();
    }
    this.checkFinished();
    if (!this.lastUi || time - this.lastUi > 80) {
      this.update();
      this.lastUi = time;
    }
    this.draw();
    this.frame = requestAnimationFrame(next => this.loop(next));
  }

  sprite(name, index, x, y, width) {
    const img = this.images[name];
    if (!img?.complete || !img.naturalWidth) return;
    const sw = img.naturalWidth / 2, sh = img.naturalHeight / 2;
    this.ctx.drawImage(img, index % 2 * sw, Math.floor(index / 2) * sh, sw, sh, x - width / 2, y - width * sh / sw / 2, width, width * sh / sw);
  }

  draw() {
    const stage = this.root.querySelector('[data-arcade-stage]');
    if (!stage?.clientWidth) return;
    if (this.scene3d) { this.scene3d.draw(this.model, stage); return; }
    const c = this.ctx, w = 1200, h = Math.round(w * stage.clientHeight / stage.clientWidth), m = this.model;
    if (this.game === 'fruit') {
      if (this.canvas.height !== h) this.canvas.height = h;
      drawFruitScene(c, w, h, m, this.images, stage.clientWidth);
      return;
    }
    if (this.canvas.height !== h) this.canvas.height = h;
    const spriteScale = Math.min(1.5, h / 660);

    c.clearRect(0, 0, w, h);
    c.fillStyle = this.game === 'shark' ? '#086b94' : this.game === 'courier' ? '#cce9e4' : '#8bd9ef';
    c.fillRect(0, 0, w, h);

    const bgName = this.game === 'courier' ? 'postcard_rooftop_background' : `${this.game}-background`;
    const bg = this.images[bgName];
    if (bg?.complete && bg.naturalWidth) {
      const scale = Math.max(w / bg.naturalWidth, h / bg.naturalHeight);
      if (this.game === 'courier') {
        const tileW = bg.naturalWidth * scale;
        const scroll = (m.player.distance || 0) * w * .18;
        const first = Math.floor(scroll / tileW);
        for (let i = first; i <= first + 2; i++) {
          c.save(); c.translate(i * tileW - scroll, (h - bg.naturalHeight * scale) / 2);
          if (i % 2) { c.translate(tileW, 0); c.scale(-1, 1); }
          c.drawImage(bg, 0, 0, tileW, bg.naturalHeight * scale); c.restore();
        }
      } else c.drawImage(bg, (w - bg.naturalWidth * scale) / 2, (h - bg.naturalHeight * scale) / 2, bg.naturalWidth * scale, bg.naturalHeight * scale);
    }

    if (this.game === 'shark') {
      c.fillStyle = `rgba(0,15,60,${(m.depth - 1) * .1})`;
      c.fillRect(0, 0, w, h);
      this.sprite('shark-sprites', 0, 150, h * .55 + Math.sin(m.elapsed * 2) * 8, 220 * spriteScale);
      for (const target of m.targets) {
        this.sprite('shark-sprites', target.variant === 3 ? 1 : target.variant + 1, target.x * w, target.y * h, (target.variant === 3 ? 275 : 210) * spriteScale);
      }
      for (const effect of m.effects) {
        c.strokeStyle = effect.hit ? '#ff7864' : '#d5ffff';
        c.lineWidth = 5;
        const progress = 1 - effect.life / .7;
        c.beginPath();
        c.arc(effect.x * w, effect.y * h, 12 + progress * 65, 0, Math.PI * 2);
        c.stroke();
        if (!effect.hit) {
          const x = 170 + (effect.x * w - 170) * Math.min(1, progress * 3);
          const y = h * .55 + (effect.y * h - h * .55) * Math.min(1, progress * 3);
          c.fillStyle = '#ffd15a';
          c.beginPath();
          c.ellipse(x, y, 22, 7, Math.atan2(effect.y * h - h * .55, effect.x * w - 170), 0, Math.PI * 2);
          c.fill();
        }
      }
    } else if (this.game === 'robot') {
      c.fillStyle = `rgba(12,20,60,${(m.rank - 1) * .06})`;
      c.fillRect(0, 0, w, h);
      c.fillStyle = '#ffb000aa';
      c.fillRect(0, h * .82, w, 8);
      c.fillStyle = '#17243c';
      c.fillRect(0, h * .84, w, h * .16);
      for (let x = -20; x < w; x += 90) {
        c.fillStyle = '#f5c34d';
        c.fillRect(x, h * .85, 48, 8);
      }

      // Gun turret placed at bottom center
      const gunImg = this.images['gun_turret'];
      if (gunImg?.complete && gunImg.naturalWidth) {
        const gw = 160 * spriteScale, gh = gw * gunImg.naturalHeight / gunImg.naturalWidth;
        c.drawImage(gunImg, w / 2 - gw / 2, h * .78 - gh * 0.15, gw, gh);
      }

      // Incoming robots scaling with depth (target.y) — sprites 1-3 only
      for (const target of m.targets) {
        const depthScale = (0.45 + target.y * 0.75) * spriteScale;
        const spriteIdx = (target.variant % 3) + 1;
        this.sprite('robot-sprites', spriteIdx, target.x * w, target.y * h, 185 * depthScale);
      }

      // Crosshair on locked target
      if (m.lock !== null) {
        const locked = m.targets.find(t => t.id === m.lock);
        if (locked) {
          const cx = locked.x * w, cy = locked.y * h;
          const cr = 28 * (0.5 + locked.y * 0.6) * spriteScale;
          c.save();
          c.strokeStyle = '#ff3030';
          c.lineWidth = 2.5;
          c.globalAlpha = 0.85;
          c.beginPath(); c.arc(cx, cy, cr, 0, Math.PI * 2); c.stroke();
          c.beginPath(); c.moveTo(cx - cr * 1.3, cy); c.lineTo(cx - cr * 0.4, cy); c.stroke();
          c.beginPath(); c.moveTo(cx + cr * 0.4, cy); c.lineTo(cx + cr * 1.3, cy); c.stroke();
          c.beginPath(); c.moveTo(cx, cy - cr * 1.3); c.lineTo(cx, cy - cr * 0.4); c.stroke();
          c.beginPath(); c.moveTo(cx, cy + cr * 0.4); c.lineTo(cx, cy + cr * 1.3); c.stroke();
          c.fillStyle = '#ff3030';
          c.beginPath(); c.arc(cx, cy, 3 * spriteScale, 0, Math.PI * 2); c.fill();
          c.restore();
        }
      }

      // Cannon laser effect from gun barrel to target + muzzle flash
      for (const effect of m.effects) {
        c.strokeStyle = effect.hit ? '#ff655e' : '#65f7ff';
        c.lineWidth = 6;
        const progress = 1 - effect.life / .7;
        c.beginPath();
        c.arc(effect.x * w, effect.y * h, 16 + progress * 74, 0, Math.PI * 2);
        c.stroke();
        if (!effect.hit) {
          c.beginPath();
          c.moveTo(w / 2, h * .82);
          c.lineTo(effect.x * w, effect.y * h);
          c.strokeStyle = '#fff2a2';
          c.lineWidth = 4 + (1 - progress) * 5;
          c.stroke();
          // Muzzle flash at gun barrel
          if (progress < 0.3) {
            c.save();
            c.globalAlpha = 1 - progress / 0.3;
            const flashSize = (12 + (1 - progress / 0.3) * 18) * spriteScale;
            c.fillStyle = '#fff8c0';
            c.beginPath(); c.arc(w / 2, h * .80, flashSize, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#ffdd44';
            c.beginPath(); c.arc(w / 2, h * .80, flashSize * 0.6, 0, Math.PI * 2); c.fill();
            c.restore();
          }
        }
      }
    } else if (this.game === 'monkey') {
      const mascot = this.images['monkey-mascot'];
      if (mascot?.complete && mascot.naturalWidth) {
        const width = 230 * spriteScale;
        const height = width * mascot.naturalHeight / mascot.naturalWidth;
        c.drawImage(mascot, 38, h - height - 10, width, height);
      }

      // Fruit collection basket next to monkey mascot
      c.fillStyle = '#8d5b2d';
      c.beginPath();
      c.ellipse(180 * spriteScale, h - 35 * spriteScale, 38 * spriteScale, 18 * spriteScale, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#b77c44';
      c.beginPath();
      c.ellipse(180 * spriteScale, h - 45 * spriteScale, 34 * spriteScale, 14 * spriteScale, 0, 0, Math.PI * 2);
      c.fill();

      for (const target of m.targets) {
        this.sprite('monkey-sprites', target.variant, target.x * w, target.y * h, 145 * spriteScale);
      }

      for (const effect of m.effects) {
        if (effect.type === 'drop') {
          // Fruit drops smoothly into the basket
          const progress = 1 - effect.life / .65;
          const fx = effect.fromX * w + (180 * spriteScale - effect.fromX * w) * progress;
          const fy = effect.fromY * h + ((h - 45 * spriteScale) - effect.fromY * h) * progress;
          const dropScale = (1 - progress * 0.3) * spriteScale;
          this.sprite('monkey-sprites', effect.variant ?? 0, fx, fy, 130 * dropScale);
        } else {
          c.strokeStyle = effect.hit ? '#ff5e6b' : '#ffe16a';
          c.lineWidth = 6;
          const progress = 1 - effect.life / .7;
          c.beginPath();
          c.arc(effect.x * w, effect.y * h, 14 + progress * 68, 0, Math.PI * 2);
          c.stroke();
        }
      }
    } else if (this.game === 'courier') {
      const groundH = h * 0.18;
      const groundY = h - groundH;

      // Rooftop ground line
      c.fillStyle = '#526d70';
      c.fillRect(0, groundY, w, groundH);
      c.fillStyle = '#e99368';
      c.fillRect(0, groundY, w, 5);
      c.fillStyle = '#e7bd94';
      c.fillRect(0, groundY + 7, w, 3);
      c.fillStyle = '#eadbc1'; c.fillRect(0, groundY - 15, w, 15);
      c.strokeStyle = '#b49c82'; c.lineWidth = 1.5;
      const roadOffset = ((m.player.distance || 0) * w) % 100;
      for (let x = -roadOffset; x < w; x += 100) {
        c.beginPath(); c.moveTo(x, groundY - 15); c.lineTo(x - 12, groundY); c.stroke();
      }

      // Hero Cat position & animation using original watercolor artwork
      const heroX = w * m.player.x;
      const heroSize = 115 * spriteScale;
      const jumpY = m.player.height * h * 0.65;
      const heroY = groundY - 10 - heroSize - jumpY;

      let catPose = 'cat_courier_idle';
      let animOffsetY = 0, scaleX = 1, scaleY = 1, rotation = 0;
      switch (m.player.state) {
        case 'idle':
          catPose = 'cat_courier_idle';
          animOffsetY = Math.sin(m.elapsed * 2.5) * 2;
          scaleY = 1 + Math.sin(m.elapsed * 2.5) * 0.015;
          scaleX = 1 - Math.sin(m.elapsed * 2.5) * 0.01;
          break;
        case 'jump':
          catPose = 'cat_courier_jump';
          if (m.player.velocityY > 0) {
            scaleX = 0.95; scaleY = 1.06;
            rotation = -0.06;
          } else {
            scaleX = 1.02; scaleY = 0.98;
            rotation = 0.03;
          }
          break;
        case 'land':
          catPose = 'cat_courier_land';
          scaleX = 1.08; scaleY = 0.92;
          break;
        case 'run':
        default: {
          catPose = courierRunFrame(m.elapsed);
          animOffsetY = -Math.abs(Math.sin(m.elapsed * Math.PI * 7.5)) * 3.5;
          rotation = 0.02;
          break;
        }
      }

      const catImg = this.images[catPose];
      const jumpFrame = m.player.state === 'jump' ? courierJumpFrame(m.player.velocityY) : null;
      const jumpImg = jumpFrame && this.images[jumpFrame.name];
      if (jumpImg?.complete && jumpImg.naturalWidth) {
        const [sx, sy, sw, sh] = jumpFrame.rect;
        const drawHeight = heroSize;
        const drawWidth = drawHeight * sw / sh;
        c.drawImage(jumpImg, sx, sy, sw, sh, heroX - drawWidth / 2, groundY - 10 - jumpY - drawHeight, drawWidth, drawHeight);
      } else if (catImg?.complete && catImg.naturalWidth && COURIER_RUN_RECTS[catPose]) {
        const [sx, sy, sw, sh] = COURIER_RUN_RECTS[catPose];
        const drawHeight = heroSize * sh / sw;
        c.drawImage(catImg, sx, sy, sw, sh, heroX - heroSize / 2, groundY - 10 - drawHeight + animOffsetY, heroSize, drawHeight);
      } else if (catImg?.complete && catImg.naturalWidth) {
        c.save();
        const drawX = heroX;
        const drawY = heroY + heroSize / 2 + animOffsetY;
        c.translate(drawX, drawY);
        c.rotate(rotation);
        c.scale(scaleX, scaleY);
        const catWidth = heroSize * catImg.naturalWidth / catImg.naturalHeight;
        c.drawImage(catImg, -catWidth / 2, -heroSize / 2, catWidth, heroSize);
        c.restore();
      }

      // Land dust particles
      if (m.player.state === 'land') {
        const landProgress = 1 - Math.max(0, (m.player.landingUntil - m.elapsed) / 0.14);
        c.fillStyle = `rgba(180,160,130,${Math.max(0, 0.6 - landProgress)})`;
        for (let i = 0; i < 4; i++) {
          const px = heroX + heroSize * 0.3 + i * 18 * spriteScale - 15;
          const py = groundY - 4 - landProgress * 12 * (i % 2 ? 1 : 1.5);
          c.beginPath();
          c.arc(px, py, (3 + i) * spriteScale * (1 - landProgress * 0.5), 0, Math.PI * 2);
          c.fill();
        }
      }

      // Obstacles
      const obsNames = ['obstacle_parcel_stack', 'obstacle_puddle', 'obstacle_rooftop_vent'];
      for (const target of m.targets) {
        const obsImg = this.images[obsNames[target.variant % 3]];
        const obsW = (target.variant === 1 ? 95 : 82) * spriteScale;
        const obsH = (target.variant === 1 ? 55 : 88) * spriteScale;
        const ox = target.x * w - obsW / 2;
        const oy = groundY - obsH + (target.variant === 1 ? 8 : 2);
        if (obsImg?.complete && obsImg.naturalWidth) {
          c.drawImage(obsImg, ox, oy, obsW, obsH);
        }
      }

      // Effects (Reward envelope / collision hit)
      for (const effect of m.effects) {
        if (effect.type === 'reward') {
          const progress = 1 - effect.life / 0.85;
          const rw = 54 * spriteScale;
          const rx = effect.x * w - rw / 2;
          const ry = groundY - 60 - progress * 95;
          c.save();
          c.globalAlpha = Math.max(0, 1 - progress * 1.1);
          const envImg = this.images['reward_envelope'];
          if (envImg?.complete && envImg.naturalWidth) {
            c.drawImage(envImg, rx, ry, rw, rw);
          }
          c.restore();
        } else if (effect.hit) {
          c.strokeStyle = '#ff655e';
          c.lineWidth = 6;
          const progress = 1 - effect.life / 0.6;
          c.beginPath();
          c.arc(heroX + heroSize / 2, groundY - 30, 20 + progress * 60, 0, Math.PI * 2);
          c.stroke();
        }
      }
    } else {
      // Race
      c.strokeStyle = '#ffffff90';
      c.lineWidth = 6;
      for (let i = 0; i < 10; i++) {
        const y = h * .47 + ((i * h * .09 + m.elapsed * (m.boost ? 200 : 90)) % (h * .53));
        c.beginPath();
        c.moveTo(600, y);
        c.lineTo(600, y + 22);
        c.stroke();
      }
      for (let i = 1; i < 4; i++) {
        const distance = Math.max(-.2, Math.min(.5, m.racers[i] - m.racers[0]));
        const y = h * (.69 - distance * .75);
        this.sprite('race-sprites', i, 220 + (i - 1) * 380, y, Math.max(100, 220 - distance * 200) * spriteScale);
      }
      if (m.boost) {
        c.fillStyle = '#20d9ff';
        c.beginPath();
        c.moveTo(585, h * .9);
        c.lineTo(600, h * .99);
        c.lineTo(615, h * .9);
        c.fill();
      }
      this.sprite('race-sprites', 0, 600, h * .83, 230 * spriteScale);
      c.fillStyle = '#10293c';
      c.fillRect(180, 110, 840, 9);
      c.fillStyle = '#5bea9d';
      c.fillRect(180, 110, 840 * m.racers[0], 9);
    }

    // Draw target word labels directly on canvas (60fps, no jitter)
    if (isTargets(this.game)) this.drawTargetWords(c, w, h);
  }

  drawTargetWords(c, w, h) {
    const m = this.model;
    c.save();
    for (const target of m.targets) {
      const typed = target.id === m.lock ? m.value.length : (target.done ? target.word.length : 0);
      let x = target.x, y = target.y;
      if (this.game === 'courier') { y = .82 - 115 * Math.min(1.5, h / 660) / h; }
      else if (this.game === 'robot') { y = Math.max(0.08, target.y - 0.05); }
      else if (this.game === 'monkey') { y = target.y + .08; }
      else { x = Math.min(.9, target.x); y = target.y + .085; }

      const px = x * w, py = y * h;
      const isLocked = target.id === m.lock;
      const isDone = target.done;
      const word = target.word;
      const typedPart = word.slice(0, typed);
      const remainPart = word.slice(typed);

      // Measure text
      const fontSize = this.game === 'courier' ? Math.max(24, Math.round(16 * w / this.canvas.clientWidth)) : Math.round(Math.min(24, h / 28));
      c.font = `800 ${fontSize}px Nunito, sans-serif`;
      const typedW = typedPart ? c.measureText(typedPart).width : 0;
      const remainW = remainPart ? c.measureText(remainPart).width : 0;
      const textW = c.measureText(word).width;
      const padX = 13, padY = 5;
      const boxW = textW + padX * 2;
      const boxH = fontSize + padY * 2;
      const bx = Math.round(px - boxW / 2), by = Math.round(py - boxH / 2);
      const radius = 7;

      // Background
      let bgColor, borderColor, textColor, typedColor;
      if (this.game === 'robot') {
        bgColor = isDone ? '#102c4fee' : '#102c4fee';
        borderColor = isLocked ? '#6dff9a' : '#60d8ff';
        textColor = '#ffffff'; typedColor = '#6dff9a';
      } else if (this.game === 'monkey') {
        bgColor = '#68421eee';
        borderColor = isLocked ? '#fff2a2' : '#ffd96a';
        textColor = '#fff8d5'; typedColor = '#6dff9a';
      } else if (this.game === 'courier') {
        bgColor = isDone ? '#d7eee0' : '#fff9eb';
        borderColor = isDone ? '#43836b' : (isLocked ? '#e99368' : '#477b72');
        textColor = isDone ? '#295d4c' : '#254b4c'; typedColor = '#318c3b';
      } else {
        bgColor = '#07324ced';
        borderColor = isLocked ? '#63ff92' : '#72def4';
        textColor = '#ffffff'; typedColor = '#6dff9a';
      }

      // Rounded rect
      c.beginPath();
      c.moveTo(bx + radius, by);
      c.lineTo(bx + boxW - radius, by);
      c.quadraticCurveTo(bx + boxW, by, bx + boxW, by + radius);
      c.lineTo(bx + boxW, by + boxH - radius);
      c.quadraticCurveTo(bx + boxW, by + boxH, bx + boxW - radius, by + boxH);
      c.lineTo(bx + radius, by + boxH);
      c.quadraticCurveTo(bx, by + boxH, bx, by + boxH - radius);
      c.lineTo(bx, by + radius);
      c.quadraticCurveTo(bx, by, bx + radius, by);
      c.closePath();
      c.fillStyle = bgColor;
      c.fill();
      c.strokeStyle = borderColor;
      c.lineWidth = isLocked ? 3 : 2;
      c.stroke();

      // Lock glow
      if (isLocked) {
        c.save();
        c.shadowColor = borderColor;
        c.shadowBlur = 12;
        c.stroke();
        c.restore();
      }

      // Text
      const textX = bx + padX;
      const textY = by + padY + fontSize * 0.85;
      c.fillStyle = textColor;
      c.fillText(word, textX, textY);
      if (typedPart) {
        c.save(); c.beginPath(); c.rect(textX, by, typedW, boxH); c.clip();
        c.fillStyle = typedColor; c.fillText(word, textX, textY); c.restore();
      }
    }
    c.restore();
  }

  destroy() {
    this.scene3d?.destroy();
    this.destroyed = true;
    cancelAnimationFrame(this.frame);
    this.input?.setActive(false);
    this.input?.destroy();
    this.audio?.close();
    this.root.removeEventListener('click', this.clickHandler);
    this.root.removeEventListener('change', this.changeHandler);
    window.removeEventListener('keydown', this.keyDownHandler);
    document.removeEventListener('visibilitychange', this.visibilityHandler);
  }
}
