/** Front-end browse password gate. Password from `VITE_SITE_PASSWORD` (default `notes`). */

const STORAGE_KEY = 'anonymous-fys-gate-unlocked';
const GATE_MODE_CLASS = 'is-gate';
const VOTE_CHOICE_KEY = 'anonymous-fys-gate-vote-choice';
const VOTE_COUNTS_KEY = 'anonymous-fys-gate-vote-counts';

export const SITE_PASSWORD = import.meta.env.VITE_SITE_PASSWORD || 'notes';

const GATE_SATIRE_QUOTE =
  '开发者反对的不是AI，是一些外行用AI来假装自己不需要理解，却要求别人为结果负责——最应该对开发者有用的东西，却成了外行免于理解、照常索要结果的许可证';

const GATE_SATIRE_LINE =
  '外行一经AI加持，便只在表层上套来套去——说法、工具、姿势轮番翻新，却从不向下沉一点真正的积累';

/** @typedef {'for' | 'against'} GateVote */

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

function enterGateMode() {
  document.documentElement.classList.add(GATE_MODE_CLASS);
}

function leaveGateMode() {
  document.documentElement.classList.remove(GATE_MODE_CLASS);
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode / quota — UI still works for this page load
  }
}

/** @returns {GateVote | null} */
function readVoteChoice() {
  try {
    const value = localStorage.getItem(VOTE_CHOICE_KEY);
    if (value === 'for' || value === 'against') return value;
    return null;
  } catch {
    return null;
  }
}

/** @param {GateVote | null} choice */
function writeVoteChoice(choice) {
  try {
    if (!choice) localStorage.removeItem(VOTE_CHOICE_KEY);
    else localStorage.setItem(VOTE_CHOICE_KEY, choice);
  } catch {
    // ignore
  }
}

function readVoteCounts() {
  const counts = readJson(VOTE_COUNTS_KEY, { for: 0, against: 0 });
  return {
    for: Math.max(0, Number(counts?.for) || 0),
    against: Math.max(0, Number(counts?.against) || 0),
  };
}

/**
 * Toggle vote: first click selects, same button again clears, other button switches.
 * Counts live in localStorage (static Pages first cut; per-browser tally).
 * @param {GateVote} next
 */
function applyVote(next) {
  const current = readVoteChoice();
  const counts = readVoteCounts();

  if (current === next) {
    counts[next] = Math.max(0, counts[next] - 1);
    writeVoteChoice(null);
  } else {
    if (current) counts[current] = Math.max(0, counts[current] - 1);
    counts[next] += 1;
    writeVoteChoice(next);
  }

  writeJson(VOTE_COUNTS_KEY, counts);
  return { choice: readVoteChoice(), counts: readVoteCounts() };
}

/**
 * @param {HTMLElement} root
 * @param {{ choice: GateVote | null, counts: { for: number, against: number } }} state
 */
function paintVoteUi(root, state) {
  const forBtn = root.querySelector('[data-gate-vote="for"]');
  const againstBtn = root.querySelector('[data-gate-vote="against"]');
  const forCount = root.querySelector('[data-gate-vote-count="for"]');
  const againstCount = root.querySelector('[data-gate-vote-count="against"]');
  if (!forBtn || !againstBtn || !forCount || !againstCount) return;

  forCount.textContent = String(state.counts.for);
  againstCount.textContent = String(state.counts.against);

  forBtn.setAttribute('aria-pressed', state.choice === 'for' ? 'true' : 'false');
  againstBtn.setAttribute('aria-pressed', state.choice === 'against' ? 'true' : 'false');
  forBtn.classList.toggle('is-selected', state.choice === 'for');
  againstBtn.classList.toggle('is-selected', state.choice === 'against');
}

/**
 * Render a 996.ICU-style manifesto + password prompt into `root`.
 * Calls `onSuccess` after a correct password (and after unlocking storage).
 */
export function renderGate(root, { onSuccess }) {
  enterGateMode();

  root.innerHTML = `
    <div class="gate" role="dialog" aria-labelledby="gate-title" aria-modal="true">
      <div class="gate-panel">
        <header class="gate-manifesto">
          <p class="gate-kicker">developers' lives matter</p>
          <h1 id="gate-title" class="gate-punch">反对的不是AI</h1>
          <figure class="gate-satire">
            <img
              class="gate-satire-image"
              src="${import.meta.env.BASE_URL}notes-assets/gate/gate-ai-satire-simple.jpg"
              alt="讽刺插画：玩具 demo 很爽；大数据量处理、逻辑完整、数据结构、内存管理——真功夫被质疑时开发者擦屁股"
              width="1280"
              height="720"
              decoding="async"
            />
            <figcaption class="gate-satire-caption">玩具 demo 很爽；大数据量处理、逻辑完整、数据结构、内存管理——质疑真功夫时，总有人在擦屁股。</figcaption>
          </figure>
          <div class="gate-quote-row">
            <blockquote class="gate-quote">
              <p>${GATE_SATIRE_QUOTE}</p>
              <p>${GATE_SATIRE_LINE}</p>
            </blockquote>
            <div class="gate-vote" role="group" aria-label="对该观点投票">
              <button type="button" class="gate-vote-btn" data-gate-vote="for" aria-pressed="false">
                <span class="gate-vote-label">赞成</span>
                <span class="gate-vote-count" data-gate-vote-count="for">0</span>
              </button>
              <button type="button" class="gate-vote-btn" data-gate-vote="against" aria-pressed="false">
                <span class="gate-vote-label">反对</span>
                <span class="gate-vote-count" data-gate-vote-count="against">0</span>
              </button>
            </div>
          </div>
        </header>
        <form class="gate-form" id="gate-form" autocomplete="off">
          <p class="gate-hint">输入站点口令以继续浏览笔记。</p>
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
    </div>
  `;

  const form = root.querySelector('#gate-form');
  const input = root.querySelector('#gate-password');
  const error = root.querySelector('#gate-error');
  const voteRoot = root.querySelector('.gate-vote');

  paintVoteUi(root, { choice: readVoteChoice(), counts: readVoteCounts() });

  voteRoot?.addEventListener('click', (event) => {
    const btn = event.target instanceof Element ? event.target.closest('[data-gate-vote]') : null;
    if (!btn) return;
    const next = btn.getAttribute('data-gate-vote');
    if (next !== 'for' && next !== 'against') return;
    paintVoteUi(root, applyVote(next));
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!checkPassword(input.value)) {
      error.hidden = false;
      input.select();
      return;
    }
    unlock();
    leaveGateMode();
    onSuccess();
  });
}
