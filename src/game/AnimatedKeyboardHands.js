import { fingerForKey } from './HandGuide.js';

const controllers = new WeakMap();
const NS = 'http://www.w3.org/2000/svg';
const DURATION = 460;
const SYMBOL_CODES = { Backquote:'`', Minus:'-', Equal:'=', BracketLeft:'[', BracketRight:']', Backslash:'\\', Semicolon:';', Quote:"'", Comma:',', Period:'.', Slash:'/' };
const PALM = 'M36 135 Q77 112 132 133 Q147 143 150 166 L170 153 Q186 151 177 174 L157 200 L151 224 Q94 237 43 224 L46 201 Q28 177 36 135Z';
const DIGITS = [
  { id:0, base:[46,145], tip:[18,66], width:16 },
  { id:1, base:[68,132], tip:[57,32], width:18 },
  { id:2, base:[101,130], tip:[100,16], width:19 },
  { id:3, base:[130,142], tip:[143,39], width:19 },
  { id:4, base:[145,181], tip:[194,135], width:21 }
];
const clamp = (n, lo, hi) => Math.min(Math.max(lo, hi), Math.max(lo, n));
const mix = (a, b, t) => a + (b - a) * t;

function element(name, attributes) {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}

function fingerPath(base, tip, width) {
  const dx = tip[0] - base[0], dy = tip[1] - base[1], length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length * width / 2, ny = dx / length * width / 2;
  const middle = [mix(base[0], tip[0], .56), mix(base[1], tip[1], .56)];
  return `M${base[0]-nx} ${base[1]-ny} Q${middle[0]-nx} ${middle[1]-ny} ${tip[0]-nx} ${tip[1]-ny} Q${tip[0]+dx/length*width} ${tip[1]+dy/length*width} ${tip[0]+nx} ${tip[1]+ny} Q${middle[0]+nx} ${middle[1]+ny} ${base[0]+nx} ${base[1]+ny}`;
}

class KeyboardHands {
  constructor(container) {
    this.container = container;
    this.visible = true;
    this.intent = { key:'', shift:false };
    this.raf = 0;
    this.svg = element('svg', { class:'keyboard-motion-hands', 'aria-hidden':'true', preserveAspectRatio:'none' });
    this.hands = ['left','right'].map(side => {
      const group = element('g', { 'data-hand':side, 'data-state':'idle' });
      const palm = element('path', { class:'motion-palm', d:PALM });
      const mirrored = element('g', { transform:side === 'right' ? 'translate(210 0) scale(-1 1)' : '' });
      mirrored.append(palm);
      const fingers = DIGITS.map(digit => {
        const id = side === 'left' ? digit.id : [8,7,6,5,4][digit.id];
        const path = element('path', { class:'motion-finger', 'data-motion-finger':id });
        mirrored.append(path);
        return { ...digit, id, path };
      });
      group.append(mirrored); this.svg.append(group);
      return { side, group, fingers, active:-1, pose:null, motion:null, pressUntil:0 };
    });
    container.append(this.svg);
    this.observer = new ResizeObserver(() => this.layout(true));
    this.observer.observe(container);
    // Capture before the input handler changes the next-key guidance.
    document.addEventListener('keydown', event => this.press(event), true);
  }

  keycap(key, side) {
    const caps = [...this.container.querySelectorAll('.game-keyboard-rows [data-key]')];
    const matches = caps.filter(cap => cap.dataset.key === key);
    return key === 'Shift' && side === 'right' ? matches[1] : matches[0];
  }

  keyPoint(key, side) {
    const cap = this.keycap(key, side);
    if (!cap) return null;
    const box = cap.getBoundingClientRect(), parent = this.container.getBoundingClientRect();
    return [box.left + box.width / 2 - parent.left - this.container.clientLeft,
      box.top + box.height / 2 - parent.top - this.container.clientTop];
  }

  setGuide(key, shift) {
    if (this.intent.key === key && this.intent.shift === shift && this.hands[0].pose) return;
    this.intent = { key, shift };
    this.layout();
  }

  setVisible(visible) {
    this.visible = visible;
    this.svg.style.display = visible ? '' : 'none';
    if (!visible) {
      cancelAnimationFrame(this.raf); this.raf = 0;
      this.hands.forEach(hand => { hand.group.dataset.state = 'hidden'; });
    } else this.layout(true);
  }

  layout(snap = false) {
    if (!this.visible || !this.container.clientWidth || !this.container.clientHeight) return;
    const width = this.container.clientWidth, height = this.container.clientHeight;
    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    const a = this.keyPoint('a'), s = this.keyPoint('s');
    if (!a || !s) return;
    const sx = Math.min((s[0] - a[0]) / 42, width / 480);
    const sy = Math.min(sx * .66, height / 340);
    const active = fingerForKey(this.intent.key);
    const activeSide = active >= 0 && active <= 4 ? 'left' : 'right';
    const now = performance.now();
    for (const hand of this.hands) {
      if (hand.pressUntil > now && !snap) { hand.pending = true; continue; }
      hand.pending = false;
      const shiftHand = this.intent.shift && active >= 0 && hand.side !== activeSide;
      const id = shiftHand ? (hand.side === 'left' ? 0 : 8) : hand.side === activeSide ? active : -1;
      const key = shiftHand ? 'Shift' : id >= 0 ? this.intent.key : '';
      const anchor = this.keyPoint(hand.side === 'left' ? 'd' : 'k');
      const tips = hand.fingers.map(digit => [...digit.tip]);
      let x = anchor[0] - (hand.side === 'left' ? 100 : 110) * sx;
      let y = anchor[1] - 16 * sy;
      const index = hand.fingers.findIndex(digit => digit.id === id);
      const target = key && this.keyPoint(key, hand.side);
      if (target && index >= 0) {
        const tip = tips[index];
        x = target[0] - (hand.side === 'left' ? tip[0] : 210-tip[0]) * sx;
        y = target[1] - tip[1] * sy;
      }
      x = clamp(x, 5, width - 210*sx - 5);
      y = clamp(y, 5, height - 240*sy - 5);
      if (target && index >= 0) {
        tips[index] = [hand.side === 'left' ? (target[0]-x)/sx : 210-(target[0]-x)/sx, (target[1]-y)/sy];
      }
      const goal = { x, y, sx, sy, tips };
      hand.active = id; hand.group.dataset.targetKey = key;
      hand.fingers.forEach(digit => digit.path.classList.toggle('is-guiding', digit.id === id));
      const stationary = hand.pose && ['x','y','sx','sy'].every(axis=>Math.abs(hand.pose[axis]-goal[axis])<.01)
        && tips.every((tip,i)=>tip.every((value,j)=>Math.abs(value-hand.pose.tips[i][j])<.01));
      if (!hand.pose || snap || stationary) { hand.pose = goal; hand.motion = null; }
      else hand.motion = { from:hand.pose, to:goal, start:now, returning:id < 0 };
      hand.group.dataset.state = hand.motion ? (id < 0 ? 'returning' : 'reaching') : (id < 0 ? 'idle' : 'pointing');
      this.draw(hand);
    }
    this.schedule();
  }

  press(event) {
    if (!this.visible || !['typing-input', 'arcade-typing'].includes(event.target?.id) || event.ctrlKey || event.metaKey || event.altKey) return;
    const code = event.code;
    const key = code?.startsWith('Key') ? code.slice(3).toLowerCase()
      : code?.startsWith('Digit') ? code.slice(5)
      : code === 'Space' ? 'Space' : SYMBOL_CODES[code] || (event.key?.length === 1 ? event.key.toLowerCase() : event.key);
    if (!key || key !== this.intent.key) return;
    const now = performance.now();
    for (const hand of this.hands) {
      if (hand.active < 0) continue;
      hand.pressUntil = now + 110; hand.group.dataset.state = 'pressing';
      this.keycap(hand.group.dataset.targetKey, hand.side)?.classList.add('hand-key-pressed');
    }
    this.schedule();
  }

  schedule() {
    if (!this.raf && this.visible) this.raf = requestAnimationFrame(time => this.frame(time));
  }

  frame(time) {
    this.raf = 0;
    let moving = false, pending = false;
    for (const hand of this.hands) {
      if (!hand.pose) continue;
      if (hand.motion) {
        const {from,to,start,returning} = hand.motion;
        const fraction = Math.min(1,(time-start)/DURATION), t = fraction*fraction*(3-2*fraction);
        hand.pose = { x:mix(from.x,to.x,t), y:mix(from.y,to.y,t)-Math.sin(Math.PI*fraction)*Math.min(7,to.y-4,from.y-4),
          sx:mix(from.sx,to.sx,t), sy:mix(from.sy,to.sy,t),
          tips:from.tips.map((tip,i)=>tip.map((n,j)=>mix(n,to.tips[i][j],t))) };
        if (fraction >= 1) { hand.motion = null; hand.group.dataset.state = returning ? 'idle' : 'pointing'; }
        else moving = true;
      }
      if (hand.pressUntil) {
        if (time < hand.pressUntil) { hand.group.dataset.state = 'pressing'; moving = true; }
        else {
          hand.pressUntil = 0;
          this.keycap(hand.group.dataset.targetKey,hand.side)?.classList.remove('hand-key-pressed');
          hand.group.dataset.state = hand.motion ? 'reaching' : hand.active < 0 ? 'idle' : 'pointing';
          pending ||= hand.pending;
        }
      }
      this.draw(hand);
    }
    if (pending) this.layout();
    if (moving) this.schedule();
  }

  draw(hand) {
    const {x,y,sx,sy,tips} = hand.pose;
    hand.group.setAttribute('transform', `translate(${x} ${y}) scale(${sx} ${sy})`);
    hand.fingers.forEach((digit,i) => {
      const tip = [...tips[i]];
      if (digit.id === hand.active && hand.pressUntil > performance.now()) tip[1] += Math.min(3, 2/sy);
      digit.path.setAttribute('d',fingerPath(digit.base,tip,digit.width));
      digit.path.dataset.tipX = x + (hand.side === 'left' ? tip[0] : 210-tip[0])*sx;
      digit.path.dataset.tipY = y + tip[1]*sy;
    });
  }
}

export function updateKeyboardHands(container, key = '', shift = false) {
  let controller = controllers.get(container);
  if (!controller) { controller = new KeyboardHands(container); controllers.set(container,controller); }
  controller.setGuide(key,shift);
}

export function showKeyboardHands(container, visible) {
  const controller = controllers.get(container);
  if (controller && controller.visible !== visible) controller.setVisible(visible);
}
