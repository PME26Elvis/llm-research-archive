import { expect, it } from 'vitest';
import { renderMarkdown } from './index';
it('renders headings and code', () => {
  expect(renderMarkdown('# 標題\n```x```')).toContain('<h1>標題</h1>');
});
