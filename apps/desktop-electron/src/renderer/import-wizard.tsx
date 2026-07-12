import React, { useEffect, useRef, useState } from "react";
import type {
  ImportCommitResult,
  ImportMetadataDto,
  ImportPlanPreviewDto,
  ImportSourceKind,
  WorkspaceInfoDto,
} from "@research-observatory/platform-contracts";

interface ImportWizardProps {
  open: boolean;
  workspace: WorkspaceInfoDto | null;
  onClose(): void;
  onChooseWorkspace(): Promise<void>;
  onCommitted(
    result: Extract<ImportCommitResult, { status: "committed" }>,
  ): Promise<void>;
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
    tags: preview.metadata.tags.join(", "),
    date: preview.metadata.date,
  };
}

export function ImportWizard({
  open,
  workspace,
  onClose,
  onChooseWorkspace,
  onCommitted,
}: ImportWizardProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  const [preview, setPreview] = useState<ImportPlanPreviewDto | null>(null);
  const [metadata, setMetadata] = useState({
    title: "",
    category: "",
    slug: "",
    tags: "",
    date: "",
  });
  const [dirty, setDirty] = useState(false);
  const [removeSource, setRemoveSource] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!open) return;
    setPreview(null);
    setMetadata({ title: "", category: "", slug: "", tags: "", date: "" });
    setDirty(false);
    setRemoveSource(false);
    setBusy(false);
    setError("");
    setStatus("");
    requestAnimationFrame(() => firstButtonRef.current?.focus());
  }, [open, workspace?.rootPath]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
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
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose, open]);

  if (!open) return null;

  function acceptPreview(next: ImportPlanPreviewDto) {
    setPreview(next);
    setMetadata(metadataFromPreview(next));
    setDirty(false);
    setError("");
    setStatus(
      next.canCommit
        ? "預覽已更新，可以提交。"
        : next.requiresMetadataConfirmation
          ? "請確認分類、slug 與其他 metadata 後更新預覽。"
          : "預覽包含阻擋提交的衝突。",
    );
  }

  async function chooseSource(kind: ImportSourceKind) {
    setBusy(true);
    setError("");
    setStatus(
      kind === "markdown-file" ? "正在讀取 Markdown…" : "正在掃描文章資料夾…",
    );
    try {
      const result = await window.observatory.selectImportSource(kind);
      if (result.status === "preview") acceptPreview(result.preview);
      else if (result.status === "rejected") {
        setError(result.message);
        setStatus("");
      } else setStatus("已取消選擇來源。");
    } catch (cause) {
      setError(`無法建立匯入預覽：${String(cause)}`);
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  function validatedMetadata(): ImportMetadataDto | undefined {
    const tags = metadata.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (!metadata.title.trim()) {
      setError("標題不可為空。");
      return undefined;
    }
    if (!kebabCasePattern.test(metadata.category)) {
      setError("分類必須是小寫英文 kebab-case，例如 llm-research。");
      return undefined;
    }
    if (!kebabCasePattern.test(metadata.slug)) {
      setError("slug 必須是小寫英文 kebab-case，例如 model-report。");
      return undefined;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(metadata.date)) {
      setError("日期必須是 YYYY-MM-DD。");
      return undefined;
    }
    if (!tags.length || tags.length > 8) {
      setError("請輸入 1 到 8 個標籤，並以逗號分隔。");
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
    setError("");
    setStatus("正在重新驗證 metadata 與輸出路徑…");
    try {
      const result = await window.observatory.refreshImportPreview({
        planId: preview.planId,
        metadata: nextMetadata,
      });
      if (result.status === "preview") acceptPreview(result.preview);
      else if (result.status === "rejected") {
        setError(result.message);
        setStatus("");
      }
    } catch (cause) {
      setError(`無法更新匯入預覽：${String(cause)}`);
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    if (!preview || dirty || !preview.canCommit) return;
    setBusy(true);
    setError("");
    setStatus("正在原子寫入並驗證文章…");
    try {
      const result = await window.observatory.commitImport({
        planId: preview.planId,
        removeSource,
      });
      if (result.status === "rejected") {
        setError(result.message);
        setStatus("提交失敗；工作區不應包含部分輸出。");
        return;
      }
      setStatus("匯入完成，正在重新載入工作區…");
      await onCommitted(result);
      onClose();
    } catch (cause) {
      setError(`匯入提交失敗：${String(cause)}`);
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  const writable = workspace?.kind === "local";

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
            <h2 id="import-wizard-title">匯入文章</h2>
            <p id="import-wizard-description">
              先建立唯讀預覽；確認
              metadata、資產與輸出檔案後，才會原子寫入工作區。
            </p>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            disabled={busy}
          >
            關閉
          </button>
        </div>

        <div className="import-target" data-testid="import-target-workspace">
          <strong>目標工作區：</strong>{" "}
          {workspace
            ? `${workspace.displayName}（${workspace.kind === "local" ? "可寫入" : "唯讀"}）`
            : "載入中"}
        </div>

        {!writable && (
          <div className="import-blocker" role="alert">
            <p>內建封存不可寫入。請先選擇本機工作區。</p>
            <button
              ref={firstButtonRef}
              type="button"
              onClick={() => void onChooseWorkspace()}
              disabled={busy}
            >
              開啟本機工作區
            </button>
          </div>
        )}

        {writable && !preview && (
          <div className="import-source-options">
            <h3>1. 選擇來源</h3>
            <button
              ref={firstButtonRef}
              type="button"
              onClick={() => void chooseSource("markdown-file")}
              disabled={busy}
            >
              選擇 Markdown 檔案…
              <small>匯入單一 .md 檔案</small>
            </button>
            <button
              type="button"
              onClick={() => void chooseSource("article-folder")}
              disabled={busy}
            >
              選擇文章資料夾…
              <small>article.md、可選 research-activity.md 與 assets/</small>
            </button>
          </div>
        )}

        {writable && preview && (
          <>
            <section
              className="import-section"
              aria-labelledby="import-metadata-title"
            >
              <div className="import-section-heading">
                <div>
                  <h3 id="import-metadata-title">2. 檢查 metadata</h3>
                  <small>來源：{preview.source.displayName}</small>
                </div>
                <button
                  type="button"
                  className="compact-button"
                  onClick={() => {
                    setPreview(null);
                    setError("");
                    setStatus("");
                  }}
                  disabled={busy}
                >
                  更換來源
                </button>
              </div>
              <div className="import-metadata-grid">
                <label>
                  標題
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
                  日期
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
                  分類
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
                  slug
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
                  標籤（逗號分隔）
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
                更新並重新驗證預覽
              </button>
            </section>

            <section
              className="import-section"
              aria-labelledby="import-plan-title"
            >
              <h3 id="import-plan-title">3. 寫入計畫</h3>
              <dl className="import-summary-grid">
                <div>
                  <dt>目標文章</dt>
                  <dd data-testid="import-target-path">
                    {preview.targetArticleRelativePath}
                  </dd>
                </div>
                <div>
                  <dt>資產</dt>
                  <dd>{preview.assets.length} 個</dd>
                </div>
                <div>
                  <dt>輸出檔案</dt>
                  <dd>{preview.outputFiles.length} 個</dd>
                </div>
                <div>
                  <dt>清理項目</dt>
                  <dd>
                    {Object.values(preview.cleanup).reduce(
                      (total, value) => total + value,
                      0,
                    )}{" "}
                    個
                  </dd>
                </div>
              </dl>

              {!!preview.warnings.length && (
                <div
                  className="import-messages"
                  aria-labelledby="import-warning-title"
                >
                  <h4 id="import-warning-title">警告</h4>
                  <ul>
                    {preview.warnings.map((warning, index) => (
                      <li key={`${warning.code}-${warning.path || index}`}>
                        {warning.message}
                        {warning.path ? `（${warning.path}）` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!!preview.conflicts.length && (
                <div className="import-messages import-conflicts" role="alert">
                  <h4>阻擋提交的衝突</h4>
                  <ul>
                    {preview.conflicts.map((conflict) => (
                      <li key={conflict.path}>
                        {conflict.message}（{conflict.path}）
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <details>
                <summary>檢視預計寫入的檔案</summary>
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
              <h3 id="import-confirm-title">4. 確認提交</h3>
              <label className="import-remove-source">
                <input
                  type="checkbox"
                  checked={removeSource}
                  onChange={(event) => setRemoveSource(event.target.checked)}
                  disabled={busy}
                />
                匯入成功且再次驗證後，刪除原始來源
              </label>
              <small>
                預設保留來源。刪除是獨立且不可復原的動作；任一驗證失敗都會保留來源。
              </small>
              {dirty && (
                <p className="import-inline-note">
                  metadata 已變更；請先更新預覽。
                </p>
              )}
              {!preview.canCommit && !dirty && (
                <p className="import-inline-note">
                  目前預覽不可提交；請修正 metadata 或衝突。
                </p>
              )}
              <button
                type="button"
                className="primary-action"
                data-testid="commit-import"
                onClick={() => void commit()}
                disabled={busy || dirty || !preview.canCommit}
              >
                {busy ? "處理中…" : "原子匯入文章"}
              </button>
            </section>
          </>
        )}

        <div
          className="import-live-region"
          aria-live="polite"
          aria-atomic="true"
        >
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
