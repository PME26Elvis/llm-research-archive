import { expect, it } from 'vitest';
import { renderMarkdown } from './index';

it('renders supported markdown and sanitizes unsafe html', () => {
  const html = renderMarkdown(
    '# 標題\n\n<script>alert(1)</script>\n\n```x```\n\n| a |\n| - |\n| b |',
  );
  expect(html).toContain('<h1 id="標題">標題</h1>');
  expect(html).toContain('<code>');
  expect(html).toContain('<table>');
  expect(html).not.toContain('<script>');
});

it('deduplicates heading IDs with the shared Unicode slugger', () => {
  const html = renderMarkdown('# 模型\n\n## 模型\n\n## Deep Heading');
  expect(html).toContain('<h1 id="模型">模型</h1>');
  expect(html).toContain('<h2 id="模型-1">模型</h2>');
  expect(html).toContain('<h2 id="deep-heading">Deep Heading</h2>');
});
