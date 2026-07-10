import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';
const md = new MarkdownIt({ html: true, linkify: true, typographer: true });
function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'article'
  );
}
md.renderer.rules.heading_open = (tokens, idx, options, _env, self) => {
  const inline = tokens[idx + 1];
  const text = inline?.type === 'inline' ? inline.content : '';
  tokens[idx].attrSet('id', slugify(text));
  return self.renderToken(tokens, idx, options);
};
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
