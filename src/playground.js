/**
 * Right-side code playground: in-browser JS/TS runner + Compiler Explorer embed for C++.
 * Mount once after unlock so hash navigations do not wipe editor state.
 */

const WIDTH_KEY = 'anonymous-fys-playground-width';
const COLLAPSED_KEY = 'anonymous-fys-playground-collapsed';
const LANG_KEY = 'anonymous-fys-playground-lang';
const CODE_KEY_PREFIX = 'anonymous-fys-playground-code:';

const MIN_WIDTH = 280;
const MAX_WIDTH_RATIO = 0.62;
const DEFAULT_WIDTH = 400;

const SAMPLES = {
  js: `// 浏览器内运行（沙箱 iframe）
console.log('hello from JS');
const nums = [1, 2, 3].map((n) => n * 2);
console.log('nums =', nums);`,
  ts: `// TypeScript 经 Sucrase 转译后在沙箱中运行
type Point = { x: number; y: number };
const p: Point = { x: 3, y: 4 };
const len = Math.hypot(p.x, p.y);
console.log('length =', len.toFixed(2));`,
  cpp: `#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::vector<int> v{1, 2, 3, 4};
    int sum = std::accumulate(v.begin(), v.end(), 0);
    std::cout << "sum = " << sum << "\\n";
    return 0;
}`,
};

/** @type {{ root: HTMLElement, editor: HTMLTextAreaElement, output: HTMLElement, frameHost: HTMLElement, lang: string } | null} */
let state = null;

function readStoredWidth() {
  try {
    const n = Number(sessionStorage.getItem(WIDTH_KEY));
    if (Number.isFinite(n) && n >= MIN_WIDTH) return n;
  } catch {
    /* ignore */
  }
  return DEFAULT_WIDTH;
}

function writeStoredWidth(width) {
  try {
    sessionStorage.setItem(WIDTH_KEY, String(Math.round(width)));
  } catch {
    /* ignore */
  }
}

function isCollapsed() {
  try {
    return sessionStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

function setCollapsed(collapsed) {
  try {
    sessionStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
  } catch {
    /* ignore */
  }
}

function readLang() {
  try {
    const lang = sessionStorage.getItem(LANG_KEY);
    if (lang === 'js' || lang === 'ts' || lang === 'cpp') return lang;
  } catch {
    /* ignore */
  }
  return 'js';
}

function writeLang(lang) {
  try {
    sessionStorage.setItem(LANG_KEY, lang);
  } catch {
    /* ignore */
  }
}

function readCode(lang) {
  try {
    const saved = sessionStorage.getItem(CODE_KEY_PREFIX + lang);
    if (saved != null) return saved;
  } catch {
    /* ignore */
  }
  return SAMPLES[lang] || '';
}

function writeCode(lang, code) {
  try {
    sessionStorage.setItem(CODE_KEY_PREFIX + lang, code);
  } catch {
    /* ignore */
  }
}

/**
 * Build a Compiler Explorer clientstate URL for C++ source.
 * @param {string} source
 */
function godboltClientStateUrl(source) {
  const payload = {
    sessions: [
      {
        id: 1,
        language: 'c++',
        source,
        compilers: [
          {
            id: 'g132',
            options: '-std=c++20 -O2 -Wall -Wextra',
          },
        ],
        executors: [
          {
            compiler: {
              id: 'g132',
              libs: [],
              options: '-std=c++20 -O2 -Wall -Wextra',
            },
          },
        ],
      },
    ],
  };
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return `https://godbolt.org/clientstate/${encodeURIComponent(b64)}`;
}

/**
 * @param {string} code
 * @param {(line: { level: string, text: string }) => void} onLog
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
function runInSandbox(code, onLog) {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.setAttribute('title', 'playground-sandbox');
    iframe.style.cssText = 'position:absolute;width:0;height:0;border:0;visibility:hidden';

    const channel = `pg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('message', onMessage);
      iframe.remove();
      resolve(result);
    };

    const onMessage = (event) => {
      if (event.source !== iframe.contentWindow) return;
      const data = event.data;
      if (!data || data.channel !== channel) return;
      if (data.type === 'log') {
        onLog({ level: data.level || 'log', text: String(data.text ?? '') });
      } else if (data.type === 'done') {
        finish({ ok: true });
      } else if (data.type === 'error') {
        onLog({ level: 'error', text: String(data.text ?? '运行出错') });
        finish({ ok: false, error: String(data.text ?? '') });
      }
    };

    window.addEventListener('message', onMessage);

    const srcdoc = `<!doctype html><html><head><meta charset="utf-8"></head><body>
<script>
(function () {
  var channel = ${JSON.stringify(channel)};
  function send(msg) {
    parent.postMessage(Object.assign({ channel: channel }, msg), '*');
  }
  function fmt(args) {
    return Array.prototype.map.call(args, function (a) {
      try {
        if (typeof a === 'string') return a;
        if (a instanceof Error) return a.stack || a.message;
        return JSON.stringify(a, null, 2);
      } catch (e) {
        return String(a);
      }
    }).join(' ');
  }
  ['log','info','warn','error','debug'].forEach(function (level) {
    var orig = console[level] ? console[level].bind(console) : function () {};
    console[level] = function () {
      send({ type: 'log', level: level, text: fmt(arguments) });
      try { orig.apply(null, arguments); } catch (e) {}
    };
  });
  window.onerror = function (msg, src, line, col, err) {
    send({ type: 'error', text: (err && err.stack) || String(msg) + ' @' + line + ':' + col });
    return true;
  };
  window.onunhandledrejection = function (ev) {
    var r = ev && ev.reason;
    send({ type: 'error', text: (r && r.stack) || String(r) });
  };
  try {
    (0, eval)(${JSON.stringify(code)});
    send({ type: 'done' });
  } catch (err) {
    send({ type: 'error', text: (err && err.stack) || String(err) });
  }
})();
<\/script>
</body></html>`;

    iframe.srcdoc = srcdoc;
    document.body.appendChild(iframe);

    // Safety timeout for runaway sync work
    setTimeout(() => {
      if (!settled) {
        onLog({ level: 'warn', text: '运行超时（同步代码过久或未结束）。' });
        finish({ ok: false, error: 'timeout' });
      }
    }, 8000);
  });
}

function appendOutputLine(outputEl, level, text) {
  const line = document.createElement('div');
  line.className = `playground-out-line playground-out-line--${level}`;
  line.textContent = text;
  outputEl.appendChild(line);
  outputEl.scrollTop = outputEl.scrollHeight;
}

function clearOutput(outputEl) {
  outputEl.innerHTML = '';
}

function setModeUi(root, lang) {
  root.querySelectorAll('[data-pg-lang]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.getAttribute('data-pg-lang') === lang);
  });
  const runBtn = root.querySelector('[data-pg-run]');
  const openBtn = root.querySelector('[data-pg-godbolt-open]');
  const reloadBtn = root.querySelector('[data-pg-godbolt-embed]');
  const hint = root.querySelector('[data-pg-hint]');
  const frameHost = root.querySelector('[data-pg-frame]');
  const output = root.querySelector('[data-pg-output]');

  const isCpp = lang === 'cpp';
  if (runBtn) runBtn.hidden = isCpp;
  if (openBtn) openBtn.hidden = !isCpp;
  if (reloadBtn) reloadBtn.hidden = !isCpp;
  if (frameHost) frameHost.hidden = !isCpp;
  if (output) output.hidden = isCpp;
  if (hint) {
    hint.textContent = isCpp
      ? 'C++ 通过外部 Compiler Explorer（Godbolt）运行，本站无本地 C++ 后端。'
      : lang === 'ts'
        ? 'TypeScript 由 Sucrase 在浏览器内转译后于沙箱 iframe 执行。'
        : 'JavaScript 在沙箱 iframe 中执行（无 DOM / 无网络）。';
  }
}

/**
 * @param {HTMLElement} pane
 */
export function mountPlayground(pane) {
  if (state?.root === pane) return;

  const lang = readLang();
  pane.innerHTML = `
    <div class="playground" data-playground>
      <header class="playground-header">
        <div class="playground-title-row">
          <h2 class="playground-title">Playground</h2>
          <button type="button" class="playground-icon-btn" data-pg-collapse title="收起面板" aria-label="收起面板">⟨</button>
        </div>
        <div class="playground-tabs" role="tablist" aria-label="语言">
          <button type="button" class="playground-tab" role="tab" data-pg-lang="js">JS</button>
          <button type="button" class="playground-tab" role="tab" data-pg-lang="ts">TS</button>
          <button type="button" class="playground-tab" role="tab" data-pg-lang="cpp">C++</button>
        </div>
      </header>
      <p class="playground-hint" data-pg-hint></p>
      <label class="playground-editor-label" for="playground-editor">代码</label>
      <textarea id="playground-editor" class="playground-editor" spellcheck="false" autocomplete="off" autocapitalize="off"></textarea>
      <div class="playground-actions">
        <button type="button" class="playground-btn playground-btn--primary" data-pg-run>运行</button>
        <button type="button" class="playground-btn playground-btn--primary" data-pg-godbolt-embed hidden>在嵌入区运行</button>
        <button type="button" class="playground-btn" data-pg-godbolt-open hidden>新标签打开 Godbolt</button>
        <button type="button" class="playground-btn" data-pg-reset>重置示例</button>
        <button type="button" class="playground-btn" data-pg-clear>清空输出</button>
      </div>
      <div class="playground-output" data-pg-output aria-live="polite"></div>
      <div class="playground-frame-host" data-pg-frame hidden>
        <p class="playground-frame-note">下方 iframe 加载 godbolt.org；首次可能需允许第三方内容。</p>
        <iframe class="playground-frame" title="Compiler Explorer" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>
    </div>
  `;

  const editor = /** @type {HTMLTextAreaElement} */ (pane.querySelector('#playground-editor'));
  const output = /** @type {HTMLElement} */ (pane.querySelector('[data-pg-output]'));
  const frameHost = /** @type {HTMLElement} */ (pane.querySelector('[data-pg-frame]'));

  editor.value = readCode(lang);
  setModeUi(pane, lang);

  state = { root: pane, editor, output, frameHost, lang };

  pane.querySelectorAll('[data-pg-lang]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!state) return;
      writeCode(state.lang, state.editor.value);
      const next = btn.getAttribute('data-pg-lang') || 'js';
      state.lang = next;
      writeLang(next);
      state.editor.value = readCode(next);
      setModeUi(pane, next);
      clearOutput(state.output);
    });
  });

  editor.addEventListener('input', () => {
    if (!state) return;
    writeCode(state.lang, state.editor.value);
  });

  // Tab inserts spaces in the editor
  editor.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const insert = '  ';
    editor.value = editor.value.slice(0, start) + insert + editor.value.slice(end);
    editor.selectionStart = editor.selectionEnd = start + insert.length;
    writeCode(state?.lang || 'js', editor.value);
  });

  pane.querySelector('[data-pg-run]')?.addEventListener('click', async () => {
    if (!state || state.lang === 'cpp') return;
    clearOutput(state.output);
    appendOutputLine(state.output, 'info', `▶ 运行 ${state.lang.toUpperCase()}…`);
    let code = state.editor.value;
    writeCode(state.lang, code);
    if (state.lang === 'ts') {
      try {
        const { transform } = await import('sucrase');
        code = transform(code, {
          transforms: ['typescript'],
          disableESTransforms: true,
        }).code;
      } catch (err) {
        appendOutputLine(state.output, 'error', `转译失败：${err instanceof Error ? err.message : String(err)}`);
        return;
      }
    }
    await runInSandbox(code, ({ level, text }) => appendOutputLine(state.output, level, text));
  });

  pane.querySelector('[data-pg-godbolt-embed]')?.addEventListener('click', () => {
    if (!state) return;
    const source = state.editor.value;
    writeCode('cpp', source);
    const url = godboltClientStateUrl(source);
    const iframe = /** @type {HTMLIFrameElement | null} */ (frameHost.querySelector('iframe'));
    if (iframe) {
      iframe.src = url;
    }
    appendOutputLine(state.output, 'info', '已请求嵌入 Godbolt（见下方 iframe）。');
  });

  pane.querySelector('[data-pg-godbolt-open]')?.addEventListener('click', () => {
    if (!state) return;
    const source = state.editor.value;
    writeCode('cpp', source);
    const url = godboltClientStateUrl(source);
    window.open(url, '_blank', 'noopener,noreferrer');
  });

  pane.querySelector('[data-pg-reset]')?.addEventListener('click', () => {
    if (!state) return;
    state.editor.value = SAMPLES[state.lang] || '';
    writeCode(state.lang, state.editor.value);
    clearOutput(state.output);
    const iframe = /** @type {HTMLIFrameElement | null} */ (frameHost.querySelector('iframe'));
    if (iframe) iframe.src = 'about:blank';
  });

  pane.querySelector('[data-pg-clear]')?.addEventListener('click', () => {
    if (!state) return;
    clearOutput(state.output);
  });

  pane.querySelector('[data-pg-collapse]')?.addEventListener('click', () => {
    const shell = pane.closest('.app-shell');
    if (!shell) return;
    shell.classList.add('is-playground-collapsed');
    setCollapsed(true);
    syncExpandFab(shell);
  });
}

/**
 * Load code into the playground (e.g. from a note code block).
 * @param {string} code
 * @param {'js' | 'ts' | 'cpp' | string} lang
 */
export function loadIntoPlayground(code, lang) {
  if (!state) return;
  let next = 'js';
  const key = (lang || '').toLowerCase();
  if (key === 'ts' || key === 'typescript') next = 'ts';
  else if (key === 'cpp' || key === 'c++' || key === 'cxx' || key === 'c') next = 'cpp';
  else if (key === 'js' || key === 'javascript' || key === 'mjs') next = 'js';
  else if (key === 'tsx') next = 'ts';

  writeCode(state.lang, state.editor.value);
  state.lang = next;
  writeLang(next);
  state.editor.value = code;
  writeCode(next, code);
  setModeUi(state.root, next);
  clearOutput(state.output);

  const shell = state.root.closest('.app-shell');
  if (shell?.classList.contains('is-playground-collapsed')) {
    shell.classList.remove('is-playground-collapsed');
    setCollapsed(false);
    syncExpandFab(shell);
  }
}

/**
 * @param {HTMLElement} browseRoot
 */
export function bindCodeBlockActions(browseRoot) {
  browseRoot.querySelectorAll('pre.hljs-pre').forEach((pre) => {
    if (pre.querySelector('.playground-send')) return;
    const lang = (pre.getAttribute('data-lang') || '').toLowerCase();
    const supported =
      !lang ||
      ['js', 'javascript', 'mjs', 'ts', 'typescript', 'tsx', 'cpp', 'c++', 'cxx', 'c'].includes(lang);
    if (!supported) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'playground-send';
    btn.textContent = '→ Playground';
    btn.title = '发送到右侧 Playground';
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const codeEl = pre.querySelector('code');
      const code = codeEl?.textContent || '';
      loadIntoPlayground(code, lang || 'cpp');
    });
    pre.appendChild(btn);
  });
}

/**
 * @param {HTMLElement} shell
 */
function syncExpandFab(shell) {
  let fab = shell.querySelector('[data-pg-expand]');
  if (!shell.classList.contains('is-playground-collapsed')) {
    fab?.remove();
    return;
  }
  if (!fab) {
    fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'playground-expand-fab';
    fab.setAttribute('data-pg-expand', '');
    fab.textContent = 'Playground';
    fab.title = '展开代码 Playground';
    fab.addEventListener('click', () => {
      shell.classList.remove('is-playground-collapsed');
      setCollapsed(false);
      syncExpandFab(shell);
    });
    shell.appendChild(fab);
  }
}

/**
 * Wire splitter drag + initial width / collapsed state on the app shell.
 * @param {HTMLElement} shell
 * @param {HTMLElement} splitter
 * @param {HTMLElement} pane
 */
export function bindPlaygroundChrome(shell, splitter, pane) {
  const width = readStoredWidth();
  shell.style.setProperty('--playground-width', `${width}px`);
  if (isCollapsed()) {
    shell.classList.add('is-playground-collapsed');
  }
  syncExpandFab(shell);

  let dragging = false;

  const onMove = (clientX) => {
    const rect = shell.getBoundingClientRect();
    const max = Math.max(MIN_WIDTH, rect.width * MAX_WIDTH_RATIO);
    const next = Math.min(max, Math.max(MIN_WIDTH, rect.right - clientX));
    shell.style.setProperty('--playground-width', `${next}px`);
    writeStoredWidth(next);
  };

  splitter.addEventListener('pointerdown', (event) => {
    if (shell.classList.contains('is-playground-collapsed')) return;
    dragging = true;
    splitter.setPointerCapture(event.pointerId);
    shell.classList.add('is-resizing');
    event.preventDefault();
  });

  splitter.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    onMove(event.clientX);
  });

  const endDrag = (event) => {
    if (!dragging) return;
    dragging = false;
    shell.classList.remove('is-resizing');
    try {
      splitter.releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
  };

  splitter.addEventListener('pointerup', endDrag);
  splitter.addEventListener('pointercancel', endDrag);

  splitter.addEventListener('keydown', (event) => {
    if (shell.classList.contains('is-playground-collapsed')) return;
    const step = event.shiftKey ? 40 : 16;
    const current = parseFloat(getComputedStyle(shell).getPropertyValue('--playground-width')) || DEFAULT_WIDTH;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const next = Math.min(
        shell.getBoundingClientRect().width * MAX_WIDTH_RATIO,
        current + step,
      );
      shell.style.setProperty('--playground-width', `${next}px`);
      writeStoredWidth(next);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      const next = Math.max(MIN_WIDTH, current - step);
      shell.style.setProperty('--playground-width', `${next}px`);
      writeStoredWidth(next);
    }
  });

  // Mobile: start collapsed on narrow viewports if never toggled this session
  try {
    if (!sessionStorage.getItem(COLLAPSED_KEY) && window.matchMedia('(max-width: 860px)').matches) {
      shell.classList.add('is-playground-collapsed');
      setCollapsed(true);
      syncExpandFab(shell);
    }
  } catch {
    /* ignore */
  }

  // Keep pane reference warm
  void pane;
}
