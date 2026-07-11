import sanitizeHtml from 'sanitize-html';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import css from 'highlight.js/lib/languages/css';
import diff from 'highlight.js/lib/languages/diff';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';

const registeredLanguages = {
  bash,
  c,
  cpp,
  css,
  diff,
  javascript,
  json,
  markdown,
  python,
  sql,
  typescript,
  xml,
  yaml,
};

for (const [name, language] of Object.entries(registeredLanguages)) {
  hljs.registerLanguage(name, language);
}

const languageAliases: Record<string, string> = {
  cxx: 'cpp',
  h: 'c',
  hpp: 'cpp',
  html: 'xml',
  js: 'javascript',
  jsx: 'javascript',
  md: 'markdown',
  node: 'javascript',
  py: 'python',
  shell: 'bash',
  sh: 'bash',
  svg: 'xml',
  ts: 'typescript',
  tsx: 'typescript',
  yml: 'yaml',
  zsh: 'bash',
};

export type HighlightStatus = 'highlighted' | 'plain' | 'skipped';

export interface HighlightResult {
  status: HighlightStatus;
  language: string;
  html: string;
}

export interface SyntaxHighlightOptions {
  highlight?: typeof highlightSource;
}

export function normalizeSyntaxLanguage(language: string): string {
  const normalized = language.trim().toLowerCase().replace(/^language-/, '');
  return languageAliases[normalized] ?? normalized;
}

export function highlightSource(source: string, language: string): HighlightResult {
  const normalized = normalizeSyntaxLanguage(language);
  if (!normalized || normalized === 'text' || normalized === 'plaintext') {
    return { status: 'plain', language: normalized || 'text', html: '' };
  }
  if (normalized === 'mermaid') {
    return { status: 'skipped', language: normalized, html: '' };
  }
  if (!hljs.getLanguage(normalized)) {
    return { status: 'plain', language: normalized, html: '' };
  }

  const highlighted = hljs.highlight(source, {
    language: normalized,
    ignoreIllegals: true,
  }).value;
  const html = sanitizeHtml(highlighted, {
    allowedTags: ['span'],
    allowedAttributes: { span: ['class'] },
    allowedSchemes: [],
  });

  return { status: 'highlighted', language: normalized, html };
}

function languageFromCode(code: HTMLElement): string {
  const languageClass = [...code.classList].find((name) => name.startsWith('language-'));
  return languageClass?.slice('language-'.length) ?? '';
}

function highlightCode(code: HTMLElement, highlight: typeof highlightSource): void {
  if (code.dataset.highlightState !== 'pending') return;

  const source = code.textContent ?? '';
  const result = highlight(source, languageFromCode(code));
  code.dataset.highlightLanguage = result.language;
  code.dataset.highlightState = result.status;

  if (result.status !== 'highlighted') return;

  code.innerHTML = result.html;
  code.classList.add('hljs');
  code.classList.add(`language-${result.language}`);
}

export function mountSyntaxHighlighting(
  reader: HTMLElement,
  options: SyntaxHighlightOptions = {},
): () => void {
  const highlight = options.highlight ?? highlightSource;
  const blocks = [...reader.querySelectorAll<HTMLElement>('pre > code')].filter((code) => {
    if (code.closest('.mermaid-diagram')) return false;
    if (normalizeSyntaxLanguage(languageFromCode(code)) === 'mermaid') return false;
    if (code.dataset.highlightState) return false;
    code.dataset.highlightState = 'pending';
    return true;
  });

  if (!blocks.length) return () => undefined;

  if (typeof IntersectionObserver === 'undefined') {
    for (const block of blocks) highlightCode(block, highlight);
    return () => undefined;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        highlightCode(entry.target as HTMLElement, highlight);
      }
    },
    { rootMargin: '320px 0px' },
  );

  for (const block of blocks) observer.observe(block);
  return () => observer.disconnect();
}
