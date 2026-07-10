import { expect, it } from 'vitest';
import { renderMarkdown } from './index';

it('renders supported markdown and sanitizes unsafe html', () => {
  const html = renderMarkdown(
    '# 標題\n\n<script>alert(1)</script>\n\n```x```\n\n| a |\n| - |\n| b |',
  );
  expect(html).toContain('<h1 id="article">標題</h1>');
  expect(html).toContain('<code>');
  expect(html).toContain('<table>');
  expect(html).not.toContain('<script>');
});
