import React, { useEffect, useMemo, useRef } from 'react';
import { buildArchiveBrowseModel } from '@research-observatory/renderer-ui';
import type { ArticleSummaryDto } from '@research-observatory/platform-contracts';

interface ObservatoryModalProps {
  articles: readonly ArticleSummaryDto[];
  onClose(): void;
}

function focusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute('disabled') && !element.getAttribute('aria-hidden'));
}

export function ObservatoryModal({ articles, onClose }: ObservatoryModalProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const model = useMemo(() => buildArchiveBrowseModel([...articles]), [articles]);
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
            <h2 id="observatory-title">Observatory 封存摘要</h2>
            <p id="observatory-description">
              以表格與文字呈現封存規模、分類、標籤、時間軸、修訂日期與閱讀量；此視圖也是所有視覺化的無障礙替代內容。
            </p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose}>
            關閉
          </button>
        </header>

        <dl className="observatory-stats" data-testid="observatory-stats">
          <div>
            <dt>文章數</dt>
            <dd>{articles.length}</dd>
          </div>
          <div>
            <dt>顯示字數</dt>
            <dd>{totals.displayCount.toLocaleString('zh-TW')}</dd>
          </div>
          <div>
            <dt>估計閱讀時間</dt>
            <dd>{totals.estimatedMinutes.toLocaleString('zh-TW')} 分鐘</dd>
          </div>
          <div>
            <dt>含修訂日期文章</dt>
            <dd>{revised.length}</dd>
          </div>
        </dl>

        <div className="observatory-grid">
          <section aria-labelledby="observatory-categories">
            <h3 id="observatory-categories">分類</h3>
            <table>
              <thead>
                <tr>
                  <th scope="col">分類</th>
                  <th scope="col">文章</th>
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
            <h3 id="observatory-timeline">時間軸</h3>
            <table>
              <thead>
                <tr>
                  <th scope="col">月份</th>
                  <th scope="col">文章</th>
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
            <h3 id="observatory-tags">熱門標籤</h3>
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
            <h3 id="observatory-revisions">最近修訂</h3>
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
              <p>目前文章尚未提供獨立修訂日期。</p>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
