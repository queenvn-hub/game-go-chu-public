// Simulation is independent of rendering, wall-clock time and browser storage.
import { EASY_WORDS, MEDIUM_WORDS, HARD_WORDS } from './ArcadeWords.js';

export const PASSAGE = 'việt nam là một đất nước tươi đẹp với những cánh đồng xanh những dòng sông hiền hòa và bầu trời trong sáng chúng em cùng nhau học tập khám phá thế giới mỗi ngày một điều mới cùng bạn bè vui chơi chăm chỉ luyện tập để tiến bộ và về đích';
export const plain = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');

export function vocabulary(mode, race = false, difficulty = 'easy') {
  if (race) {
    const words = PASSAGE.split(' ');
    return mode === 'letters' ? [...'asdfghjklqwertyuiopzxcvbnm'] : mode === 'plain' ? words.map(plain) : words;
  }
  if (mode === 'letters') return [...'asdfghjklqwertyuiopzxcvbnm'];
  const pool = difficulty === 'hard' ? HARD_WORDS : difficulty === 'medium' ? MEDIUM_WORDS : EASY_WORDS;
  const words = [...new Set(pool.map(word => word.normalize('NFC').trim()).filter(word => /^[\p{L}]+$/u.test(word)))];
  return mode === 'plain' ? [...new Set(words.map(plain))] : words;
}

export class ArcadeModel {
  constructor({ game = 'shark', mode = 'accented', difficulty = 'easy', random = Math.random } = {}) {
    this.game = game; this.mode = mode; this.difficulty = difficulty; this.random = random;
    this.words = vocabulary(mode, game === 'race', difficulty); this.state = 'ready'; this.elapsed = 0;
    this.score = 0; this.combo = 0; this.bestCombo = 0; this.completed = 0; this.lives = 3;
    this.correct = 0; this.errors = 0; this.errorWords = []; this.targets = []; this.nextSpawn = game === 'monkey' ? .45 : game === 'courier' ? .8 : 0; this.serial = 0;
    this.altitude = 0;
    this.lock = null; this.value = ''; this.nitro = 0; this.boost = 0; this.effects = [];
    this.racers = [0, 0, 0, 0]; this.finishTimes = [null, null, null, null];
    this.countdown = 3; this.tier = { easy: 0, medium: 1, hard: 2 }[difficulty] ?? 0;

    // Cat courier physics
    this.player = { x: .15, distance: 0, height: 0, velocityY: 0, airborne: false, landingUntil: 0, state: 'idle' };
  }

  start() { this.state = 'countdown'; if (this.game === 'courier') this.player.state = 'run'; }
  pause() { if (['playing', 'countdown'].includes(this.state)) { this.previousState = this.state; this.state = 'paused'; if (this.game === 'courier') this.player.state = 'idle'; } }
  resume() { if (this.state === 'paused') { this.state = this.previousState; if (this.game === 'courier' && this.state === 'playing') this.player.state = this.player.airborne ? 'jump' : 'run'; } }

  get depth() { return Math.min(4, 1 + Math.floor(this.completed / 8)); }
  get rank() { return Math.min(4, 1 + Math.floor(this.completed / 6)); }
  get level() { return 1 + Math.floor(this.completed / 6); }
  get accuracy() { return this.correct + this.errors ? Math.round(this.correct / (this.correct + this.errors) * 100) : 100; }
  get wpm() { return this.elapsed ? Math.round(this.correct / 5 / (this.elapsed / 60)) : 0; }
  get position() { return 1 + this.racers.slice(1).filter((p, i) => this.finishTimes[i + 1] !== null || p > this.racers[0]).length; }
  get cat() { return this.player; }
  get target() {
    if (this.game === 'race') return this.words[this.completed] || '';
    const active = this.targets.find(t => t.id === this.lock);
    return active ? active.word : '';
  }

  jump() {
    if (this.game === 'courier' && !this.player.airborne && this.state === 'playing') {
      this.player.airborne = true;
      this.player.velocityY = 1.85;
      this.player.landingUntil = 0;
      this.player.state = 'jump';
    }
  }

  spawn() {
    const isMonkey = this.game === 'monkey';
    const isRobot = this.game === 'robot';
    const isCourier = this.game === 'courier';
    const variant = isRobot ? this.serial % 7 : Math.floor(this.random() * (isCourier ? 3 : Math.min(4, this.depth + 1)));

    let x = 1.08;
    let y = .22 + (this.serial % 4) * .16;
    let speed = (.035 + this.tier * .014 + this.depth * .004) * [1, 1.25, .9, .8][variant];

    if (isMonkey) {
      x = .18 + (this.serial % 5) * .16;
      y = -.12;
      speed = .085 + this.tier * .02 + (this.serial % 3) * .012;
    } else if (isRobot) {
      // Robot approaches from distance (depth): x centered with sway, y starts small (high)
      x = .42 + ((this.serial % 5) - 2) * .09;
      y = .14;
      speed = .045 + this.tier * .015 + this.rank * .006;
    } else if (isCourier) {
      x = 1.12;
      y = .78;
      speed = .18 + this.tier * .06 + (this.level - 1) * .012;
    }

    this.targets.push({
      id: ++this.serial,
      word: this.words[Math.floor(this.random() * this.words.length)],
      x,
      y,
      variant,
      speed,
      done: false
    });
  }

  tick(dt) {
    if (this.state === 'countdown') {
      this.countdown -= dt;
      if (this.countdown <= 0) this.state = 'playing';
      return;
    }
    if (this.state !== 'playing') return;

    this.elapsed += dt;
    this.boost = Math.max(0, this.boost - dt);
    this.effects = this.effects.filter(e => (e.life -= dt) > 0);

    if (this.game === 'race') {
      const goal = this.completed / this.words.length;
      this.racers[0] = Math.min(goal, this.racers[0] + dt * (this.boost ? .12 : .065));
      for (let i = 1; i < 4; i++) {
        this.racers[i] = Math.min(1, this.racers[i] + dt * (.007 + this.tier * .003 + i * .0008));
        if (this.racers[i] >= 1 && this.finishTimes[i] === null) this.finishTimes[i] = this.elapsed;
      }
      if (this.completed === this.words.length && this.racers[0] >= 1) {
        this.finishTimes[0] = this.elapsed;
        this.state = 'finished';
      }
      return;
    }

    this.nextSpawn -= dt;

    if (this.game === 'monkey') {
      if (this.nextSpawn <= 0 && this.targets.length < 5) {
        this.spawn();
        this.nextSpawn = Math.max(.8, 2.1 - this.tier * .2 - this.altitude * .001);
      }
      this.altitude += dt * (10 + this.tier * 2);
      for (const target of this.targets) {
        target.y += target.speed * dt;
        target.x += Math.sin(this.elapsed * 1.5 + target.id) * dt * .008;
      }
      const missed = this.targets.filter(t => t.y > .88);
      if (missed.length) {
        this.lives = Math.max(0, this.lives - missed.length);
        this.combo = 0;
        if (missed.some(t => t.id === this.lock)) { this.lock = null; this.value = ''; }
        this.targets = this.targets.filter(t => t.y <= .88);
        this.effects.push({ x: .5, y: .86, life: .6, hit: true });
        if (!this.lives) this.state = 'finished';
      }
      return;
    }

    if (this.game === 'robot') {
      if (this.nextSpawn <= 0 && this.targets.length < 5) {
        this.spawn();
        this.nextSpawn = Math.max(1.6, 4.0 - this.tier * .6 - this.rank * .25);
      }
      for (const target of this.targets) {
        target.y += target.speed * dt;
        target.x += Math.sin(this.elapsed * 1.2 + target.id) * dt * .012;
      }
      const collided = this.targets.filter(t => t.y >= .78);
      if (collided.length) {
        this.lives = Math.max(0, this.lives - collided.length);
        this.combo = 0;
        if (collided.some(t => t.id === this.lock)) { this.lock = null; this.value = ''; }
        this.targets = this.targets.filter(t => t.y < .78);
        this.effects.push({ x: .5, y: .84, life: .6, hit: true });
        if (!this.lives) this.state = 'finished';
      }
      return;
    }

    if (this.game === 'courier') {
      // Update courier jumping physics
      const player = this.player;
      player.distance += (.18 + this.tier * .06 + (this.level - 1) * .012) * dt;
      player.x = Math.min(.25, player.x + dt * .015);
      if (player.airborne) {
        player.height += player.velocityY * dt;
        player.velocityY -= 4.2 * dt;
        if (player.height <= 0 && player.velocityY < 0) {
          player.height = 0;
          player.velocityY = 0;
          player.airborne = false;
          player.landingUntil = this.elapsed + 0.14;
          player.state = 'land';
        }
      } else if (player.landingUntil && this.elapsed >= player.landingUntil) {
        player.landingUntil = 0;
        player.state = 'run';
      }

      if (this.nextSpawn <= 0 && this.targets.length < 4) {
        const last = this.targets[this.targets.length - 1];
        if (!last || last.x < .88) {
          this.spawn();
          const baseInterval = this.tier === 0 ? 2.5 : this.tier === 1 ? 2.0 : 1.6;
          this.nextSpawn = Math.max(1.1, baseInterval - (this.level - 1) * 0.1);
        }
      }

      const heroX = player.x;
      for (const target of [...this.targets]) {
        target.x -= target.speed * dt;
        const gap = target.x - heroX;

        // Auto jump when word is completed and obstacle approaches
        if (target.done && gap > 0 && gap <= target.speed * 0.32 && !player.airborne) {
          this.jump();
        }

        // Collision or pass check when reaching hero position
        if (gap <= 0.02) {
          const cleared = target.done && player.airborne && player.height >= 0.14;
          if (cleared) {
            this.combo++;
            this.completed++;
            this.bestCombo = Math.max(this.bestCombo, this.combo);
            const bonus = Math.min(this.combo, 10) * 10;
            this.score += 50 + bonus;
            this.effects.push({ type: 'reward', x: target.x, y: .46, life: .85 });
          } else {
            this.lives = Math.max(0, this.lives - 1);
            this.combo = 0;
            this.effects.push({ x: heroX, y: .78, life: .6, hit: true });
          }
          if (target.id === this.lock) { this.lock = null; this.value = ''; }
          this.targets = this.targets.filter(t => t !== target);
          if (this.lives <= 0 || this.completed >= 25) { this.state = 'finished'; this.player.state = 'idle'; }
        }
      }
      return;
    }

    // Default: Shark
    if (this.nextSpawn <= 0 && this.targets.length < 5) {
      this.spawn();
      this.nextSpawn = Math.max(1.7, 4.5 - this.tier * .7 - this.depth * .3);
    }
    for (const target of this.targets) target.x -= target.speed * dt;
    const collided = this.targets.filter(t => t.x < .14);
    if (collided.length) {
      this.lives = Math.max(0, this.lives - collided.length);
      this.combo = 0;
      if (collided.some(t => t.id === this.lock)) { this.lock = null; this.value = ''; }
      this.targets = this.targets.filter(t => t.x >= .14);
      this.effects.push({ x: .14, y: .5, life: .6, hit: true });
      if (!this.lives) this.state = 'finished';
    }
  }

  accept(value, { intermediate = false } = {}) {
    if (this.state !== 'playing') return { ignored: true };
    value = value.normalize('NFC').trim().toLocaleLowerCase('vi');
    if (!value) { this.value = ''; this.lock = null; return { accepted: true }; }

    if (['shark', 'robot', 'monkey', 'courier'].includes(this.game) && this.lock === null) {
      // Find candidate matching word
      const available = this.targets.filter(t => !t.done);
      const candidate = available
        .filter(t => plain(t.word).startsWith(plain(value)))
        .sort((a, b) => ['robot', 'monkey'].includes(this.game) ? (b.y - a.y) : (a.x - b.x))[0];
      if (candidate) this.lock = candidate.id;
    }

    const target = this.target;
    const matches = target && (target.startsWith(value) || (intermediate && plain(target).startsWith(plain(value))));
    if (!matches) {
      this.errors++;
      const entry = {target: target || '', typed: value, count: 1};
      const prior = this.errorWords.find(item => item.target === entry.target && item.typed === entry.typed);
      if (prior) prior.count++;
      else if (entry.target || entry.typed) this.errorWords.push(entry);
      return { accepted: false };
    }

    this.correct += Math.max(0, value.length - this.value.length);
    this.value = value;
    if (value !== target) return { accepted: true };

    const victim = this.targets.find(t => t.id === this.lock);

    if (this.game === 'courier') {
      // For courier: mark word done so cat prepares to leap
      if (victim) {
        victim.done = true;
      }
      this.lock = null;
      this.value = '';
      return { accepted: true, completed: true };
    }

    this.completed++;
    this.combo++;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.score += 100 + Math.min(10, this.combo) * 10;

    this.nitro += 20;
    if (this.nitro >= 100) { this.nitro = 0; this.boost = 3; }

    if (victim) {
      if (this.game === 'monkey') {
        // Drop fruit into basket effect
        this.effects.push({ type: 'drop', fromX: victim.x, fromY: victim.y, life: .65, variant: victim.variant });
      } else {
        this.effects.push({ x: victim.x, y: victim.y, life: .7, variant: victim.variant });
      }
      this.targets = this.targets.filter(t => t !== victim);
    }

    this.lock = null;
    this.value = '';

    if (['shark', 'robot', 'monkey'].includes(this.game) && this.completed >= (this.game === 'shark' ? 30 : this.game === 'robot' ? 25 : 20)) {
      this.state = 'finished';
    }
    return { accepted: true, completed: true };
  }
}
