import { describe, expect, it } from 'vitest';
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

describe('footnotes', () => {
  it('renders normal and inline notes with accessible deterministic anchors', () => {
    const html = renderMarkdown(
      '研究結論[^來源]，以及 inline note.^[補充說明]\n\n[^來源]: 第一個來源。',
    );

    expect(html).toContain(
      '<sup class="footnote-ref"><a href="#fn-1" id="fnref-1" aria-label="註腳 1" rel="noreferrer">[1]</a></sup>',
    );
    expect(html).toContain(
      '<sup class="footnote-ref"><a href="#fn-2" id="fnref-2" aria-label="註腳 2" rel="noreferrer">[2]</a></sup>',
    );
    expect(html).toContain('<section class="footnotes" aria-label="註腳">');
    expect(html).toContain('<li id="fn-1" class="footnote-item" tabindex="-1">');
    expect(html).toContain('第一個來源。');
    expect(html).toContain('補充說明');
  });

  it('creates unique references and back links for repeated citations', () => {
    const html = renderMarkdown('第一次[^same]，第二次[^same]。\n\n[^same]: 共用註腳。');

    expect(html).toContain('id="fnref-1"');
    expect(html).toContain('id="fnref-1-2"');
    expect(html).toContain('href="#fnref-1"');
    expect(html).toContain('href="#fnref-1-2"');
    expect(html).toContain('aria-label="返回註腳 1 的第一個引用位置"');
    expect(html).toContain('aria-label="返回註腳 1 的第 2 個引用位置"');
  });

  it('sanitizes unsafe HTML inside footnote content', () => {
    const html = renderMarkdown(
      '安全[^x]\n\n[^x]: <img src=x onerror="alert(1)"><script>x</script>',
    );

    expect(html).not.toContain('onerror');
    expect(html).not.toContain('<script>');
    expect(html).toContain('<section class="footnotes" aria-label="註腳">');
  });
});
