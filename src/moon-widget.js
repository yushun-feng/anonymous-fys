import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const TEXTURE_URL = `${import.meta.env.BASE_URL}textures/moon.jpg`;

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

/**
 * Mount an interactive Moon into `container`.
 * Returns `{ dispose }` so callers can tear down on route change.
 */
export function mountMoonWidget(container, { compact = false } = {}) {
  const shell = document.createElement('section');
  shell.className = `moon-widget${compact ? ' moon-widget--compact' : ''}`;
  shell.innerHTML = `
    <div class="moon-widget__head">
      <h2 class="moon-widget__title">Interactive Moon</h2>
      <p class="moon-widget__hint">拖拽旋转 · 滚轮/捏合缩放</p>
    </div>
    <div class="moon-widget__stage" role="img" aria-label="可交互的三维月球"></div>
    <p class="moon-widget__fallback" hidden>当前环境无法使用 WebGL，已跳过三维月球展示。</p>
  `;
  container.appendChild(shell);

  const stage = shell.querySelector('.moon-widget__stage');
  const fallback = shell.querySelector('.moon-widget__fallback');

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
  scene.background = new THREE.Color(0x070b10);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0.35, 3.2);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.minDistance = 1.6;
  controls.maxDistance = 6;
  controls.rotateSpeed = 0.7;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.35;
  controls.target.set(0, 0, 0);

  // Pause auto-rotate while the user is interacting.
  controls.addEventListener('start', () => {
    controls.autoRotate = false;
  });
  controls.addEventListener('end', () => {
    controls.autoRotate = true;
  });

  const ambient = new THREE.AmbientLight(0x6a7585, 0.55);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xfff2e0, 2.1);
  key.position.set(4.5, 1.2, 2.5);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x6f8fb8, 0.35);
  fill.position.set(-3, -1, -2);
  scene.add(fill);

  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 64),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 1,
      metalness: 0,
    }),
  );
  scene.add(moon);

  const loader = new THREE.TextureLoader();
  loader.load(
    TEXTURE_URL,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      moon.material.map = texture;
      moon.material.needsUpdate = true;
    },
    undefined,
    () => {
      // Keep a lit sphere if the texture fails; still interactive.
      moon.material.color.set(0xb0b4ba);
    },
  );

  let disposed = false;
  let raf = 0;
  let visible = true;

  const resize = () => {
    if (disposed) return;
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
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

  const tick = () => {
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    if (!visible) return;
    controls.update();
    renderer.render(scene, camera);
  };
  tick();

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io?.disconnect();
      controls.dispose();
      moon.geometry.dispose();
      moon.material.map?.dispose();
      moon.material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      shell.remove();
    },
  };
}
