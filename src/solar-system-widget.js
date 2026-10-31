import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const TEX = (name) => `${import.meta.env.BASE_URL}textures/solar/${name}`;

/** Stylized (not true-scale) orbital radii and sizes for readability. */
const PLANETS = [
  { id: 'mercury', label: 'Mercury / 水星', tex: 'mercury.jpg', dist: 3.2, size: 0.14, period: 10, segs: 32 },
  { id: 'venus', label: 'Venus / 金星', tex: 'venus.jpg', dist: 4.4, size: 0.2, period: 16, segs: 32 },
  { id: 'earth', label: 'Earth / 地球', tex: 'earth.jpg', dist: 5.8, size: 0.22, period: 24, segs: 48, moon: true },
  { id: 'mars', label: 'Mars / 火星', tex: 'mars.jpg', dist: 7.4, size: 0.16, period: 36, segs: 32 },
  { id: 'jupiter', label: 'Jupiter / 木星', tex: 'jupiter.jpg', dist: 10.6, size: 0.58, period: 60, segs: 48 },
  { id: 'saturn', label: 'Saturn / 土星', tex: 'saturn.jpg', dist: 14.2, size: 0.5, period: 80, segs: 48, rings: true },
  { id: 'uranus', label: 'Uranus / 天王星', tex: 'uranus.jpg', dist: 17.6, size: 0.34, period: 100, segs: 32 },
  { id: 'neptune', label: 'Neptune / 海王星', tex: 'neptune.jpg', dist: 20.6, size: 0.32, period: 120, segs: 32 },
];

function canUseWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

function prepareTexture(texture, renderer) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function makeOrbitLine(radius) {
  const pts = [];
  const segments = 128;
  for (let i = 0; i <= segments; i += 1) {
    const a = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({
    color: 0x4a5a6a,
    transparent: true,
    opacity: 0.35,
  });
  return new THREE.LineLoop(geo, mat);
}

function makeLabel(text) {
  const el = document.createElement('div');
  el.className = 'solar-label';
  el.textContent = text;
  const obj = new CSS2DObject(el);
  obj.center.set(0.5, 1.25);
  return obj;
}

function makeStarfield(count = 900) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const r = 40 + Math.random() * 60;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xb8c4d4,
    size: 0.06,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  return new THREE.Points(geo, mat);
}

/**
 * Mount an interactive stylized solar system into `container`.
 * Returns `{ dispose }` for tear-down on route change.
 */
export function mountSolarSystemWidget(container, { compact = false } = {}) {
  const shell = document.createElement('section');
  shell.className = `solar-widget${compact ? ' solar-widget--compact' : ''}`;
  shell.innerHTML = `
    <div class="solar-widget__stage" role="img" aria-label="可交互的太阳系三维场景"></div>
    <p class="solar-widget__fallback" hidden>当前环境无法使用 WebGL，已跳过三维太阳系展示。</p>
  `;
  container.appendChild(shell);

  const stage = shell.querySelector('.solar-widget__stage');
  const fallback = shell.querySelector('.solar-widget__fallback');

  if (!canUseWebGL()) {
    stage.hidden = true;
    fallback.hidden = false;
    return {
      dispose() {
        shell.remove();
      },
    };
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070b);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
  camera.position.set(0, compact ? 10 : 12, compact ? 18 : 22);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = 'solar-widget__labels';
  stage.appendChild(labelRenderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.minDistance = compact ? 6 : 4;
  controls.maxDistance = compact ? 36 : 48;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.target.set(0, 0, 0);

  const ambient = new THREE.AmbientLight(0x6a7380, 0.35);
  scene.add(ambient);
  const sunLight = new THREE.PointLight(0xfff2d6, 2.4, 80, 1.1);
  scene.add(sunLight);

  scene.add(makeStarfield(compact ? 500 : 900));

  const loader = new THREE.TextureLoader();
  const disposables = [];
  const orbits = [];
  let disposed = false;

  const loadTex = (file) =>
    new Promise((resolve) => {
      loader.load(
        TEX(file),
        (texture) => resolve(prepareTexture(texture, renderer)),
        undefined,
        () => resolve(null),
      );
    });

  const sunGroup = new THREE.Group();
  scene.add(sunGroup);

  const sunSegs = compact ? 32 : 48;
  const sunGeo = new THREE.SphereGeometry(1.15, sunSegs, sunSegs);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffc978 });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunGroup.add(sunMesh);
  disposables.push(sunGeo, sunMat);

  const sunLabel = makeLabel('Sun / 太阳');
  sunLabel.position.set(0, 1.35, 0);
  sunGroup.add(sunLabel);

  loadTex('sun.jpg').then((tex) => {
    if (!tex || disposed) {
      tex?.dispose();
      return;
    }
    sunMat.map = tex;
    sunMat.color.set(0xffffff);
    sunMat.needsUpdate = true;
    disposables.push(tex);
  });

  PLANETS.forEach((def) => {
    const orbit = new THREE.Group();
    scene.add(orbit);

    const orbitLine = makeOrbitLine(def.dist);
    scene.add(orbitLine);
    disposables.push(orbitLine.geometry, orbitLine.material);

    const body = new THREE.Group();
    body.position.x = def.dist;
    orbit.add(body);

    const segs = compact ? Math.min(def.segs, 32) : def.segs;
    const geo = new THREE.SphereGeometry(def.size, segs, segs);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xb0b8c0,
      roughness: 0.9,
      metalness: 0.05,
    });
    const mesh = new THREE.Mesh(geo, mat);
    body.add(mesh);
    disposables.push(geo, mat);

    const label = makeLabel(def.label);
    label.position.set(0, def.size + 0.18, 0);
    body.add(label);

    loadTex(def.tex).then((tex) => {
      if (!tex || disposed) {
        tex?.dispose();
        return;
      }
      mat.map = tex;
      mat.color.set(0xffffff);
      mat.needsUpdate = true;
      disposables.push(tex);
    });

    if (def.rings) {
      const ringGeo = new THREE.RingGeometry(def.size * 1.35, def.size * 2.35, 64);
      const pos = ringGeo.attributes.position;
      const uv = ringGeo.attributes.uv;
      // Map U radially so ring textures stretch correctly.
      for (let i = 0; i < pos.count; i += 1) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const len = Math.hypot(x, y);
        uv.setXY(i, (len - def.size * 1.35) / (def.size * 1.0), 0.5);
      }
      uv.needsUpdate = true;
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xd6c6a4,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2.15;
      body.add(ring);
      disposables.push(ringGeo, ringMat);

      Promise.all([loadTex('saturn-ring.jpg'), loadTex('saturn-ring-alpha.gif')]).then(
        ([color, alpha]) => {
          if (disposed) {
            color?.dispose();
            alpha?.dispose();
            return;
          }
          if (color) {
            ringMat.map = color;
            ringMat.color.set(0xffffff);
            disposables.push(color);
          }
          if (alpha) {
            ringMat.alphaMap = alpha;
            disposables.push(alpha);
          }
          ringMat.needsUpdate = true;
        },
      );
    }

    if (def.moon) {
      const moonPivot = new THREE.Group();
      body.add(moonPivot);
      const moonGeo = new THREE.SphereGeometry(def.size * 0.28, 24, 24);
      const moonMat = new THREE.MeshStandardMaterial({ color: 0x9a9ea6, roughness: 1 });
      const moonMesh = new THREE.Mesh(moonGeo, moonMat);
      moonMesh.position.x = def.size * 2.1;
      moonPivot.add(moonMesh);
      disposables.push(moonGeo, moonMat);
      loadTex('moon.jpg').then((tex) => {
        if (!tex || disposed) {
          tex?.dispose();
          return;
        }
        moonMat.map = tex;
        moonMat.color.set(0xffffff);
        moonMat.needsUpdate = true;
        disposables.push(tex);
      });
      const moonLabel = makeLabel('Moon / 月球');
      moonLabel.position.set(def.size * 2.1, def.size * 0.45, 0);
      moonPivot.add(moonLabel);
      orbits.push({
        group: moonPivot,
        speed: (Math.PI * 2) / 6,
        spin: moonMesh,
        spinSpeed: 0.8,
      });
    }

    const phase = Math.random() * Math.PI * 2;
    orbit.rotation.y = phase;
    orbits.push({
      group: orbit,
      speed: (Math.PI * 2) / def.period,
      spin: mesh,
      spinSpeed: 0.35 + Math.random() * 0.4,
    });
  });

  let raf = 0;
  let visible = true;
  let last = performance.now();

  const resize = () => {
    if (disposed) return;
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    labelRenderer.setSize(width, height);
  };

  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();

  const io =
    typeof IntersectionObserver === 'function'
      ? new IntersectionObserver(
          ([entry]) => {
            visible = entry?.isIntersecting ?? true;
          },
          { threshold: 0.05 },
        )
      : null;
  io?.observe(stage);

  const tick = (now) => {
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    if (!visible) {
      last = now;
      return;
    }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    for (const item of orbits) {
      item.group.rotation.y += item.speed * dt;
      if (item.spin) item.spin.rotation.y += item.spinSpeed * dt;
    }
    sunMesh.rotation.y += 0.05 * dt;
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  };
  raf = requestAnimationFrame(tick);

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io?.disconnect();
      controls.dispose();
      for (const d of disposables) d.dispose?.();
      renderer.dispose();
      renderer.domElement.remove();
      labelRenderer.domElement.remove();
      shell.remove();
    },
  };
}
