/**
 * Transform Explorer — TRS + left/right matrix multiply demo.
 * Column-vector convention: p' = M p; left multiply A·M ≈ world; right M·A ≈ local.
 * Chinese UI. Teaching sketch with Three.js dart + ghost.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** @param {number} n */
function fmt(n) {
  const v = Math.abs(n) < 1e-10 ? 0 : n;
  return (Object.is(v, -0) ? 0 : v).toFixed(2);
}

/**
 * @param {THREE.Matrix4} m
 * @returns {string}
 */
function matrixTableHtml(m, highlight = '') {
  const e = m.elements;
  // Three stores column-major; display mathematical rows.
  const cells = [];
  for (let r = 0; r < 4; r += 1) {
    const row = [];
    for (let c = 0; c < 4; c += 1) {
      row.push(`<td>${fmt(e[c * 4 + r])}</td>`);
    }
    cells.push(`<tr>${row.join('')}</tr>`);
  }
  return `<table class="xf-mat${highlight ? ` xf-mat--${highlight}` : ''}" aria-label="4×4 矩阵"><tbody>${cells.join('')}</tbody></table>`;
}

/**
 * Build TRS matrix: M = T · R · S (column vectors, XYZ Euler intrinsic / Three default).
 * @param {{ tx: number, ty: number, tz: number, rx: number, ry: number, rz: number, sx: number, sy: number, sz: number }} p
 */
function trsMatrix(p) {
  const t = new THREE.Matrix4().makeTranslation(p.tx, p.ty, p.tz);
  const r = new THREE.Matrix4().makeRotationFromEuler(
    new THREE.Euler(
      THREE.MathUtils.degToRad(p.rx),
      THREE.MathUtils.degToRad(p.ry),
      THREE.MathUtils.degToRad(p.rz),
      'XYZ',
    ),
  );
  const s = new THREE.Matrix4().makeScale(p.sx, p.sy, p.sz);
  return t.multiply(r).multiply(s);
}

/**
 * @param {number} opacity
 * @param {'main' | 'left' | 'right'} kind
 */
function createDart(opacity, kind) {
  const group = new THREE.Group();
  const bodyColor = kind === 'main' ? 0xe8a045 : kind === 'left' ? 0x5b9fd4 : 0x7bc47f;
  const tipColor = kind === 'main' ? 0xff6b4a : kind === 'left' ? 0x7ec8ff : 0xa8e6a1;
  const mat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    roughness: 0.45,
    metalness: 0.15,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 0.99,
  });
  const tipMat = new THREE.MeshStandardMaterial({
    color: tipColor,
    roughness: 0.35,
    metalness: 0.2,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 0.99,
  });
  const finMat = new THREE.MeshStandardMaterial({
    color: 0xd7c2ea,
    roughness: 0.5,
    metalness: 0.05,
    transparent: opacity < 1,
    opacity: Math.min(1, opacity + 0.05),
    depthWrite: opacity >= 0.99,
    side: THREE.DoubleSide,
  });

  // Shaft along +Z (Three cylinder default = Y).
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.15, 14), mat);
  shaft.rotation.x = Math.PI / 2;
  shaft.position.z = 0.15;
  group.add(shaft);

  // Tip at +Z.
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.42, 14), tipMat);
  tip.rotation.x = Math.PI / 2;
  tip.position.z = 0.98;
  group.add(tip);

  // Cross fins near tail (−Z) so roll is visible.
  const finGeo = new THREE.BoxGeometry(0.55, 0.04, 0.28);
  const finA = new THREE.Mesh(finGeo, finMat);
  finA.position.z = -0.55;
  group.add(finA);
  const finB = new THREE.Mesh(finGeo, finMat);
  finB.rotation.z = Math.PI / 2;
  finB.position.z = -0.55;
  group.add(finB);

  // Nose stripe.
  const nose = new THREE.Mesh(
    new THREE.TorusGeometry(0.12, 0.025, 8, 20),
    new THREE.MeshBasicMaterial({
      color: 0xffe08a,
      transparent: opacity < 1,
      opacity: Math.min(1, opacity + 0.1),
    }),
  );
  nose.rotation.y = Math.PI / 2;
  nose.position.z = 0.72;
  group.add(nose);

  if (kind === 'main' || opacity > 0.85) {
    const axes = new THREE.AxesHelper(0.55);
    axes.position.set(0, 0, 0);
    group.add(axes);
  }

  return group;
}

function defaultA() {
  return { tx: 0, ty: 0, tz: 0, rx: 0, ry: 45, rz: 0, sx: 1, sy: 1, sz: 1 };
}

/**
 * @param {HTMLElement} container
 * @param {{ compact?: boolean }} [options]
 */
export function mountTransformExplorer(container, options = {}) {
  const compact = Boolean(options.compact);

  const shell = document.createElement('section');
  shell.className = `xf-explorer${compact ? ' xf-explorer--compact' : ''}`;
  shell.setAttribute('aria-label', '矩阵变换与左右乘演示');

  /** @type {THREE.Matrix4} */
  let M = new THREE.Matrix4().identity();
  let Aparams = defaultA();
  /** @type {'both' | 'left' | 'right'} */
  let previewMode = 'both';
  /** @type {{ no: number, op: string, detail: string }[]} */
  let log = [];
  let logNo = 0;

  function pushLog(op, detail) {
    logNo += 1;
    log.push({ no: logNo, op, detail });
    if (log.length > 40) log = log.slice(-40);
  }

  pushLog('INIT', '列向量约定 p′ = M p；左乘 A·M ≈ 世界系，右乘 M·A ≈ 物体系');

  shell.innerHTML = `
    <header class="xf-explorer__hero">
      <div>
        <p class="xf-explorer__eyebrow">TRANSFORM · MATRIX</p>
        <h2 class="xf-explorer__title">变换沙箱 · 左乘 / 右乘</h2>
        <p class="xf-explorer__subtitle">定向飞镖看朝向；同一增量 A，对比 <code>A·M</code>（世界）与 <code>M·A</code>（物体）。约定：列向量、列主序。</p>
      </div>
      <div class="xf-explorer__hero-actions">
        <a class="xf-explorer__link" href="#/note/graphics/foundation/ch02-vectors-transforms">笔记 ch02 →</a>
        ${compact ? '<a class="xf-explorer__link" href="#/transform">打开完整页 →</a>' : ''}
      </div>
    </header>

    <details class="xf-explorer__glossary">
      <summary>小白概念：左乘、右乘、世界系 / 物体系</summary>
      <div class="xf-explorer__glossary-list">
        <div>
          <dt>列向量 · p′ = M p</dt>
          <dd>本页与 LearnOpenGL / ch02 一致：矩阵<strong>左乘</strong>列向量。教材若写行向量 pᵀM，是对偶包装，几何相同（矩阵转置），本页不切换双轨。</dd>
        </div>
        <div>
          <dt>左乘 A·M</dt>
          <dd>新变换乘在<strong>左边</strong>：在<strong>世界坐标系</strong>里再施加 A（绕世界轴转、沿世界轴移）。</dd>
        </div>
        <div>
          <dt>右乘 M·A</dt>
          <dd>新变换乘在<strong>右边</strong>：在<strong>物体局部系</strong>里再施加 A（绕自身轴转、沿飞镖局部轴移）。</dd>
        </div>
        <div>
          <dt>为何飞镖要歪过一次</dt>
          <dd>姿态歪了之后，世界 +X 与局部红轴不再重合，同一平移 T(2,0,0) 左乘/右乘会明显分叉。</dd>
        </div>
        <div>
          <dt>齐次坐标</dt>
          <dd>点 (x,y,z,1)，方向 (x,y,z,0)。4×4 才能把平移写进矩阵。</dd>
        </div>
        <div>
          <dt>尖端朝向</dt>
          <dd>飞镖锥尖默认沿物体局部 <code>+Z</code>；尾翼十字辨滚转；局部 RGB 轴随物体。</dd>
        </div>
        <div>
          <dt>行列式 det</dt>
          <dd>有向体积缩放：纯旋转 ≈ ±1；非均匀缩放会变；为 0 表示压扁；负号表示朝向翻转。右侧面板实时显示。</dd>
        </div>
        <div>
          <dt>矩阵的列</dt>
          <dd>列向量约定下，线性部分的三列是基向量 e₁,e₂,e₃ 的像——飞镖局部 RGB 轴就是「基被变到哪」。详见几何意义导读。</dd>
        </div>
      </div>
      <p class="xf-explorer__glossary-tip">先跑剧本「歪尖端 → 世界/局部平移」；再拧缩放看 det。延伸：<a href="#/note/graphics/linalg-geometry-map">线性代数的几何意义导读</a>。</p>
    </details>

    <div class="xf-explorer__chips" role="toolbar" aria-label="演示剧本">
      <button type="button" class="xf-explorer__chip" data-script="reset">重置</button>
      <button type="button" class="xf-explorer__chip" data-script="tilt-local">① 右乘绕 Y 45°（歪尖端）</button>
      <button type="button" class="xf-explorer__chip" data-script="compare-ry">② 对比再绕 Y 45°</button>
      <button type="button" class="xf-explorer__chip" data-script="compare-tx">③ 对比平移 +X</button>
      <button type="button" class="xf-explorer__chip" data-script="rt-vs-tr">先 R 后 T / 先 T 后 R</button>
      <button type="button" class="xf-explorer__chip" data-script="det-scale">④ 非均匀缩放看 det</button>
      <button type="button" class="xf-explorer__chip" data-script="det-reflect">⑤ 镜像翻转 det&lt;0</button>
    </div>

    <div class="xf-explorer__workspace">
      <aside class="xf-explorer__panel xf-explorer__log" aria-label="操作日志">
        <p class="xf-explorer__panel-title">操作日志</p>
        <div class="xf-explorer__table-wrap">
          <table class="xf-explorer__table">
            <thead><tr><th>#</th><th>操作</th><th>说明</th></tr></thead>
            <tbody data-log-body></tbody>
          </table>
        </div>
      </aside>

      <div class="xf-explorer__center">
        <div class="xf-explorer__center-stage">
          <div class="xf-explorer__viewport" data-viewport tabindex="0" aria-label="三维视口"></div>
          <p class="xf-explorer__legend">
            <span class="xf-explorer__swatch xf-explorer__swatch--main">当前 M</span>
            <span class="xf-explorer__swatch xf-explorer__swatch--left">预览 A·M（左·世界）</span>
            <span class="xf-explorer__swatch xf-explorer__swatch--right">预览 M·A（右·物体）</span>
          </p>
        </div>

        <aside class="xf-explorer__panel xf-explorer__panel--controls xf-explorer__dock" aria-label="增量矩阵调节">
          <div class="xf-explorer__dock-head">
            <div class="xf-explorer__dock-intro">
              <p class="xf-explorer__panel-title">增量矩阵 A（TRS）</p>
              <p class="xf-explorer__panel-hint xf-explorer__panel-hint--dock">滑条粗调、数字框精输；Shift 或精调可 ÷10 步进。</p>
            </div>
            <label class="xf-explorer__fine">
              <input type="checkbox" data-fine />
              精调（÷10）
            </label>
            <div class="xf-explorer__side-row xf-explorer__side-row--dock">
              <span class="xf-explorer__side-label">预览</span>
              <label class="xf-explorer__radio"><input type="radio" name="xf-preview" value="both" checked /> 并列</label>
              <label class="xf-explorer__radio"><input type="radio" name="xf-preview" value="left" /> 仅左乘</label>
              <label class="xf-explorer__radio"><input type="radio" name="xf-preview" value="right" /> 仅右乘</label>
            </div>
            <div class="xf-explorer__btn-row xf-explorer__btn-row--dock">
              <button type="button" class="xf-explorer__btn xf-explorer__btn--left" data-apply="left">采用左乘 A·M</button>
              <button type="button" class="xf-explorer__btn xf-explorer__btn--right" data-apply="right">采用右乘 M·A</button>
              <button type="button" class="xf-explorer__btn" data-reset-a>重置 A</button>
              <button type="button" class="xf-explorer__btn" data-reset-m>M ← I</button>
            </div>
          </div>
          <div class="xf-explorer__sliders" data-a-sliders></div>
        </aside>
      </div>

      <aside class="xf-explorer__panel xf-explorer__panel--detail">
        <p class="xf-explorer__panel-title">矩阵</p>
        <p class="xf-explorer__formula" data-formula>预览：M′ = A·M　与　M′ = M·A</p>
        <p class="xf-explorer__panel-hint">列主序存储、按数学行显示。det ≈ 有向体积缩放（仿射 4×4 末行 [0,0,0,1] 时等于线性部分）。</p>
        <p class="xf-explorer__dets" data-dets></p>
        <p class="xf-explorer__mat-label">当前 M</p>
        <div data-mat-m></div>
        <p class="xf-explorer__mat-label">增量 A</p>
        <div data-mat-a></div>
        <p class="xf-explorer__mat-label xf-explorer__mat-label--left">左乘结果 A·M</p>
        <div data-mat-left></div>
        <p class="xf-explorer__mat-label xf-explorer__mat-label--right">右乘结果 M·A</p>
        <div data-mat-right></div>
      </aside>
    </div>
    <p class="xf-explorer__credit">教学示意；尖端 = 局部 +Z。约定见 <a href="#/note/graphics/foundation/ch02-vectors-transforms">ch02</a>；几何直觉地图见 <a href="#/note/graphics/linalg-geometry-map">导读</a>（推荐纸书《线性代数的几何意义》作延伸，本站不摘录正文）。</p>
  `;

  container.replaceChildren(shell);

  const sliderHost = /** @type {HTMLElement} */ (shell.querySelector('[data-a-sliders]'));
  const fineToggle = /** @type {HTMLInputElement | null} */ (shell.querySelector('[data-fine]'));
  /** Coarse step for range/± ; fine = coarse / 10 when精调 or Shift. */
  const sliderDefs = [
    { key: 'tx', label: 'T.x', min: -3, max: 3, step: 0.01, snaps: [-2, -1, 0, 1, 2] },
    { key: 'ty', label: 'T.y', min: -3, max: 3, step: 0.01, snaps: [-2, -1, 0, 1, 2] },
    { key: 'tz', label: 'T.z', min: -3, max: 3, step: 0.01, snaps: [-2, -1, 0, 1, 2] },
    { key: 'rx', label: 'R.x°', min: -180, max: 180, step: 0.5, snaps: [-90, -45, 0, 45, 90] },
    { key: 'ry', label: 'R.y°', min: -180, max: 180, step: 0.5, snaps: [-90, -45, 0, 45, 90] },
    { key: 'rz', label: 'R.z°', min: -180, max: 180, step: 0.5, snaps: [-90, -45, 0, 45, 90] },
    { key: 'sx', label: 'S.x', min: -3, max: 3, step: 0.01, snaps: [-1, 0.5, 1, 1.5, 2] },
    { key: 'sy', label: 'S.y', min: -3, max: 3, step: 0.01, snaps: [-1, 0.5, 1, 1.5, 2] },
    { key: 'sz', label: 'S.z', min: -3, max: 3, step: 0.01, snaps: [-1, 0.5, 1, 1.5, 2] },
  ];

  /** @type {Map<string, (typeof sliderDefs)[number]>} */
  const sliderByKey = new Map(sliderDefs.map((d) => [d.key, d]));

  /** @param {number} value @param {number} min @param {number} max */
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  /** Snap to nearest multiple of step (stable for floats). */
  function quantize(value, step) {
    if (!(step > 0)) return value;
    const n = Math.round(value / step);
    const q = n * step;
    const decimals = String(step).includes('.') ? String(step).split('.')[1].length : 0;
    return Number(q.toFixed(Math.min(6, decimals + 1)));
  }

  function isFineMode(shiftKey = false) {
    return Boolean(fineToggle?.checked) || shiftKey;
  }

  function activeStep(def, shiftKey = false) {
    return isFineMode(shiftKey) ? def.step / 10 : def.step;
  }

  /**
   * @param {keyof typeof Aparams} key
   * @param {number} raw
   * @param {{ shiftKey?: boolean, quantizeTo?: number, source?: 'range' | 'num' | 'other' }} [opts]
   */
  function setParam(key, raw, opts = {}) {
    const def = sliderByKey.get(key);
    if (!def) return;
    const step = opts.quantizeTo ?? activeStep(def, opts.shiftKey);
    const next = clamp(quantize(raw, step), def.min, def.max);
    Aparams[key] = next;
    syncSliderInputs(opts.source === 'range' ? key : null, opts.source === 'num' ? key : null);
    renderPanels();
  }

  sliderHost.innerHTML = sliderDefs
    .map((d) => {
      const v = /** @type {number} */ (Aparams[/** @type {keyof typeof Aparams} */ (d.key)]);
      const snaps = d.snaps
        .map(
          (s) =>
            `<button type="button" class="xf-explorer__snap" data-snap-key="${d.key}" data-snap-val="${s}">${s}</button>`,
        )
        .join('');
      return `<div class="xf-explorer__slider" data-slider-row="${d.key}">
        <div class="xf-explorer__slider-head">
          <span class="xf-explorer__slider-label">${d.label}</span>
          <div class="xf-explorer__slider-tools">
            <button type="button" class="xf-explorer__nudge" data-nudge="-1" data-key="${d.key}" aria-label="${d.label} 减小">−</button>
            <input type="number" class="xf-explorer__num" data-num-key="${d.key}"
              min="${d.min}" max="${d.max}" step="${d.step}" value="${v}" inputmode="decimal" />
            <button type="button" class="xf-explorer__nudge" data-nudge="1" data-key="${d.key}" aria-label="${d.label} 增大">+</button>
          </div>
        </div>
        <input type="range" class="xf-explorer__range" data-key="${d.key}"
          min="${d.min}" max="${d.max}" step="${d.step}" value="${v}" />
        <div class="xf-explorer__snaps" role="group" aria-label="${d.label} 快捷值">${snaps}</div>
      </div>`;
    })
    .join('');

  const viewportEl = /** @type {HTMLElement} */ (shell.querySelector('[data-viewport]'));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c1218);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(3.4, 2.4, 4.2);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  viewportEl.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 0.2, 0);

  scene.add(new THREE.AmbientLight(0xb8c4d4, 0.7));
  scene.add(new THREE.HemisphereLight(0xd0dcec, 0x2a3038, 0.55));
  const key = new THREE.DirectionalLight(0xfff0dd, 1.35);
  key.position.set(4, 6, 3);
  scene.add(key);

  const grid = new THREE.GridHelper(10, 10, 0x3a4654, 0x24303c);
  grid.position.y = 0;
  scene.add(grid);
  scene.add(new THREE.AxesHelper(1.8));

  const mainDart = createDart(1, 'main');
  const leftDart = createDart(0.42, 'left');
  const rightDart = createDart(0.42, 'right');
  scene.add(mainDart, leftDart, rightDart);

  const _left = new THREE.Matrix4();
  const _right = new THREE.Matrix4();
  const _A = new THREE.Matrix4();

  function currentA() {
    return trsMatrix(Aparams);
  }

  function syncDart(obj, matrix) {
    obj.matrixAutoUpdate = false;
    obj.matrix.copy(matrix);
    obj.updateMatrixWorld(true);
  }

  function updateScene() {
    _A.copy(currentA());
    _left.multiplyMatrices(_A, M);
    _right.multiplyMatrices(M, _A);

    syncDart(mainDart, M);
    syncDart(leftDart, _left);
    syncDart(rightDart, _right);

    const showLeft = previewMode === 'both' || previewMode === 'left';
    const showRight = previewMode === 'both' || previewMode === 'right';
    leftDart.visible = showLeft;
    rightDart.visible = showRight;
  }

  function renderPanels() {
    _A.copy(currentA());
    _left.multiplyMatrices(_A, M);
    _right.multiplyMatrices(M, _A);

    const matM = shell.querySelector('[data-mat-m]');
    const matA = shell.querySelector('[data-mat-a]');
    const matL = shell.querySelector('[data-mat-left]');
    const matR = shell.querySelector('[data-mat-right]');
    const formula = shell.querySelector('[data-formula]');
    const logBody = shell.querySelector('[data-log-body]');

    if (matM) matM.innerHTML = matrixTableHtml(M);
    if (matA) matA.innerHTML = matrixTableHtml(_A);
    if (matL) matL.innerHTML = matrixTableHtml(_left, 'left');
    if (matR) matR.innerHTML = matrixTableHtml(_right, 'right');

    const detsEl = shell.querySelector('[data-dets]');
    if (detsEl) {
      const dM = M.determinant();
      const dA = _A.determinant();
      const dL = _left.determinant();
      const dR = _right.determinant();
      const tip =
        Math.abs(dA) < 1e-8
          ? 'A 把体积压扁（奇异）'
          : dA < 0
            ? 'det(A)&lt;0：朝向翻转'
            : Math.abs(dA - 1) < 1e-6
              ? 'det(A)≈1：体积几乎不变（如纯旋转/平移）'
              : 'det(A) 为体积缩放因子';
      detsEl.innerHTML = `det(M)=<strong>${fmt(dM)}</strong>　det(A)=<strong>${fmt(dA)}</strong>　det(A·M)=<strong class="is-left">${fmt(dL)}</strong>　det(M·A)=<strong class="is-right">${fmt(dR)}</strong><br/><span class="xf-explorer__det-tip">${tip}</span>`;
    }

    if (formula) {
      if (previewMode === 'left') {
        formula.innerHTML = '预览强调：<strong class="is-left">M′ = A · M</strong>（世界系）';
      } else if (previewMode === 'right') {
        formula.innerHTML = '预览强调：<strong class="is-right">M′ = M · A</strong>（物体系）';
      } else {
        formula.innerHTML =
          '并列预览：<strong class="is-left">A · M</strong>　与　<strong class="is-right">M · A</strong>';
      }
    }

    if (logBody) {
      const LOG_UI_MAX = 14;
      logBody.innerHTML = [...log]
        .reverse()
        .slice(0, LOG_UI_MAX)
        .map(
          (row) =>
            `<tr><td>${row.no}</td><td><span class="xf-explorer__op">${escapeHtml(row.op)}</span></td><td>${escapeHtml(row.detail)}</td></tr>`,
        )
        .join('');
    }

    updateScene();
  }

  function applySide(side) {
    const A = currentA();
    if (side === 'left') {
      M = A.clone().multiply(M);
      pushLog('左乘', `M ← A·M（世界系）· A≈ T(${fmt(Aparams.tx)},${fmt(Aparams.ty)},${fmt(Aparams.tz)}) R(${fmt(Aparams.rx)},${fmt(Aparams.ry)},${fmt(Aparams.rz)})`);
    } else {
      M = M.clone().multiply(A);
      pushLog('右乘', `M ← M·A（物体系）· A≈ T(${fmt(Aparams.tx)},${fmt(Aparams.ty)},${fmt(Aparams.tz)}) R(${fmt(Aparams.rx)},${fmt(Aparams.ry)},${fmt(Aparams.rz)})`);
    }
    renderPanels();
  }

  function runScript(id) {
    if (id === 'reset') {
      M = new THREE.Matrix4().identity();
      Aparams = defaultA();
      syncSliderInputs();
      pushLog('重置', 'M ← I，A ← 绕 Y 45°');
      renderPanels();
      return;
    }
    if (id === 'tilt-local') {
      Aparams = { tx: 0, ty: 0, tz: 0, rx: 0, ry: 45, rz: 0, sx: 1, sy: 1, sz: 1 };
      syncSliderInputs();
      M = M.clone().multiply(currentA());
      pushLog('剧本①', '右乘 R_y(45°)：尖端在物体系下偏转（为后续分叉打底）');
      renderPanels();
      return;
    }
    if (id === 'compare-ry') {
      Aparams = { tx: 0, ty: 0, tz: 0, rx: 0, ry: 45, rz: 0, sx: 1, sy: 1, sz: 1 };
      syncSliderInputs();
      previewMode = 'both';
      syncPreviewRadios();
      pushLog('剧本②', 'A = R_y(45°)：看蓝飞镖(A·M)绕世界 Y，绿飞镖(M·A)绕自身 Y');
      renderPanels();
      return;
    }
    if (id === 'compare-tx') {
      Aparams = { tx: 2, ty: 0, tz: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 };
      syncSliderInputs();
      previewMode = 'both';
      syncPreviewRadios();
      pushLog('剧本③', 'A = T(2,0,0)：左乘沿世界 +X，右乘沿局部红轴 — 歪姿态后分叉最明显');
      renderPanels();
      return;
    }
    if (id === 'rt-vs-tr') {
      // M = R, A = T → A·M = T·R（先旋后移），M·A = R·T（先移后旋）
      M = trsMatrix({ tx: 0, ty: 0, tz: 0, rx: 0, ry: 60, rz: 0, sx: 1, sy: 1, sz: 1 });
      Aparams = { tx: 2, ty: 0, tz: 0, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1 };
      syncSliderInputs();
      previewMode = 'both';
      syncPreviewRadios();
      pushLog('剧本', 'M=R_y(60°), A=T(2,0,0)：蓝=A·M=先旋后移；绿=M·A=先移后旋');
      renderPanels();
      return;
    }
    if (id === 'det-scale') {
      M = new THREE.Matrix4().identity();
      Aparams = { tx: 0, ty: 0, tz: 0, rx: 0, ry: 0, rz: 0, sx: 2, sy: 0.5, sz: 1 };
      syncSliderInputs();
      previewMode = 'both';
      syncPreviewRadios();
      pushLog('剧本④', 'A = diag(2,0.5,1)：det(A)=1，体积不变但形状变；看飞镖被拉扁');
      renderPanels();
      return;
    }
    if (id === 'det-reflect') {
      M = new THREE.Matrix4().identity();
      Aparams = { tx: 0, ty: 0, tz: 0, rx: 0, ry: 0, rz: 0, sx: -1, sy: 1, sz: 1 };
      syncSliderInputs();
      previewMode = 'left';
      syncPreviewRadios();
      pushLog('剧本⑤', 'A = diag(-1,1,1)：镜像，det(A)=-1，朝向翻转（尖端左右对调）');
      renderPanels();
    }
  }

  /**
   * @param {string | null} [skipRangeKey] skip rewriting the range currently being dragged
   * @param {string | null} [skipNumKey] skip rewriting the number field being typed
   */
  function syncSliderInputs(skipRangeKey = null, skipNumKey = null) {
    for (const d of sliderDefs) {
      const key = /** @type {keyof typeof Aparams} */ (d.key);
      const val = Aparams[key];
      const range = /** @type {HTMLInputElement | null} */ (
        shell.querySelector(`input.xf-explorer__range[data-key="${d.key}"]`)
      );
      const num = /** @type {HTMLInputElement | null} */ (
        shell.querySelector(`input.xf-explorer__num[data-num-key="${d.key}"]`)
      );
      if (range) {
        range.step = String(activeStep(d));
        if (d.key !== skipRangeKey) range.value = String(val);
      }
      if (num) {
        num.step = String(activeStep(d));
        if (d.key !== skipNumKey && document.activeElement !== num) {
          num.value = String(val);
        }
      }
    }
  }

  function syncPreviewRadios() {
    for (const input of shell.querySelectorAll('input[name="xf-preview"]')) {
      const el = /** @type {HTMLInputElement} */ (input);
      el.checked = el.value === previewMode;
    }
  }

  fineToggle?.addEventListener('change', () => {
    syncSliderInputs();
  });

  sliderHost.addEventListener('pointerdown', (ev) => {
    const t = /** @type {HTMLElement} */ (ev.target);
    if (!(t instanceof HTMLInputElement) || t.type !== 'range' || !t.dataset.key) return;
    const def = sliderByKey.get(t.dataset.key);
    if (!def) return;
    t.step = String(activeStep(def, ev.shiftKey));
  });

  sliderHost.addEventListener('input', (ev) => {
    const t = /** @type {HTMLElement} */ (ev.target);
    if (!(t instanceof HTMLInputElement)) return;
    if (t.dataset.key && t.type === 'range') {
      const keyName = /** @type {keyof typeof Aparams} */ (t.dataset.key);
      const def = sliderByKey.get(keyName);
      if (!def) return;
      const pe = /** @type {InputEvent & { shiftKey?: boolean }} */ (ev);
      setParam(keyName, Number(t.value), {
        shiftKey: Boolean(pe.shiftKey),
        quantizeTo: activeStep(def, Boolean(pe.shiftKey)),
        source: 'range',
      });
      return;
    }
    if (t.dataset.numKey && t.type === 'number') {
      const keyName = /** @type {keyof typeof Aparams} */ (t.dataset.numKey);
      const def = sliderByKey.get(keyName);
      if (!def || t.value === '' || Number.isNaN(Number(t.value))) return;
      setParam(keyName, Number(t.value), { quantizeTo: activeStep(def), source: 'num' });
    }
  });

  sliderHost.addEventListener('change', (ev) => {
    const t = /** @type {HTMLElement} */ (ev.target);
    if (!(t instanceof HTMLInputElement) || t.type !== 'number' || !t.dataset.numKey) return;
    const keyName = /** @type {keyof typeof Aparams} */ (t.dataset.numKey);
    const def = sliderByKey.get(keyName);
    if (!def) return;
    const raw = t.value === '' || Number.isNaN(Number(t.value)) ? Aparams[keyName] : Number(t.value);
    setParam(keyName, raw, { quantizeTo: activeStep(def), source: 'other' });
  });

  sliderHost.addEventListener('click', (ev) => {
    const t = /** @type {HTMLElement} */ (ev.target);
    const nudgeBtn = t.closest('[data-nudge]');
    if (nudgeBtn instanceof HTMLElement && nudgeBtn.dataset.key) {
      const keyName = /** @type {keyof typeof Aparams} */ (nudgeBtn.dataset.key);
      const def = sliderByKey.get(keyName);
      if (!def) return;
      const dir = Number(nudgeBtn.dataset.nudge) || 0;
      const step = activeStep(def, ev.shiftKey);
      setParam(keyName, Aparams[keyName] + dir * step, {
        shiftKey: ev.shiftKey,
        quantizeTo: step,
      });
      return;
    }
    const snapBtn = t.closest('[data-snap-key]');
    if (snapBtn instanceof HTMLElement && snapBtn.dataset.snapKey != null) {
      const keyName = /** @type {keyof typeof Aparams} */ (snapBtn.dataset.snapKey);
      const def = sliderByKey.get(keyName);
      if (!def) return;
      const snapVal = Number(snapBtn.dataset.snapVal);
      setParam(keyName, snapVal, { quantizeTo: def.step });
    }
  });

  shell.querySelectorAll('input[name="xf-preview"]').forEach((input) => {
    input.addEventListener('change', () => {
      const el = /** @type {HTMLInputElement} */ (input);
      if (el.checked) {
        previewMode = /** @type {'both' | 'left' | 'right'} */ (el.value);
        renderPanels();
      }
    });
  });

  shell.querySelector('[data-apply="left"]')?.addEventListener('click', () => applySide('left'));
  shell.querySelector('[data-apply="right"]')?.addEventListener('click', () => applySide('right'));
  shell.querySelector('[data-reset-a]')?.addEventListener('click', () => {
    Aparams = defaultA();
    syncSliderInputs();
    pushLog('A', '重置增量 A 为绕 Y 45°');
    renderPanels();
  });
  shell.querySelector('[data-reset-m]')?.addEventListener('click', () => {
    M = new THREE.Matrix4().identity();
    pushLog('M', 'M ← I');
    renderPanels();
  });
  shell.querySelectorAll('[data-script]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = /** @type {HTMLElement} */ (btn).getAttribute('data-script');
      if (id) runScript(id);
    });
  });

  let raf = 0;
  let disposed = false;

  function resize() {
    const w = Math.max(1, viewportEl.clientWidth);
    const h = Math.max(1, viewportEl.clientHeight || 320);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  const ro = new ResizeObserver(() => resize());
  ro.observe(viewportEl);
  resize();

  function frame() {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    controls.update();
    renderer.render(scene, camera);
  }
  frame();
  renderPanels();

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of mats) m?.dispose?.();
        }
      });
      if (renderer.domElement.parentElement === viewportEl) {
        viewportEl.removeChild(renderer.domElement);
      }
      container.replaceChildren();
    },
  };
}
