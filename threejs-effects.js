// ===== CAPRICCIO - Three.js 3D Effects =====
// Efeitos 3D elegantes para o site Capriccio
// Paleta: marrom escuro (#2C1810) + dourado (#C5973B) + creme (#FFF8EC)

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.163.0/build/three.module.js';

// ─────────────────────────────────────────────
// 1. HERO CANVAS — Partículas douradas flutuantes
// ─────────────────────────────────────────────
class HeroParticles {
  constructor() {
    this.container = document.getElementById('hero-canvas');
    if (!this.container) return;

    this.isMobile = window.innerWidth < 768;
    this.mouse = new THREE.Vector2(0, 0);
    this.smoothMouse = new THREE.Vector2(0, 0);
    this.clock = new THREE.Clock();

    this.initRenderer();
    this.initScene();
    this.initCamera();
    this.createParticles();
    this.createOrnamentalRings();
    this.initEvents();
    this.animate();
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);
  }

  initScene() {
    this.scene = new THREE.Scene();
    // Nevoeiro suave para profundidade
    this.scene.fog = new THREE.FogExp2(0x000000, 0.025);
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    this.camera.position.set(0, 0, 8);
  }

  createParticles() {
    const count = this.isMobile ? 600 : 1800;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const speeds = new Float32Array(count);
    const phases = new Float32Array(count);

    const gold = new THREE.Color(0xC5973B);
    const goldPale = new THREE.Color(0xE8D5A3);
    const cream = new THREE.Color(0xFFF8EC);

    for (let i = 0; i < count; i++) {
      // Distribuição em esfera achatada
      const r = 3 + Math.random() * 14;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      positions[i * 3 + 2] = r * Math.cos(phi) - 4;

      // Cor: gradiente dourado → creme
      const t = Math.random();
      const col = t < 0.5
        ? gold.clone().lerp(goldPale, t * 2)
        : goldPale.clone().lerp(cream, (t - 0.5) * 2);

      colors[i * 3]     = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      sizes[i]  = Math.random() * 1.8 + 0.4;
      speeds[i] = Math.random() * 0.4 + 0.1;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

    this._particleBasePos = positions.slice();
    this._particleSpeeds  = speeds;
    this._particlePhases  = phases;
    this._particleCount   = count;
    this._particleGeo     = geo;

    const mat = new THREE.PointsMaterial({
      size: 0.06,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  createOrnamentalRings() {
    // Dois anéis decorativos girando lentamente — remetem a ornamentos de confeitaria
    this.rings = [];

    const ringData = [
      { r: 3.5, tube: 0.008, segs: 128, color: 0xC5973B, opacity: 0.25, speed: 0.08, tilt: 0.4 },
      { r: 5.2, tube: 0.005, segs: 128, color: 0xE8D5A3, opacity: 0.15, speed: -0.05, tilt: -0.6 },
    ];

    ringData.forEach(d => {
      const geo = new THREE.TorusGeometry(d.r, d.tube, 4, d.segs);
      const mat = new THREE.MeshBasicMaterial({
        color: d.color,
        transparent: true,
        opacity: d.opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.rotation.x = d.tilt;
      ring.userData.speed = d.speed;
      this.scene.add(ring);
      this.rings.push(ring);
    });
  }

  initEvents() {
    window.addEventListener('mousemove', e => {
      this.mouse.x = (e.clientX / window.innerWidth)  * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const elapsed = this.clock.getElapsedTime();

    // Suaviza movimento do mouse
    this.smoothMouse.lerp(this.mouse, 0.03);

    // Paralaxe da câmera
    this.camera.position.x += (this.smoothMouse.x * 1.5 - this.camera.position.x) * 0.04;
    this.camera.position.y += (this.smoothMouse.y * 0.8 - this.camera.position.y) * 0.04;
    this.camera.lookAt(this.scene.position);

    // Anima partículas — flutuação suave
    if (!this.isMobile) {
      const pos = this._particleGeo.attributes.position;
      const base = this._particleBasePos;
      const N = this._particleCount;

      for (let i = 0; i < N; i++) {
        const bx = base[i * 3];
        const by = base[i * 3 + 1];
        const bz = base[i * 3 + 2];
        const ph = this._particlePhases[i];
        const sp = this._particleSpeeds[i];

        pos.setXYZ(
          i,
          bx + Math.sin(elapsed * sp + ph) * 0.12,
          by + Math.cos(elapsed * sp * 0.7 + ph) * 0.15,
          bz + Math.sin(elapsed * sp * 0.5 + ph * 1.3) * 0.08
        );
      }
      pos.needsUpdate = true;
    }

    // Rotação suave das partículas
    this.particles.rotation.y = elapsed * 0.018;
    this.particles.rotation.x = Math.sin(elapsed * 0.04) * 0.06;

    // Anéis ornamentais
    this.rings.forEach(ring => {
      ring.rotation.y += ring.userData.speed * 0.005;
      ring.rotation.z += ring.userData.speed * 0.003;
    });

    this.renderer.render(this.scene, this.camera);
  }
}

// ─────────────────────────────────────────────
// 2. STATS SECTION — Partículas douradas reativas
// ─────────────────────────────────────────────
class StatsParticles {
  constructor() {
    this.container = document.getElementById('stats-canvas');
    if (!this.container) return;

    this.clock = new THREE.Clock();
    this.mouse = new THREE.Vector2(0, 0);

    this.initRenderer();
    this.initScene();
    this.initCamera();
    this.createParticles();
    this.initEvents();
    this.animate();
  }

  initRenderer() {
    const w = this.container.offsetWidth;
    const h = this.container.offsetHeight || 200;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);
    this._w = w;
    this._h = h;
  }

  initScene() {
    this.scene = new THREE.Scene();
  }

  initCamera() {
    this._w = this.container.offsetWidth;
    this._h = this.container.offsetHeight || 200;
    this.camera = new THREE.PerspectiveCamera(60, this._w / this._h, 0.1, 100);
    this.camera.position.z = 5;
  }

  createParticles() {
    const count = 400;
    const positions = new Float32Array(count * 3);
    const basePos   = new Float32Array(count * 3);
    const colors    = new Float32Array(count * 3);

    const gold = new THREE.Color(0xC5973B);

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 18;
      const y = (Math.random() - 0.5) * 4;
      const z = (Math.random() - 0.5) * 4;

      positions[i*3]=basePos[i*3]=x;
      positions[i*3+1]=basePos[i*3+1]=y;
      positions[i*3+2]=basePos[i*3+2]=z;

      const t = Math.random();
      colors[i*3]   = gold.r * (0.7 + t * 0.3);
      colors[i*3+1] = gold.g * (0.7 + t * 0.3);
      colors[i*3+2] = gold.b * (0.7 + t * 0.3);
    }

    this._base = basePos;
    this._count = count;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
    this._geo = geo;

    const mat = new THREE.PointsMaterial({
      size: 0.07,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.points = new THREE.Points(geo, mat);
    this.scene.add(this.points);
  }

  initEvents() {
    this.container.addEventListener('mousemove', e => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    });

    window.addEventListener('resize', () => {
      const w = this.container.offsetWidth;
      const h = this.container.offsetHeight || 200;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const elapsed = this.clock.getElapsedTime();

    const pos = this._geo.attributes.position;
    const base = this._base;

    for (let i = 0; i < this._count; i++) {
      const bx = base[i*3];
      const by = base[i*3+1];

      // Repulsão suave do mouse
      const mx = this.mouse.x * 9;
      const my = this.mouse.y * 2;
      const dx = mx - bx;
      const dy = my - by;
      const dist = Math.sqrt(dx*dx + dy*dy) + 0.01;
      const repulse = Math.max(0, 2 - dist) * 0.2;

      pos.setX(i, bx - (dx / dist) * repulse + Math.sin(elapsed + i * 0.5) * 0.05);
      pos.setY(i, by - (dy / dist) * repulse + Math.cos(elapsed * 0.7 + i) * 0.04);
    }
    pos.needsUpdate = true;

    this.points.rotation.y = elapsed * 0.01;

    this.renderer.render(this.scene, this.camera);
  }
}

// ─────────────────────────────────────────────
// 3. SERVICES SECTION — Geometrias flutuantes
// ─────────────────────────────────────────────
class ServicesBackground {
  constructor() {
    this.container = document.getElementById('services-canvas');
    if (!this.container) return;

    this.clock = new THREE.Clock();
    this.mouse = new THREE.Vector2(0, 0);
    this.smoothMouse = new THREE.Vector2(0, 0);

    this.initRenderer();
    this.initScene();
    this.initCamera();
    this.createShapes();
    this.initEvents();
    this.animate();
  }

  initRenderer() {
    const w = this.container.offsetWidth;
    const h = this.container.offsetHeight || 600;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);
  }

  initScene() {
    this.scene = new THREE.Scene();
  }

  initCamera() {
    const w = this.container.offsetWidth;
    const h = this.container.offsetHeight || 600;
    this.camera = new THREE.PerspectiveCamera(65, w / h, 0.1, 100);
    this.camera.position.z = 7;
  }

  createShapes() {
    this.shapes = [];

    const geos = [
      new THREE.OctahedronGeometry(0.3),
      new THREE.IcosahedronGeometry(0.25),
      new THREE.TetrahedronGeometry(0.28),
      new THREE.TorusGeometry(0.22, 0.05, 8, 24),
      new THREE.TorusKnotGeometry(0.18, 0.05, 64, 8),
    ];

    // Luz ambiente dourada
    const ambLight = new THREE.AmbientLight(0xC5973B, 0.5);
    this.scene.add(ambLight);
    const ptLight = new THREE.PointLight(0xE8D5A3, 2, 20);
    ptLight.position.set(3, 3, 4);
    this.scene.add(ptLight);

    for (let i = 0; i < 18; i++) {
      const geo = geos[Math.floor(Math.random() * geos.length)];
      const t = Math.random();
      const color = new THREE.Color().setHSL(0.1 + t * 0.04, 0.7, 0.45 + t * 0.3);

      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.2,
        metalness: 0.85,
        transparent: true,
        opacity: 0.35 + Math.random() * 0.3,
        wireframe: Math.random() < 0.35
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 18,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 6 - 2
      );
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        0
      );
      mesh.userData = {
        floatSpeed:  0.3 + Math.random() * 0.5,
        rotSpeedX:   (Math.random() - 0.5) * 0.6,
        rotSpeedY:   (Math.random() - 0.5) * 0.8,
        floatPhase:  Math.random() * Math.PI * 2,
        baseY:       mesh.position.y,
        depth:       0.2 + Math.random() * 0.8
      };

      this.scene.add(mesh);
      this.shapes.push(mesh);
    }
  }

  initEvents() {
    window.addEventListener('mousemove', e => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('resize', () => {
      const w = this.container.offsetWidth;
      const h = this.container.offsetHeight || 600;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const elapsed = this.clock.getElapsedTime();

    this.smoothMouse.lerp(this.mouse, 0.04);

    this.shapes.forEach(shape => {
      const d = shape.userData;
      shape.position.y = d.baseY + Math.sin(elapsed * d.floatSpeed + d.floatPhase) * 0.4;
      shape.rotation.x += 0.005 * d.rotSpeedX;
      shape.rotation.y += 0.005 * d.rotSpeedY;
      // Paralaxe por profundidade
      shape.position.x += (this.smoothMouse.x * d.depth * 0.5 - shape.position.x * 0.001) * 0.015;
    });

    this.renderer.render(this.scene, this.camera);
  }
}

// ─────────────────────────────────────────────
// 4. CONTACT SECTION — Onda suave
// ─────────────────────────────────────────────
class ContactWave {
  constructor() {
    this.container = document.getElementById('contact-canvas');
    if (!this.container) return;

    this.clock = new THREE.Clock();
    this.initRenderer();
    this.initScene();
    this.initCamera();
    this.createWave();
    this.initEvents();
    this.animate();
  }

  initRenderer() {
    const w = this.container.offsetWidth;
    const h = this.container.offsetHeight || 500;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);
  }

  initScene() {
    this.scene = new THREE.Scene();
  }

  initCamera() {
    const w = this.container.offsetWidth;
    const h = this.container.offsetHeight || 500;
    this.camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100);
    this.camera.position.set(0, 3, 8);
    this.camera.lookAt(0, 0, 0);
  }

  createWave() {
    const segs = 60;
    const geo = new THREE.PlaneGeometry(22, 10, segs, segs);
    this._origPos = geo.attributes.position.array.slice();

    const mat = new THREE.MeshStandardMaterial({
      color: 0xC5973B,
      roughness: 0.6,
      metalness: 0.3,
      wireframe: true,
      transparent: true,
      opacity: 0.18
    });

    this.wave = new THREE.Mesh(geo, mat);
    this.wave.rotation.x = -Math.PI / 3.5;
    this._geo = geo;

    const ambLight = new THREE.AmbientLight(0xC5973B, 1);
    this.scene.add(ambLight);
    this.scene.add(this.wave);
  }

  initEvents() {
    window.addEventListener('resize', () => {
      const w = this.container.offsetWidth;
      const h = this.container.offsetHeight || 500;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const elapsed = this.clock.getElapsedTime();
    const pos = this._geo.attributes.position;
    const orig = this._origPos;

    for (let i = 0; i < pos.count; i++) {
      const x = orig[i * 3];
      const z = orig[i * 3 + 1];
      const wave = Math.sin(x * 0.5 + elapsed * 0.8) * 0.35
                 + Math.cos(z * 0.4 + elapsed * 0.6) * 0.25;
      pos.setZ(i, wave);
    }
    pos.needsUpdate = true;
    this._geo.computeVertexNormals();

    this.renderer.render(this.scene, this.camera);
  }
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
function initThreeJS() {
  // Reduzido Motion: respeita preferências de acessibilidade
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  new HeroParticles();
  new StatsParticles();
  new ServicesBackground();
  new ContactWave();
}

// Aguarda carregamento completo da página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThreeJS);
} else {
  initThreeJS();
}
