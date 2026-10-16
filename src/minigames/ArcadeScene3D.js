import * as T from '../../assets/vendor/three/three.module.js';

export const ROBOT_COLORS = [0xef5350, 0xff973d, 0xf3d34a, 0x48ba76, 0x39bfd3, 0x5379ed, 0xbb65d8];

export class ArcadeScene3D {
  constructor(stage, game) {
    this.game = game;
    this.renderer = new T.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.domElement.className = 'arcade-three-canvas';
    stage.prepend(this.renderer.domElement);
    this.scene = new T.Scene();
    this.scene.background = new T.Color(game === 'robot' ? '#adcfe0' : '#a6e4ef');
    this.scene.fog = new T.Fog(this.scene.background, 22, 65);
    this.camera = new T.PerspectiveCamera(50, 1, .1, 100);
    this.camera.position.set(game === 'robot' ? 0 : 10, game === 'robot' ? 4 : 7, 13);
    this.camera.lookAt(0, 1, game === 'robot' ? -12 : -3);
    if (game === 'courier') {
      this.camera = new T.OrthographicCamera(-12, 12, 8, -8, .1, 100);
      this.camera.position.set(3, 8, 18); this.camera.lookAt(3, 1, 0);
    }
    this.scene.add(new T.HemisphereLight(0xffffff, 0x476052, 2.4));
    const sun = new T.DirectionalLight(0xfff1cd, 3);
    sun.position.set(-8, 15, 7);
    this.scene.add(sun);
    this.targets = new Map();
    this.box(this.scene, [24, .4, 70], [0, -.3, -20], game === 'robot' ? 0x657d85 : 0xc87b61);
    for (let i = 0; i < 18; i++) {
      const z = -i * 4;
      for (const side of [-1, 1]) {
        this.box(this.scene, [3, 3 + i % 4, 3], [side * 10, 1, z], [0xe8ce97, 0x66a8ab, 0xdd9174][i % 3]);
        for (let row = 0; row < 3; row++) for (let col = 0; col < 2; col++) {
          this.box(this.scene, [.65, .55, .05], [side * 10 - .6 + col * 1.2, .6 + row, z + 1.52], 0x264958);
        }
        if (game === 'robot') this.box(this.scene, [.14, .03, 2], [side * 4, -.06, z], 0xffe49a);
      }
    }
    this.hero = game === 'robot' ? this.gun() : this.cat();
    this.scene.add(this.hero);
  }

  box(parent, size, position, color) {
    const mesh = new T.Mesh(new T.BoxGeometry(...size), new T.MeshStandardMaterial({ color, roughness: .65, metalness: .15 }));
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
  }

  sphere(parent, radius, position, color, scale = [1, 1, 1]) {
    const mesh = new T.Mesh(new T.SphereGeometry(radius, 20, 14), new T.MeshStandardMaterial({ color, roughness: .7 }));
    mesh.position.set(...position); mesh.scale.set(...scale); parent.add(mesh); return mesh;
  }

  gun() {
    const g = new T.Group();
    this.box(g, [1.4, .6, 1.6], [0, .2, 0], 0x253c46);
    this.box(g, [.55, .45, 2.8], [0, .65, -1], 0x415e69);
    this.box(g, [.2, .12, .6], [0, .95, -.6], 0x3af4d0);
    g.position.set(0, .3, 8); return g;
  }

  cat() {
    const g = new T.Group();
    this.sphere(g, .75, [0, 1, 0], 0xe4a35c, [1, 1.2, .7]);
    this.sphere(g, .7, [0, 2, 0], 0xffd09a);
    for (const side of [-1, 1]) {
      const ear = new T.Mesh(new T.ConeGeometry(.3, .6, 4), new T.MeshStandardMaterial({ color: 0xe4a35c }));
      ear.position.set(side * .45, 2.6, 0); g.add(ear);
      this.sphere(g, .12, [side * .25, 2.1, .61], 0x183944);
      this.sphere(g, .23, [side * .43, .25, .08], 0xffd09a);
    }
    this.sphere(g, .13, [0, 1.9, .7], 0xdc727f);
    this.box(g, [.7, .8, .35], [0, 1.1, -.7], 0x329fa6);
    this.sphere(g, .25, [-.7, .8, -.5], 0xe4a35c, [1, 2.5, 1]);
    g.position.set(-6, 0, 0); return g;
  }

  robot(variant) {
    const g = new T.Group();
    const color = ROBOT_COLORS[variant % ROBOT_COLORS.length];
    g.userData.variant = variant;
    g.userData.color = color;
    this.box(g, [1.4, 1.5, .8], [0, 1.7, 0], color);
    this.box(g, [1, .7, .8], [0, 2.8, 0], 0x334d5c);
    this.sphere(g, .2, [0, 2.8, .5], 0xff5a56);
    this.box(g, [.18, .35 + variant * .04, .18], [0, 3.3, 0], color);
    this.box(g, [.8, .14, .08], [0, 1.8, .45], 0xdafcff);
    g.scale.set(1 + (variant % 3) * .12, 1 + (variant % 2) * .1, 1);
    for (const side of [-1, 1]) {
      this.box(g, [.4, 1.2, .5], [side * .45, .5, 0], 0x334d5c);
      this.box(g, [.4, 1.3, .4], [side * .95, 1.7, 0], color);
    }
    return g;
  }

  label(parent) {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
    const texture = new T.CanvasTexture(canvas);
    const sprite = new T.Sprite(new T.SpriteMaterial({ map: texture, depthTest: false }));
    sprite.scale.set(3.5, .875, 1); sprite.position.y = 3.6; parent.add(sprite);
    return { canvas, texture, sprite };
  }

  draw(model, stage) {
    const w = stage.clientWidth, h = stage.clientHeight;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    if (this.game === 'courier') {
      this.camera.top = 12 * h / w; this.camera.bottom = -this.camera.top;
      this.camera.updateProjectionMatrix();
    }
    for (const [id, entry] of this.targets) if (!model.targets.some(t => t.id === id)) {
      this.scene.remove(entry.group); this.disposeObject(entry.group); this.targets.delete(id);
    }
    for (const target of model.targets) {
      let entry = this.targets.get(target.id);
      if (!entry) {
        const group = this.game === 'robot' ? this.robot(target.variant || 0) : new T.Group();
        if (this.game === 'courier') {
          this.box(group, [1.1, .9, 1.1], [0, .45, 0], 0xd3a36e);
          this.box(group, [1.13, .12, 1.13], [0, .7, 0], 0xffe2b0);
        }
        entry = { group, ...this.label(group) }; this.targets.set(target.id, entry); this.scene.add(group);
      }
      const g = entry.group;
      if (this.game === 'robot') g.position.set((target.x - .5) * 16, 0, 7 - (1 - target.y) * 42);
      else g.position.set((target.x - .15) * 20 - 6, 0, 0);
      if (this.game === 'robot') {
        // Fixed world size lets perspective grow the label with the approaching robot.
        entry.sprite.scale.set(4.8, 1.2, 1);
      }
      g.rotation.z = this.game === 'robot' ? Math.sin(model.elapsed * 7 + target.id) * .035 : 0;
      const key = `${target.word}:${model.lock === target.id ? model.value.length : 0}:${target.done}`;
      if (entry.key !== key) {
        entry.key = key;
        const c = entry.canvas.getContext('2d'); c.clearRect(0, 0, 512, 128);
        c.fillStyle = '#153344'; c.fillRect(0, 0, 512, 128);
        c.strokeStyle = model.lock === target.id ? '#72ffad' : '#ffffff'; c.lineWidth = 8; c.strokeRect(4, 4, 504, 120);
        c.font = 'bold 62px sans-serif'; c.textAlign = 'center'; c.fillStyle = target.done ? '#72ffad' : '#ffffff';
        c.fillText(target.word, 256, 86, 470);
        if (model.lock === target.id && model.value) {
          const fullWidth = c.measureText(target.word).width;
          const ratio = Math.min(1, 470 / fullWidth);
          const prefixWidth = c.measureText(target.word.slice(0, model.value.length)).width * ratio;
          c.save(); c.beginPath(); c.rect(256 - fullWidth * ratio / 2, 0, prefixWidth, 128); c.clip();
          c.fillStyle = '#72ffad'; c.fillText(target.word, 256, 86, 470); c.restore();
        }
        entry.texture.needsUpdate = true;
      }
    }
    if (this.game === 'courier') {
      this.hero.position.y = (model.player?.height || 0) * 6;
      this.hero.rotation.z = Math.sin(model.elapsed * 9) * .035;
    } else {
      const lock = model.targets.find(t => t.id === model.lock);
      this.hero.rotation.y = lock ? -(lock.x - .5) * .4 : 0;
    }
    if (this.effectGroup) { this.scene.remove(this.effectGroup); this.disposeObject(this.effectGroup); }
    this.effectGroup = new T.Group(); this.scene.add(this.effectGroup);
    for (const effect of model.effects) {
      if (this.game === 'robot') {
        const endpoint = new T.Vector3((effect.x - .5) * 16, 1.8, 7 - (1 - effect.y) * 42);
        if (!effect.hit) {
          const line = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0, 1, 6), endpoint]), new T.LineBasicMaterial({ color: 0x58f5ff }));
          this.effectGroup.add(line);
        }
        this.sphere(this.effectGroup, Math.max(.1, effect.life), endpoint.toArray(), effect.hit ? 0xff5656 : 0xffcc52);
      } else if (effect.type === 'reward') {
        this.box(this.effectGroup, [.8, .5, .08], [-6, 3 + (1 - effect.life) * 3, 0], 0xffe6a4);
      }
    }
    this.renderer.render(this.scene, this.camera);
  }

  disposeObject(object) {
    object.traverse(child => { child.geometry?.dispose(); const materials = Array.isArray(child.material) ? child.material : [child.material]; for (const m of materials) { m?.map?.dispose(); m?.dispose(); } });
  }

  destroy() { this.disposeObject(this.scene); this.renderer.dispose(); this.renderer.domElement.remove(); }
}
