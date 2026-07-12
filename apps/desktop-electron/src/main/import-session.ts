import path from "node:path";
import {
  commitImportPlan,
  createImportPlan,
  removeImportedSource,
  type ImportCommitErrorCode,
  type ImportIssue,
  type ImportPlan,
} from "@research-observatory/content-engine";
import type {
  ImportCommitRequest,
  ImportMetadataDto,
  ImportPlanPreviewDto,
  ImportPreviewResult,
  WorkspaceInfoDto,
} from "@research-observatory/platform-contracts";

const MAX_CACHED_IMPORT_PLANS = 8;

function isInside(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
}

function displayPath(
  plan: ImportPlan,
  candidate: string | undefined,
): string | undefined {
  if (!candidate) return undefined;
  const absolute = path.resolve(candidate);
  if (
    plan.source.kind === "article-folder" &&
    isInside(plan.source.rootPath, absolute)
  ) {
    const relative = path
      .relative(plan.source.rootPath, absolute)
      .split(path.sep)
      .join("/");
    return relative || path.basename(plan.source.rootPath);
  }
  if (isInside(plan.workspaceRoot, absolute)) {
    const relative = path
      .relative(plan.workspaceRoot, absolute)
      .split(path.sep)
      .join("/");
    return relative || path.basename(plan.workspaceRoot);
  }
  return path.basename(absolute);
}

function issueDto(plan: ImportPlan, issue: ImportIssue) {
  const issuePath = displayPath(plan, issue.path);
  return {
    severity: issue.severity,
    code: issue.code,
    message: issue.message,
    ...(issuePath ? { path: issuePath } : {}),
  };
}

export function importPlanPreview(
  plan: ImportPlan,
  workspace: Pick<WorkspaceInfoDto, "displayName">,
): ImportPlanPreviewDto {
  return {
    planId: plan.planId,
    source: {
      kind: plan.source.kind,
      displayName: path.basename(plan.source.rootPath),
    },
    targetWorkspaceName: workspace.displayName,
    targetArticleRelativePath: plan.targetArticleRelativePath,
    metadata: plan.metadata,
    cleanup: plan.cleanup,
    assets: plan.assets.map(({ relativePath, outputPath, sizeBytes }) => ({
      relativePath,
      outputPath,
      sizeBytes,
    })),
    outputFiles: plan.outputFiles.map(({ kind, relativePath, sizeBytes }) => ({
      kind,
      relativePath,
      sizeBytes,
    })),
    warnings: plan.warnings.map((issue) => issueDto(plan, issue)),
    conflicts: plan.conflicts.map(({ code, message, path: conflictPath }) => ({
      code,
      message,
      path: displayPath(plan, conflictPath) || path.basename(conflictPath),
    })),
    requiresMetadataConfirmation: plan.requiresMetadataConfirmation,
    canCommit: plan.canCommit,
  };
}

function rejectedPreview(
  code:
    | "workspace-read-only"
    | "plan-not-found"
    | "invalid-source"
    | "invalid-metadata",
  message: string,
): ImportPreviewResult {
  return { status: "rejected", code, message };
}

function issueMessage(issues: readonly ImportIssue[]): string {
  return issues.map((issue) => issue.message).join("\n");
}

export type ImportSessionCommitResult =
  | {
      ok: true;
      articleId: string;
      sourceStatus: "retained" | "removed" | "removal-failed";
      message?: string;
    }
  | {
      ok: false;
      code:
        | "workspace-read-only"
        | "plan-not-found"
        | "plan-not-committable"
        | "stale-plan"
        | "target-conflict"
        | "commit-in-progress"
        | "stage-failed"
        | "validation-failed"
        | "commit-failed"
        | "rollback-failed";
      message: string;
    };

function commitErrorCode(
  code: ImportCommitErrorCode,
): Exclude<
  Extract<ImportSessionCommitResult, { ok: false }>["code"],
  "plan-not-found"
> {
  return code;
}

export class ImportSessionService {
  private readonly plans = new Map<string, ImportPlan>();

  clear(): void {
    this.plans.clear();
  }

  private store(plan: ImportPlan): void {
    this.plans.delete(plan.planId);
    this.plans.set(plan.planId, plan);
    while (this.plans.size > MAX_CACHED_IMPORT_PLANS) {
      const oldest = this.plans.keys().next().value as string | undefined;
      if (!oldest) break;
      this.plans.delete(oldest);
    }
  }

  createPreview(
    sourcePath: string,
    workspace: WorkspaceInfoDto,
  ): ImportPreviewResult {
    if (workspace.kind !== "local") {
      return rejectedPreview(
        "workspace-read-only",
        "內建封存為唯讀；請先開啟可寫入的本機工作區。",
      );
    }
    const result = createImportPlan({
      sourcePath,
      workspaceRoot: workspace.rootPath,
    });
    if (!result.ok) {
      const metadataFailure = result.issues.every(
        (issue) => issue.code === "invalid-metadata",
      );
      return rejectedPreview(
        metadataFailure ? "invalid-metadata" : "invalid-source",
        issueMessage(result.issues),
      );
    }
    this.store(result.plan);
    return {
      status: "preview",
      preview: importPlanPreview(result.plan, workspace),
    };
  }

  refreshPreview(
    planId: string,
    metadata: ImportMetadataDto,
    workspace: WorkspaceInfoDto,
  ): ImportPreviewResult {
    if (workspace.kind !== "local") {
      return rejectedPreview(
        "workspace-read-only",
        "內建封存為唯讀；請先開啟可寫入的本機工作區。",
      );
    }
    const current = this.plans.get(planId);
    if (
      !current ||
      path.resolve(current.workspaceRoot) !== path.resolve(workspace.rootPath)
    ) {
      return rejectedPreview(
        "plan-not-found",
        "匯入預覽已過期；請重新選擇來源。",
      );
    }
    const result = createImportPlan({
      sourcePath: current.source.rootPath,
      workspaceRoot: workspace.rootPath,
      publicationDate: metadata.date,
      overrides: metadata,
    });
    if (!result.ok) {
      return rejectedPreview("invalid-metadata", issueMessage(result.issues));
    }
    this.store(result.plan);
    return {
      status: "preview",
      preview: importPlanPreview(result.plan, workspace),
    };
  }

  commit(
    request: ImportCommitRequest,
    workspace: WorkspaceInfoDto,
  ): ImportSessionCommitResult {
    if (workspace.kind !== "local") {
      return {
        ok: false,
        code: "workspace-read-only",
        message: "內建封存為唯讀；無法提交匯入。",
      };
    }
    const plan = this.plans.get(request.planId);
    if (
      !plan ||
      path.resolve(plan.workspaceRoot) !== path.resolve(workspace.rootPath)
    ) {
      return {
        ok: false,
        code: "plan-not-found",
        message: "匯入預覽已過期；請重新建立預覽。",
      };
    }
    const committed = commitImportPlan(plan);
    if (!committed.ok) {
      return {
        ok: false,
        code: commitErrorCode(committed.error.code),
        message: committed.error.message,
      };
    }

    let sourceStatus: "retained" | "removed" | "removal-failed" = "retained";
    let message: string | undefined;
    if (request.removeSource) {
      const removed = removeImportedSource(committed.receipt);
      if (removed.ok) sourceStatus = "removed";
      else {
        sourceStatus = "removal-failed";
        message = `文章已匯入，但來源未刪除：${removed.error.message}`;
      }
    }
    this.plans.clear();
    return {
      ok: true,
      articleId: `${plan.metadata.category}/${plan.metadata.slug}`,
      sourceStatus,
      ...(message ? { message } : {}),
    };
  }
}
