import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

/**
 * Stylized Portal 2 co-op bots: Atlas + P-body.
 * Procedural low/mid-poly meshes only — no Valve game assets or ripped textures.
 */

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

function trackDisposable(list, ...items) {
  for (const item of items) {
    if (item) list.push(item);
  }
}

function makeLabel(text) {
  const el = document.createElement('div');
  el.className = 'portal-label';
  el.textContent = text;
  const obj = new CSS2DObject(el);
  obj.center.set(0.5, 1.3);
  return obj;
}

function makeMetal(color, extras = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: extras.roughness ?? 0.42,
    metalness: extras.metalness ?? 0.55,
    emissive: extras.emissive ?? 0x000000,
    emissiveIntensity: extras.emissiveIntensity ?? 0,
  });
}

/**
 * Shared bipedal co-op bot skeleton; Atlas is stockier/blue, P-body taller/orange.
 * @param {'atlas' | 'pbody'} variant
 */
function buildCoopBot(variant, disposables) {
  const isAtlas = variant === 'atlas';
  const accent = isAtlas ? 0x3a7bd5 : 0xe8882a;
  const accentSoft = isAtlas ? 0x6aa8e8 : 0xf0a85a;
  const shell = isAtlas ? 0xd6dde4 : 0xd8d0c6;
  const dark = 0x23282e;

  const shellMat = makeMetal(shell, { roughness: 0.48, metalness: 0.45 });
  const accentMat = makeMetal(accent, { roughness: 0.35, metalness: 0.5 });
  const softMat = makeMetal(accentSoft, { roughness: 0.4, metalness: 0.4 });
  const darkMat = makeMetal(dark, { roughness: 0.38, metalness: 0.65 });
  const eyeMat = makeMetal(accent, {
    roughness: 0.22,
    metalness: 0.12,
    emissive: accent,
    emissiveIntensity: 0.75,
  });
  trackDisposable(disposables, shellMat, accentMat, softMat, darkMat, eyeMat);

  const root = new THREE.Group();
  const torsoPivot = new THREE.Group();
  root.add(torsoPivot);

  // Scale: Atlas shorter/wider; P-body lankier.
  const scaleY = isAtlas ? 1 : 1.12;
  const scaleX = isAtlas ? 1.08 : 0.92;
  torsoPivot.scale.set(scaleX, scaleY, 1);

  // Pelvis / lower body — Atlas rounder; P-body more oval/tall.
  const pelvisGeo = new THREE.SphereGeometry(isAtlas ? 0.36 : 0.28, 22, 18);
  const pelvis = new THREE.Mesh(pelvisGeo, shellMat);
  pelvis.position.y = 0.55;
  if (!isAtlas) pelvis.scale.set(0.9, 1.25, 0.9);
  torsoPivot.add(pelvis);
  trackDisposable(disposables, pelvisGeo);

  // Torso — Atlas sphere; P-body elongated capsule-like stack.
  const torsoGeo = isAtlas
    ? new THREE.SphereGeometry(0.42, 24, 20)
    : new THREE.CapsuleGeometry(0.3, 0.28, 8, 16);
  const torso = new THREE.Mesh(torsoGeo, shellMat);
  torso.position.y = isAtlas ? 1.15 : 1.22;
  torsoPivot.add(torso);
  trackDisposable(disposables, torsoGeo);

  // Chest accent plate.
  const plateGeo = new THREE.CircleGeometry(isAtlas ? 0.22 : 0.18, 20);
  const plate = new THREE.Mesh(plateGeo, accentMat);
  plate.position.set(0, 1.15, isAtlas ? 0.38 : 0.33);
  torsoPivot.add(plate);
  trackDisposable(disposables, plateGeo);

  // Neck joint.
  const neckGeo = new THREE.SphereGeometry(0.12, 12, 12);
  const neck = new THREE.Mesh(neckGeo, darkMat);
  neck.position.y = 1.55;
  torsoPivot.add(neck);
  trackDisposable(disposables, neckGeo);

  // Head (look-around pivot).
  const headPivot = new THREE.Group();
  headPivot.position.y = 1.78;
  torsoPivot.add(headPivot);

  const headGeo = new THREE.SphereGeometry(isAtlas ? 0.34 : 0.3, 24, 20);
  const head = new THREE.Mesh(headGeo, shellMat);
  headPivot.add(head);
  trackDisposable(disposables, headGeo);

  // Face disk + glowing eye.
  const faceGeo = new THREE.CircleGeometry(isAtlas ? 0.22 : 0.2, 24);
  const face = new THREE.Mesh(faceGeo, darkMat);
  face.position.z = isAtlas ? 0.3 : 0.27;
  headPivot.add(face);
  trackDisposable(disposables, faceGeo);

  const irisGeo = new THREE.CircleGeometry(isAtlas ? 0.12 : 0.11, 20);
  const iris = new THREE.Mesh(irisGeo, eyeMat);
  iris.position.z = (isAtlas ? 0.3 : 0.27) + 0.01;
  headPivot.add(iris);
  trackDisposable(disposables, irisGeo);

  const pupilGeo = new THREE.CircleGeometry(0.045, 12);
  const pupil = new THREE.Mesh(pupilGeo, darkMat);
  pupil.position.z = (isAtlas ? 0.3 : 0.27) + 0.02;
  headPivot.add(pupil);
  trackDisposable(disposables, pupilGeo);

  // Antenna stubs on head (slightly different silhouettes).
  const antGeo = new THREE.CylinderGeometry(0.03, 0.03, isAtlas ? 0.22 : 0.32, 8);
  trackDisposable(disposables, antGeo);
  for (const side of [-1, 1]) {
    const ant = new THREE.Mesh(antGeo, softMat);
    ant.position.set(side * (isAtlas ? 0.22 : 0.18), isAtlas ? 0.28 : 0.34, -0.05);
    ant.rotation.z = side * 0.35;
    headPivot.add(ant);
  }

  // Arms with ball joints.
  const armRoots = [];
  const upperArmGeo = new THREE.CapsuleGeometry(0.08, isAtlas ? 0.28 : 0.36, 6, 10);
  const foreArmGeo = new THREE.CapsuleGeometry(0.07, isAtlas ? 0.26 : 0.34, 6, 10);
  const jointGeo = new THREE.SphereGeometry(0.1, 12, 12);
  const handGeo = new THREE.SphereGeometry(0.11, 12, 12);
  trackDisposable(disposables, upperArmGeo, foreArmGeo, jointGeo, handGeo);

  for (const side of [-1, 1]) {
    const armRoot = new THREE.Group();
    armRoot.position.set(side * (isAtlas ? 0.48 : 0.4), 1.25, 0);
    torsoPivot.add(armRoot);

    const shoulder = new THREE.Mesh(jointGeo, darkMat);
    armRoot.add(shoulder);

    const upper = new THREE.Mesh(upperArmGeo, shellMat);
    upper.position.set(side * 0.05, -0.22, 0);
    upper.rotation.z = side * 0.35;
    armRoot.add(upper);

    const elbow = new THREE.Group();
    elbow.position.set(side * 0.12, -0.42, 0.05);
    armRoot.add(elbow);
    const elbowBall = new THREE.Mesh(jointGeo, darkMat);
    elbow.add(elbowBall);

    const fore = new THREE.Mesh(foreArmGeo, softMat);
    fore.position.set(side * 0.02, -0.22, 0.08);
    fore.rotation.x = 0.45;
    elbow.add(fore);

    const hand = new THREE.Mesh(handGeo, accentMat);
    hand.position.set(0, -0.42, 0.12);
    elbow.add(hand);

    armRoots.push({ armRoot, elbow, side });
  }

  // Legs.
  const legRoots = [];
  const thighGeo = new THREE.CapsuleGeometry(0.1, isAtlas ? 0.32 : 0.4, 6, 10);
  const shinGeo = new THREE.CapsuleGeometry(0.09, isAtlas ? 0.3 : 0.38, 6, 10);
  const footGeo = new THREE.BoxGeometry(0.2, 0.08, 0.32);
  trackDisposable(disposables, thighGeo, shinGeo, footGeo);

  for (const side of [-1, 1]) {
    const legRoot = new THREE.Group();
    legRoot.position.set(side * (isAtlas ? 0.2 : 0.16), 0.4, 0);
    root.add(legRoot);

    const hip = new THREE.Mesh(jointGeo, darkMat);
    legRoot.add(hip);

    const thigh = new THREE.Mesh(thighGeo, shellMat);
    thigh.position.set(0, -0.28, 0);
    legRoot.add(thigh);

    const knee = new THREE.Group();
    knee.position.set(0, -0.52, 0);
    legRoot.add(knee);
    const kneeBall = new THREE.Mesh(jointGeo, darkMat);
    knee.add(kneeBall);

    const shin = new THREE.Mesh(shinGeo, softMat);
    shin.position.set(0, -0.28, 0.02);
    knee.add(shin);

    const foot = new THREE.Mesh(footGeo, accentMat);
    foot.position.set(0, -0.5, 0.06);
    knee.add(foot);

    legRoots.push({ legRoot, knee, side });
  }

  return {
    group: root,
    headPivot,
    torsoPivot,
    armRoots,
    legRoots,
    eyeMat,
    variant,
  };
}

function makeLabFloor(disposables) {
  const group = new THREE.Group();
  const floorMat = makeMetal(0x7f8892, { roughness: 0.88, metalness: 0.12 });
  const accent = makeMetal(0x3f4852, { roughness: 0.72, metalness: 0.22 });
  trackDisposable(disposables, floorMat, accent);

  const floorGeo = new THREE.BoxGeometry(8.5, 0.12, 5.2);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.y = -0.06;
  group.add(floor);
  trackDisposable(disposables, floorGeo);

  const padGeo = new THREE.CylinderGeometry(0.95, 1.0, 0.08, 28);
  trackDisposable(disposables, padGeo);
  for (const x of [-1.7, 1.7]) {
    const pad = new THREE.Mesh(padGeo, accent);
    pad.position.set(x, 0.02, 0);
    group.add(pad);
  }

  const wallGeo = new THREE.BoxGeometry(8.5, 2.6, 0.12);
  const wall = new THREE.Mesh(wallGeo, accent);
  wall.position.set(0, 1.2, -2.4);
  group.add(wall);
  trackDisposable(disposables, wallGeo);

  // Colored portal-ish rings high on the back wall (decor only; not attached to bots).
  const ringGeo = new THREE.TorusGeometry(0.42, 0.05, 10, 36);
  const blueRing = new THREE.Mesh(
    ringGeo,
    makeMetal(0x3a7bd5, { roughness: 0.3, metalness: 0.4, emissive: 0x1a4a9a, emissiveIntensity: 0.35 }),
  );
  blueRing.position.set(-2.6, 2.05, -2.32);
  const orangeRing = new THREE.Mesh(
    ringGeo,
    makeMetal(0xe8882a, { roughness: 0.3, metalness: 0.4, emissive: 0x8a4510, emissiveIntensity: 0.35 }),
  );
  orangeRing.position.set(2.6, 2.05, -2.32);
  group.add(blueRing, orangeRing);
  trackDisposable(disposables, ringGeo, blueRing.material, orangeRing.material);

  return group;
}

/**
 * Mount Atlas + P-body showcase into `container`.
 * Returns `{ dispose }` for tear-down on route change.
 */
export function mountPortalPropsWidget(container, { compact = false } = {}) {
  const shell = document.createElement('section');
  shell.className = `portal-widget${compact ? ' portal-widget--compact' : ''}`;
  shell.innerHTML = `
    <div class="portal-widget__stage" role="img" aria-label="可交互的 Atlas 与 P-body 三维展台"></div>
    <p class="portal-widget__fallback" hidden>当前环境无法使用 WebGL，已跳过三维展台展示。</p>
  `;
  container.appendChild(shell);

  const stage = shell.querySelector('.portal-widget__stage');
  const fallback = shell.querySelector('.portal-widget__fallback');

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
  scene.background = new THREE.Color(0x12161c);
  scene.fog = new THREE.Fog(0x12161c, 10, 26);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
  camera.position.set(0, compact ? 2.4 : 2.9, compact ? 6.6 : 7.6);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = 'portal-widget__labels';
  stage.appendChild(labelRenderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.minDistance = compact ? 3.8 : 3.2;
  controls.maxDistance = compact ? 13 : 15;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.target.set(0, 1.1, 0);

  scene.add(new THREE.AmbientLight(0xb8c4d0, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.15);
  key.position.set(4, 8, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x7eb6ff, 0.32);
  fill.position.set(-5, 3, -2);
  scene.add(fill);
  const warm = new THREE.PointLight(0xff9a4a, 0.4, 14, 2);
  warm.position.set(2.2, 2.2, 2.5);
  scene.add(warm);

  const disposables = [];
  let disposed = false;

  scene.add(makeLabFloor(disposables));

  const atlas = buildCoopBot('atlas', disposables);
  atlas.group.position.set(-1.7, 0, 0);
  const atlasLabel = makeLabel('Atlas');
  atlasLabel.position.set(0, 2.35, 0);
  atlas.group.add(atlasLabel);

  const pbody = buildCoopBot('pbody', disposables);
  pbody.group.position.set(1.7, 0, 0);
  const pbodyLabel = makeLabel('P-body');
  pbodyLabel.position.set(0, 2.45, 0);
  pbody.group.add(pbodyLabel);

  scene.add(atlas.group, pbody.group);

  let raf = 0;
  let visible = true;
  let last = performance.now();
  let t = 0;

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

  function animateBot(bot, time, phase) {
    const bob = Math.sin(time * 1.5 + phase) * 0.035;
    bot.group.position.y = bob;

    // Idle torso sway.
    bot.torsoPivot.rotation.y = Math.sin(time * 0.55 + phase) * 0.08;
    bot.torsoPivot.rotation.z = Math.sin(time * 0.7 + phase) * 0.03;

    // Look-around.
    bot.headPivot.rotation.y = Math.sin(time * 0.65 + phase * 1.3) * 0.55;
    bot.headPivot.rotation.x = Math.sin(time * 0.4 + phase) * 0.12;

    // Soft arm idle.
    for (const { armRoot, elbow, side } of bot.armRoots) {
      armRoot.rotation.x = Math.sin(time * 1.1 + phase + side) * 0.18;
      armRoot.rotation.z = side * (0.15 + Math.sin(time * 0.9 + phase) * 0.08);
      elbow.rotation.x = 0.2 + Math.sin(time * 1.3 + phase + side) * 0.15;
    }

    // Subtle weight shift in legs.
    for (const { legRoot, knee, side } of bot.legRoots) {
      legRoot.rotation.x = Math.sin(time * 1.5 + phase + side) * 0.06;
      knee.rotation.x = Math.max(0, Math.sin(time * 1.5 + phase + side + 1) * 0.08);
    }

    bot.eyeMat.emissiveIntensity = 0.55 + (Math.sin(time * 2.2 + phase) * 0.5 + 0.5) * 0.4;
  }

  const tick = (now) => {
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    if (!visible) {
      last = now;
      return;
    }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;

    animateBot(atlas, t, 0);
    animateBot(pbody, t, 1.7);

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
