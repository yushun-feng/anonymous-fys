/**
 * In-browser Python via Pyodide (lazy load from jsDelivr on first run).
 */

const PYODIDE_VERSION = '0.27.7';
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

/** @type {Promise<any> | null} */
let pyodidePromise = null;

/**
 * @param {(msg: string) => void} [onProgress]
 */
function loadPyodideRuntime(onProgress) {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      onProgress?.(
        `首次加载 Pyodide ${PYODIDE_VERSION}（约 10MB+，可缓存；请稍候）…`,
      );
      const mod = await import(/* @vite-ignore */ `${PYODIDE_BASE}pyodide.mjs`);
      const loadPyodide = mod.loadPyodide ?? mod.default?.loadPyodide;
      if (typeof loadPyodide !== 'function') {
        throw new Error('Pyodide loadPyodide 不可用（CDN 模块格式异常）');
      }
      const pyodide = await loadPyodide({ indexURL: PYODIDE_BASE });
      onProgress?.('Pyodide 已就绪，开始运行…');
      return pyodide;
    })().catch((err) => {
      pyodidePromise = null;
      throw err;
    });
  }
  return pyodidePromise;
}

/**
 * @param {string} code
 * @param {(line: { level: string, text: string }) => void} onLog
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function runPythonLocal(code, onLog) {
  let pyodide;
  try {
    pyodide = await loadPyodideRuntime((msg) => onLog({ level: 'info', text: msg }));
  } catch (err) {
    onLog({
      level: 'error',
      text: `加载 Pyodide 失败：${err instanceof Error ? err.message : String(err)}`,
    });
    onLog({ level: 'info', text: '可尝试「远程备用」（Wandbox）或检查网络。' });
    return { ok: false, error: 'load' };
  }

  let stdout = '';
  let stderr = '';
  pyodide.setStdout({
    batched: (chunk) => {
      stdout += chunk;
    },
  });
  pyodide.setStderr({
    batched: (chunk) => {
      stderr += chunk;
    },
  });

  try {
    await pyodide.runPythonAsync(code);
    if (stdout) {
      onLog({ level: 'info', text: '—— stdout ——' });
      stdout.replace(/\n$/, '').split('\n').forEach((line) => onLog({ level: 'log', text: line }));
    }
    if (stderr) {
      onLog({ level: 'warn', text: '—— stderr ——' });
      stderr.replace(/\n$/, '').split('\n').forEach((line) => onLog({ level: 'warn', text: line }));
    }
    if (!stdout && !stderr) {
      onLog({ level: 'info', text: '（无输出）' });
    }
    onLog({ level: 'info', text: '✓ 完成（Pyodide）' });
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    onLog({ level: 'error', text: msg });
    return { ok: false, error: 'runtime' };
  }
}
