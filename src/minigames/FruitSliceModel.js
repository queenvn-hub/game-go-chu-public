import { ArcadeModel, plain } from './ArcadeModel.js';

export class FruitSliceModel extends ArcadeModel {
  constructor(options = {}) {
    super({ ...options, game: 'fruit' });
    this.nextSpawn = .3;
    this.events = [];
  }

  get multiplier() { return this.combo >= 10 ? 2 : this.combo >= 5 ? 1.5 : 1; }
  get marketKey() { return this.combo >= 10 ? 'fruitRush' : this.combo >= 5 ? 'fruitBusy' : 'fruitMorning'; }

  spawn() {
    const lane = [0, 1, 2].find(n => !this.targets.some(t => t.lane === n));
    if (lane === undefined) return;
    const rotten = this.mode !== 'letters' && this.serial >= 3 && this.random() < .2;
    const candidates = this.words.filter(word => !this.targets.some(t => plain(t.word)[0] === plain(word)[0]));
    let word = (candidates.length ? candidates : this.words)[Math.floor(this.random() * (candidates.length || this.words.length))];
    this.targets.push({ id: ++this.serial, word, lane, x: .2 + lane * .3,
      y: .86, age: 0, duration: Math.max(4, 8 - this.tier * 1.2 - this.elapsed / 100),
      variant: rotten ? 5 : Math.floor(this.random() * 5), rotten, done: false });
  }

  tick(dt) {
    if (this.state === 'countdown') { super.tick(dt); return; }
    if (this.state !== 'playing') return;
    this.elapsed += dt;
    this.effects = this.effects.filter(e => (e.life -= dt) > 0);
    // Completion precedes the actual slash so the two sound events stay distinct.
    for (const fruit of this.targets.filter(t => t.done)) {
      fruit.sliceDelay -= dt;
      if (fruit.sliceDelay > 0) continue;
      this.events.push(fruit.rotten ? 'rotten' : 'slice');
      this.effects.push({ ...fruit, life: .8, type: 'slice' });
      this.targets = this.targets.filter(t => t !== fruit);
    }
    for (const fruit of this.targets.filter(t => !t.done)) {
      fruit.age += dt;
      const p = fruit.age / fruit.duration;
      fruit.y = .86 - 2.32 * p * (1 - p);
      fruit.x = .2 + fruit.lane * .3 + Math.sin(p * Math.PI) * (fruit.lane === 0 ? .025 : -.025);
      if (p < 1) continue;
      this.targets = this.targets.filter(t => t !== fruit);
      if (this.lock === fruit.id) { this.lock = null; this.value = ''; }
      if (!fruit.rotten) {
        this.lives = Math.max(0, this.lives - 1); this.combo = 0;
        this.events.push('miss');
        this.effects.push({ ...fruit, type: 'miss', life: .6 });
      }
    }
    if (!this.lives) { this.state = 'finished'; return; }
    this.nextSpawn -= dt;
    if (this.nextSpawn <= 0 && this.targets.length < 3) {
      this.spawn();
      this.nextSpawn = Math.max(.9, 2.4 - this.tier * .35 - this.elapsed / 150);
    }
  }

  accept(value, { intermediate = false } = {}) {
    if (this.state !== 'playing') return { ignored: true };
    value = value.normalize('NFC').trim().toLocaleLowerCase('vi');
    if (!value) { this.lock = null; this.value = ''; return { accepted: true }; }
    const matches = word => word.startsWith(value) || (intermediate && plain(word).startsWith(plain(value)));
    if (this.lock === null) {
      const candidate = this.targets.filter(t => !t.done && matches(t.word))
        .sort((a, b) => (a.duration - a.age) - (b.duration - b.age))[0];
      if (candidate) this.lock = candidate.id;
    }
    const fruit = this.targets.find(t => t.id === this.lock && !t.done);
    if (!fruit || !matches(fruit.word)) {
      this.errors++;
      const entry = {target: fruit?.word || '', typed: value, count: 1};
      const prior = this.errorWords.find(item => item.target === entry.target && item.typed === entry.typed);
      if (prior) prior.count++; else if (entry.target || entry.typed) this.errorWords.push(entry);
      return { accepted: false };
    }
    this.correct += Math.max(0, value.length - this.value.length);
    this.value = value;
    if (value !== fruit.word) return { accepted: true };
    if (fruit.rotten) { this.score = Math.max(0, this.score - 50); this.combo = 0; fruit.points = -50; }
    else {
      this.completed++; this.combo++; this.bestCombo = Math.max(this.bestCombo, this.combo);
      fruit.points = 100 * this.multiplier; this.score += fruit.points;
    }
    fruit.done = true; fruit.sliceDelay = .16;
    this.lock = null; this.value = '';
    return { accepted: true, completed: true, rotten: fruit.rotten };
  }
}
