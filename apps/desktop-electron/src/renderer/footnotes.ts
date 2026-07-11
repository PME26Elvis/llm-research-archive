import './footnotes.css';

function footnoteTarget(reader: HTMLElement, href: string): HTMLElement | null {
  if (!href.startsWith('#fn-') && !href.startsWith('#fnref-')) return null;
  const id = href.slice(1);
  const target = reader.ownerDocument.getElementById(id);
  return target && reader.contains(target) ? target : null;
}

export function mountFootnoteNavigation(reader: HTMLElement): () => void {
  const onClick = (event: MouseEvent) => {
    const anchor = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>(
      'a.footnote-backref, .footnote-ref > a',
    );
    if (!anchor || !reader.contains(anchor)) return;

    const target = footnoteTarget(reader, anchor.getAttribute('href') ?? '');
    if (!target) return;

    event.preventDefault();
    event.stopPropagation();
    target.scrollIntoView({ block: 'center' });
    target.focus({ preventScroll: true });
  };

  reader.addEventListener('click', onClick);
  return () => reader.removeEventListener('click', onClick);
}
