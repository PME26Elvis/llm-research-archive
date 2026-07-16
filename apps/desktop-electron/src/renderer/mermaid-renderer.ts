import sanitizeHtml from 'sanitize-html';

export type MermaidTheme = 'light' | 'dark';

export interface MermaidApi {
  initialize(config: Record<string, unknown>): void;
  parse?(source: string): Promise<unknown>;
  render(id: string, source: string): Promise<{ svg: string }>;
}

const allowedSvgTags = [
  'svg',
  'g',
  'defs',
  'style',
  'marker',
  'symbol',
  'switch',
  'path',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'text',
  'tspan',
  'title',
  'desc',
  'clipPath',
  'mask',
  'pattern',
  'linearGradient',
  'radialGradient',
  'stop',
  'use',
];

const allowedSvgAttributes = [
  'id',
  'class',
  'style',
  'transform',
  'role',
  'aria-label',
  'aria-labelledby',
  'aria-hidden',
  'focusable',
  'tabindex',
  'xmlns',
  'xmlns:xlink',
  'viewBox',
  'width',
  'height',
  'preserveAspectRatio',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'd',
  'points',
  'dx',
  'dy',
  'text-anchor',
  'dominant-baseline',
  'font-size',
  'font-family',
  'font-weight',
  'font-style',
  'text-decoration',
  'letter-spacing',
  'word-spacing',
  'fill',
  'fill-opacity',
  'fill-rule',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-dasharray',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'clip-rule',
  'opacity',
  'color',
  'shape-rendering',
  'vector-effect',
  'pointer-events',
  'marker-start',
  'marker-mid',
  'marker-end',
  'orient',
  'refX',
  'refY',
  'markerWidth',
  'markerHeight',
  'gradientUnits',
  'offset',
  'stop-color',
  'stop-opacity',
  'clip-path',
  'mask',
  'filter',
  'href',
  'xlink:href',
];

function safeSvgAttribute(name: string, value: string): boolean {
  const lowerName = name.toLowerCase();
  if (lowerName.startsWith('on') || lowerName === 'srcdoc') return false;
  if ((lowerName === 'href' || lowerName === 'xlink:href') && !value.startsWith('#')) return false;
  if (/javascript:|data:text\/html|@import/i.test(value)) return false;
  if (/url\(/i.test(value) && /url\(\s*(?!['"]?#)/i.test(value)) return false;
  return true;
}

function safeLabel(label: string): string {
  return label.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function normalizeMermaidSource(source: string): string {
  const normalized = source
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .trim();
  if (!normalized) throw new Error('Mermaid source is empty');
  return normalized;
}

export function sanitizeMermaidSvg(svg: string, label = 'Mermaid 圖表'): string {
  let clean = sanitizeHtml(svg, {
    allowedTags: allowedSvgTags,
    allowedAttributes: { '*': allowedSvgAttributes },
    allowedSchemes: [],
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
    parser: { lowerCaseTags: false, lowerCaseAttributeNames: false },
    transformTags: {
      '*': (tagName, attribs) => ({
        tagName,
        attribs: Object.fromEntries(
          Object.entries(attribs).filter(([name, value]) => safeSvgAttribute(name, value)),
        ),
      }),
    },
  });

  clean = clean
    .replace(/@import[^;}{]+;?/gi, '')
    .replace(/url\(\s*(?!['"]?#)[^)]+\)/gi, 'none')
    .replace(/javascript:/gi, '');

  if (!/^<svg\b/i.test(clean) || !/<\/svg>\s*$/i.test(clean)) {
    throw new Error('Mermaid renderer returned invalid SVG');
  }

  return clean.replace(
    /^<svg\b([^>]*)>/i,
    (_match, attributes: string) =>
      `<svg${attributes.replace(/\srole=(['"]).*?\1/i, '').replace(/\saria-label=(['"]).*?\1/i, '')} role="img" aria-label="${safeLabel(label)}">`,
  );
}

let mermaidPromise: Promise<MermaidApi> | undefined;
let renderQueue: Promise<unknown> = Promise.resolve();

export function loadMermaid(): Promise<MermaidApi> {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(
      ({ default: mermaid }) => mermaid as unknown as MermaidApi,
    );
  }
  return mermaidPromise;
}

function configureMermaid(renderer: MermaidApi, theme: MermaidTheme): void {
  renderer.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: theme === 'light' ? 'default' : 'dark',
    suppressErrorRendering: true,
    flowchart: { htmlLabels: false },
    fontFamily: 'system-ui, sans-serif',
  });
}

async function renderWithTheme(
  renderer: MermaidApi,
  id: string,
  source: string,
  label: string,
  theme: MermaidTheme,
): Promise<string> {
  const normalizedSource = normalizeMermaidSource(source);
  configureMermaid(renderer, theme);
  await renderer.parse?.(normalizedSource);
  const { svg } = await renderer.render(id, normalizedSource);
  return sanitizeMermaidSvg(svg, label);
}

export async function renderMermaidSvg(
  id: string,
  source: string,
  label = 'Mermaid 圖表',
  api?: MermaidApi,
  theme: MermaidTheme = 'dark',
): Promise<string> {
  if (api) return renderWithTheme(api, id, source, label, theme);

  const renderer = await loadMermaid();
  const task = renderQueue
    .catch(() => undefined)
    .then(() => renderWithTheme(renderer, id, source, label, theme));
  renderQueue = task;
  return task;
}
