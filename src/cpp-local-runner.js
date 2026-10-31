/**
 * In-browser C++ compile/run via browsercc (Clang/LLD → WASI WASM).
 * Toolchain (~90MB: clang.wasm + lld.wasm + sysroot) loads lazily from jsDelivr
 * on first use so the Vite/Pages bundle stays small.
 */

const BROWSERCC_URL = 'https://cdn.jsdelivr.net/npm/browsercc@0.1.1/dist/index.js';
const WASI_SHIM_URL = 'https://cdn.jsdelivr.net/npm/@bjorn3/browser_wasi_shim@0.4.2/dist/index.js';

/** Flags compatible with WASI (no C++ exceptions / threads). */
const COMPILE_FLAGS = ['-std=c++20', '-O2', '-Wall', '-Wextra', '-fno-exceptions'];

/** @type {Promise<{ compile: Function, WASI: any, File: any, OpenFile: any, ConsoleStdout: any }> | null} */
let toolchainPromise = null;

/**
 * @param {(msg: string) => void} [onProgress]
 */
function loadToolchain(onProgress) {
  if (!toolchainPromise) {
    toolchainPromise = (async () => {
      onProgress?.(
        '首次加载浏览器内 Clang/LLD WASM 工具链（约 90MB，可缓存；请稍候）…',
      );
      const [browsercc, wasiShim] = await Promise.all([
        import(/* @vite-ignore */ BROWSERCC_URL),
        import(/* @vite-ignore */ WASI_SHIM_URL),
      ]);
      if (typeof browsercc.compile !== 'function') {
        throw new Error('browsercc.compile 不可用（CDN 模块格式异常）');
      }
      const { WASI, File, OpenFile, ConsoleStdout } = wasiShim;
      if (!WASI || !File || !OpenFile || !ConsoleStdout) {
        throw new Error('browser_wasi_shim 导出不完整');
      }
      onProgress?.('工具链已就绪，开始本地编译…');
      return { compile: browsercc.compile, WASI, File, OpenFile, ConsoleStdout };
    })().catch((err) => {
      // Allow retry after a failed load (e.g. transient CDN error).
      toolchainPromise = null;
      throw err;
    });
  }
  return toolchainPromise;
}

/**
 * Split multi-line text into log lines (preserve empty trailing strip).
 * @param {string} text
 * @param {(line: string) => void} each
 */
function forEachLine(text, each) {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\n$/, '');
  if (!normalized) return;
  normalized.split('\n').forEach(each);
}

/**
 * Compile & run C++ entirely in the browser; emit stdout/stderr via onLog.
 * @param {string} code
 * @param {(line: { level: string, text: string }) => void} onLog
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function runCppLocalWasm(code, onLog) {
  let compile;
  let WASI;
  let File;
  let OpenFile;
  let ConsoleStdout;

  try {
    ({ compile, WASI, File, OpenFile, ConsoleStdout } = await loadToolchain((msg) =>
      onLog({ level: 'info', text: msg }),
    ));
  } catch (err) {
    onLog({
      level: 'error',
      text: `加载本地 WASM 工具链失败：${err instanceof Error ? err.message : String(err)}`,
    });
    onLog({
      level: 'warn',
      text: '可改用「远程备用（Wandbox）」或「Compiler Explorer」。',
    });
    return { ok: false, error: 'toolchain-load' };
  }

  let compileOutput = '';
  /** @type {WebAssembly.Module | null} */
  let module = null;

  try {
    onLog({ level: 'info', text: `▶ 本地编译（clang.wasm，${COMPILE_FLAGS.join(' ')}）…` });
    const result = await compile({
      source: code,
      fileName: 'main.cpp',
      flags: COMPILE_FLAGS,
    });
    compileOutput = String(result.compileOutput || '').trim();
    module = result.module;
  } catch (err) {
    onLog({
      level: 'error',
      text: `编译过程异常：${err instanceof Error ? err.message : String(err)}`,
    });
    return { ok: false, error: 'compile-throw' };
  }

  if (compileOutput) {
    const level = module ? 'warn' : 'error';
    onLog({ level, text: module ? '—— 编译警告 ——' : '—— 编译错误 ——' });
    forEachLine(compileOutput, (line) => onLog({ level, text: line }));
  }

  if (!module) {
    onLog({ level: 'error', text: '本地编译失败（无 WASM 产物）。' });
    return { ok: false, error: 'compile' };
  }

  let stdout = '';
  let stderr = '';
  const outDec = new TextDecoder();
  const errDec = new TextDecoder();

  try {
    const fds = [
      new OpenFile(new File(new Uint8Array())),
      new ConsoleStdout((data) => {
        stdout += outDec.decode(data, { stream: true });
      }),
      new ConsoleStdout((data) => {
        stderr += errDec.decode(data, { stream: true });
      }),
    ];
    const wasi = new WASI(['main.wasm'], [], fds);
    const instance = await WebAssembly.instantiate(module, {
      wasi_snapshot_preview1: wasi.wasiImport,
    });
    const exitCode = wasi.start(instance);
    stdout += outDec.decode();
    stderr += errDec.decode();

    if (stdout) {
      onLog({ level: 'info', text: '—— stdout ——' });
      forEachLine(stdout, (line) => onLog({ level: 'log', text: line }));
    }
    if (stderr) {
      onLog({ level: 'warn', text: '—— stderr ——' });
      forEachLine(stderr, (line) => onLog({ level: 'warn', text: line }));
    }
    if (!stdout && !stderr && !compileOutput) {
      onLog({ level: 'info', text: '（无输出）' });
    }

    if (exitCode !== 0) {
      onLog({ level: 'error', text: `退出码：${exitCode}` });
      return { ok: false, error: `exit-${exitCode}` };
    }

    onLog({ level: 'info', text: '✓ 完成（浏览器内 clang.wasm / WASI）' });
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    onLog({ level: 'error', text: `运行失败：${msg}` });
    if (stdout) {
      onLog({ level: 'info', text: '—— stdout（异常前）——' });
      forEachLine(stdout, (line) => onLog({ level: 'log', text: line }));
    }
    if (stderr) {
      onLog({ level: 'warn', text: '—— stderr（异常前）——' });
      forEachLine(stderr, (line) => onLog({ level: 'warn', text: line }));
    }
    return { ok: false, error: 'runtime' };
  }
}
