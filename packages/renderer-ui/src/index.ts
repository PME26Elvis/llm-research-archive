import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';
const md = new MarkdownIt({ html: true, linkify: true, typographer: true });
export function renderMarkdown(markdown: string): string {
  return sanitizeHtml(md.render(markdown), {
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
    allowedAttributes: { a: ['href', 'title'], img: ['src', 'alt', 'title'], code: ['class'] },
    allowedSchemes: ['http', 'https', 'mailto', 'app-asset'],
    transformTags: {
      a: (_tag, attrs) => ({ tagName: 'a', attribs: { ...attrs, rel: 'noreferrer' } }),
    },
  });
}
