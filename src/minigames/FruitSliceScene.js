const colors = ['#ff438a', '#ff644f', '#c75bdf', '#57d685', '#f7cf53', '#897159'];

function fruit(ctx, atlas, variant, x, y, size, half = 0) {
  ctx.save(); ctx.translate(x, y);
  if (half) { ctx.beginPath(); ctx.rect(half < 0 ? -size : 0, -size, size, size * 2); ctx.clip(); }
  // Oval texture masks keep atlas cell backgrounds outside the fruit silhouette.
  ctx.beginPath(); ctx.ellipse(0, 0, size * .43, size * .45, -.12, 0, Math.PI * 2); ctx.clip();
  if (atlas?.naturalWidth) {
    const sw = atlas.naturalWidth / 3, sh = atlas.naturalHeight / 2;
    ctx.drawImage(atlas, variant % 3 * sw + sw * .12, Math.floor(variant / 3) * sh + sh * .15,
      sw * .76, sh * .8, -size / 2, -size / 2, size, size);
  } else { ctx.fillStyle = colors[variant]; ctx.fillRect(-size, -size, size * 2, size * 2); }
  ctx.restore();
}

export function drawFruitScene(ctx, w, h, model, images, displayWidth = w) {
  ctx.fillStyle = '#123c3c'; ctx.fillRect(0, 0, w, h);
  const bg = images['fruit-background'];
  if (bg?.naturalWidth) ctx.drawImage(bg, 0, 0, w, h);
  const size = Math.min(w * .22, h * .23);
  for (const target of model.targets) {
    const x = target.x * w, y = target.y * h;
    fruit(ctx, images['fruit-sprites'], target.variant, x, y, size);
    const active = target.id === model.lock;
    const font = displayWidth < 650 ? 18 * w / displayWidth : 28;
    ctx.font = `800 ${font}px Nunito, sans-serif`;
    const width = Math.max(size * .6, ctx.measureText(target.word).width + 22);
    const top = y + size * .2;
    ctx.fillStyle = target.rotten ? '#40282a' : '#fff7e8';
    ctx.strokeStyle = active || target.done ? '#48f59a' : target.rotten ? '#fb7185' : '#eac36e';
    ctx.lineWidth = active ? 4 : 2;
    ctx.beginPath(); ctx.roundRect(x - width / 2, top, width, font + 14, 6); ctx.fill(); ctx.stroke();
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillStyle = target.done ? '#078844' : target.rotten ? '#ffc0bb' : '#34261b';
    ctx.fillText(target.word, x - width / 2 + 11, top + (font + 14) / 2);
    if (active && model.value) {
      ctx.save(); ctx.beginPath(); ctx.rect(x - width / 2, top, 11 + ctx.measureText(target.word.slice(0, model.value.length)).width, font + 14); ctx.clip();
      ctx.fillStyle = '#078844'; ctx.fillText(target.word, x - width / 2 + 11, top + (font + 14) / 2); ctx.restore();
    }
  }
  for (const e of model.effects) {
    const p = 1 - e.life / (e.type === 'slice' ? .8 : .6), x = e.x * w, y = e.y * h;
    ctx.save(); ctx.globalAlpha = 1 - p;
    if (e.type === 'slice') {
      for (const side of [-1, 1]) fruit(ctx, images['fruit-sprites'], e.variant, x + side * p * size * .75, y + p * p * 100, size, side);
      ctx.strokeStyle = '#d9fff3'; ctx.lineWidth = 7 * (1 - p);
      ctx.beginPath(); ctx.moveTo(x - size * .6, y + size * .3); ctx.quadraticCurveTo(x, y - size * .4, x + size * .65, y - size * .25); ctx.stroke();
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6;
        ctx.fillStyle = colors[e.variant]; ctx.beginPath();
        ctx.arc(x + Math.cos(a) * p * size, y + Math.sin(a) * p * size + p * p * 60, 3 + i % 3, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.font = '900 32px Nunito, sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = e.type === 'miss' || e.rotten ? '#ff9d9d' : '#fff078';
    ctx.strokeStyle = '#273734'; ctx.lineWidth = 4;
    const text = e.type === 'miss' ? '-1' : `${e.points > 0 ? '+' : ''}${e.points}`;
    ctx.strokeText(text, x, y - 30 - p * 60); ctx.fillText(text, x, y - 30 - p * 60);
    ctx.restore();
  }
}
