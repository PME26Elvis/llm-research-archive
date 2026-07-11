import { describe, expect, it } from 'vitest';
import { highlightSource, normalizeSyntaxLanguage } from './syntax-highlight';

describe('normalizeSyntaxLanguage', () => {
  it('normalizes common fenced-code aliases without auto-detection', () => {
    expect(normalizeSyntaxLanguage('ts')).toBe('typescript');
    expect(normalizeSyntaxLanguage('language-py')).toBe('python');
    expect(normalizeSyntaxLanguage('YML')).toBe('yaml');
    expect(normalizeSyntaxLanguage('shell')).toBe('bash');
  });
});

describe('highlightSource', () => {
  it('highlights a registered language with bounded span-only markup', () => {
    const result = highlightSource('const answer: number = 42;', 'ts');

    expect(result.status).toBe('highlighted');
    expect(result.language).toBe('typescript');
    expect(result.html).toContain('hljs-keyword');
    expect(result.html).toContain('answer');
    expect(result.html).toMatch(/^([^<]|<span class="hljs-[^"]+">|<\/span>)+$/);
  });

  it('escapes executable-looking source instead of creating executable DOM', () => {
    const result = highlightSource('<script>alert(1)</script>', 'html');

    expect(result.status).toBe('highlighted');
    expect(result.html).not.toContain('<script>');
    expect(result.html).not.toContain('onerror=');
    expect(result.html).toContain('&lt;');
  });

  it('leaves unknown and plaintext languages untouched', () => {
    expect(highlightSource('plain body', 'brainfuck').status).toBe('plain');
    expect(highlightSource('plain body', 'text').status).toBe('plain');
  });

  it('never processes Mermaid source as syntax-highlighted code', () => {
    expect(highlightSource('flowchart TD\nA-->B', 'mermaid')).toEqual({
      status: 'skipped',
      language: 'mermaid',
      html: '',
    });
  });
});
