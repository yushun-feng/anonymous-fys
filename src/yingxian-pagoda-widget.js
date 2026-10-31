import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

/**
 * Yingxian Wooden Pagoda showcase — loads the Draco-compressed GLB from
 * https://github.com/huangbai-AI/yingxian-pagoda (yingxian-v20.glb).
 * Educational reconstruction; not a surveyed heritage scan.
 */

const MODEL_URL = `${import.meta.env.BASE_URL}models/yingxian-pagoda.glb`;
const DRACO_PATH = `${import.meta.env.BASE_URL}draco/`;

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

function makeLabel(text) {
  const el = document.createElement('div');
  el.className = 'pagoda-label';
  el.textContent = text;
  const obj = new CSS2DObject(el);
  obj.center.set(0.5, 1.15);
  return obj;
}

function fitCameraToObject(camera, controls, object, { compact = false } = {}) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = THREE.MathUtils.degToRad(camera.fov);
  let distance = maxDim / (2 * Math.tan(fov / 2));
  distance *= compact ? 1.55 : 1.35;

  const dir = new THREE.Vector3(0.72, 0.42, 0.85).normalize();
  camera.position.copy(center).addScaledVector(dir, distance);
  controls.target.copy(center).setY(center.y + size.y * 0.05);
  controls.minDistance = maxDim * 0.35;
  controls.maxDistance = maxDim * 4.5;
  camera.near = Math.max(0.05, maxDim / 400);
  camera.far = Math.max(200, maxDim * 20);
  camera.updateProjectionMatrix();
  controls.update();
  return { box, size, center, maxDim };
}

/**
 * Mount Yingxian Wooden Pagoda GLB showcase into `container`.
 * Returns `{ dispose }` for tear-down on route change.
 */
export function mountYingxianPagodaWidget(container, { compact = false } = {}) {
  const shell = document.createElement('section');
  shell.className = `pagoda-widget${compact ? ' pagoda-widget--compact' : ''}`;
  shell.innerHTML = `
    <div class="pagoda-widget__stage" role="img" aria-label="可交互的应县木塔三维展台"></div>
    <p class="pagoda-widget__status" data-pagoda-status>正在加载木塔模型…</p>
    <p class="pagoda-widget__fallback" hidden>当前环境无法使用 WebGL，已跳过三维展台展示。</p>
  `;
  container.appendChild(shell);

  const stage = shell.querySelector('.pagoda-widget__stage');
  const status = shell.querySelector('[data-pagoda-status]');
  const fallback = shell.querySelector('.pagoda-widget__fallback');

  if (!canUseWebGL()) {
    stage.hidden = true;
    status.hidden = true;
    fallback.hidden = false;
    return {
      dispose() {
        shell.remove();
      },
    };
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb7c4d2);
  scene.fog = new THREE.Fog(0xb7c4d2, 80, 320);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 800);
  camera.position.set(60, 45, 110);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = !compact;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = 'pagoda-widget__labels';
  stage.appendChild(labelRenderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.target.set(0, 30, 0);
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.35;

  scene.add(new THREE.AmbientLight(0xdde6f0, 0.45));
  scene.add(new THREE.HemisphereLight(0xe8f0ff, 0x6a7058, 0.55));
  const sun = new THREE.DirectionalLight(0xffe2bd, 2.4);
  sun.position.set(55, 90, 40);
  sun.castShadow = !compact;
  if (sun.castShadow) {
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0002;
    sun.shadow.normalBias = 0.04;
    const extent = 90;
    sun.shadow.camera.left = -extent;
    sun.shadow.camera.right = extent;
    sun.shadow.camera.top = extent;
    sun.shadow.camera.bottom = -extent;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 260;
  }
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x9eb7ff, 0.55);
  fill.position.set(-50, 40, -30);
  scene.add(fill);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(160, 64),
    new THREE.MeshStandardMaterial({ color: 0x6e7a68, roughness: 0.95, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  let disposed = false;
  let raf = 0;
  let visible = true;
  let root = null;
  const disposables = [ground.geometry, ground.material];

  const draco = new DRACOLoader();
  draco.setDecoderPath(DRACO_PATH);
  draco.setWorkerLimit(2);
  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);

  loader.load(
    MODEL_URL,
    (gltf) => {
      if (disposed) {
        gltf.scene.traverse((obj) => {
          if (obj.isMesh) {
            obj.geometry?.dispose?.();
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((m) => m?.dispose?.());
          }
        });
        return;
      }
      root = gltf.scene;
      root.traverse((obj) => {
        if (obj.isMesh) {
          obj.castShadow = !compact;
          obj.receiveShadow = true;
          if (obj.material) {
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            for (const m of mats) {
              if (m && 'envMapIntensity' in m) m.envMapIntensity = 0.85;
            }
          }
        }
      });
      scene.add(root);
      const fit = fitCameraToObject(camera, controls, root, { compact });
      ground.position.y = fit.box.min.y - 0.02;
      sun.target.position.copy(fit.center);
      scene.add(sun.target);

      const label = makeLabel('应县木塔 · 佛宫寺释迦塔');
      label.position.set(fit.center.x, fit.box.max.y + fit.maxDim * 0.04, fit.center.z);
      root.add(label);

      status.textContent = '';
      status.hidden = true;
    },
    (event) => {
      if (disposed || !status || !event.total) return;
      const pct = Math.min(99, Math.round((event.loaded / event.total) * 100));
      status.textContent = `正在加载木塔模型… ${pct}%`;
    },
    (error) => {
      console.error('应县木塔模型加载失败', error);
      if (disposed) return;
      status.hidden = false;
      status.textContent = '木塔模型加载失败，笔记浏览不受影响。';
    },
  );

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

  let userControl = false;
  controls.addEventListener('start', () => {
    userControl = true;
    controls.autoRotate = false;
  });
  controls.addEventListener('end', () => {
    userControl = false;
    setTimeout(() => {
      if (!disposed && !userControl) controls.autoRotate = true;
    }, 2500);
  });

  const tick = () => {
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    if (!visible) return;
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
      draco.dispose();
      if (root) {
        scene.remove(root);
        root.traverse((obj) => {
          if (obj.isMesh) {
            obj.geometry?.dispose?.();
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((m) => {
              m?.map?.dispose?.();
              m?.normalMap?.dispose?.();
              m?.roughnessMap?.dispose?.();
              m?.metalnessMap?.dispose?.();
              m?.dispose?.();
            });
          }
        });
      }
      for (const d of disposables) d.dispose?.();
      renderer.dispose();
      renderer.domElement.remove();
      labelRenderer.domElement.remove();
      shell.remove();
    },
  };
}
