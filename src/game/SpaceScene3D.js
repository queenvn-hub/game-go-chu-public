import * as THREE from '../../assets/vendor/three/three.module.js';
import { clamp } from './text.js';
import { ART_SIZE, ROCK_RECTS, SHIP_RECT, BURST_RECT } from './GameArtwork.js';

const UP = new THREE.Vector3(0, 1, 0);
const hash = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

function rockGeometry(seed, detail = 3) {
  const geometry = new THREE.IcosahedronGeometry(1, detail);
  const positions = geometry.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < positions.count; i++) {
    v.fromBufferAttribute(positions, i).normalize();
    // Equal positions receive equal displacement, including duplicated triangle vertices.
    const ridge = Math.sin(v.x * 9 + seed) * Math.cos(v.y * 11 - seed) * Math.sin(v.z * 8 + 2);
    const fine = Math.sin(v.x * 23 + v.y * 16) * Math.cos(v.z * 21 + seed);
    const r = .88 + .09 * ridge + .012 * fine;
    positions.setXYZ(i, v.x * r * 1.08, v.y * r * .94, v.z * r);
  }
  const unique=[],indices=[],lookup=new Map();
  for(let i=0;i<positions.count;i++) {
    const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
    const key=`${Math.round(x*1e5)},${Math.round(y*1e5)},${Math.round(z*1e5)}`;
    if(!lookup.has(key)){lookup.set(key,unique.length/3);unique.push(x,y,z);}
    indices.push(lookup.get(key));
  }
  const smooth=new THREE.BufferGeometry();
  smooth.setAttribute('position',new THREE.Float32BufferAttribute(unique,3));smooth.setIndex(indices);smooth.computeVertexNormals();
  geometry.dispose();return smooth;
}

function rockMaterial(atlas, fragments=false) {
  const material = new THREE.MeshStandardMaterial({ color:0xa9a9a9, roughness:.94, metalness:.08, emissive:0xff5308 });
  material.flatShading=fragments;
  material.onBeforeCompile = shader => {
    shader.uniforms.stoneAtlas={value:atlas};
    shader.vertexShader = 'varying vec3 vStone;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvStone = position;');
    shader.fragmentShader = `varying vec3 vStone;
      uniform sampler2D stoneAtlas;
      vec3 stoneSample(vec2 p) {
        vec2 uv=vec2(.75, .5)+p*vec2(.13,.26);
        return pow(texture2D(stoneAtlas,uv).rgb,vec3(2.2));
      }
      float stoneHash(vec3 p) { return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453); }
      float stoneNoise(vec3 p) {
        vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(mix(stoneHash(i),stoneHash(i+vec3(1,0,0)),f.x),
          mix(stoneHash(i+vec3(0,1,0)),stoneHash(i+vec3(1,1,0)),f.x),f.y),
          mix(mix(stoneHash(i+vec3(0,0,1)),stoneHash(i+vec3(1,0,1)),f.x),
          mix(stoneHash(i+vec3(0,1,1)),stoneHash(i+vec3(1,1,1)),f.x),f.y),f.z);
      }
      float stoneFbm(vec3 p) { return .57*stoneNoise(p)+.28*stoneNoise(p*2.1)+.15*stoneNoise(p*4.3); }
    ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      float grain=stoneFbm(vStone*22.0);
      vec3 weights=pow(abs(normalize(vStone)),vec3(4.0)); weights/=weights.x+weights.y+weights.z;
      vec3 surface=stoneSample(vStone.yz)*weights.x+stoneSample(vStone.xz)*weights.y+stoneSample(vStone.xy)*weights.z;
      diffuseColor.rgb *= (.035+surface*1.8)*(.5+grain);
    `);
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      float vein=abs(stoneFbm(vStone*3.0)-.49);
      float cracks=(1.0-smoothstep(.001,.008,vein));
      float rim=pow(1.0-abs(dot(normalize(normal),normalize(vViewPosition))),3.0);
      totalEmissiveRadiance *= ${fragments?'cracks*.12+rim*.1':'cracks*(.7+rim*3.5)+rim*.65'};
    `);
  };
  material.customProgramCacheKey = () => `orbit-stone-v3-${fragments}`;
  return material;
}

function softParticleTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32,32,0,32,32,32);
  gradient.addColorStop(0,'#ffffff'); gradient.addColorStop(.18,'#ffffffcf');
  gradient.addColorStop(.5,'#ffffff55'); gradient.addColorStop(1,'#ffffff00');
  ctx.fillStyle=gradient; ctx.fillRect(0,0,64,64);
  return new THREE.CanvasTexture(canvas);
}

export class SpaceScene3D {
  constructor(game) {
    this.game=game;
    this.renderer=new THREE.WebGLRenderer({alpha:true, antialias:true, powerPreference:'high-performance'});
    this.renderer.setClearColor(0x000000,0);
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.2;
    this.scene=new THREE.Scene();
    this.camera=new THREE.PerspectiveCamera(45,1,.1,200);
    this.camera.position.z=24;
    this.camera.updateMatrixWorld();
    this.available=true;
    this.renderer.domElement.addEventListener('webglcontextlost', event => {event.preventDefault();this.available=false;});
    this.renderer.domElement.addEventListener('webglcontextrestored', () => {this.available=true;this.sizeKey='';});
    this.rocks=new Map(); this.bolts=new Map(); this.debris=new Map();
    this.rockShapes=Array.from({length:6},(_,i)=>rockGeometry(i+1,12));
    this.lowRockShapes=Array.from({length:6},(_,i)=>rockGeometry(i+1,5));
    this.fragmentShapes=Array.from({length:4},(_,i)=>rockGeometry(i+3,1));
    this.stoneAtlas=new THREE.TextureLoader().load(new URL('../../assets/space-sprites-v2.png',import.meta.url).href);
    this.stoneAtlas.colorSpace=THREE.SRGBColorSpace;
    this.rockMaterial=rockMaterial(this.stoneAtlas);
    this.fragmentMaterial=rockMaterial(this.stoneAtlas,true);
    this.particleTexture=softParticleTexture();
    this.boltGeometry=new THREE.CylinderGeometry(1,1,1,6);
    this.boltMaterials=[new THREE.MeshBasicMaterial({color:0x8eefff}),new THREE.MeshBasicMaterial({color:0xffed9a})];
    this.sphereGeometry=new THREE.IcosahedronGeometry(1,1);
    const hemisphere=new THREE.HemisphereLight(0xcdeeff,0x16101c,2.6);
    const sun=new THREE.DirectionalLight(0xffead2,4); sun.position.set(-9,12,14);
    const rim=new THREE.DirectionalLight(0x43acff,3); rim.position.set(10,-2,-8);
    this.scene.add(hemisphere,sun,rim);
    this.flashLight=new THREE.PointLight(0xff8b24,0,35,2); this.scene.add(this.flashLight);
    this.initStars(); this.initShip(); this.initArtwork();
  }

  atlasTexture(file, rect) {
    const texture=new THREE.TextureLoader().load(new URL(`../../assets/game-neon/${file}.png`,import.meta.url).href);
    texture.colorSpace=THREE.SRGBColorSpace;
    const [x,y,w,h]=rect;
    texture.repeat.set(w/ART_SIZE[0],h/ART_SIZE[1]);
    texture.offset.set(x/ART_SIZE[0],1-(y+h)/ART_SIZE[1]);
    texture.generateMipmaps=false;
    texture.minFilter=THREE.LinearFilter;
    (this.artTextures ||= []).push(texture);
    return texture;
  }

  initArtwork() {
    this.artRockMaterials=ROCK_RECTS.map(rect=>new THREE.SpriteMaterial({map:this.atlasTexture('meteors',rect),transparent:true,depthWrite:false,toneMapped:false}));
    this.ship.children.forEach(child=>{child.visible=false;});
    const ship=new THREE.Sprite(new THREE.SpriteMaterial({map:this.atlasTexture('effects',SHIP_RECT),transparent:true,depthWrite:false,toneMapped:false}));
    ship.scale.set(3.2,3.2*SHIP_RECT[3]/SHIP_RECT[2],1);
    ship.position.y=.24;
    this.ship.add(ship);
    this.burstTexture=this.atlasTexture('effects',BURST_RECT);
  }

  initStars() {
    const count=520, positions=new Float32Array(count*6), colors=new Float32Array(count*6);
    this.starSeeds=Array.from({length:count},(_,i)=>({x:(hash(i+1)-.5)*70,y:(hash(i+1001)-.5)*60,z:hash(i+2001)*80}));
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
    for(let i=0;i<count;i++) {
      const color=new THREE.Color(i%9===0?0xffdfb0:0x72beff);
      color.toArray(colors,i*6); color.clone().multiplyScalar(.15).toArray(colors,i*6+3);
    }
    geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
    this.stars=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending}));
    this.scene.add(this.stars);
  }

  initShip() {
    this.ship=new THREE.Group();
    const alloy=new THREE.MeshStandardMaterial({color:0x668698,metalness:.72,roughness:.34});
    const dark=new THREE.MeshStandardMaterial({color:0x10232e,metalness:.6,roughness:.35});
    const blue=new THREE.MeshStandardMaterial({color:0x087fb5,emissive:0x007bac,emissiveIntensity:.5,metalness:.65,roughness:.2});
    const glow=new THREE.MeshBasicMaterial({color:0x63e5ff});
    const hull = (points,depth,mat,z=0) => {
      const shape=new THREE.Shape(); points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y)); shape.closePath();
      const geo=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.025,bevelThickness:.025});
      const mesh=new THREE.Mesh(geo,mat); mesh.position.z=z; this.ship.add(mesh); return mesh;
    };
    hull([[0,.7],[-.24,.03],[-.27,-.56],[0,-.74],[.27,-.56],[.24,.03]],.22,alloy);
    for(const side of [-1,1]) {
      hull([[side*.14,.13],[side*1.22,-.49],[side*1.17,-.66],[side*.32,-.49]],.065,alloy,.04);
      hull([[side*.27,-.1],[side*1.13,-.51],[side*.96,-.49],[side*.24,-.22]],.02,blue,.13);
      const engine=new THREE.Mesh(new THREE.CylinderGeometry(.14,.18,.55,12),dark);
      engine.position.set(side*.48,-.45,.02); this.ship.add(engine);
      const nozzle=new THREE.Mesh(new THREE.CylinderGeometry(.11,.13,.065,12),glow);
      nozzle.position.set(side*.48,-.75,.02); this.ship.add(nozzle);
      const exhaust=new THREE.Sprite(new THREE.SpriteMaterial({map:this.particleTexture,color:0x17bfff,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending}));
      exhaust.scale.set(.6,.7,1);exhaust.position.set(side*.48,-.78,.08);this.ship.add(exhaust);
      const plume=new THREE.Mesh(new THREE.ConeGeometry(.11,.46,12),new THREE.MeshBasicMaterial({color:0x3ddaff,transparent:true,opacity:.65,depthWrite:false,blending:THREE.AdditiveBlending}));
      plume.rotation.z=Math.PI; plume.position.set(side*.48,-.99,.02); this.ship.add(plume);
      (this.plumes ||= []).push(plume);
      hull([[side*.7,-.31],[side*.68,-.66],[side*.82,-.61],[side*.86,-.41]],.055,dark,.15);
      hull([[side*.31,-.07],[side*.34,-.51],[side*.4,-.51],[side*.4,-.15]],.09,alloy,.18);
      for(let j=0;j<3;j++) {
        const vent=new THREE.Mesh(new THREE.BoxGeometry(.11,.035,.025),dark);
        vent.position.set(side*.35,-.25-j*.075,.31);this.ship.add(vent);
      }
    }
    const canopy=new THREE.Mesh(new THREE.SphereGeometry(1,16,10),new THREE.MeshStandardMaterial({color:0x0b7199,metalness:.8,roughness:.15,emissive:0x064266,emissiveIntensity:.6}));
    canopy.scale.set(.13,.28,.14); canopy.position.set(0,.04,.24); this.ship.add(canopy);
    hull([[0,.65],[-.035,.29],[.035,.29]],.025,glow,.24);
    this.shield=new THREE.Mesh(new THREE.SphereGeometry(1.25,24,16),new THREE.ShaderMaterial({
      transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
      uniforms:{strength:{value:1}},
      vertexShader:'varying vec3 n; varying vec3 eye; void main(){ vec4 p=modelViewMatrix*vec4(position,1.0); n=normalize(normalMatrix*normal); eye=-p.xyz; gl_Position=projectionMatrix*p; }',
      fragmentShader:'varying vec3 n; varying vec3 eye; uniform float strength; void main(){ float rim=pow(1.0-abs(dot(normalize(n),normalize(eye))),3.5); gl_FragColor=vec4(.09,.6,1.0,rim*.24*strength); }'
    }));
    this.ship.add(this.shield); this.scene.add(this.ship);
  }

  unitsPerPixel(z=0) {
    return 2*(this.camera.position.z-z)*Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2))/this.game.height;
  }

  fromScreen(x,y,z,out=new THREE.Vector3()) {
    const unit=this.unitsPerPixel(z);
    return out.set((x-this.game.width/2)*unit,(this.game.height/2-y)*unit,z);
  }

  syncRocks() {
    const live=new Set();
    for(const target of this.game.targets) {
      this.game.calculateCharacterLayout(target);
      const meteor=target.labelLayout.meteor;
      live.add(target.id);
      let mesh=this.rocks.get(target.id);
      if(!mesh) {
        mesh=new THREE.Sprite(this.artRockMaterials[Math.abs(target.id)%6]);
        this.rocks.set(target.id,mesh); this.scene.add(mesh);
      }
      const approach=clamp((meteor.size/target.spaceBaseMetrics.rockSize-.42)/.58,0,1);
      const z=-20+approach*20;
      this.fromScreen(meteor.x,meteor.y,z,mesh.position);
      const size=meteor.size*1.12*this.unitsPerPixel(z);
      mesh.scale.set(size,size,1);
    }
    for(const [id,mesh] of this.rocks) if(!live.has(id)){this.scene.remove(mesh);this.rocks.delete(id);}
  }

  syncBolts() {
    const live=new Set(), g=this.game;
    for(const p of g.projectiles) {
      if(p.delay>0||p.hasHit) continue;
      live.add(p.id);
      let bolt=this.bolts.get(p.id);
      if(!bolt){bolt=new THREE.Mesh(this.boltGeometry,this.boltMaterials[p.isFinal?1:0]);this.scene.add(bolt);this.bolts.set(p.id,bolt);}
      const target=g.targets.find(t=>t.id===p.targetId);
      const endpoint=target&&g.getCharacterTargetPoint(target,p.targetCharacterIndex);
      if(!endpoint){bolt.visible=false;continue;} bolt.visible=true;
      const tail=p.trail.at(-1)||{x:p.x,y:p.y+16};
      const dx=p.x-tail.x,dy=p.y-tail.y, length=Math.hypot(dx,dy)||1;
      const pxLength=Math.min(34,Math.max(10,length));
      const targetZ=this.rocks.get(p.targetId)?.position.z||0;
      const ship=g.shipPosition();
      const total=Math.hypot(endpoint.x-ship.x,endpoint.y-ship.y)||1;
      const progress=clamp(1-Math.hypot(endpoint.x-p.x,endpoint.y-p.y)/total,0,1);
      const z=2+(targetZ-2)*progress;
      const head=this.fromScreen(p.x,p.y,z);
      const end=this.fromScreen(p.x-dx/length*pxLength,p.y-dy/length*pxLength,z+.03);
      bolt.position.copy(head).lerp(end,.5);
      const direction=head.clone().sub(end);
      bolt.quaternion.setFromUnitVectors(UP,direction.clone().normalize());
      bolt.scale.set((p.isFinal?2:1.25)*this.unitsPerPixel(z),direction.length(),(p.isFinal?2:1.25)*this.unitsPerPixel(z));
    }
    for(const [id,mesh] of this.bolts) if(!live.has(id)){this.scene.remove(mesh);this.bolts.delete(id);}
  }

  syncParticles() {
    const live=new Set(this.game.particles);
    this.flashLight.intensity=0;
    for(const p of this.game.particles) {
      let mesh=this.debris.get(p);
      if(!mesh) {
        if(p.rock) mesh=new THREE.Mesh(this.fragmentShapes[this.debris.size%4],this.fragmentMaterial);
        else if(p.smoke||p.shock) mesh=new THREE.Sprite(new THREE.SpriteMaterial({map:p.shock?this.burstTexture:this.particleTexture,color:p.smoke?0x85959e:0xffffff,transparent:true,opacity:0,depthWrite:false,toneMapped:false,blending:p.smoke?THREE.NormalBlending:THREE.AdditiveBlending}));
        else mesh=new THREE.Mesh(this.sphereGeometry,new THREE.MeshBasicMaterial({color:p.color,transparent:true,depthWrite:false}));
        this.debris.set(p,mesh); this.scene.add(mesh);
      }
      const alpha=clamp(p.life/p.maxLife,0,1), z=((p.z||1)-1)*8;
      this.fromScreen(p.x,p.y,z,mesh.position);
      const unit=this.unitsPerPixel(z);
      if(p.rock) {
        const size=p.size*(p.z||1)*unit;
        mesh.scale.set(size,size*.6,size*.8);
        mesh.rotation.set(p.angle,p.angle*.7,p.angle*.43);
      } else if(p.smoke) {
        mesh.scale.setScalar(p.size*(2-alpha)*unit*3);
        mesh.material.opacity=Math.sin(alpha*Math.PI)*.32;
        mesh.material.rotation=p.angle||0;
      } else if(p.shock) {
        mesh.scale.setScalar(p.size*(1.1-alpha*.5)*unit);
        mesh.material.opacity=alpha*.75;
        this.flashLight.position.copy(mesh.position);this.flashLight.position.z+=2;
        this.flashLight.intensity=Math.max(this.flashLight.intensity,alpha*25);
      } else {
        mesh.scale.setScalar(Math.max(.4,p.size*alpha)*unit);
        mesh.material.opacity=alpha;
      }
    }
    for(const [p,mesh] of this.debris) if(!live.has(p)) {
      this.scene.remove(mesh); if(!p.rock)mesh.material.dispose();this.debris.delete(p);
    }
  }

  render(ctx) {
    if(!this.available) return false;
    const g=this.game;
    try {
      const dpr=Math.min(g.dpr,g.effectsLevel==='high'?1.5:g.effectsLevel==='low'?1:1.25);
      const sizeKey=`${g.width}|${g.height}|${dpr}`;
      if(sizeKey!==this.sizeKey) {
        this.renderer.setPixelRatio(dpr);this.renderer.setSize(g.width,g.height,false);
        this.camera.aspect=g.width/g.height;this.camera.updateProjectionMatrix();this.sizeKey=sizeKey;
      }
      const positions=this.stars.geometry.attributes.position;
      this.stars.geometry.setDrawRange(0,g.effectsLevel==='low'?160:g.effectsLevel==='high'?1040:640);
      const time=g.flightTime||0;
      for(let i=0;i<this.starSeeds.length;i++) {
        const star=this.starSeeds[i],z=-80+((star.z+time*5)%90);
        positions.setXYZ(i*2,star.x,star.y,z);
        positions.setXYZ(i*2+1,star.x,star.y,z-(g.effectsLevel==='low'?.06:.4));
      }
      positions.needsUpdate=true;
      this.syncRocks();this.syncBolts();this.syncParticles();
      const ship=g.shipPosition(); this.fromScreen(ship.x,ship.y,2,this.ship.position);
      this.ship.scale.setScalar(g.shipRadius()*this.unitsPerPixel(2));
      this.ship.rotation.y=Math.sin(time*.65)*.055;
      this.plumes.forEach((plume,i)=>{plume.scale.y=.9+Math.sin(time*13+i)*.1;});
      this.shield.material.uniforms.strength.value=clamp(g.stats.shield/100,0,1);
      this.renderer.render(this.scene,this.camera);
      ctx.drawImage(this.renderer.domElement,0,0,g.width,g.height);
      return true;
    } catch(error) {
      this.available=false;
      console.warn('3D display unavailable; continuing with Canvas 2D.',error.message);
      return false;
    }
  }

  dispose() {
    const geometries=new Set(),materials=new Set();
    this.scene.traverse(node=>{if(node.geometry)geometries.add(node.geometry);if(node.material)materials.add(node.material);});
    [...this.rockShapes,...this.lowRockShapes,...this.fragmentShapes,this.boltGeometry,this.sphereGeometry].forEach(geo=>geometries.add(geo));
    [this.rockMaterial,this.fragmentMaterial,...this.boltMaterials,...this.artRockMaterials].forEach(material=>materials.add(material));
    geometries.forEach(geo=>geo.dispose());materials.forEach(material=>material.dispose());
    this.artTextures.forEach(texture=>texture.dispose());
    this.particleTexture.dispose();this.stoneAtlas.dispose();this.renderer.dispose();this.available=false;
  }
}
