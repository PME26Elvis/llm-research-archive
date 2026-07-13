import './mermaid.css';
import { renderMermaidSvg, type MermaidTheme } from './mermaid-renderer';

export interface MermaidLabels {
  diagram: string;
  pending: string;
  source: string;
  rendering: string;
  done: string;
  failed: string;
}

interface MermaidMountOptions {
  render?: typeof renderMermaidSvg;
  labels?: MermaidLabels;
}

const defaultLabels: MermaidLabels = {
  diagram: 'Mermaid 圖表',
  pending: '圖表將在接近閱讀區域時載入',
  source: '查看 Mermaid 原始碼',
  rendering: '正在渲染 Mermaid 圖表…',
  done: 'Mermaid 圖表已完成',
  failed: 'Mermaid 圖表無法渲染，已保留原始碼',
};

let diagramSequence = 0;

function resolvedTheme(): MermaidTheme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function createMermaidFigure(
  pre: HTMLPreElement,
  source: string,
  labels: MermaidLabels,
): HTMLElement {
  const figure = document.createElement('figure');
  figure.className = 'mermaid-diagram';
  figure.dataset.mermaidState = 'pending';
  figure.dataset.mermaidSource = source;
  figure.dataset.mermaidRenderVersion = '0';

  const caption = document.createElement('figcaption');
  caption.textContent = labels.diagram;

  const canvas = document.createElement('div');
  canvas.className = 'mermaid-canvas';
  canvas.dataset.mermaidCanvas = '';

  const status = document.createElement('p');
  status.className = 'mermaid-status';
  status.dataset.mermaidStatus = '';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.textContent = labels.pending;

  const sourceDetails = document.createElement('details');
  sourceDetails.className = 'mermaid-source';
  const summary = document.createElement('summary');
  summary.textContent = labels.source;

  pre.replaceWith(figure);
  sourceDetails.append(summary, pre);
  figure.append(caption, canvas, status, sourceDetails);
  return figure;
}

async function renderFigure(
  figure: HTMLElement,
  render: typeof renderMermaidSvg,
  labels: MermaidLabels,
): Promise<void> {
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
  status.textContent = labels.rendering;
  const id = `research-observatory-mermaid-${++diagramSequence}`;

  try {
    const svg = await render(id, source, labels.diagram, undefined, resolvedTheme());
    if (!figure.isConnected || Number(figure.dataset.mermaidRenderVersion) !== version) return;
    canvas.innerHTML = svg;
    figure.dataset.mermaidState = 'rendered';
    figure.dataset.mermaidTheme = resolvedTheme();
    status.textContent = labels.done;
    sourceDetails.open = false;
  } catch {
    if (!figure.isConnected || Number(figure.dataset.mermaidRenderVersion) !== version) return;
    canvas.replaceChildren();
    figure.dataset.mermaidState = 'error';
    status.setAttribute('role', 'alert');
    status.textContent = labels.failed;
    sourceDetails.open = true;
  }
}

export function mountMermaidBlocks(
  reader: HTMLElement,
  options: MermaidMountOptions = {},
): () => void {
  const render = options.render ?? renderMermaidSvg;
  const labels = options.labels ?? defaultLabels;
  const figures: HTMLElement[] = [];

  for (const figure of reader.querySelectorAll<HTMLElement>('figure.mermaid-diagram')) {
    figure.querySelector('figcaption')?.replaceChildren(labels.diagram);
    figure.querySelector('details.mermaid-source > summary')?.replaceChildren(labels.source);
    figure.querySelector('svg')?.setAttribute('aria-label', labels.diagram);
    const status = figure.querySelector<HTMLElement>('[data-mermaid-status]');
    if (status) {
      const state = figure.dataset.mermaidState;
      status.textContent =
        state === 'rendered'
          ? labels.done
          : state === 'error'
            ? labels.failed
            : state === 'rendering'
              ? labels.rendering
              : labels.pending;
    }
    figures.push(figure);
  }

  for (const code of reader.querySelectorAll<HTMLElement>('pre > code.language-mermaid')) {
    const pre = code.parentElement;
    if (!(pre instanceof HTMLPreElement) || pre.closest('.mermaid-diagram')) continue;
    figures.push(createMermaidFigure(pre, code.textContent || '', labels));
  }

  if (!figures.length) return () => undefined;

  let observer: IntersectionObserver | undefined;
  if (typeof IntersectionObserver === 'undefined') {
    for (const figure of figures) void renderFigure(figure, render, labels);
  } else {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer?.unobserve(entry.target);
          void renderFigure(entry.target as HTMLElement, render, labels);
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
      void renderFigure(figure, render, labels);
    }
  };
  document.addEventListener('observatory-theme-change', onThemeChange);

  return () => {
    observer?.disconnect();
    document.removeEventListener('observatory-theme-change', onThemeChange);
  };
}
