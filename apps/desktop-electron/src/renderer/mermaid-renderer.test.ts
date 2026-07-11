import { describe, expect, it, vi } from 'vitest';
import { renderMermaidSvg, sanitizeMermaidSvg, type MermaidApi } from './mermaid-renderer';

describe('sanitizeMermaidSvg', () => {
  it('preserves safe diagram geometry and fragment marker references', () => {
    const svg = sanitizeMermaidSvg(
      '<svg viewBox="0 0 10 10"><defs><marker id="arrow"><path d="M0 0 L10 5 L0 10 Z"></path></marker></defs><path d="M0 0 L10 10" marker-end="url(#arrow)"></path><text x="1" y="2">安全</text></svg>',
      '流程圖',
    );

    expect(svg).toContain('viewBox="0 0 10 10"');
    expect(svg).toContain('marker-end="url(#arrow)"');
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
    expect(svg).toContain('stroke:url(#safe)');
  });

  it('rejects a non-SVG renderer response', () => {
    expect(() => sanitizeMermaidSvg('<div>not svg</div>')).toThrow(/invalid SVG/);
  });
});

describe('renderMermaidSvg', () => {
  it('renders through the injected Mermaid API and sanitizes its result', async () => {
    const render = vi.fn(async () => ({
      svg: '<svg><text>Start</text><script>alert(1)</script></svg>',
    }));
    const api: MermaidApi = { initialize: vi.fn(), render };

    await expect(renderMermaidSvg('diagram-1', 'graph TD\nA-->B', '測試圖', api)).resolves.toBe(
      '<svg role="img" aria-label="測試圖"><text>Start</text></svg>',
    );
    expect(render).toHaveBeenCalledWith('diagram-1', 'graph TD\nA-->B');
  });
});
