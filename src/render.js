import { marked } from 'marked';
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

marked.use({
  gfm: true,
  breaks: false,
  renderer: {
    code({ text, lang }) {
      const language = resolveLang(lang || '');
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
  return marked.parse(markdown);
}

/** @param {string} text */
export function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
