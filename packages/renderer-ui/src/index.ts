import MarkdownIt from 'markdown-it';
import footnote from 'markdown-it-footnote';
import sanitizeHtml from 'sanitize-html';
import { HeadingSlugger } from '@research-observatory/domain';

export * from './browse';

interface FootnoteToken {
  meta: {
    id: number;
    subId?: number;
  };
}

function footnoteNumber(token: FootnoteToken): number {
  return Number(token.meta.id) + 1;
}

function footnoteReferenceId(token: FootnoteToken): string {
  const number = footnoteNumber(token);
  const subId = Number(token.meta.subId ?? 0);
  return `fnref-${number}${subId > 0 ? `-${subId + 1}` : ''}`;
}

const md = new MarkdownIt({ html: true, linkify: true, typographer: true }).use(footnote);

md.renderer.rules.footnote_ref = (tokens, idx) => {
  const token = tokens[idx] as unknown as FootnoteToken;
  const number = footnoteNumber(token);
  const subId = Number(token.meta.subId ?? 0);
  const caption = `[${number}${subId > 0 ? `:${subId}` : ''}]`;
  return `<sup class="footnote-ref"><a href="#fn-${number}" id="${footnoteReferenceId(token)}" aria-label="註腳 ${number}">${caption}</a></sup>`;
};

md.renderer.rules.footnote_block_open = () =>
  '<hr class="footnotes-sep">\n<section class="footnotes" aria-label="註腳">\n<ol class="footnotes-list">\n';
md.renderer.rules.footnote_block_close = () => '</ol>\n</section>\n';
md.renderer.rules.footnote_open = (tokens, idx) => {
  const number = footnoteNumber(tokens[idx] as unknown as FootnoteToken);
  return `<li id="fn-${number}" class="footnote-item" tabindex="-1">`;
};
md.renderer.rules.footnote_close = () => '</li>\n';
md.renderer.rules.footnote_anchor = (tokens, idx) => {
  const token = tokens[idx] as unknown as FootnoteToken;
  const number = footnoteNumber(token);
  const subId = Number(token.meta.subId ?? 0);
  const position = subId > 0 ? `第 ${subId + 1} 個` : '第一個';
  return ` <a href="#${footnoteReferenceId(token)}" class="footnote-backref" aria-label="返回註腳 ${number} 的${position}引用位置">↩︎</a>`;
};

export function renderMarkdown(markdown: string): string {
  const slugger = new HeadingSlugger();
  const env = { slugger };
  md.renderer.rules.heading_open = (tokens, idx, options, currentEnv, self) => {
    const inline = tokens[idx + 1];
    const text = inline?.type === 'inline' ? inline.content : '';
    tokens[idx].attrSet('id', (currentEnv.slugger as HeadingSlugger).slug(text));
    return self.renderToken(tokens, idx, options);
  };
  return sanitizeHtml(md.render(markdown, env), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'img',
      'details',
      'summary',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'section',
    ]),
    allowedAttributes: {
      a: ['href', 'title', 'id', 'class', 'aria-label', 'rel'],
      img: ['src', 'alt', 'title'],
      code: ['class'],
      sup: ['class'],
      section: ['class', 'aria-label'],
      ol: ['class'],
      li: ['id', 'class', 'tabindex'],
      hr: ['class'],
      h1: ['id'],
      h2: ['id'],
      h3: ['id'],
      h4: ['id'],
      h5: ['id'],
      h6: ['id'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'app-asset', 'file'],
    transformTags: {
      a: (_tag, attrs) => ({ tagName: 'a', attribs: { ...attrs, rel: 'noreferrer' } }),
    },
  });
}
