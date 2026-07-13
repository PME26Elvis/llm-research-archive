import React, { useEffect, useMemo, useRef } from 'react';
import { buildArchiveBrowseModel } from '@research-observatory/renderer-ui';
import type { AppLocale, ArticleSummaryDto } from '@research-observatory/platform-contracts';
import { formatNumber, translate } from './i18n';

interface ObservatoryModalProps {
  articles: readonly ArticleSummaryDto[];
  locale: AppLocale;
  onClose(): void;
}

function focusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute('disabled') && !element.getAttribute('aria-hidden'));
}

export function ObservatoryModal({ articles, locale, onClose }: ObservatoryModalProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const model = useMemo(() => buildArchiveBrowseModel([...articles], locale), [articles, locale]);
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const totals = useMemo(
    () =>
      articles.reduce(
        (summary, article) => ({
          displayCount: summary.displayCount + article.readingStats.displayCount,
          estimatedMinutes: summary.estimatedMinutes + article.readingStats.estimatedMinutes,
        }),
        { displayCount: 0, estimatedMinutes: 0 },
      ),
    [articles],
  );
  const revised = useMemo(
    () => articles.filter((article) => article.updatedAt && article.updatedAt !== article.date),
    [articles],
  );

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = focusableElements(dialogRef.current);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        ref={dialogRef}
        className="modal observatory-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="observatory-title"
        aria-describedby="observatory-description"
        data-testid="observatory-modal"
      >
        <header>
          <div>
            <h2 id="observatory-title">{t('observatory.title')}</h2>
            <p id="observatory-description">{t('observatory.description')}</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose}>
            {t('general.close')}
          </button>
        </header>

        <dl className="observatory-stats" data-testid="observatory-stats">
          <div>
            <dt>{t('observatory.articleCount')}</dt>
            <dd>{formatNumber(locale, articles.length)}</dd>
          </div>
          <div>
            <dt>{t('observatory.wordCount')}</dt>
            <dd>{formatNumber(locale, totals.displayCount)}</dd>
          </div>
          <div>
            <dt>{t('observatory.readingTime')}</dt>
            <dd>{formatNumber(locale, totals.estimatedMinutes)}</dd>
          </div>
          <div>
            <dt>{t('observatory.revisedCount')}</dt>
            <dd>{formatNumber(locale, revised.length)}</dd>
          </div>
        </dl>

        <div className="observatory-grid">
          <section aria-labelledby="observatory-categories">
            <h3 id="observatory-categories">{t('observatory.categories')}</h3>
            <table>
              <thead>
                <tr>
                  <th scope="col">{t('observatory.categories')}</th>
                  <th scope="col">{t('observatory.articles')}</th>
                </tr>
              </thead>
              <tbody>
                {model.categories.map((item) => (
                  <tr key={item.key}>
                    <th scope="row">{item.label}</th>
                    <td>{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section aria-labelledby="observatory-timeline">
            <h3 id="observatory-timeline">{t('observatory.timeline')}</h3>
            <table>
              <thead>
                <tr>
                  <th scope="col">{t('observatory.month')}</th>
                  <th scope="col">{t('observatory.articles')}</th>
                </tr>
              </thead>
              <tbody>
                {model.timeline.map((item) => (
                  <tr key={item.key}>
                    <th scope="row">{item.label}</th>
                    <td>{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section aria-labelledby="observatory-tags">
            <h3 id="observatory-tags">{t('observatory.tags')}</h3>
            <ol>
              {model.tags.slice(0, 20).map((item) => (
                <li key={item.key}>
                  <span>{item.label}</span>
                  <strong>{item.count}</strong>
                </li>
              ))}
            </ol>
          </section>
          <section aria-labelledby="observatory-revisions">
            <h3 id="observatory-revisions">{t('observatory.revisions')}</h3>
            {revised.length ? (
              <ol>
                {[...revised]
                  .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
                  .slice(0, 20)
                  .map((article) => (
                    <li key={article.id}>
                      <span>{article.title}</span>
                      <time dateTime={article.updatedAt}>{article.updatedAt}</time>
                    </li>
                  ))}
              </ol>
            ) : (
              <p>{t('observatory.noRevisions')}</p>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
