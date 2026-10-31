/**
 * Soft front-end access gate (obfuscation only).
 *
 * This is NOT real security. The password is embedded in the client bundle
 * (via Vite `import.meta.env`) and is trivial to recover from source / DevTools.
 * It only deters casual visitors from seeing the note list immediately.
 */

const STORAGE_KEY = 'anonymous-fys-gate-unlocked';

/** Build-time password; falls back to a documented default for local/dev. */
export const SITE_PASSWORD = import.meta.env.VITE_SITE_PASSWORD || 'notes';

export function isUnlocked() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function unlock() {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // sessionStorage may be unavailable; unlock lasts for this page load only.
  }
}

export function checkPassword(input) {
  return String(input ?? '') === SITE_PASSWORD;
}

/**
 * Render a minimal password prompt into `root`.
 * Calls `onSuccess` after a correct password (and after unlocking storage).
 */
export function renderGate(root, { onSuccess }) {
  root.innerHTML = `
    <div class="gate" role="dialog" aria-labelledby="gate-title" aria-modal="true">
      <form class="gate-form" id="gate-form" autocomplete="off">
        <h1 id="gate-title" class="gate-title">访问确认</h1>
        <p class="gate-hint">输入站点口令以继续浏览笔记（仅前端软门禁，非真实鉴权）。</p>
        <label class="gate-label" for="gate-password">口令</label>
        <input
          id="gate-password"
          class="gate-input"
          type="password"
          name="password"
          required
          autofocus
          spellcheck="false"
        />
        <p class="gate-error" id="gate-error" hidden>口令不正确</p>
        <button type="submit" class="gate-submit">进入</button>
      </form>
    </div>
  `;

  const form = root.querySelector('#gate-form');
  const input = root.querySelector('#gate-password');
  const error = root.querySelector('#gate-error');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!checkPassword(input.value)) {
      error.hidden = false;
      input.select();
      return;
    }
    unlock();
    onSuccess();
  });
}
