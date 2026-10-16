const NS = 'http://www.w3.org/2000/svg';

// Display regions of the supplied atlas without modifying its original pixels.
function artwork(file, rect, width = 1448, height = 1086) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', rect.join(' '));
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('neon-art');
  const image = document.createElementNS(NS, 'image');
  image.setAttribute('href', `./assets/game-neon/${file}.png`);
  image.setAttribute('width', width);
  image.setAttribute('height', height);
  svg.append(image);
  return svg;
}

export function installNeonGame() {
  const screen = document.querySelector('#game-screen');
  const brand = screen.querySelector('.hud-brand');
  brand.prepend(artwork('brand', [20, 115, 2110, 490], 2172, 724));
  const positions = [[270,100,240,245],[515,100,205,245],[715,100,240,245],[955,100,245,245],[1200,100,245,245]];
  screen.querySelectorAll('.hud-stats>div').forEach((item,index) => item.prepend(artwork('icons',positions[index])));
  const guide = screen.querySelector('#typing-guide-panel');
  screen.querySelector('.input-status').append(guide);
  const controls = {'pause-button':'Pause','hud-restart-button':'RotateCcw','hud-home-button':'House','hud-custom-button':'Pencil','hud-report-button':'TriangleAlert','game-sound-button':'Volume2','fullscreen-button':'Maximize'};
  for(const [id,name] of Object.entries(controls)) {
    const button = document.getElementById(id);
    const svg = window.lucide?.createElement(window.lucide.icons[name]);
    if(svg) { svg.classList.add('neon-control-icon'); button.append(svg); }
  }
  const sound = document.getElementById('game-sound-button');
  const updateSound = () => {
    const muted = sound.querySelector('span').textContent.includes('🔇');
    const svg = window.lucide?.createElement(window.lucide.icons[muted ? 'VolumeX' : 'Volume2']);
    if (svg) { svg.classList.add('neon-control-icon'); sound.querySelector('.neon-control-icon')?.replaceWith(svg); }
    sound.setAttribute('aria-pressed', String(!muted));
  };
  new MutationObserver(updateSound).observe(sound.querySelector('span'), { childList:true, characterData:true, subtree:true });
  updateSound();
}
