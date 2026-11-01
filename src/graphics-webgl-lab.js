/**
 * Beside-notes WebGL practice panel for graphics topic pages.
 * Reuses CodeMirror patterns from shader-toy; supports GLSL VS/FS + short JS WebGL.
 */

import { EditorState } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  placeholder,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import {
  bracketMatching,
  foldGutter,
  indentOnInput,
  syntaxHighlighting,
  defaultHighlightStyle,
} from '@codemirror/language';
import { cpp } from '@codemirror/lang-cpp';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';

const LIVE_MS = 550;
const STORAGE_KEY = 'anonymous-fys-graphics-lab';
const COLLAPSED_KEY = 'anonymous-fys-playground-collapsed';

const PRESETS = {
  triangle: {
    id: 'triangle',
    label: '三角形',
    blurb: 'NDC 彩色三角形：对照第 1 / 3 章 Hello Triangle。',
    mode: 'glsl',
    vs: `attribute vec2 aPos;
attribute vec3 aColor;
varying vec3 vColor;

void main() {
  vColor = aColor;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`,
    fs: `precision mediump float;
varying vec3 vColor;

void main() {
  gl_FragColor = vec4(vColor, 1.0);
}
`,
  },
  mvp: {
    id: 'mvp',
    label: 'MVP 旋转',
    blurb: '主机每帧传入 uMVP；顶点在模型空间，对照第 2 章变换链。',
    mode: 'glsl',
    vs: `attribute vec3 aPos;
attribute vec3 aColor;
uniform mat4 uMVP;
varying vec3 vColor;

void main() {
  vColor = aColor;
  gl_Position = uMVP * vec4(aPos, 1.0);
}
`,
    fs: `precision mediump float;
varying vec3 vColor;

void main() {
  gl_FragColor = vec4(vColor, 1.0);
}
`,
  },
  jsClear: {
    id: 'jsClear',
    label: 'JS 清屏',
    blurb: '短 JS：拿到 gl/canvas，每帧 frame(t) 清屏变色。',
    mode: 'js',
    js: `// 可用参数：gl, canvas
// 返回 { frame(t), dispose? }；t 为秒

gl.enable(gl.DEPTH_TEST);

return {
  frame(t) {
    const r = 0.08 + 0.08 * Math.sin(t);
    const g = 0.1 + 0.05 * Math.cos(t * 0.7);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(r, g, 0.16, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  },
};
`,
  },
};

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function canUseWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext('webgl') || c.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('createShader failed');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) || 'compile error';
    gl.deleteShader(shader);
    throw new Error(info);
  }
  return shader;
}

function linkProgram(gl, vsSource, fsSource) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
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

function editorTheme() {
  return EditorView.theme({
    '&': {
      height: '100%',
      fontSize: '0.78rem',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
    },
    '.cm-scroller': {
      fontFamily: 'var(--font-mono)',
      lineHeight: '1.45',
      overflow: 'auto',
    },
    '&.cm-focused': {
      outline: '2px solid var(--accent-soft)',
      outlineOffset: '0',
      borderColor: 'var(--accent)',
    },
    '.cm-content': { padding: '0.45rem 0', caretColor: 'var(--accent)' },
    '.cm-gutters': {
      backgroundColor: '#0a0e13',
      borderRight: '1px solid var(--border)',
      color: 'var(--muted)',
    },
  });
}

/**
 * @param {HTMLElement} host
 * @param {string} doc
 * @param {'glsl' | 'js'} lang
 * @param {(code: string) => void} onChange
 * @param {() => void} onApply
 */
function createEditor(host, doc, lang, onChange, onApply) {
  return new EditorView({
    parent: host,
    state: EditorState.create({
      doc,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        foldGutter(),
        history(),
        keymap.of([
          indentWithTab,
          ...defaultKeymap,
          ...historyKeymap,
          {
            key: 'Mod-Enter',
            run: () => {
              onApply();
              return true;
            },
          },
        ]),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        oneDark,
        lang === 'js' ? javascript() : cpp(),
        placeholder(lang === 'js' ? '编辑短 JS WebGL…' : '编辑 GLSL…'),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onChange(update.state.doc.toString());
        }),
        editorTheme(),
      ],
    }),
  });
}

function perspective(fovY, aspect, near, far) {
  const f = 1 / Math.tan((fovY * Math.PI) / 180 / 2);
  const nf = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0,
  ]);
}

function lookAt(eye, center, up) {
  let zx = eye[0] - center[0];
  let zy = eye[1] - center[1];
  let zz = eye[2] - center[2];
  let len = Math.hypot(zx, zy, zz) || 1;
  zx /= len; zy /= len; zz /= len;
  let xx = up[1] * zz - up[2] * zy;
  let xy = up[2] * zx - up[0] * zz;
  let xz = up[0] * zy - up[1] * zx;
  len = Math.hypot(xx, xy, xz) || 1;
  xx /= len; xy /= len; xz /= len;
  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;
  return new Float32Array([
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
    -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
    -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
    1,
  ]);
}

/** Column-major 4×4 multiply: out = a * b (WebGL / GLM order). */
function multiply(a, b) {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      out[c * 4 + r] =
        a[0 * 4 + r] * b[c * 4 + 0] +
        a[1 * 4 + r] * b[c * 4 + 1] +
        a[2 * 4 + r] * b[c * 4 + 2] +
        a[3 * 4 + r] * b[c * 4 + 3];
    }
  }
  return out;
}

function rotateY(rad) {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return new Float32Array([c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1]);
}

function readStore() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

function writeStore(partial) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readStore(), ...partial }));
  } catch {
    /* ignore */
  }
}

/**
 * @param {HTMLElement} pane
 * @returns {{ dispose: () => void }}
 */
export function mountGraphicsWebglLab(pane) {
  const stored = readStore();
  /** @type {typeof PRESETS[keyof typeof PRESETS]} */
  let activePreset =
    stored.preset && PRESETS[/** @type {keyof typeof PRESETS} */ (stored.preset)]
      ? PRESETS[/** @type {keyof typeof PRESETS} */ (stored.preset)]
      : PRESETS.triangle;

  /** @type {'vs' | 'fs' | 'js'} */
  let editorKind =
    stored.editorKind === 'fs' || stored.editorKind === 'js' || stored.editorKind === 'vs'
      ? stored.editorKind
      : 'vs';
  if (activePreset.mode === 'js') editorKind = 'js';
  else if (editorKind === 'js') editorKind = 'vs';

  let live = stored.live !== false;
  let disposed = false;
  let debounceTimer = 0;
  let raf = 0;
  const start = performance.now();
  /** @type {WebGLProgram | null} */
  let program = null;
  /** @type {{ frame?: (t: number) => void, dispose?: () => void } | null} */
  let jsHooks = null;
  let suppress = false;

  const docs = {
    vs: typeof stored.vs === 'string' ? stored.vs : activePreset.vs || PRESETS.triangle.vs,
    fs: typeof stored.fs === 'string' ? stored.fs : activePreset.fs || PRESETS.triangle.fs,
    js: typeof stored.js === 'string' ? stored.js : PRESETS.jsClear.js,
  };
  // Fresh preset wins when no stored overrides for current glsl preset.
  if (activePreset.mode === 'glsl' && stored.preset !== activePreset.id) {
    docs.vs = activePreset.vs || docs.vs;
    docs.fs = activePreset.fs || docs.fs;
  }

  pane.innerHTML = `
    <div class="gw-lab" data-gw-lab>
      <header class="playground-header">
        <div class="playground-title-row">
          <h2 class="playground-title">WebGL 练习</h2>
          <button type="button" class="playground-icon-btn" data-gw-collapse title="收起面板" aria-label="收起面板">⟨</button>
        </div>
        <div class="playground-tabs" role="tablist" aria-label="预设">
          ${Object.values(PRESETS)
            .map(
              (p) =>
                `<button type="button" class="playground-tab${p.id === activePreset.id ? ' is-active' : ''}" role="tab" data-gw-preset="${escapeHtml(p.id)}" aria-selected="${p.id === activePreset.id}">${escapeHtml(p.label)}</button>`,
            )
            .join('')}
        </div>
      </header>
      <p class="playground-hint" data-gw-blurb>${escapeHtml(activePreset.blurb)}</p>
      <div class="gw-lab__stage" role="img" aria-label="WebGL 练习画布">
        <canvas data-gw-canvas width="480" height="270"></canvas>
      </div>
      <p class="gw-lab__fallback" data-gw-fallback hidden>当前环境无法使用 WebGL。</p>
      <div class="playground-tabs gw-lab__editor-tabs" role="tablist" aria-label="编辑对象">
        <button type="button" class="playground-tab" role="tab" data-gw-kind="vs">顶点 VS</button>
        <button type="button" class="playground-tab" role="tab" data-gw-kind="fs">片元 FS</button>
        <button type="button" class="playground-tab" role="tab" data-gw-kind="js">短 JS</button>
      </div>
      <div class="gw-lab__editor-host" data-gw-editor></div>
      <div class="playground-actions">
        <button type="button" class="playground-btn playground-btn--primary" data-gw-apply>应用</button>
        <label class="gw-lab__toggle"><input type="checkbox" data-gw-live ${live ? 'checked' : ''} /> 自动编译</label>
        <button type="button" class="playground-btn" data-gw-reset>重置预设</button>
      </div>
      <pre class="gw-lab__error" data-gw-error hidden></pre>
      <p class="gw-lab__status" data-gw-status>就绪</p>
    </div>
  `;

  const canvas = /** @type {HTMLCanvasElement} */ (pane.querySelector('[data-gw-canvas]'));
  const stage = /** @type {HTMLElement} */ (pane.querySelector('.gw-lab__stage'));
  const fallback = /** @type {HTMLElement} */ (pane.querySelector('[data-gw-fallback]'));
  const editorHost = /** @type {HTMLElement} */ (pane.querySelector('[data-gw-editor]'));
  const errorEl = /** @type {HTMLElement} */ (pane.querySelector('[data-gw-error]'));
  const statusEl = /** @type {HTMLElement} */ (pane.querySelector('[data-gw-status]'));
  const blurbEl = /** @type {HTMLElement} */ (pane.querySelector('[data-gw-blurb]'));
  const shell = pane.closest('.app-shell');
  shell?.classList.add('is-graphics-lab');
  pane.setAttribute('aria-label', 'WebGL 练习');

  function setStatus(text, kind = 'ok') {
    statusEl.textContent = text;
    statusEl.dataset.kind = kind;
  }

  function setError(message) {
    if (!message) {
      errorEl.hidden = true;
      errorEl.textContent = '';
      return;
    }
    errorEl.hidden = false;
    errorEl.textContent = message;
  }

  function syncKindTabs() {
    pane.querySelectorAll('[data-gw-kind]').forEach((btn) => {
      const kind = btn.getAttribute('data-gw-kind');
      const on = kind === editorKind;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  function persist() {
    writeStore({
      preset: activePreset.id,
      editorKind,
      live,
      vs: docs.vs,
      fs: docs.fs,
      js: docs.js,
    });
  }

  const gl = canUseWebGL()
    ? /** @type {WebGLRenderingContext | null} */ (
        canvas.getContext('webgl', { alpha: false, antialias: true }) ||
          canvas.getContext('experimental-webgl', { alpha: false, antialias: true })
      )
    : null;

  if (!gl) {
    stage.hidden = true;
    fallback.hidden = false;
    setStatus('无 WebGL', 'error');
  }

  /** @type {WebGLBuffer | null} */
  let tri2d = null;
  /** @type {WebGLBuffer | null} */
  let tri3d = null;
  if (gl) {
    tri2d = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tri2d);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0, 0.65, 0.95, 0.35, 0.35, -0.7, -0.55, 0.3, 0.85, 0.4, 0.7, -0.55, 0.35, 0.45, 0.95,
      ]),
      gl.STATIC_DRAW,
    );
    tri3d = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tri3d);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0, 0.55, 0, 0.95, 0.4, 0.35, -0.6, -0.45, 0, 0.3, 0.8, 0.45, 0.6, -0.45, 0, 0.35, 0.5, 0.95,
      ]),
      gl.STATIC_DRAW,
    );
  }

  function resizeCanvas() {
    if (!gl) return;
    const rect = stage.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(Math.max(rect.height, 140) * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function disposeJsHooks() {
    try {
      jsHooks?.dispose?.();
    } catch {
      /* ignore */
    }
    jsHooks = null;
  }

  function bindGlslAttributes(presetId) {
    if (!gl || !program) return;
    const aPos = gl.getAttribLocation(program, 'aPos');
    const aColor = gl.getAttribLocation(program, 'aColor');
    const isMvp = presetId === 'mvp';
    const buf = isMvp ? tri3d : tri2d;
    const stride = (isMvp ? 6 : 5) * 4;
    const posSize = isMvp ? 3 : 2;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    if (aPos >= 0) {
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, posSize, gl.FLOAT, false, stride, 0);
    }
    if (aColor >= 0) {
      gl.enableVertexAttribArray(aColor);
      gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, stride, posSize * 4);
    }
  }

  function compileGlsl() {
    if (!gl) throw new Error('WebGL unavailable');
    const next = linkProgram(gl, docs.vs, docs.fs);
    if (program) gl.deleteProgram(program);
    program = next;
    gl.useProgram(program);
    bindGlslAttributes(activePreset.id);
    setError('');
    setStatus('GLSL 编译/链接成功', 'ok');
  }

  function compileJs() {
    if (!gl) throw new Error('WebGL unavailable');
    disposeJsHooks();
    const runner = new Function('gl', 'canvas', `"use strict";\n${docs.js}\n`);
    const result = runner(gl, canvas);
    if (!result || typeof result !== 'object') {
      throw new Error('JS 练习需 return { frame(t) { ... } }');
    }
    jsHooks = result;
    if (program) {
      gl.deleteProgram(program);
      program = null;
    }
    setError('');
    setStatus('JS 练习已应用', 'ok');
  }

  function flushCurrentDoc() {
    const cur = editorRef.view.state.doc.toString();
    if (editorKind === 'js') docs.js = cur;
    else if (editorKind === 'fs') docs.fs = cur;
    else docs.vs = cur;
  }

  function applyNow() {
    if (disposed) return;
    window.clearTimeout(debounceTimer);
    debounceTimer = 0;
    flushCurrentDoc();
    try {
      if (editorKind === 'js' || activePreset.mode === 'js') compileJs();
      else {
        disposeJsHooks();
        compileGlsl();
      }
      persist();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('失败（尽量保留上一状态）', 'error');
    }
  }

  function scheduleLive() {
    if (!live || disposed) return;
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => applyNow(), LIVE_MS);
    setStatus('输入中…将自动应用', 'pending');
  }

  /** @type {{ view: EditorView }} */
  const editorRef = {
    view: createEditor(
      editorHost,
      editorKind === 'js' ? docs.js : editorKind === 'fs' ? docs.fs : docs.vs,
      editorKind === 'js' ? 'js' : 'glsl',
      (code) => {
        if (suppress || disposed) return;
        if (editorKind === 'js') docs.js = code;
        else if (editorKind === 'fs') docs.fs = code;
        else docs.vs = code;
        persist();
        scheduleLive();
      },
      () => applyNow(),
    ),
  };

  function remountEditor() {
    const nextDoc = editorKind === 'js' ? docs.js : editorKind === 'fs' ? docs.fs : docs.vs;
    editorRef.view.destroy();
    editorHost.innerHTML = '';
    editorRef.view = createEditor(
      editorHost,
      nextDoc,
      editorKind === 'js' ? 'js' : 'glsl',
      (code) => {
        if (suppress || disposed) return;
        if (editorKind === 'js') docs.js = code;
        else if (editorKind === 'fs') docs.fs = code;
        else docs.vs = code;
        persist();
        scheduleLive();
      },
      () => applyNow(),
    );
    syncKindTabs();
    persist();
  }

  function switchKind(kind) {
    flushCurrentDoc();
    editorKind = kind;
    remountEditor();
  }

  function loadExternalDoc(code, lang) {
    const key = (lang || '').toLowerCase();
    flushCurrentDoc();
    if (key === 'js' || key === 'javascript') {
      docs.js = code;
      editorKind = 'js';
    } else if (key === 'vs' || key === 'vert' || key === 'vertex') {
      docs.vs = code;
      editorKind = 'vs';
    } else {
      docs.fs = code;
      editorKind = 'fs';
    }
    remountEditor();
    applyNow();
  }

  syncKindTabs();

  pane.querySelectorAll('[data-gw-kind]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const kind = btn.getAttribute('data-gw-kind');
      if (kind === 'vs' || kind === 'fs' || kind === 'js') switchKind(kind);
    });
  });

  pane.querySelectorAll('[data-gw-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = /** @type {keyof typeof PRESETS} */ (btn.getAttribute('data-gw-preset') || '');
      const preset = PRESETS[id];
      if (!preset) return;
      flushCurrentDoc();
      activePreset = preset;
      blurbEl.textContent = preset.blurb;
      pane.querySelectorAll('[data-gw-preset]').forEach((b) => {
        const on = b.getAttribute('data-gw-preset') === id;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      if (preset.mode === 'js') {
        docs.js = preset.js || docs.js;
        editorKind = 'js';
      } else {
        docs.vs = preset.vs || docs.vs;
        docs.fs = preset.fs || docs.fs;
        if (editorKind === 'js') editorKind = 'vs';
      }
      remountEditor();
      applyNow();
    });
  });

  pane.querySelector('[data-gw-apply]')?.addEventListener('click', () => applyNow());
  pane.querySelector('[data-gw-live]')?.addEventListener('change', (event) => {
    live = /** @type {HTMLInputElement} */ (event.target).checked;
    persist();
  });
  pane.querySelector('[data-gw-reset]')?.addEventListener('click', () => {
    if (activePreset.mode === 'js') {
      docs.js = activePreset.js || PRESETS.jsClear.js;
      editorKind = 'js';
    } else {
      docs.vs = activePreset.vs || PRESETS.triangle.vs;
      docs.fs = activePreset.fs || PRESETS.triangle.fs;
      if (editorKind === 'js') editorKind = 'vs';
    }
    remountEditor();
    applyNow();
  });

  pane.querySelector('[data-gw-collapse]')?.addEventListener('click', () => {
    const sh = pane.closest('.app-shell');
    if (!sh) return;
    sh.classList.add('is-playground-collapsed');
    try {
      sessionStorage.setItem(COLLAPSED_KEY, '1');
    } catch {
      /* ignore */
    }
    let fab = sh.querySelector('[data-pg-expand]');
    if (!fab) {
      fab = document.createElement('button');
      fab.type = 'button';
      fab.className = 'playground-expand-fab';
      fab.setAttribute('data-pg-expand', '');
      fab.addEventListener('click', () => {
        sh.classList.remove('is-playground-collapsed');
        try {
          sessionStorage.setItem(COLLAPSED_KEY, '0');
        } catch {
          /* ignore */
        }
        fab?.remove();
      });
      sh.appendChild(fab);
    }
    fab.textContent = 'WebGL 练习';
    fab.title = '展开 WebGL 练习面板';
  });

  /** @param {Event} event */
  const onReload = (event) => {
    const detail = /** @type {CustomEvent<{ code: string, lang: string }>} */ (event).detail;
    if (!detail?.code) return;
    loadExternalDoc(detail.code, detail.lang);
  };
  window.addEventListener('gw-lab-reload-doc', onReload);

  function drawFrame(now) {
    if (disposed) return;
    raf = requestAnimationFrame(drawFrame);
    if (!gl) return;
    resizeCanvas();
    const t = (now - start) / 1000;

    if (jsHooks?.frame) {
      try {
        jsHooks.frame(t);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus('JS frame 异常', 'error');
      }
      return;
    }

    if (!program) return;
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.07, 0.08, 0.11, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);
    bindGlslAttributes(activePreset.id);

    const uMVP = gl.getUniformLocation(program, 'uMVP');
    if (uMVP) {
      const aspect = canvas.width / Math.max(canvas.height, 1);
      const P = perspective(45, aspect, 0.1, 100);
      const V = lookAt([0, 0.15, 2.4], [0, 0, 0], [0, 1, 0]);
      const M = rotateY(t);
      gl.uniformMatrix4fv(uMVP, false, multiply(P, multiply(V, M)));
    }
    const uTime = gl.getUniformLocation(program, 'uTime');
    if (uTime) gl.uniform1f(uTime, t);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  applyNow();
  raf = requestAnimationFrame(drawFrame);

  return {
    dispose() {
      disposed = true;
      window.clearTimeout(debounceTimer);
      cancelAnimationFrame(raf);
      window.removeEventListener('gw-lab-reload-doc', onReload);
      disposeJsHooks();
      try {
        editorRef.view.destroy();
      } catch {
        /* ignore */
      }
      if (gl && program) gl.deleteProgram(program);
      if (gl && tri2d) gl.deleteBuffer(tri2d);
      if (gl && tri3d) gl.deleteBuffer(tri3d);
      try {
        gl?.getExtension('WEBGL_lose_context')?.loseContext();
      } catch {
        /* ignore */
      }
      shell?.classList.remove('is-graphics-lab');
      pane.innerHTML = '';
      pane.setAttribute('aria-label', '代码 Playground');
    },
  };
}

/**
 * @param {string} code
 * @param {string} lang
 * @param {HTMLElement | null | undefined} pane
 */
export function loadIntoGraphicsLab(code, lang, pane) {
  if (!pane?.querySelector('[data-gw-lab]')) return false;
  window.dispatchEvent(
    new CustomEvent('gw-lab-reload-doc', { detail: { code, lang: (lang || '').toLowerCase() } }),
  );
  const shell = pane.closest('.app-shell');
  if (shell?.classList.contains('is-playground-collapsed')) {
    shell.classList.remove('is-playground-collapsed');
    try {
      sessionStorage.setItem(COLLAPSED_KEY, '0');
    } catch {
      /* ignore */
    }
    shell.querySelector('[data-pg-expand]')?.remove();
  }
  return true;
}
