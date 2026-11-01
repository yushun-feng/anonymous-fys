import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import hljs from 'highlight.js/lib/core';
import cpp from 'highlight.js/lib/languages/cpp';
import c from 'highlight.js/lib/languages/c';
import glsl from 'highlight.js/lib/languages/glsl';
import bash from 'highlight.js/lib/languages/bash';
import xml from 'highlight.js/lib/languages/xml';

hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('c', c);
hljs.registerLanguage('glsl', glsl);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
// HLSL 语法接近 C/C++；highlight.js 无独立 hlsl 语言包
hljs.registerLanguage('hlsl', cpp);

const LANG_ALIASES = {
  hlsl: 'hlsl',
  glsl: 'glsl',
  'c++': 'cpp',
  cxx: 'cpp',
  h: 'c',
  hpp: 'cpp',
};

/**
 * @param {string} lang
 */
function resolveLang(lang) {
  const key = (lang || '').toLowerCase().trim();
  if (!key) return '';
  return LANG_ALIASES[key] || key;
}

/**
 * @param {string} code
 * @param {string} lang
 */
function highlightCode(code, lang) {
  const language = resolveLang(lang);
  if (language && hljs.getLanguage(language)) {
    return hljs.highlight(code, { language }).value;
  }
  return hljs.highlightAuto(code).value;
}

/** @param {string} value */
function escapeAttr(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

/**
 * Convert TeX delimiters `\[...\]` / `\(...\)` to `$$...$$` / `$...$`
 * outside fenced/inline code, so KaTeX extension can pick them up.
 * @param {string} markdown
 */
export function normalizeMathDelimiters(markdown) {
  const chunks = markdown.split(/(```[\s\S]*?```)/g);
  return chunks
    .map((chunk) => {
      if (chunk.startsWith('```')) return chunk;
      // Protect inline code spans while rewriting math outside them.
      return chunk
        .split(/(`[^`\n]*`)/g)
        .map((part) => {
          if (part.startsWith('`')) return part;
          return part
            .replace(/\\\[([\s\S]*?)\\\]/g, (_, tex) => `$$\n${String(tex).trim()}\n$$`)
            .replace(/\\\(([\s\S]*?)\\\)/g, (_, tex) => `$${String(tex).trim()}$`);
        })
        .join('');
    })
    .join('');
}

marked.use(
  markedKatex({
    throwOnError: false,
    nonStandard: true,
  }),
);

marked.use({
  gfm: true,
  breaks: false,
  renderer: {
    code({ text, lang }) {
      const language = resolveLang(lang || '');
      if (language === 'mermaid') {
        // Mermaid.run entity-decodes innerHTML; keep markup-safe source here.
        const escaped = text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        return `<pre class="mermaid" data-lang="mermaid">${escaped}</pre>\n`;
      }
      const highlighted = highlightCode(text, language);
      const langAttr = language ? ` data-lang="${escapeAttr(language)}"` : '';
      const classAttr = language
        ? ` class="hljs language-${escapeAttr(language)}"`
        : ' class="hljs"';
      return `<pre class="hljs-pre"${langAttr}><code${classAttr}>${highlighted}</code></pre>\n`;
    },
  },
});

/** @param {string} markdown */
export function renderMarkdown(markdown) {
  return marked.parse(normalizeMathDelimiters(markdown));
}

let mermaidInitialized = false;

/**
 * Render Mermaid diagrams inside a browse root (lazy-loads the library).
 * @param {ParentNode} root
 */
export async function runMermaidIn(root) {
  const nodes = root.querySelectorAll('pre.mermaid');
  if (!nodes.length) return;

  const mermaid = (await import('mermaid')).default;
  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'dark',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    });
    mermaidInitialized = true;
  }

  nodes.forEach((node) => node.removeAttribute('data-processed'));
  await mermaid.run({ nodes: [...nodes], suppressErrors: true });
}

/** @param {string} text */
export function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
