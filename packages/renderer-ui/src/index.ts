import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';
import { HeadingSlugger } from '@research-observatory/domain';

export * from './browse';

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });
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
    ]),
    allowedAttributes: {
      a: ['href', 'title'],
      img: ['src', 'alt', 'title'],
      code: ['class'],
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
