import { describe, expect, it, vi } from 'vitest';
import {
  normalizeMermaidSource,
  renderMermaidSvg,
  sanitizeMermaidSvg,
  type MermaidApi,
} from './mermaid-renderer';

describe('normalizeMermaidSource', () => {
  it('removes a BOM, normalizes line endings, and trims fenced source', () => {
    expect(normalizeMermaidSource('\uFEFFflowchart TD\r\n  A --> B\r\n')).toBe(
      'flowchart TD\n  A --> B',
    );
  });

  it('rejects an empty diagram before invoking Mermaid', () => {
    expect(() => normalizeMermaidSource(' \r\n ')).toThrow(/source is empty/);
  });
});

describe('sanitizeMermaidSvg', () => {
  it('preserves safe diagram geometry, styling, and fragment marker references', () => {
    const svg = sanitizeMermaidSvg(
      '<svg viewBox="0 0 10 10"><defs><marker id="arrow"><path d="M0 0 L10 5 L0 10 Z"></path></marker></defs><path d="M0 0 L10 10" marker-end="url(#arrow)" fill-rule="evenodd" vector-effect="non-scaling-stroke"></path><text x="1" y="2" font-style="italic">安全</text></svg>',
      '流程圖',
    );

    expect(svg).toContain('viewBox="0 0 10 10"');
    expect(svg).toContain('marker-end="url(#arrow)"');
    expect(svg).toContain('fill-rule="evenodd"');
    expect(svg).toContain('vector-effect="non-scaling-stroke"');
    expect(svg).toContain('font-style="italic"');
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label="流程圖"');
    expect(svg).toContain('安全');
  });

  it('removes executable, embedded, event, and external URL content', () => {
    const svg = sanitizeMermaidSvg(
      '<svg onload="alert(1)"><script>alert(1)</script><foreignObject><iframe src="https://evil.example"></iframe></foreignObject><use href="https://evil.example/icon.svg#x"></use><path style="fill:url(https://evil.example/x);stroke:url(#safe)"></path><style>@import url(https://evil.example/x.css); .x{fill:url(https://evil.example/x)}</style></svg>',
    );

    expect(svg).not.toMatch(/script|foreignObject|iframe|onload|evil\.example|@import/i);
    expect(svg).not.toContain('href=');
  });

  it('rejects a non-SVG renderer response', () => {
    expect(() => sanitizeMermaidSvg('<div>not svg</div>')).toThrow(/invalid SVG/);
  });
});

describe('renderMermaidSvg', () => {
  it('normalizes, parses, configures, renders, and sanitizes the requested theme', async () => {
    const initialize = vi.fn();
    const parse = vi.fn(async () => ({ diagramType: 'flowchart-v2' }));
    const render = vi.fn(async () => ({
      svg: '<svg><text>Start</text><script>alert(1)</script></svg>',
    }));
    const api: MermaidApi = { initialize, parse, render };

    await expect(
      renderMermaidSvg('diagram-1', '\uFEFFgraph TD\r\nA-->B\r\n', '測試圖', api, 'light'),
    ).resolves.toBe('<svg role="img" aria-label="測試圖"><text>Start</text></svg>');
    expect(initialize).toHaveBeenCalledWith(
      expect.objectContaining({ securityLevel: 'strict', theme: 'default' }),
    );
    expect(parse).toHaveBeenCalledWith('graph TD\nA-->B');
    expect(render).toHaveBeenCalledWith('diagram-1', 'graph TD\nA-->B');
    expect(parse.mock.invocationCallOrder[0]).toBeLessThan(render.mock.invocationCallOrder[0]);
  });
});
