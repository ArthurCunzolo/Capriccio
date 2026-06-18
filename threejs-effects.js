// ============================================================
// CAPRICCIO — Three.js Global Interactive Scene
// Canvas fixo, reativo ao scroll + mouse, com bloom e shaders
// Inspirado na estética imersiva de sites como igloo.inc
// ============================================================

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.163.0/build/three.module.js';
import { EffectComposer }  from 'https://cdn.jsdelivr.net/npm/three@0.163.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass }      from 'https://cdn.jsdelivr.net/npm/three@0.163.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.163.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass }      from 'https://cdn.jsdelivr.net/npm/three@0.163.0/examples/jsm/postprocessing/ShaderPass.js';

// ─── Cores da paleta Capriccio ───────────────────────────────
const GOLD       = new THREE.Color(0xC5973B);
const GOLD_PALE  = new THREE.Color(0xE8D5A3);
const BROWN_DARK = new THREE.Color(0x1a0d07);
const CREAM      = new THREE.Color(0xFFF8EC);

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // Sem animações — só um canvas transparente
  const cvs = document.createElement('canvas');
  cvs.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;';
  document.body.prepend(cvs);
  return;
}

// ─── Seções e suas "cenas" mapeadas ──────────────────────────
// Cada seção define cor de fundo, intensidade do bloom, posição
// da câmera e comportamento das partículas
const SECTION_MAP = [
  { id: 'inicio',   camZ: 6,   bloomStr: 0.9,  particleColor: GOLD,      bgAlpha: 0.0 },
  { id: 'sobre',    camZ: 7,   bloomStr: 0.5,  particleColor: GOLD_PALE, bgAlpha: 0.6 },
  { id: 'servicos', camZ: 5,   bloomStr: 1.4,  particleColor: GOLD,      bgAlpha: 0.0 },
  { id: 'galeria',  camZ: 8,   bloomStr: 0.4,  particleColor: CREAM,     bgAlpha: 0.7 },
  { id: 'equipe',   camZ: 7.5, bloomStr: 0.3,  particleColor: GOLD_PALE, bgAlpha: 0.7 },
  { id: 'contato',  camZ: 5.5, bloomStr: 1.1,  particleColor: GOLD,      bgAlpha: 0.0 },
];

// ============================================================
class CapriccioScene {
  constructor() {
    this.isMobile  = window.innerWidth < 768;
    this.mouse     = new THREE.Vector2(0, 0);
    this.smoothMouse = new THREE.Vector2(0, 0);
    this.raycaster = new THREE.Raycaster();
    this.clock     = new THREE.Clock();
    this.scrollY   = 0;
    this.targetScrollY = 0;
    this.currentSection = 0;
    this.targetSection  = 0;
    this.sectionProgress = 0; // 0→1 lerp between sections

    // Estado animado (lerp-able)
    this.state = {
      camZ:      6,
      bloomStr:  0.9,
      colorR:    GOLD.r,
      colorG:    GOLD.g,
      colorB:    GOLD.b,
    };

    this.init();
  }

  // ─── Setup ─────────────────────────────────────────────────
  init() {
    this.createCanvas();
    this.createRenderer();
    this.createScene();
    this.createCamera();
    this.createLights();
    this.createParticleField();
    this.createNoiseSphere();
    this.createFloatingRings();
    this.createPostProcessing();
    this.bindEvents();
    this.detectSections();
    this.animate();
  }

  createCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      z-index: 0;
      pointer-events: none;
    `;
    document.body.prepend(this.canvas);
  }

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !this.isMobile,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.setClearColor(0x000000, 0); // transparent
  }

  createScene() {
    this.scene = new THREE.Scene();
  }

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      60, window.innerWidth / window.innerHeight, 0.1, 200
    );
    this.camera.position.set(0, 0, 6);
  }

  createLights() {
    this.ambientLight = new THREE.AmbientLight(0xC5973B, 0.4);
    this.scene.add(this.ambientLight);

    this.pointLight = new THREE.PointLight(0xE8D5A3, 3, 30);
    this.pointLight.position.set(3, 3, 4);
    this.scene.add(this.pointLight);

    this.rimLight = new THREE.PointLight(0xC5973B, 2, 25);
    this.rimLight.position.set(-4, -2, 2);
    this.scene.add(this.rimLight);
  }

  // ─── Partículas ────────────────────────────────────────────
  createParticleField() {
    const count = this.isMobile ? 800 : 2500;
    const pos   = new Float32Array(count * 3);
    const col   = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phase = new Float32Array(count);
    const speed = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Distribuição esférica + um pouco achatada
      const r     = 3 + Math.random() * 18;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);

      pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta) * 0.55;
      pos[i*3+2] = r * Math.cos(phi) - 3;

      const t = Math.random();
      const c = GOLD.clone().lerp(GOLD_PALE, t);
      col[i*3]   = c.r;
      col[i*3+1] = c.g;
      col[i*3+2] = c.b;

      sizes[i] = Math.random() * 2.4 + 0.3;
      phase[i] = Math.random() * Math.PI * 2;
      speed[i] = Math.random() * 0.5 + 0.1;
    }

    this._pCount   = count;
    this._pBasePos = pos.slice();
    this._pPhase   = phase;
    this._pSpeed   = speed;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
    geo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));
    this._pGeo = geo;
    this._pCol = col;

    const mat = new THREE.PointsMaterial({
      size: 0.055,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  // ─── Esfera com shader de noise ────────────────────────────
  createNoiseSphere() {
    const geo = new THREE.IcosahedronGeometry(1.6, this.isMobile ? 24 : 64);

    this.sphereMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:    { value: 0 },
        uMouse:   { value: new THREE.Vector2(0, 0) },
        uColor1:  { value: GOLD.clone() },
        uColor2:  { value: GOLD_PALE.clone() },
        uNoise:   { value: 0.28 },
        uAlpha:   { value: 0.55 },
      },
      vertexShader: `
        uniform float uTime;
        uniform vec2  uMouse;
        uniform float uNoise;
        varying vec2  vUv;
        varying vec3  vNormal;
        varying vec3  vPos;

        // 3D Simplex-like noise (compact)
        vec3 mod289v3(vec3 x){return x-floor(x*(1./289.))*289.;}
        vec4 mod289v4(vec4 x){return x-floor(x*(1./289.))*289.;}
        vec4 permute4(vec4 x){return mod289v4(((x*34.)+1.)*x);}
        vec4 taylorInvSqrt4(vec4 r){return 1.79284291400159-0.85373472095314*r;}
        float snoise3(vec3 v){
          const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
          vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
          vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;
          vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
          vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
          i=mod289v3(i);
          vec4 p=permute4(permute4(permute4(i.z+vec4(0.,i1.z,i2.z,1.))
            +i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
          float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
          vec4 j=p-49.*floor(p*ns.z*ns.z);
          vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
          vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;
          vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
          vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;
          vec4 sh=-step(h,vec4(0.));
          vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
          vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);
          vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
          vec4 norm=taylorInvSqrt4(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
          p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
          vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
          m=m*m;return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
        }

        void main(){
          vUv     = uv;
          vNormal = normalize(normalMatrix * normal);
          float n = snoise3(position * 1.2 + uTime * 0.18);
          float n2= snoise3(position * 2.4 - uTime * 0.12 + 10.0);
          float d = uNoise * (n * 0.65 + n2 * 0.35);
          // Mouse influence: tilt a onda perto do cursor
          float mx = uMouse.x * 0.18;
          float my = uMouse.y * 0.18;
          vec3 displaced = position + normal * d + vec3(mx, my, 0.0) * 0.5;
          vPos = displaced;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3  uColor1;
        uniform vec3  uColor2;
        uniform float uAlpha;
        varying vec2  vUv;
        varying vec3  vNormal;
        varying vec3  vPos;

        void main(){
          // Fresnel glow
          vec3 viewDir = normalize(cameraPosition - vPos);
          float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.8);

          // Gradiente temporal
          float t = sin(uTime * 0.4 + vUv.y * 3.14) * 0.5 + 0.5;
          vec3  color = mix(uColor1, uColor2, t);

          // Brilho nas bordas
          color += fresnel * uColor2 * 0.7;

          // Alpha: borda brilhante, centro mais transparente
          float alpha = uAlpha * (0.35 + fresnel * 0.65);

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.sphere = new THREE.Mesh(geo, this.sphereMat);
    this.sphere.position.set(0, 0, -1);
    this.scene.add(this.sphere);
  }

  // ─── Anéis ornamentais ──────────────────────────────────────
  createFloatingRings() {
    this.rings = [];
    const configs = [
      { r: 2.5, tube: 0.007, segs: 160, speed:  0.10, tiltX: 0.5,  tiltZ: 0.2  },
      { r: 3.4, tube: 0.005, segs: 160, speed: -0.07, tiltX: -0.3, tiltZ: 0.8  },
      { r: 4.4, tube: 0.004, segs: 200, speed:  0.05, tiltX: 1.1,  tiltZ: -0.4 },
    ];
    configs.forEach(cfg => {
      const geo = new THREE.TorusGeometry(cfg.r, cfg.tube, 4, cfg.segs);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xC5973B,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.rotation.x = cfg.tiltX;
      ring.rotation.z = cfg.tiltZ;
      ring.userData.speed = cfg.speed;
      ring.userData.baseTiltX = cfg.tiltX;
      this.scene.add(ring);
      this.rings.push(ring);
    });
  }

  // ─── Post-processing: Bloom + Vignette ──────────────────────
  createPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.9,   // strength
      0.55,  // radius
      0.20   // threshold
    );
    this.composer.addPass(this.bloomPass);

    // Vignette GLSL pass
    const vignetteShader = {
      uniforms: {
        tDiffuse:  { value: null },
        uOffset:   { value: 0.85 },
        uDarkness: { value: 1.3 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uOffset;
        uniform float uDarkness;
        varying vec2 vUv;
        void main(){
          vec4 color = texture2D(tDiffuse, vUv);
          vec2 uv = (vUv - vec2(0.5)) * vec2(uOffset);
          gl_FragColor = vec4(mix(color.rgb, vec3(0.0), dot(uv,uv) * uDarkness), color.a);
        }
      `,
    };
    const vigPass = new ShaderPass(vignetteShader);
    this.composer.addPass(vigPass);
  }

  // ─── Detecta seções e observa scroll ───────────────────────
  detectSections() {
    this._sectionEls = SECTION_MAP.map(s => document.getElementById(s.id)).filter(Boolean);

    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = this._sectionEls.indexOf(entry.target);
          if (idx !== -1) this.targetSection = idx;
        }
      });
    }, { threshold: 0.35 });

    this._sectionEls.forEach(el => obs.observe(el));
  }

  // ─── Eventos ───────────────────────────────────────────────
  bindEvents() {
    window.addEventListener('mousemove', e => {
      this.mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // Touch paralaxe
    window.addEventListener('touchmove', e => {
      const t = e.touches[0];
      this.mouse.x =  (t.clientX / window.innerWidth)  * 2 - 1;
      this.mouse.y = -(t.clientY / window.innerHeight) * 2 + 1;
    }, { passive: true });

    window.addEventListener('resize', () => {
      const w = window.innerWidth, h = window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.composer.setSize(w, h);
      this.bloomPass.resolution.set(w, h);
    });
  }

  // ─── Lerp state entre seções ───────────────────────────────
  lerpToSection(delta) {
    const speed = 1.8 * delta;
    const target = SECTION_MAP[Math.min(this.targetSection, SECTION_MAP.length - 1)];

    this.state.camZ     += (target.camZ    - this.state.camZ)     * speed;
    this.state.bloomStr += (target.bloomStr - this.state.bloomStr) * speed;
    this.state.colorR   += (target.particleColor.r - this.state.colorR) * speed * 0.6;
    this.state.colorG   += (target.particleColor.g - this.state.colorG) * speed * 0.6;
    this.state.colorB   += (target.particleColor.b - this.state.colorB) * speed * 0.6;
  }

  // ─── Loop de animação ──────────────────────────────────────
  animate() {
    requestAnimationFrame(() => this.animate());
    const delta   = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // Mouse suave
    this.smoothMouse.lerp(this.mouse, 0.045);

    // Transição de seção
    this.lerpToSection(delta);

    // Câmera: paralaxe + transição de Z
    this.camera.position.x += (this.smoothMouse.x * 1.8 - this.camera.position.x) * 0.05;
    this.camera.position.y += (this.smoothMouse.y * 1.0 - this.camera.position.y) * 0.05;
    this.camera.position.z += (this.state.camZ - this.camera.position.z) * 0.04;
    this.camera.lookAt(0, 0, 0);

    // Bloom dinâmico
    this.bloomPass.strength = this.state.bloomStr;

    // Cores das partículas
    const pCol = this._pGeo.attributes.color;
    const N    = this._pCount;
    const r = this.state.colorR, g = this.state.colorG, b = this.state.colorB;
    for (let i = 0; i < N; i++) {
      pCol.setXYZ(i, r * (0.7 + Math.random() * 0.3), g * (0.7 + Math.random() * 0.3), b * (0.7 + Math.random() * 0.3));
    }
    pCol.needsUpdate = true;

    // Posição flutuante das partículas
    if (!this.isMobile) {
      const pos  = this._pGeo.attributes.position;
      const base = this._pBasePos;
      for (let i = 0; i < N; i++) {
        const ph = this._pPhase[i];
        const sp = this._pSpeed[i];
        pos.setXYZ(
          i,
          base[i*3]   + Math.sin(elapsed * sp + ph) * 0.14,
          base[i*3+1] + Math.cos(elapsed * sp * 0.7 + ph) * 0.18,
          base[i*3+2] + Math.sin(elapsed * sp * 0.5 + ph * 1.3) * 0.09
        );
      }
      pos.needsUpdate = true;
    }

    // Rotação das partículas
    this.particles.rotation.y  = elapsed * 0.016;
    this.particles.rotation.x += Math.sin(elapsed * 0.03) * 0.0002;

    // Esfera com shader noise
    this.sphereMat.uniforms.uTime.value  = elapsed;
    this.sphereMat.uniforms.uMouse.value.set(this.smoothMouse.x, this.smoothMouse.y);
    this.sphereMat.uniforms.uColor1.value.setRGB(r, g, b);

    // Rotação suave da esfera em resposta ao mouse
    this.sphere.rotation.y += (this.smoothMouse.x * 0.4 - this.sphere.rotation.y) * 0.02;
    this.sphere.rotation.x += (-this.smoothMouse.y * 0.25 - this.sphere.rotation.x) * 0.02;
    this.sphere.rotation.z  = elapsed * 0.04;

    // Pulso de escala da esfera
    const pulse = 1 + Math.sin(elapsed * 0.9) * 0.04;
    this.sphere.scale.setScalar(pulse);

    // Luz ponto orbita ao redor do centro
    this.pointLight.position.x = Math.cos(elapsed * 0.4) * 5;
    this.pointLight.position.y = Math.sin(elapsed * 0.3) * 3;
    this.rimLight.position.x   = Math.cos(elapsed * 0.3 + Math.PI) * 4;
    this.rimLight.position.y   = Math.sin(elapsed * 0.5 + Math.PI) * 3;

    // Anéis: rotação + tilt com mouse
    this.rings.forEach((ring, i) => {
      ring.rotation.y += ring.userData.speed * 0.007;
      ring.rotation.z += ring.userData.speed * 0.004;
      ring.rotation.x = ring.userData.baseTiltX + this.smoothMouse.y * 0.12;
    });

    this.composer.render();
  }
}

// ─── Inicializa após DOM pronto ───────────────────────────────
function boot() {
  // Espera loading sair antes de iniciar Three.js
  const loadScreen = document.getElementById('loading-screen');
  if (loadScreen) {
    const observer = new MutationObserver(() => {
      if (loadScreen.classList.contains('done') || !loadScreen.parentNode) {
        observer.disconnect();
        new CapriccioScene();
      }
    });
    observer.observe(loadScreen, { attributes: true, childList: true });
    // Safety net
    setTimeout(() => new CapriccioScene(), 4000);
  } else {
    new CapriccioScene();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
