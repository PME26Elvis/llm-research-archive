import './mermaid.css';
import { renderMermaidSvg, type MermaidTheme } from './mermaid-renderer';

interface MermaidMountOptions {
  render?: typeof renderMermaidSvg;
}

let diagramSequence = 0;

function resolvedTheme(): MermaidTheme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function createMermaidFigure(pre: HTMLPreElement, source: string): HTMLElement {
  const figure = document.createElement('figure');
  figure.className = 'mermaid-diagram';
  figure.dataset.mermaidState = 'pending';
  figure.dataset.mermaidSource = source;
  figure.dataset.mermaidRenderVersion = '0';

  const caption = document.createElement('figcaption');
  caption.textContent = 'Mermaid 圖表';

  const canvas = document.createElement('div');
  canvas.className = 'mermaid-canvas';
  canvas.dataset.mermaidCanvas = '';

  const status = document.createElement('p');
  status.className = 'mermaid-status';
  status.dataset.mermaidStatus = '';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.textContent = '圖表將在接近閱讀區域時載入';

  const sourceDetails = document.createElement('details');
  sourceDetails.className = 'mermaid-source';
  const summary = document.createElement('summary');
  summary.textContent = '查看 Mermaid 原始碼';

  pre.replaceWith(figure);
  sourceDetails.append(summary, pre);
  figure.append(caption, canvas, status, sourceDetails);
  return figure;
}

async function renderFigure(figure: HTMLElement, render: typeof renderMermaidSvg): Promise<void> {
  if (figure.dataset.mermaidState !== 'pending') return;
  const source = figure.dataset.mermaidSource || '';
  const canvas = figure.querySelector<HTMLElement>('[data-mermaid-canvas]');
  const status = figure.querySelector<HTMLElement>('[data-mermaid-status]');
  const sourceDetails = figure.querySelector<HTMLDetailsElement>('details.mermaid-source');
  if (!canvas || !status || !sourceDetails) return;

  const version = Number(figure.dataset.mermaidRenderVersion ?? 0) + 1;
  figure.dataset.mermaidRenderVersion = String(version);
  figure.dataset.mermaidState = 'rendering';
  status.setAttribute('role', 'status');
  status.textContent = '正在渲染 Mermaid 圖表…';
  const id = `research-observatory-mermaid-${++diagramSequence}`;

  try {
    const svg = await render(id, source, 'Mermaid 圖表', undefined, resolvedTheme());
    if (!figure.isConnected || Number(figure.dataset.mermaidRenderVersion) !== version) return;
    canvas.innerHTML = svg;
    figure.dataset.mermaidState = 'rendered';
    figure.dataset.mermaidTheme = resolvedTheme();
    status.textContent = 'Mermaid 圖表已完成';
    sourceDetails.open = false;
  } catch {
    if (!figure.isConnected || Number(figure.dataset.mermaidRenderVersion) !== version) return;
    canvas.replaceChildren();
    figure.dataset.mermaidState = 'error';
    status.setAttribute('role', 'alert');
    status.textContent = 'Mermaid 圖表無法渲染，已保留原始碼';
    sourceDetails.open = true;
  }
}

export function mountMermaidBlocks(
  reader: HTMLElement,
  options: MermaidMountOptions = {},
): () => void {
  const render = options.render ?? renderMermaidSvg;
  const figures: HTMLElement[] = [];

  for (const code of reader.querySelectorAll<HTMLElement>('pre > code.language-mermaid')) {
    const pre = code.parentElement;
    if (!(pre instanceof HTMLPreElement) || pre.closest('.mermaid-diagram')) continue;
    figures.push(createMermaidFigure(pre, code.textContent || ''));
  }

  if (!figures.length) return () => undefined;

  let observer: IntersectionObserver | undefined;
  if (typeof IntersectionObserver === 'undefined') {
    for (const figure of figures) void renderFigure(figure, render);
  } else {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer?.unobserve(entry.target);
          void renderFigure(entry.target as HTMLElement, render);
        }
      },
      { rootMargin: '320px 0px' },
    );

    for (const figure of figures) observer.observe(figure);
  }

  const onThemeChange = () => {
    for (const figure of figures) {
      if (figure.dataset.mermaidState !== 'rendered') continue;
      if (figure.dataset.mermaidTheme === resolvedTheme()) continue;
      figure.dataset.mermaidState = 'pending';
      figure.querySelector<HTMLElement>('[data-mermaid-canvas]')?.replaceChildren();
      void renderFigure(figure, render);
    }
  };
  document.addEventListener('observatory-theme-change', onThemeChange);

  return () => {
    observer?.disconnect();
    document.removeEventListener('observatory-theme-change', onThemeChange);
  };
}
