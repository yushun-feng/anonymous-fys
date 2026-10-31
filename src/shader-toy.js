/**
 * Lightweight WebGL fragment-shader showcase (ShaderToy-style).
 * Fullscreen quad + a few presets; uniforms exposed as sliders.
 */

const VERT = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

/** Shared helpers prepended to every preset fragment source. */
const FRAG_PRELUDE = `
precision highp float;
uniform vec3 iResolution;
uniform float iTime;
uniform vec4 iMouse;
uniform float uSpeed;
uniform float uScale;
uniform float uContrast;
uniform float uHue;
`;

const PRESETS = [
  {
    id: 'plasma',
    label: 'Plasma',
    blurb: '经典等离子色场，调速度与对比度。',
    uniforms: [
      { key: 'uSpeed', label: '速度', min: 0.1, max: 3, step: 0.05, value: 1 },
      { key: 'uScale', label: '尺度', min: 0.4, max: 4, step: 0.05, value: 1.2 },
      { key: 'uContrast', label: '对比', min: 0.4, max: 2, step: 0.05, value: 1 },
      { key: 'uHue', label: '色相偏移', min: 0, max: 6.28, step: 0.05, value: 0 },
    ],
    source: `
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
  float t = iTime * uSpeed;
  float v = 0.0;
  v += sin((uv.x + t) * 4.0 * uScale);
  v += sin((uv.y + t * 0.7) * 3.2 * uScale);
  v += sin((uv.x + uv.y + t * 0.5) * 2.4 * uScale);
  vec2 c = uv + 0.35 * vec2(sin(t * 0.4), cos(t * 0.33));
  v += sin(length(c) * 8.0 * uScale - t * 2.0);
  v = v * 0.25 * uContrast + 0.5;
  vec3 col = 0.5 + 0.5 * cos(6.2831 * (v + vec3(0.0, 0.33, 0.67) + uHue / 6.2831));
  gl_FragColor = vec4(col, 1.0);
}
`,
  },
  {
    id: 'mandelbrot',
    label: 'Mandelbrot',
    blurb: 'Julia/Mandelbrot 混合探索；鼠标拖动可平移中心。',
    uniforms: [
      { key: 'uSpeed', label: '动画', min: 0, max: 2, step: 0.05, value: 0.6 },
      { key: 'uScale', label: '缩放', min: 0.3, max: 8, step: 0.05, value: 1.6 },
      { key: 'uContrast', label: '迭代感', min: 0.5, max: 2.5, step: 0.05, value: 1.2 },
      { key: 'uHue', label: '色相', min: 0, max: 6.28, step: 0.05, value: 1.2 },
    ],
    source: `
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
  vec2 mouse = (iMouse.xy - 0.5 * iResolution.xy) / iResolution.y;
  if (iMouse.z < 0.5) mouse = vec2(0.0);
  float zoom = uScale;
  vec2 c = uv / zoom + mouse * 0.55 + vec2(-0.45, 0.0);
  // Mild time warp on Julia blend
  vec2 z = c;
  vec2 k = 0.7885 * vec2(cos(iTime * uSpeed * 0.35 + uHue), sin(iTime * uSpeed * 0.35));
  float m = 0.0;
  const int MAX = 64;
  for (int i = 0; i < MAX; i++) {
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + mix(c, k, 0.55);
    if (dot(z, z) > 16.0) break;
    m += 1.0;
  }
  float t = m / float(MAX);
  t = pow(t, 1.0 / max(uContrast, 0.01));
  vec3 col = 0.5 + 0.5 * cos(6.2831 * (t + vec3(0.0, 0.15, 0.35) + uHue * 0.08));
  col *= smoothstep(0.0, 0.08, t);
  gl_FragColor = vec4(col, 1.0);
}
`,
  },
  {
    id: 'tunnel',
    label: 'Neon Tunnel',
    blurb: '霓虹隧道；尺度控制环密度。',
    uniforms: [
      { key: 'uSpeed', label: '前进速度', min: 0.1, max: 3, step: 0.05, value: 1.1 },
      { key: 'uScale', label: '环密度', min: 0.5, max: 4, step: 0.05, value: 1.5 },
      { key: 'uContrast', label: '亮度', min: 0.4, max: 2.2, step: 0.05, value: 1.1 },
      { key: 'uHue', label: '色相', min: 0, max: 6.28, step: 0.05, value: 0.4 },
    ],
    source: `
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
  float a = atan(uv.y, uv.x);
  float r = length(uv);
  float z = 1.0 / max(r, 0.05) + iTime * uSpeed * 2.0;
  float rings = sin(z * 3.0 * uScale + a * 6.0);
  float spokes = sin(a * 10.0 + iTime * uSpeed);
  float v = rings * 0.55 + spokes * 0.25;
  v = v * 0.5 + 0.5;
  vec3 col = 0.45 + 0.55 * cos(6.2831 * (v + vec3(0.0, 0.25, 0.5) + uHue / 6.2831));
  col *= (0.25 + 0.75 * smoothstep(1.2, 0.05, r)) * uContrast;
  gl_FragColor = vec4(col, 1.0);
}
`,
  },
  {
    id: 'raymarch',
    label: 'Soft Spheres',
    blurb: '简易 raymarch 软球；鼠标影响光照方向。',
    uniforms: [
      { key: 'uSpeed', label: '旋转', min: 0, max: 2.5, step: 0.05, value: 0.8 },
      { key: 'uScale', label: '球间距', min: 0.6, max: 2.2, step: 0.05, value: 1 },
      { key: 'uContrast', label: '光感', min: 0.5, max: 2.5, step: 0.05, value: 1.2 },
      { key: 'uHue', label: '材质色相', min: 0, max: 6.28, step: 0.05, value: 2.1 },
    ],
    source: `
float sdSphere(vec3 p, float r) { return length(p) - r; }

float map(vec3 p) {
  float t = iTime * uSpeed;
  vec3 a = p - vec3(sin(t) * 0.55 * uScale, 0.1, cos(t * 0.8) * 0.45);
  vec3 b = p - vec3(cos(t * 0.7) * 0.5, sin(t * 1.1) * 0.35, -0.2);
  vec3 c = p - vec3(0.0, -0.35, sin(t * 0.5) * 0.4);
  float d = sdSphere(a, 0.42);
  d = min(d, sdSphere(b, 0.34));
  d = min(d, sdSphere(c, 0.5));
  d = min(d, p.y + 0.85);
  return d;
}

vec3 calcNormal(vec3 p) {
  vec2 e = vec2(0.001, 0.0);
  return normalize(vec3(
    map(p + e.xyy) - map(p - e.xyy),
    map(p + e.yxy) - map(p - e.yxy),
    map(p + e.yyx) - map(p - e.yyx)
  ));
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
  vec3 ro = vec3(0.0, 0.15, 2.6);
  vec3 rd = normalize(vec3(uv, -1.4));
  float t = 0.0;
  float hit = 0.0;
  for (int i = 0; i < 64; i++) {
    vec3 p = ro + rd * t;
    float d = map(p);
    if (d < 0.001) { hit = 1.0; break; }
    t += d;
    if (t > 12.0) break;
  }
  vec3 col = vec3(0.04, 0.05, 0.08);
  if (hit > 0.5) {
    vec3 p = ro + rd * t;
    vec3 n = calcNormal(p);
    vec2 m = iMouse.xy / max(iResolution.xy, vec2(1.0));
    if (iMouse.z < 0.5) m = vec2(0.55, 0.45);
    vec3 light = normalize(vec3(m.x * 2.0 - 1.0, m.y * 2.0 - 0.2, 0.8));
    float diff = max(dot(n, light), 0.0);
    float spec = pow(max(dot(reflect(-light, n), -rd), 0.0), 32.0);
    vec3 base = 0.5 + 0.5 * cos(uHue + vec3(0.0, 2.0, 4.0) + n.y);
    col = base * (0.18 + 0.82 * diff) * uContrast + vec3(spec * 0.65);
  }
  col = mix(col, vec3(0.05, 0.07, 0.12), 1.0 - exp(-0.08 * t * t));
  gl_FragColor = vec4(col, 1.0);
}
`,
  },
  {
    id: 'noise',
    label: 'FBM Domain',
    blurb: '分形噪声域扭曲；适合当 GPU 噪声直觉演示。',
    uniforms: [
      { key: 'uSpeed', label: '流动', min: 0, max: 2, step: 0.05, value: 0.55 },
      { key: 'uScale', label: '频率', min: 0.5, max: 5, step: 0.05, value: 2.2 },
      { key: 'uContrast', label: '对比', min: 0.4, max: 2.5, step: 0.05, value: 1.15 },
      { key: 'uHue', label: '色相', min: 0, max: 6.28, step: 0.05, value: 3.4 },
    ],
    source: `
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
  float t = iTime * uSpeed;
  vec2 p = uv * uScale;
  p += 0.35 * vec2(fbm(p + t), fbm(p + 3.1 - t));
  float n = fbm(p + fbm(p + t * 0.4));
  n = pow(clamp(n, 0.0, 1.0), 1.0 / max(uContrast, 0.01));
  vec3 col = 0.5 + 0.5 * cos(6.2831 * (n + vec3(0.0, 0.2, 0.45) + uHue / 6.2831));
  gl_FragColor = vec4(col, 1.0);
}
`,
  },
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

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) || 'compile error';
    gl.deleteShader(shader);
    throw new Error(info);
  }
  return shader;
}

function createProgram(gl, fragSource) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERT);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_PRELUDE + fragSource);
  if (!vs || !fs) throw new Error('shader create failed');
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) || 'link error';
    gl.deleteProgram(program);
    throw new Error(info);
  }
  return program;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Mount a realtime WebGL shader toy into `container`.
 * Returns `{ dispose }` for tear-down on route change.
 * @param {HTMLElement} container
 * @param {{ compact?: boolean }} [options]
 */
export function mountShaderToy(container, { compact = false } = {}) {
  const shell = document.createElement('section');
  shell.className = `shader-toy${compact ? ' shader-toy--compact' : ''}`;

  const presetButtons = PRESETS.map(
    (p, i) =>
      `<button type="button" class="shader-toy__preset${i === 0 ? ' is-active' : ''}" data-preset="${escapeHtml(p.id)}">${escapeHtml(p.label)}</button>`,
  ).join('');

  shell.innerHTML = `
    <div class="shader-toy__toolbar">
      <div class="shader-toy__presets" role="tablist" aria-label="着色器预设">${presetButtons}</div>
      ${
        compact
          ? ''
          : `<label class="shader-toy__toggle"><input type="checkbox" data-pause /> 暂停</label>`
      }
    </div>
    <p class="shader-toy__blurb" data-blurb>${escapeHtml(PRESETS[0].blurb)}</p>
    <div class="shader-toy__sliders" data-sliders></div>
    <div class="shader-toy__stage" role="img" aria-label="实时片段着色器画布">
      <canvas data-canvas></canvas>
    </div>
    <p class="shader-toy__fallback" hidden>当前环境无法使用 WebGL，已跳过 Shader Toy 展示。</p>
  `;
  container.appendChild(shell);

  const canvas = /** @type {HTMLCanvasElement} */ (shell.querySelector('[data-canvas]'));
  const stage = /** @type {HTMLElement} */ (shell.querySelector('.shader-toy__stage'));
  const slidersEl = /** @type {HTMLElement} */ (shell.querySelector('[data-sliders]'));
  const blurbEl = /** @type {HTMLElement} */ (shell.querySelector('[data-blurb]'));
  const fallback = /** @type {HTMLElement} */ (shell.querySelector('.shader-toy__fallback'));
  const pauseInput = /** @type {HTMLInputElement | null} */ (shell.querySelector('[data-pause]'));

  if (!canUseWebGL()) {
    stage.hidden = true;
    slidersEl.hidden = true;
    fallback.hidden = false;
    return {
      dispose() {
        shell.remove();
      },
    };
  }

  const gl = /** @type {WebGLRenderingContext} */ (
    canvas.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: false }) ||
      canvas.getContext('experimental-webgl', { alpha: false, antialias: false })
  );

  if (!gl) {
    stage.hidden = true;
    slidersEl.hidden = true;
    fallback.hidden = false;
    return {
      dispose() {
        shell.remove();
      },
    };
  }

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

  /** @type {WebGLProgram | null} */
  let program = null;
  /** @type {Record<string, WebGLUniformLocation | null>} */
  let locs = {};
  /** @type {Record<string, number>} */
  let values = {};
  let disposed = false;
  let paused = false;
  let raf = 0;
  let start = performance.now();
  let pausedAt = 0;
  const mouse = { x: 0, y: 0, z: 0, w: 0 };

  function cacheLocations(prog) {
    locs = {
      iResolution: gl.getUniformLocation(prog, 'iResolution'),
      iTime: gl.getUniformLocation(prog, 'iTime'),
      iMouse: gl.getUniformLocation(prog, 'iMouse'),
      uSpeed: gl.getUniformLocation(prog, 'uSpeed'),
      uScale: gl.getUniformLocation(prog, 'uScale'),
      uContrast: gl.getUniformLocation(prog, 'uContrast'),
      uHue: gl.getUniformLocation(prog, 'uHue'),
      a_position: gl.getAttribLocation(prog, 'a_position'),
    };
  }

  function applyUniformDefaults(preset) {
    values = {};
    for (const u of preset.uniforms) values[u.key] = u.value;
  }

  function renderSliders(preset) {
    if (compact) {
      slidersEl.innerHTML = '';
      slidersEl.hidden = true;
      return;
    }
    slidersEl.hidden = false;
    slidersEl.innerHTML = preset.uniforms
      .map(
        (u) => `
      <label class="shader-toy__slider">
        <span class="shader-toy__slider-label">${escapeHtml(u.label)} <em data-val-for="${escapeHtml(u.key)}">${u.value.toFixed(2)}</em></span>
        <input type="range" data-uniform="${escapeHtml(u.key)}" min="${u.min}" max="${u.max}" step="${u.step}" value="${u.value}" />
      </label>`,
      )
      .join('');
    slidersEl.querySelectorAll('[data-uniform]').forEach((input) => {
      input.addEventListener('input', () => {
        const key = input.getAttribute('data-uniform') || '';
        const num = Number(/** @type {HTMLInputElement} */ (input).value);
        values[key] = num;
        const label = slidersEl.querySelector(`[data-val-for="${key}"]`);
        if (label) label.textContent = num.toFixed(2);
      });
    });
  }

  function setPreset(id) {
    const idx = PRESETS.findIndex((p) => p.id === id);
    if (idx < 0) return;
    presetIndex = idx;
    const preset = PRESETS[idx];
    blurbEl.textContent = preset.blurb;
    shell.querySelectorAll('[data-preset]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-preset') === id);
    });
    try {
      const next = createProgram(gl, preset.source);
      if (program) gl.deleteProgram(program);
      program = next;
      gl.useProgram(program);
      cacheLocations(program);
      applyUniformDefaults(preset);
      renderSliders(preset);
    } catch (err) {
      blurbEl.textContent = `着色器编译失败：${err instanceof Error ? err.message : String(err)}`;
    }
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, compact ? 1.25 : 2);
    const rect = stage.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  function frame(now) {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    if (paused || !program) return;
    resize();
    const t = (now - start) * 0.001;
    gl.useProgram(program);
    const aPos = /** @type {number} */ (locs.a_position);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    if (locs.iResolution) gl.uniform3f(locs.iResolution, canvas.width, canvas.height, 1);
    if (locs.iTime) gl.uniform1f(locs.iTime, t);
    if (locs.iMouse) gl.uniform4f(locs.iMouse, mouse.x, mouse.y, mouse.z, mouse.w);
    if (locs.uSpeed) gl.uniform1f(locs.uSpeed, values.uSpeed ?? 1);
    if (locs.uScale) gl.uniform1f(locs.uScale, values.uScale ?? 1);
    if (locs.uContrast) gl.uniform1f(locs.uContrast, values.uContrast ?? 1);
    if (locs.uHue) gl.uniform1f(locs.uHue, values.uHue ?? 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function toCanvasMouse(ev) {
    const rect = canvas.getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / Math.max(rect.width, 1)) * canvas.width;
    const y = (1 - (ev.clientY - rect.top) / Math.max(rect.height, 1)) * canvas.height;
    return { x, y };
  }

  function onPointerDown(ev) {
    const p = toCanvasMouse(ev);
    mouse.x = p.x;
    mouse.y = p.y;
    mouse.z = p.x;
    mouse.w = p.y;
    stage.setPointerCapture?.(ev.pointerId);
  }
  function onPointerMove(ev) {
    if (mouse.z <= 0 && ev.buttons === 0) return;
    const p = toCanvasMouse(ev);
    mouse.x = p.x;
    mouse.y = p.y;
  }
  function onPointerUp() {
    mouse.z = 0;
    mouse.w = 0;
  }

  stage.addEventListener('pointerdown', onPointerDown);
  stage.addEventListener('pointermove', onPointerMove);
  stage.addEventListener('pointerup', onPointerUp);
  stage.addEventListener('pointercancel', onPointerUp);
  stage.addEventListener('pointerleave', onPointerUp);

  shell.querySelectorAll('[data-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-preset') || '';
      setPreset(id);
    });
  });

  pauseInput?.addEventListener('change', () => {
    paused = !!pauseInput.checked;
    if (paused) {
      pausedAt = performance.now();
    } else {
      start += performance.now() - pausedAt;
    }
  });

  const onResize = () => resize();
  window.addEventListener('resize', onResize);

  // Compact home preview: soft spheres looks distinctive at a glance.
  setPreset(compact ? 'raymarch' : PRESETS[0].id);
  resize();
  raf = requestAnimationFrame(frame);

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerup', onPointerUp);
      stage.removeEventListener('pointercancel', onPointerUp);
      stage.removeEventListener('pointerleave', onPointerUp);
      if (program) gl.deleteProgram(program);
      if (quad) gl.deleteBuffer(quad);
      const ext = gl.getExtension('WEBGL_lose_context');
      ext?.loseContext();
      shell.remove();
    },
  };
}

export { PRESETS };
