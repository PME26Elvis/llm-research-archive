import sanitizeHtml from 'sanitize-html';

export interface MermaidApi {
  initialize(config: Record<string, unknown>): void;
  render(id: string, source: string): Promise<{ svg: string }>;
}

const allowedSvgTags = [
  'svg',
  'g',
  'defs',
  'style',
  'marker',
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
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-dasharray',
  'stroke-linecap',
  'stroke-linejoin',
  'opacity',
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

export function loadMermaid(): Promise<MermaidApi> {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(({ default: mermaid }) => {
      const api = mermaid as unknown as MermaidApi;
      api.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'dark',
        suppressErrorRendering: true,
        flowchart: { htmlLabels: false },
        fontFamily: 'system-ui, sans-serif',
      });
      return api;
    });
  }
  return mermaidPromise;
}

export async function renderMermaidSvg(
  id: string,
  source: string,
  label = 'Mermaid 圖表',
  api?: MermaidApi,
): Promise<string> {
  const renderer = api ?? (await loadMermaid());
  const { svg } = await renderer.render(id, source);
  return sanitizeMermaidSvg(svg, label);
}
