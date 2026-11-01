/**
 * Chapter-end personal notes: localStorage-backed draft per note path.
 * Lets the reader insert or reference the current chapter markdown while writing.
 */

const STORAGE_PREFIX = 'anonymous-fys-personal-note:';
const SAVE_DEBOUNCE_MS = 280;

/**
 * @param {string} notePath relative path under notes/ (e.g. cpp/learncpp/01.md)
 */
function storageKey(notePath) {
  return STORAGE_PREFIX + notePath;
}

/**
 * @param {string} notePath
 * @returns {string}
 */
export function loadPersonalNote(notePath) {
  try {
    return localStorage.getItem(storageKey(notePath)) ?? '';
  } catch {
    return '';
  }
}

/**
 * @param {string} notePath
 * @param {string} text
 */
export function savePersonalNote(notePath, text) {
  try {
    if (!text) {
      localStorage.removeItem(storageKey(notePath));
    } else {
      localStorage.setItem(storageKey(notePath), text);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Insert text at the textarea caret (or append if no selection API).
 * @param {HTMLTextAreaElement} textarea
 * @param {string} chunk
 */
function insertAtCaret(textarea, chunk) {
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? start;
  const before = textarea.value.slice(0, start);
  const after = textarea.value.slice(end);
  const needsLeadNl = before.length > 0 && !before.endsWith('\n');
  const needsTrailNl = after.length > 0 && !chunk.endsWith('\n') && !after.startsWith('\n');
  const lead = needsLeadNl ? '\n\n' : before.length > 0 && before.endsWith('\n') && !before.endsWith('\n\n') ? '\n' : '';
  const trail = needsTrailNl ? '\n' : '';
  const inserted = `${lead}${chunk}${trail}`;
  textarea.value = before + inserted + after;
  const caret = before.length + inserted.length;
  textarea.focus();
  textarea.setSelectionRange(caret, caret);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Build a markdown reference block pointing at the chapter (not full body).
 * @param {{ path: string, title: string, id: string }} note
 */
function chapterReferenceMarkdown(note) {
  const href = `#/note/${encodeURIComponent(note.id)}`;
  return [
    `> **引用章节** [${note.title}](${href})`,
    `> 路径：\`notes/${note.path}\``,
    `>`,
    `> （在此写下与该章相关的个人笔记）`,
  ].join('\n');
}

/**
 * Mount the personal-notes panel into a host element at the end of a note view.
 * @param {HTMLElement} host
 * @param {{ id: string, path: string, title: string, body: string }} note
 * @returns {{ dispose: () => void }}
 */
export function mountPersonalNotes(host, note) {
  const saved = loadPersonalNote(note.path);

  host.innerHTML = `
    <section class="personal-notes" data-personal-notes aria-label="本章个人笔记">
      <header class="personal-notes__header">
        <h2 class="personal-notes__title">我的笔记</h2>
        <p class="personal-notes__hint">仅保存在本机浏览器（localStorage），按章节路径区分；可插入或引用本章 Markdown。</p>
      </header>
      <div class="personal-notes__toolbar" role="toolbar" aria-label="应用本章内容">
        <button type="button" class="personal-notes__btn" data-action="insert-body">插入本章全文</button>
        <button type="button" class="personal-notes__btn" data-action="insert-ref">插入章节引用</button>
        <button type="button" class="personal-notes__btn personal-notes__btn--ghost" data-action="clear">清空</button>
        <span class="personal-notes__status" data-status aria-live="polite"></span>
      </div>
      <label class="personal-notes__label" for="personal-note-editor">个人笔记（Markdown）</label>
      <textarea
        id="personal-note-editor"
        class="personal-notes__editor"
        data-editor
        rows="12"
        spellcheck="true"
        placeholder="在此写下对本课的理解、疑问、练习……可用上方按钮插入/引用本章内容。"
      ></textarea>
    </section>
  `;

  const editor = /** @type {HTMLTextAreaElement} */ (host.querySelector('[data-editor]'));
  const status = /** @type {HTMLElement} */ (host.querySelector('[data-status]'));
  editor.value = saved;
  let timer = 0;
  let disposed = false;

  function setStatus(text, kind = '') {
    status.textContent = text;
    status.dataset.kind = kind;
  }

  function persist() {
    if (disposed) return;
    const ok = savePersonalNote(note.path, editor.value);
    setStatus(ok ? '已保存到本机' : '保存失败（存储可能已满）', ok ? 'ok' : 'err');
  }

  function scheduleSave() {
    setStatus('保存中…', 'pending');
    window.clearTimeout(timer);
    timer = window.setTimeout(persist, SAVE_DEBOUNCE_MS);
  }

  editor.addEventListener('input', scheduleSave);

  host.querySelector('[data-action="insert-body"]')?.addEventListener('click', () => {
    insertAtCaret(editor, note.body.trimEnd());
  });

  host.querySelector('[data-action="insert-ref"]')?.addEventListener('click', () => {
    insertAtCaret(editor, chapterReferenceMarkdown(note));
  });

  host.querySelector('[data-action="clear"]')?.addEventListener('click', () => {
    if (editor.value && !window.confirm('清空本章个人笔记？此操作仅影响本机存储。')) return;
    editor.value = '';
    editor.focus();
    persist();
  });

  if (saved) setStatus('已从本机恢复', 'ok');

  return {
    dispose() {
      disposed = true;
      window.clearTimeout(timer);
      // Flush pending edits so a quick navigation does not drop keystrokes.
      if (status.dataset.kind === 'pending') {
        savePersonalNote(note.path, editor.value);
      }
      host.innerHTML = '';
    },
  };
}
