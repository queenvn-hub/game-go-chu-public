import { clamp } from './text.js';
import { ROCK_RECTS, SHIP_RECT, drawAtlas } from './GameArtwork.js';

const FONT = '"Baloo 2", "Segoe UI", sans-serif';
const BODY_FONT = '"Nunito", "Segoe UI", sans-serif';
export const CHARACTER_COLORS = Object.freeze({ correct: '#6ff5c0', next: '#ffda67', pending: '#fff6df' });

export function targetTravelBounds(game, target) {
  const base = target.spaceBaseMetrics;
  const defense = Math.max(1, game.defenseY());
  const start = base.height * Math.max(.64, 18 / base.fontSize) / 2 + 16;
  const end = Math.min((defense - base.height * .32) / (1 + base.height * .18 / defense), defense - base.height * 9 / base.fontSize);
  return { start, end: Math.max(start + 1, end) };
}

export function rockOutline(seed = 1) {
  const variant = Math.abs(seed) % 8;
  return Array.from({ length: 14 }, (_, i) => {
    const angle = i / 14 * Math.PI * 2;
    const noise = Math.sin(seed * .17 + i * 17.13) * .5 + .5;
    let radius = .38 + noise * .12;
    if (variant === 3 && i === 3 || variant === 5 && i === 9) radius *= .54;
    return [Math.cos(angle) * radius * (variant === 1 ? .77 : 1), Math.sin(angle) * radius * (variant === 2 ? .7 : 1)];
  });
}

export function traceRock(ctx, points, size) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x * size, y * size) : ctx.moveTo(x * size, y * size));
  ctx.closePath();
}

function wrapUnits(units, widths, limit) {
  const positions = [];
  const lines = [];
  let width = 0, line = 0;
  for (let index = 0; index < units.length; index += 1) {
    if (index === 0 || /\s/u.test(units[index - 1])) {
      let wordWidth = 0;
      for (let end = index; end < units.length && !/\s/u.test(units[end]); end += 1) wordWidth += widths[end];
      if (width && width + wordWidth > limit) { lines.push(width); line += 1; width = 0; }
    }
    if (width && width + widths[index] > limit) { lines.push(width); line += 1; width = 0; }
    positions.push({ offset: width, line });
    width += widths[index];
  }
  lines.push(width);
  return { positions, lines, width: Math.max(...lines, 0) };
}

// Measurement is shared by drawing, spawn bounds and projectile hit coordinates.
export function measureTarget(game, target, ctx) {
  const translationVisible = !game.settings.courseMode && Boolean(target.translationText)
    && game.settings.translationLanguage !== 'none' && game.settings.meaningMode === 'immediate';
  const fontSize = game.getWordFontSize(target);
  const key = `${game.width}|${game.height}|${fontSize}|${translationVisible ? target.translationText : ''}`;
  if (!target.spaceBaseMetrics || target.spaceBaseMetrics.key !== key) {
    ctx.save();
    ctx.font = `800 ${fontSize}px ${FONT}`;
    const units = target.characterStates.map(item => item.char);
    const widths = units.map(char => ctx.measureText(char).width);
    const rawWidth = widths.reduce((sum, width) => sum + width, 0);
    const maxRock = Math.min(310, game.width * 0.65);
    const inline = rawWidth + 28 <= maxRock * 0.66 && !/[.!?]\s*$/u.test(target.text);
    const rockSize = inline ? clamp((rawWidth + 28) / 0.66, 118, maxRock) : game.height < 600 ? 48 : 66;
    const lineLimit = inline ? rawWidth + 1 : Math.min(700, game.width - 76);
    const wrapped = wrapUnits(units, widths, lineLimit);
    const lineHeight = fontSize * 1.42;
    const translationSize = clamp(fontSize * 0.48, 15, 20);
    ctx.font = `700 ${translationSize}px ${BODY_FONT}`;
    const translationUnits = translationVisible ? [...target.translationText] : [];
    const translationWidths = translationUnits.map(char => ctx.measureText(char).width);
    const translated = wrapUnits(translationUnits, translationWidths, Math.min(700, game.width - 76));
    const translationHeight = translationVisible ? translated.lines.length * translationSize * 1.4 + 12 : 0;
    const panelWidth = Math.max(wrapped.width + 32, translated.width + 32, 150);
    const width = inline ? Math.max(rockSize, translationVisible ? translated.width + 32 : 0) : panelWidth;
    const panelHeight = wrapped.lines.length * lineHeight + 26 + translationHeight;
    const height = inline ? rockSize + translationHeight : rockSize + 18 + panelHeight;
    target.spaceBaseMetrics = { key, inline, fontSize, widths, units, wrapped, lineHeight, translationSize,
      translationUnits, translationWidths, translated, translationHeight, panelWidth, panelHeight, rockSize, width, height };
    ctx.restore();
  }
  // Project text and rock together; collision and bullets consume these same coordinates.
  const base = target.spaceBaseMetrics;
  const depth = clamp(target.y / Math.max(1, game.defenseY()), 0, 1);
  const logicalScale = Math.max(0.64 + depth * 0.36, 18 / base.fontSize);
  target.collisionMetrics = { width: base.width * logicalScale, height: base.height * logicalScale };
  // Reach full visual size before the unchanged collision footprint meets the defense line.
  const travel = targetTravelBounds(game, target);
  const approach = clamp((target.y - travel.start) / (travel.end - travel.start), 0, 1);
  const scale = Math.max(.42 / (1 - .58 * approach), 16 / base.fontSize);
  const scaledWrap = value => ({ width: value.width * scale, lines: value.lines.map(n => n * scale),
    positions: value.positions.map(p => ({ ...p, offset: p.offset * scale })) });
  const m = { ...base, wrapped: scaledWrap(base.wrapped), translated: scaledWrap(base.translated),
    widths: base.widths.map(n => n * scale), translationWidths: base.translationWidths.map(n => n * scale) };
  for (const name of ['fontSize', 'lineHeight', 'translationSize', 'translationHeight', 'panelWidth', 'panelHeight', 'rockSize', 'width', 'height']) m[name] = base[name] * scale;
  target.spaceMetrics = m;
  const centerX = clamp(target.x, m.width / 2 + 18, game.width - m.width / 2 - 18);
  const top = target.y - m.height / 2;
  const meteor = { x: centerX, y: top + m.rockSize / 2, size: m.rockSize };
  const labelY = m.inline ? meteor.y - m.lineHeight / 2 : top + m.rockSize + 18;
  const firstCenterY = m.inline ? meteor.y : labelY + 13 + m.lineHeight / 2;
  target.characterLayout = m.units.map((char, index) => {
    const position = m.wrapped.positions[index];
    const x = centerX - m.wrapped.lines[position.line] / 2 + position.offset;
    const centerY = firstCenterY + position.line * m.lineHeight;
    return { char, index, x, y: centerY - m.lineHeight / 2, width: m.widths[index], height: m.lineHeight,
      centerX: x + m.widths[index] / 2, centerY };
  });
  target.labelLayout = { x: centerX - m.panelWidth / 2, y: labelY, width: m.panelWidth,
    height: m.inline ? m.lineHeight : m.panelHeight, fontSize: m.fontSize, textWidth: m.wrapped.width,
    inline: m.inline, meteor, bounds: { x: clamp(target.x, base.width * logicalScale / 2 + 18, game.width - base.width * logicalScale / 2 - 18) - base.width * logicalScale / 2,
      y: target.y - base.height * logicalScale / 2, width: base.width * logicalScale, height: base.height * logicalScale },
    translationY: m.inline ? top + m.rockSize + 8 : labelY + m.panelHeight - m.translationHeight + 6 };
  return target.characterLayout;
}

export function characterColor(target, index, active) {
  if (index < target.confirmedProgress) return CHARACTER_COLORS.correct;
  if (active && index === target.confirmedProgress) return CHARACTER_COLORS.next;
  return CHARACTER_COLORS.pending;
}

export class SpacePresentation {
  constructor(game) {
    this.game = game;
    this.flightStars = Array.from({ length: 240 }, (_, i) => ({
      x: (i * .61803398875) % 1, y: (i * .754877666) % 1, alpha: .35 + (i % 7) / 11
    }));
    this.backdrop = this.load('../../assets/game-neon/space.png');
    this.rockAtlas = this.load('../../assets/game-neon/meteors.png');
    this.effectAtlas = this.load('../../assets/game-neon/effects.png');
    this.foreground = this.load('../../assets/game-neon/foreground.png');
    this.sprites = this.load('../../assets/space-sprites-v2.png');
    this.three = null;
    this.frame3D = false;
    // The engine owns time and input; WebGL only presents its current state.
    if (typeof document !== 'undefined' && game.canvas instanceof HTMLCanvasElement
      && new URLSearchParams(location.search).get('renderer') !== '2d') {
      this.loading3D = import('./SpaceScene3D.js').then(({ SpaceScene3D }) => {
        this.three = new SpaceScene3D(game);
      }).catch(error => { console.warn('Using Canvas 2D:', error.message); });
    }
  }

  get is3D() { return Boolean(this.three?.available); }

  load(path) {
    if (typeof Image === 'undefined') return null;
    const image = new Image();
    image.src = new URL(path, import.meta.url).href;
    return image;
  }

  ready(image) { return Boolean(image?.complete && image.naturalWidth); }

  background(ctx, time) {
    const g = this.game;
    ctx.fillStyle = '#030b1b';
    ctx.fillRect(0, 0, g.width, g.height);
    if (this.ready(this.backdrop)) {
      const scale = Math.max(g.width / this.backdrop.naturalWidth, g.height / this.backdrop.naturalHeight) * 1.06;
      const width = this.backdrop.naturalWidth * scale, height = this.backdrop.naturalHeight * scale;
      ctx.drawImage(this.backdrop, (g.width - width) / 2 + Math.sin((g.flightTime || 0) * .06) * g.width * .018, (g.height - height) / 2, width, height);
      ctx.fillStyle = 'rgba(2, 7, 20, .15)';
      ctx.fillRect(0, 0, g.width, g.height);
    }
    if (!this.is3D && g.effectsLevel !== 'low') {
      for (const star of this.flightStars.slice(0, g.effectsLevel === 'high' ? 240 : 120)) {
        const z = 0.1 + ((star.y + (g.flightTime || 0) * .16) % 1) * 2;
        const angle = star.x * Math.PI * 2;
        const radius = z * z * .42;
        const cx = g.width * .5, cy = g.height * .04;
        const x = cx + Math.cos(angle) * radius * g.width;
        const y = cy + Math.sin(angle) * radius * g.height;
        ctx.globalAlpha = star.alpha * Math.min(0.85, z * .55);
        ctx.strokeStyle = '#85cfff'; ctx.lineWidth = Math.max(.5, z * .65);
        ctx.beginPath(); ctx.moveTo(x, y);
        ctx.lineTo(x + (x - cx) * .055 * z, y + (y - cy) * .055 * z); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    if (this.ready(this.foreground)) {
      ctx.save();
      const height = Math.max(200, g.defenseY()) * 1.15;
      const side = 700 * height / 1086;
      ctx.globalAlpha=.85;
      ctx.drawImage(this.foreground,0,0,700,1086,-side*.55,0,side,height);
      ctx.drawImage(this.foreground,748,0,700,1086,g.width-side*.45,0,side,height);
      ctx.restore();
    }
    this.frame3D = Boolean(this.three?.render(ctx));
  }

  sprite(ctx, cellIndex, x, y, size) {
    if (!this.ready(this.sprites)) return false;
    const cell = this.sprites.naturalWidth / 2;
    ctx.save();
    // The atlas has an opaque black matte; additive screening removes its rectangle.
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(this.sprites, cellIndex * cell, 0, cell, this.sprites.naturalHeight, x - size / 2, y - size / 2, size, size);
    ctx.restore();
    return true;
  }

  meteor(ctx, target, meteor) {
    const { x, y, size } = meteor;
    if (drawAtlas(ctx,this.rockAtlas,ROCK_RECTS[Math.abs(target.id)%6],x,y,size*1.12)) return;
    ctx.save();
    ctx.fillStyle = '#090b10';
    ctx.beginPath(); ctx.arc(x, y, size * 0.46, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((target.rotation || 0) * .3);
    ctx.scale(1.06, .94);
    if (!this.sprite(ctx, 1, 0, 0, size * 1.09)) {
      ctx.strokeStyle = '#df7c32'; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.restore();
    if (target.labelLayout.inline) {
      const shade = ctx.createRadialGradient(x, y, size * 0.12, x, y, size * 0.4);
      shade.addColorStop(0, 'rgba(3,6,12,.64)'); shade.addColorStop(1, 'rgba(3,6,12,0)');
      ctx.fillStyle = shade;
      ctx.beginPath(); ctx.arc(x, y, size * 0.41, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  lock(ctx, meteor) {
    const { x, y, size } = meteor;
    const r = size * 0.53;
    ctx.save();
    ctx.strokeStyle = '#65eafa'; ctx.lineWidth = 1.6;
    ctx.shadowColor = '#36dafa'; ctx.shadowBlur = this.game.effectsLevel === 'low' ? 0 : 7;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 0.35; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y, r + 5, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    for (let index = 0; index < 4; index += 1) {
      const a = index * Math.PI / 2;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * (r - 5), y + Math.sin(a) * (r - 5));
      ctx.lineTo(x + Math.cos(a) * (r + 6), y + Math.sin(a) * (r + 6)); ctx.stroke();
    }
    const d = r * 0.83, arm = Math.min(13, size * 0.1);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      const px = x + sx * d, py = y + sy * d;
      ctx.beginPath(); ctx.moveTo(px - sx * arm, py); ctx.lineTo(px, py); ctx.lineTo(px, py - sy * arm); ctx.stroke();
    }
    ctx.restore();
  }

  target(ctx, target, active) {
    const g = this.game;
    measureTarget(g, target, ctx);
    const l = target.labelLayout, m = target.spaceMetrics;
    ctx.save();
    if (!this.frame3D) this.meteor(ctx, target, l.meteor);
    if (active) this.lock(ctx, l.meteor);
    if (!l.inline) {
      ctx.strokeStyle = active ? '#65eafa' : 'rgba(101,234,250,.5)';
      ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(l.meteor.x, l.meteor.y + l.meteor.size * .55);
      ctx.lineTo(l.meteor.x, l.y); ctx.stroke();
      ctx.fillStyle = 'rgba(3, 12, 29, .94)';
      ctx.beginPath(); ctx.roundRect(l.x, l.y, l.width, l.height, 16); ctx.fill(); ctx.stroke();
    }
    g.renderTargetCharacters(ctx, target);
    if (m.translationUnits.length) {
      if (l.inline) {
        ctx.fillStyle = 'rgba(3,12,29,.9)';
        ctx.beginPath(); ctx.roundRect(l.meteor.x - (m.translated.width + 24) / 2, l.translationY - 4,
          m.translated.width + 24, m.translationHeight, 8); ctx.fill();
      }
      ctx.font = `700 ${m.translationSize}px ${BODY_FONT}`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#cadceb';
      m.translationUnits.forEach((char, index) => {
        const p = m.translated.positions[index];
        ctx.fillText(char, l.meteor.x - m.translated.lines[p.line] / 2 + p.offset,
          l.translationY + (p.line + 0.5) * m.translationSize * 1.4);
      });
    }
    ctx.restore();
  }

  characters(ctx, target) {
    const g = this.game;
    const layout = measureTarget(g, target, ctx);
    const size = target.labelLayout.fontSize;
    const active = target.id === g.activeTargetId;
    ctx.save();
    ctx.font = `800 ${size}px ${FONT}`;
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    for (const ch of layout) {
      ctx.fillStyle = characterColor(target, ch.index, active);
      ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 4;
      ctx.fillText(ch.char, ch.x, ch.centerY);
      ctx.shadowBlur = 0;
      if (active && ch.index === target.confirmedProgress) {
        ctx.strokeStyle = CHARACTER_COLORS.next; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(ch.x, ch.centerY + size * .57);
        ctx.lineTo(ch.x + Math.max(ch.width, 8), ch.centerY + size * .57); ctx.stroke();
      }
      const pulse = target.characterStates[ch.index]?.hitPulse || 0;
      if (pulse > 0 && g.effectsLevel !== 'low') {
        ctx.save(); ctx.globalAlpha = pulse; ctx.strokeStyle = '#7defff'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(ch.centerX, ch.centerY, 3 + (1 - pulse) * 14, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      if (g.debugCharacterTargets) {
        ctx.strokeStyle = '#fd7599'; ctx.lineWidth = 1;
        ctx.strokeRect(ch.x, ch.y, ch.width, ch.height);
      }
    }
    ctx.restore();
  }

  ship(ctx) {
    if (this.frame3D) return;
    const g = this.game, p = g.shipPosition();
    const radius = g.shipRadius();
    const shield = clamp(g.stats.shield / 100, 0, 1);
    ctx.save();
    if (shield > 0) {
      const glow = ctx.createRadialGradient(p.x, p.y, radius * .2, p.x, p.y, radius);
      glow.addColorStop(0, 'rgba(24,129,213,.03)');
      glow.addColorStop(.82, `rgba(31,151,235,${.06 + shield * .1})`);
      glow.addColorStop(1, `rgba(65,204,255,${.18 + shield * .4})`);
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.fill();
    }
    if (!drawAtlas(ctx,this.effectAtlas,SHIP_RECT,p.x,p.y-radius*.24,radius*3.2,radius*3.2*SHIP_RECT[3]/SHIP_RECT[2])) this.sprite(ctx, 0, p.x, p.y + 0.8, radius * 1.75);
    if (shield > 0) {
      ctx.strokeStyle = `rgba(81,211,255,${.25 + shield * .65})`; ctx.lineWidth = 0.8;
      ctx.shadowColor = '#36b9ff'; ctx.shadowBlur = g.effectsLevel === 'low' ? 0 : 9;
      ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0; ctx.globalAlpha = .15 + shield * .12; ctx.lineWidth = .7;
      for (const factor of [-.5, .5]) {
        ctx.beginPath(); ctx.ellipse(p.x, p.y, radius * Math.sqrt(1 - factor * factor), radius * .2,
          factor, 0, Math.PI * 2); ctx.stroke();
      }
      if (g.damageFlash > 0) {
        ctx.globalAlpha = g.damageFlash; ctx.strokeStyle = '#ffbd86'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(p.x, p.y, radius + (1 - g.damageFlash) * 12, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.restore();
  }
}
