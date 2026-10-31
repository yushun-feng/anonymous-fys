/**
 * Right-side code playground: in-browser JS/TS runner + local WASM C++ (browsercc).
 * Mount once after unlock so hash navigations do not wipe editor state.
 */

import { EditorState, Compartment } from '@codemirror/state';
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
import { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';
import { runCppLocalWasm } from './cpp-local-runner.js';

const WIDTH_KEY = 'anonymous-fys-playground-width';
const COLLAPSED_KEY = 'anonymous-fys-playground-collapsed';
const LANG_KEY = 'anonymous-fys-playground-lang';
const CODE_KEY_PREFIX = 'anonymous-fys-playground-code:';

const MIN_WIDTH = 280;
const MAX_WIDTH_RATIO = 0.62;
const DEFAULT_WIDTH = 400;

/** Optional remote fallback when local WASM toolchain fails or is unwanted. */
const WANDBOX_COMPILE_URL = 'https://wandbox.org/api/compile.json';
const WANDBOX_COMPILER = 'gcc-13.2.0';
const WANDBOX_OPTIONS = 'warning,c++2b';
const WANDBOX_TIMEOUT_MS = 25000;

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

/** @type {{ root: HTMLElement, view: EditorView, output: HTMLElement, lang: string, langCompartment: Compartment } | null} */
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
 * @param {string} lang
 */
function languageSupport(lang) {
  if (lang === 'cpp') return cpp();
  return javascript({ typescript: lang === 'ts' });
}

/**
 * Prefill Compiler Explorer in a new tab (optional fallback).
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
 * Compile & run C++ via Wandbox; stream textual results through onLog.
 * @param {string} code
 * @param {(line: { level: string, text: string }) => void} onLog
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
async function runCppViaWandbox(code, onLog) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WANDBOX_TIMEOUT_MS);
  try {
    const res = await fetch(WANDBOX_COMPILE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        compiler: WANDBOX_COMPILER,
        options: WANDBOX_OPTIONS,
        save: false,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      onLog({
        level: 'error',
        text: `Wandbox HTTP ${res.status}${body ? `: ${body.slice(0, 200)}` : ''}`,
      });
      return { ok: false, error: `http-${res.status}` };
    }
    /** @type {Record<string, unknown>} */
    const data = await res.json();
    // Wandbox puts both errors and warnings in compiler_error (even when status is 0).
    const compilerDiag = String(data.compiler_error || '').trim();
    const programOut = String(data.program_output || '').replace(/\r\n/g, '\n');
    const programErr = String(data.program_error || '').replace(/\r\n/g, '\n');
    const status = data.status != null ? String(data.status) : '';
    const signal = data.signal != null ? String(data.signal) : '';
    const okStatus = status === '0';

    if (compilerDiag) {
      const level = okStatus ? 'warn' : 'error';
      onLog({ level, text: okStatus ? '—— 编译警告 ——' : '—— 编译错误 ——' });
      compilerDiag.split('\n').forEach((line) => onLog({ level, text: line }));
    }

    if (programOut) {
      onLog({ level: 'info', text: '—— stdout ——' });
      programOut.replace(/\n$/, '').split('\n').forEach((line) => onLog({ level: 'log', text: line }));
    }
    if (programErr) {
      onLog({ level: 'warn', text: '—— stderr ——' });
      programErr.replace(/\n$/, '').split('\n').forEach((line) => onLog({ level: 'warn', text: line }));
    }

    if (!programOut && !programErr && !compilerDiag) {
      onLog({ level: 'info', text: '（无输出）' });
    }

    if (signal) {
      onLog({ level: 'error', text: `进程信号：${signal}` });
    }
    if (!okStatus) {
      onLog({ level: 'error', text: `退出码：${status || '?'}` });
      return { ok: false, error: compilerDiag ? 'compile' : `exit-${status || '?'}` };
    }
    onLog({ level: 'info', text: `✓ 完成（${WANDBOX_COMPILER}）` });
    return { ok: true };
  } catch (err) {
    const aborted =
      (typeof DOMException !== 'undefined' && err instanceof DOMException && err.name === 'AbortError') ||
      (err instanceof Error && err.name === 'AbortError');
    const msg = aborted
      ? `请求超时（>${WANDBOX_TIMEOUT_MS / 1000}s）。可稍后重试、改用本地「运行」，或打开 Compiler Explorer。`
      : `网络/API 失败：${err instanceof Error ? err.message : String(err)}`;
    onLog({ level: 'error', text: msg });
    return { ok: false, error: aborted ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
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

function getEditorCode() {
  return state?.view.state.doc.toString() ?? '';
}

/**
 * @param {string} code
 */
function setEditorCode(code) {
  if (!state) return;
  state.view.dispatch({
    changes: { from: 0, to: state.view.state.doc.length, insert: code },
  });
}

/**
 * @param {string} lang
 */
function setEditorLanguage(lang) {
  if (!state) return;
  state.view.dispatch({
    effects: state.langCompartment.reconfigure(languageSupport(lang)),
  });
}

function setModeUi(root, lang) {
  root.querySelectorAll('[data-pg-lang]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.getAttribute('data-pg-lang') === lang);
    btn.setAttribute('aria-selected', btn.getAttribute('data-pg-lang') === lang ? 'true' : 'false');
  });
  const openGodboltBtn = root.querySelector('[data-pg-open-godbolt]');
  const wandboxBtn = root.querySelector('[data-pg-wandbox]');
  const hint = root.querySelector('[data-pg-hint]');

  const isCpp = lang === 'cpp';
  if (openGodboltBtn) openGodboltBtn.hidden = !isCpp;
  if (wandboxBtn) wandboxBtn.hidden = !isCpp;
  if (hint) {
    hint.textContent = isCpp
      ? 'C++ 在浏览器内用 Clang WASM（browsercc）本地编译为 WASI 并运行，stdout/stderr 显示在下方；首次需下载工具链。可选远程备用。'
      : lang === 'ts'
        ? 'TypeScript 由 Sucrase 在浏览器内转译后于沙箱 iframe 执行。'
        : 'JavaScript 在沙箱 iframe 中执行（无 DOM / 无网络）。';
  }
}

/**
 * @param {HTMLElement} host
 * @param {string} lang
 * @param {string} doc
 * @param {(code: string) => void} onDocChange
 */
function createEditor(host, lang, doc, onDocChange) {
  const langCompartment = new Compartment();
  const view = new EditorView({
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
        keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        oneDark,
        langCompartment.of(languageSupport(lang)),
        placeholder('在此编辑代码…'),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onDocChange(update.state.doc.toString());
        }),
        EditorView.theme({
          '&': {
            height: '100%',
            fontSize: '0.8rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
          },
          '.cm-scroller': {
            fontFamily: 'var(--font-mono)',
            lineHeight: '1.5',
            overflow: 'auto',
          },
          '&.cm-focused': {
            outline: '2px solid var(--accent-soft)',
            outlineOffset: '0',
            borderColor: 'var(--accent)',
          },
          '.cm-content': {
            padding: '0.55rem 0',
            caretColor: 'var(--accent)',
          },
          '.cm-gutters': {
            backgroundColor: '#0a0e13',
            borderRight: '1px solid var(--border)',
            color: 'var(--muted)',
          },
        }),
      ],
    }),
  });
  return { view, langCompartment };
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
          <button type="button" class="playground-tab" role="tab" data-pg-lang="js" aria-selected="false">JS</button>
          <button type="button" class="playground-tab" role="tab" data-pg-lang="ts" aria-selected="false">TS</button>
          <button type="button" class="playground-tab" role="tab" data-pg-lang="cpp" aria-selected="false">C++</button>
        </div>
      </header>
      <p class="playground-hint" data-pg-hint></p>
      <label class="playground-editor-label" for="playground-editor-host">代码</label>
      <div id="playground-editor-host" class="playground-editor-host" data-pg-editor role="textbox" aria-label="代码编辑器" aria-multiline="true"></div>
      <div class="playground-actions">
        <button type="button" class="playground-btn playground-btn--primary" data-pg-run>运行</button>
        <button type="button" class="playground-btn" data-pg-wandbox hidden title="可选：经 Wandbox 远程 gcc 编译运行">远程备用</button>
        <button type="button" class="playground-btn" data-pg-open-godbolt hidden title="备用：新标签打开 Compiler Explorer">Compiler Explorer</button>
        <button type="button" class="playground-btn" data-pg-reset>重置示例</button>
        <button type="button" class="playground-btn" data-pg-clear>清空输出</button>
      </div>
      <div class="playground-output" data-pg-output aria-live="polite"></div>
    </div>
  `;

  const editorHost = /** @type {HTMLElement} */ (pane.querySelector('[data-pg-editor]'));
  const output = /** @type {HTMLElement} */ (pane.querySelector('[data-pg-output]'));
  const initialCode = readCode(lang);

  const { view, langCompartment } = createEditor(editorHost, lang, initialCode, (code) => {
    if (!state) return;
    writeCode(state.lang, code);
  });

  state = { root: pane, view, output, lang, langCompartment };
  setModeUi(pane, lang);

  pane.querySelectorAll('[data-pg-lang]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!state) return;
      writeCode(state.lang, getEditorCode());
      const next = btn.getAttribute('data-pg-lang') || 'js';
      state.lang = next;
      writeLang(next);
      setEditorLanguage(next);
      setEditorCode(readCode(next));
      setModeUi(pane, next);
      clearOutput(state.output);
    });
  });

  const runBtn = /** @type {HTMLButtonElement | null} */ (pane.querySelector('[data-pg-run]'));
  const wandboxBtn = /** @type {HTMLButtonElement | null} */ (pane.querySelector('[data-pg-wandbox]'));

  const setCppBusy = (busy) => {
    if (runBtn) runBtn.disabled = busy;
    if (wandboxBtn) wandboxBtn.disabled = busy;
  };

  runBtn?.addEventListener('click', async () => {
    if (!state || !runBtn) return;
    clearOutput(state.output);
    const code = getEditorCode();
    writeCode(state.lang, code);
    setCppBusy(true);
    try {
      if (state.lang === 'cpp') {
        await runCppLocalWasm(code, ({ level, text }) => appendOutputLine(state.output, level, text));
        return;
      }
      appendOutputLine(state.output, 'info', `▶ 运行 ${state.lang.toUpperCase()}…`);
      let runnable = code;
      if (state.lang === 'ts') {
        try {
          const { transform } = await import('sucrase');
          runnable = transform(code, {
            transforms: ['typescript'],
            disableESTransforms: true,
          }).code;
        } catch (err) {
          appendOutputLine(
            state.output,
            'error',
            `转译失败：${err instanceof Error ? err.message : String(err)}`,
          );
          return;
        }
      }
      await runInSandbox(runnable, ({ level, text }) => appendOutputLine(state.output, level, text));
    } finally {
      setCppBusy(false);
    }
  });

  wandboxBtn?.addEventListener('click', async () => {
    if (!state || state.lang !== 'cpp' || !wandboxBtn) return;
    clearOutput(state.output);
    const code = getEditorCode();
    writeCode('cpp', code);
    setCppBusy(true);
    try {
      appendOutputLine(state.output, 'info', `▶ 远程备用：Wandbox ${WANDBOX_COMPILER}…`);
      await runCppViaWandbox(code, ({ level, text }) => appendOutputLine(state.output, level, text));
    } finally {
      setCppBusy(false);
    }
  });

  pane.querySelector('[data-pg-open-godbolt]')?.addEventListener('click', () => {
    if (!state || state.lang !== 'cpp') return;
    const source = getEditorCode();
    writeCode('cpp', source);
    const url = godboltClientStateUrl(source);
    window.open(url, '_blank', 'noopener,noreferrer');
    appendOutputLine(state.output, 'info', '已在新标签打开 Compiler Explorer（源码已预填，备用）。');
  });

  pane.querySelector('[data-pg-reset]')?.addEventListener('click', () => {
    if (!state) return;
    const sample = SAMPLES[state.lang] || '';
    setEditorCode(sample);
    writeCode(state.lang, sample);
    clearOutput(state.output);
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

  writeCode(state.lang, getEditorCode());
  state.lang = next;
  writeLang(next);
  setEditorLanguage(next);
  setEditorCode(code);
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

  try {
    if (!sessionStorage.getItem(COLLAPSED_KEY) && window.matchMedia('(max-width: 860px)').matches) {
      shell.classList.add('is-playground-collapsed');
      setCollapsed(true);
      syncExpandFab(shell);
    }
  } catch {
    /* ignore */
  }

  void pane;
}
