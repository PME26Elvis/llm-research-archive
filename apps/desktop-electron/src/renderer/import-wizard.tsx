import React, { useEffect, useRef, useState } from 'react';
import type {
  AppLocale,
  ImportCommitResult,
  ImportMetadataDto,
  ImportPlanPreviewDto,
  ImportSourceKind,
  WorkspaceInfoDto,
} from '@research-observatory/platform-contracts';
import { translate } from './i18n';

interface ImportWizardProps {
  open: boolean;
  locale: AppLocale;
  workspace: WorkspaceInfoDto | null;
  onClose(): void;
  onChooseWorkspace(): Promise<void>;
  onCommitted(result: Extract<ImportCommitResult, { status: 'committed' }>): Promise<void>;
}

const kebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function metadataFromPreview(preview: ImportPlanPreviewDto) {
  return {
    title: preview.metadata.title,
    category: preview.metadata.category,
    slug: preview.metadata.slug,
    tags: preview.metadata.tags.join(', '),
    date: preview.metadata.date,
  };
}

export function ImportWizard({
  open,
  locale,
  workspace,
  onClose,
  onChooseWorkspace,
  onCommitted,
}: ImportWizardProps) {
  const t = (key: Parameters<typeof translate>[1], values: Record<string, string | number> = {}) =>
    translate(locale, key, values);

  function previewError(code: string, fallback: string): string {
    const keys = {
      'workspace-read-only': 'import.error.workspaceReadOnly',
      'plan-not-found': 'import.error.planNotFound',
      'invalid-source': 'import.error.invalidSource',
      'invalid-metadata': 'import.error.invalidMetadata',
    } as const;
    const key = keys[code as keyof typeof keys];
    return key ? t(key) : fallback;
  }

  function commitError(code: string, fallback: string): string {
    const keys = {
      'workspace-read-only': 'import.error.workspaceReadOnly',
      'plan-not-found': 'import.error.planNotFound',
      'plan-not-committable': 'import.error.notCommittable',
      'stale-plan': 'import.error.stalePlan',
      'target-conflict': 'import.error.targetConflict',
      'commit-in-progress': 'import.error.inProgress',
      'stage-failed': 'import.error.stageFailed',
      'validation-failed': 'import.error.validationFailed',
      'commit-failed': 'import.error.commitFailed',
      'rollback-failed': 'import.error.rollbackFailed',
    } as const;
    const key = keys[code as keyof typeof keys];
    return key ? t(key) : fallback;
  }

  function issueMessage(code: string, fallback: string): string {
    const keys = {
      'source-not-found': 'import.issue.sourceNotFound',
      'unsupported-source': 'import.issue.unsupportedSource',
      'source-symlink': 'import.issue.sourceSymlink',
      'source-escape': 'import.issue.sourceEscape',
      'article-not-found': 'import.issue.articleNotFound',
      'invalid-frontmatter': 'import.issue.invalidFrontmatter',
      'invalid-metadata': 'import.issue.invalidMetadata',
      'category-fallback': 'import.issue.categoryFallback',
      'slug-fallback': 'import.issue.slugFallback',
      'ignored-source-entry': 'import.issue.ignoredSourceEntry',
      'asset-symlink': 'import.issue.assetSymlink',
      'asset-escape': 'import.issue.assetEscape',
      'missing-asset-reference': 'import.issue.missingAssetReference',
      'target-symlink': 'import.issue.targetSymlink',
    } as const;
    const key = keys[code as keyof typeof keys];
    return key ? t(key) : fallback;
  }

  const dialogRef = useRef<HTMLElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  const [preview, setPreview] = useState<ImportPlanPreviewDto | null>(null);
  const [metadata, setMetadata] = useState({
    title: '',
    category: '',
    slug: '',
    tags: '',
    date: '',
  });
  const [dirty, setDirty] = useState(false);
  const [removeSource, setRemoveSource] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!open) return;
    setPreview(null);
    setMetadata({ title: '', category: '', slug: '', tags: '', date: '' });
    setDirty(false);
    setRemoveSource(false);
    setBusy(false);
    setError('');
    setStatus('');
    requestAnimationFrame(() => firstButtonRef.current?.focus());
  }, [open, workspace?.rootPath]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), [href], select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ),
      );
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
  }, [busy, onClose, open]);

  if (!open) return null;

  function acceptPreview(next: ImportPlanPreviewDto) {
    setPreview(next);
    setMetadata(metadataFromPreview(next));
    setDirty(false);
    setError('');
    setStatus(
      next.canCommit
        ? t('import.previewReady')
        : next.requiresMetadataConfirmation
          ? t('import.confirmMetadata')
          : t('import.previewBlocked'),
    );
  }

  async function chooseSource(kind: ImportSourceKind) {
    setBusy(true);
    setError('');
    setStatus(kind === 'markdown-file' ? t('import.readingMarkdown') : t('import.scanningFolder'));
    try {
      const result = await window.observatory.selectImportSource(kind);
      if (result.status === 'preview') acceptPreview(result.preview);
      else if (result.status === 'rejected') {
        setError(previewError(result.code, result.message));
        setStatus('');
      } else setStatus(t('import.cancelled'));
    } catch (cause) {
      setError(t('import.previewFailed', { error: String(cause) }));
      setStatus('');
    } finally {
      setBusy(false);
    }
  }

  function validatedMetadata(): ImportMetadataDto | undefined {
    const tags = metadata.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (!metadata.title.trim()) {
      setError(t('import.titleRequired'));
      return undefined;
    }
    if (!kebabCasePattern.test(metadata.category)) {
      setError(t('import.categoryInvalid'));
      return undefined;
    }
    if (!kebabCasePattern.test(metadata.slug)) {
      setError(t('import.slugInvalid'));
      return undefined;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(metadata.date)) {
      setError(t('import.dateInvalid'));
      return undefined;
    }
    if (!tags.length || tags.length > 8) {
      setError(t('import.tagsInvalid'));
      return undefined;
    }
    return {
      title: metadata.title.trim(),
      category: metadata.category,
      slug: metadata.slug,
      tags,
      date: metadata.date,
    };
  }

  async function refreshPreview() {
    if (!preview) return;
    const nextMetadata = validatedMetadata();
    if (!nextMetadata) return;
    setBusy(true);
    setError('');
    setStatus(t('import.revalidating'));
    try {
      const result = await window.observatory.refreshImportPreview({
        planId: preview.planId,
        metadata: nextMetadata,
      });
      if (result.status === 'preview') acceptPreview(result.preview);
      else if (result.status === 'rejected') {
        setError(previewError(result.code, result.message));
        setStatus('');
      }
    } catch (cause) {
      setError(t('import.refreshFailed', { error: String(cause) }));
      setStatus('');
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    if (!preview || dirty || !preview.canCommit) return;
    setBusy(true);
    setError('');
    setStatus(t('import.committing'));
    try {
      const result = await window.observatory.commitImport({
        planId: preview.planId,
        removeSource,
      });
      if (result.status === 'rejected') {
        setError(commitError(result.code, result.message));
        setStatus(t('import.commitRejected'));
        return;
      }
      setStatus(t('import.completed'));
      await onCommitted(result);
      onClose();
    } catch (cause) {
      setError(t('import.commitFailed', { error: String(cause) }));
      setStatus('');
    } finally {
      setBusy(false);
    }
  }

  const writable = workspace?.kind === 'local';

  return (
    <div
      className="modal-backdrop import-wizard-backdrop"
      onMouseDown={() => {
        if (!busy) onClose();
      }}
    >
      <section
        ref={dialogRef}
        className="modal import-wizard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-wizard-title"
        aria-describedby="import-wizard-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="import-wizard-header">
          <div>
            <h2 id="import-wizard-title">{t('import.title')}</h2>
            <p id="import-wizard-description">{t('import.description')}</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} disabled={busy}>
            {t('general.close')}
          </button>
        </div>

        <div className="import-target" data-testid="import-target-workspace">
          <strong>{t('import.targetWorkspace')}</strong>{' '}
          {workspace
            ? `${workspace.displayName} (${workspace.kind === 'local' ? t('import.writable') : t('import.readOnly')})`
            : t('general.loading')}
        </div>

        {!writable && (
          <div className="import-blocker" role="alert">
            <p>{t('import.bundledBlocked')}</p>
            <button
              ref={firstButtonRef}
              type="button"
              onClick={() => void onChooseWorkspace()}
              disabled={busy}
            >
              {t('import.openWorkspace')}
            </button>
          </div>
        )}

        {writable && !preview && (
          <div className="import-source-options">
            <h3>{t('import.stepSource')}</h3>
            <button
              ref={firstButtonRef}
              type="button"
              onClick={() => void chooseSource('markdown-file')}
              disabled={busy}
            >
              {t('import.chooseMarkdown')}
              <small>{t('import.chooseMarkdownHint')}</small>
            </button>
            <button
              type="button"
              onClick={() => void chooseSource('article-folder')}
              disabled={busy}
            >
              {t('import.chooseFolder')}
              <small>{t('import.chooseFolderHint')}</small>
            </button>
          </div>
        )}

        {writable && preview && (
          <>
            <section className="import-section" aria-labelledby="import-metadata-title">
              <div className="import-section-heading">
                <div>
                  <h3 id="import-metadata-title">{t('import.stepMetadata')}</h3>
                  <small>{t('import.source', { name: preview.source.displayName })}</small>
                </div>
                <button
                  type="button"
                  className="compact-button"
                  onClick={() => {
                    setPreview(null);
                    setError('');
                    setStatus('');
                  }}
                  disabled={busy}
                >
                  {t('import.changeSource')}
                </button>
              </div>
              <div className="import-metadata-grid">
                <label>
                  {t('import.fieldTitle')}
                  <input
                    type="text"
                    value={metadata.title}
                    onChange={(event) => {
                      setMetadata((current) => ({
                        ...current,
                        title: event.target.value,
                      }));
                      setDirty(true);
                    }}
                    disabled={busy}
                  />
                </label>
                <label>
                  {t('import.fieldDate')}
                  <input
                    type="text"
                    inputMode="numeric"
                    value={metadata.date}
                    onChange={(event) => {
                      setMetadata((current) => ({
                        ...current,
                        date: event.target.value,
                      }));
                      setDirty(true);
                    }}
                    disabled={busy}
                  />
                </label>
                <label>
                  {t('import.fieldCategory')}
                  <input
                    type="text"
                    value={metadata.category}
                    onChange={(event) => {
                      setMetadata((current) => ({
                        ...current,
                        category: event.target.value,
                      }));
                      setDirty(true);
                    }}
                    disabled={busy}
                  />
                </label>
                <label>
                  {t('import.fieldSlug')}
                  <input
                    type="text"
                    value={metadata.slug}
                    onChange={(event) => {
                      setMetadata((current) => ({
                        ...current,
                        slug: event.target.value,
                      }));
                      setDirty(true);
                    }}
                    disabled={busy}
                  />
                </label>
                <label className="import-tags-field">
                  {t('import.fieldTags')}
                  <input
                    type="text"
                    value={metadata.tags}
                    onChange={(event) => {
                      setMetadata((current) => ({
                        ...current,
                        tags: event.target.value,
                      }));
                      setDirty(true);
                    }}
                    disabled={busy}
                  />
                </label>
              </div>
              <button
                type="button"
                className="primary-action"
                onClick={() => void refreshPreview()}
                disabled={busy || !dirty}
              >
                {t('import.refresh')}
              </button>
            </section>

            <section className="import-section" aria-labelledby="import-plan-title">
              <h3 id="import-plan-title">{t('import.stepPlan')}</h3>
              <dl className="import-summary-grid">
                <div>
                  <dt>{t('import.targetArticle')}</dt>
                  <dd data-testid="import-target-path">{preview.targetArticleRelativePath}</dd>
                </div>
                <div>
                  <dt>{t('import.assets')}</dt>
                  <dd>{t('import.itemCount', { count: preview.assets.length })}</dd>
                </div>
                <div>
                  <dt>{t('import.outputFiles')}</dt>
                  <dd>{t('import.itemCount', { count: preview.outputFiles.length })}</dd>
                </div>
                <div>
                  <dt>{t('import.cleanupItems')}</dt>
                  <dd>
                    {t('import.itemCount', {
                      count: Object.values(preview.cleanup).reduce(
                        (total, value) => total + value,
                        0,
                      ),
                    })}
                  </dd>
                </div>
              </dl>

              {!!preview.warnings.length && (
                <div className="import-messages" aria-labelledby="import-warning-title">
                  <h4 id="import-warning-title">{t('import.warnings')}</h4>
                  <ul>
                    {preview.warnings.map((warning, index) => (
                      <li key={`${warning.code}-${warning.path || index}`}>
                        {issueMessage(warning.code, warning.message)}
                        {warning.path ? ` (${warning.path})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!!preview.conflicts.length && (
                <div className="import-messages import-conflicts" role="alert">
                  <h4>{t('import.conflicts')}</h4>
                  <ul>
                    {preview.conflicts.map((conflict) => (
                      <li key={conflict.path}>
                        {t('import.error.targetConflict')} ({conflict.path})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <details>
                <summary>{t('import.viewFiles')}</summary>
                <ul className="import-file-list">
                  {preview.outputFiles.map((file) => (
                    <li key={file.relativePath}>
                      <span>{file.relativePath}</span>
                      <small>{formatBytes(file.sizeBytes)}</small>
                    </li>
                  ))}
                </ul>
              </details>
            </section>

            <section
              className="import-section import-confirm"
              aria-labelledby="import-confirm-title"
            >
              <h3 id="import-confirm-title">{t('import.stepConfirm')}</h3>
              <label className="import-remove-source">
                <input
                  type="checkbox"
                  checked={removeSource}
                  onChange={(event) => setRemoveSource(event.target.checked)}
                  disabled={busy}
                />
                {t('import.removeSource')}
              </label>
              <small>{t('import.removeSourceHint')}</small>
              {dirty && <p className="import-inline-note">{t('import.metadataDirty')}</p>}
              {!preview.canCommit && !dirty && (
                <p className="import-inline-note">{t('import.notCommittable')}</p>
              )}
              <button
                type="button"
                className="primary-action"
                data-testid="commit-import"
                onClick={() => void commit()}
                disabled={busy || dirty || !preview.canCommit}
              >
                {busy ? t('import.processing') : t('import.commit')}
              </button>
            </section>
          </>
        )}

        <div className="import-live-region" aria-live="polite" aria-atomic="true">
          {status}
        </div>
        {error && (
          <div className="error import-error" role="alert">
            {error}
          </div>
        )}
      </section>
    </div>
  );
}
