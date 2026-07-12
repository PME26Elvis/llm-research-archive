import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { WorkspaceInfoDto } from "@research-observatory/platform-contracts";
import { ImportSessionService } from "./import-session";

const roots: string[] = [];

function fixture() {
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), "desktop-import-session-"),
  );
  roots.push(root);
  const workspaceRoot = path.join(root, "workspace");
  const sourcePath = path.join(root, "report.md");
  fs.mkdirSync(workspaceRoot);
  fs.writeFileSync(sourcePath, "# GPU Model Report\n\nLLM GPU benchmark.");
  const workspace: WorkspaceInfoDto = {
    kind: "local",
    rootPath: workspaceRoot,
    displayName: "workspace",
    articleCount: 0,
    warnings: [],
    invalidFiles: [],
  };
  return { root, workspace, sourcePath };
}

afterEach(() => {
  while (roots.length)
    fs.rmSync(roots.pop()!, { recursive: true, force: true });
});

describe("ImportSessionService", () => {
  it("returns a sanitized preview and never exposes source write paths", () => {
    const { workspace, sourcePath } = fixture();
    const service = new ImportSessionService();
    const result = service.createPreview(sourcePath, workspace);
    expect(result.status).toBe("preview");
    if (result.status !== "preview") return;
    expect(result.preview.source.displayName).toBe("report.md");
    expect(JSON.stringify(result.preview)).not.toContain(
      path.dirname(sourcePath),
    );
    expect(result.preview.targetArticleRelativePath).toBe(
      "llm/gpu-model-report/index.md",
    );
  });

  it("rebuilds metadata into a new cached plan before commit", () => {
    const { workspace, sourcePath } = fixture();
    const service = new ImportSessionService();
    const first = service.createPreview(sourcePath, workspace);
    if (first.status !== "preview") throw new Error("preview failed");
    const refreshed = service.refreshPreview(
      first.preview.planId,
      {
        ...first.preview.metadata,
        slug: "custom-report",
        tags: ["LLM", "Reviewed"],
      },
      workspace,
    );
    expect(refreshed.status).toBe("preview");
    if (refreshed.status !== "preview") return;
    expect(refreshed.preview.planId).not.toBe(first.preview.planId);
    expect(refreshed.preview.targetArticleRelativePath).toBe(
      "llm/custom-report/index.md",
    );
    expect(refreshed.preview.canCommit).toBe(true);
  });

  it("commits only cached plans and retains the source by default", () => {
    const { workspace, sourcePath } = fixture();
    const service = new ImportSessionService();
    expect(
      service.commit(
        { planId: "a".repeat(64), removeSource: false },
        workspace,
      ),
    ).toEqual({
      ok: false,
      code: "plan-not-found",
      message: "匯入預覽已過期；請重新建立預覽。",
    });
    const preview = service.createPreview(sourcePath, workspace);
    if (preview.status !== "preview") throw new Error("preview failed");
    const committed = service.commit(
      { planId: preview.preview.planId, removeSource: false },
      workspace,
    );
    expect(committed).toEqual({
      ok: true,
      articleId: "llm/gpu-model-report",
      sourceStatus: "retained",
    });
    expect(fs.existsSync(sourcePath)).toBe(true);
    expect(
      fs.existsSync(
        path.join(workspace.rootPath, "llm/gpu-model-report/index.md"),
      ),
    ).toBe(true);
  });

  it("deletes a source only after explicit successful commit authority", () => {
    const { workspace, sourcePath } = fixture();
    const service = new ImportSessionService();
    const preview = service.createPreview(sourcePath, workspace);
    if (preview.status !== "preview") throw new Error("preview failed");
    const committed = service.commit(
      { planId: preview.preview.planId, removeSource: true },
      workspace,
    );
    expect(committed).toEqual({
      ok: true,
      articleId: "llm/gpu-model-report",
      sourceStatus: "removed",
    });
    expect(fs.existsSync(sourcePath)).toBe(false);
  });

  it("refuses preview and commit authority for bundled workspaces", () => {
    const { workspace, sourcePath } = fixture();
    const bundled = { ...workspace, kind: "bundled" as const };
    const service = new ImportSessionService();
    expect(service.createPreview(sourcePath, bundled)).toEqual({
      status: "rejected",
      code: "workspace-read-only",
      message: "內建封存為唯讀；請先開啟可寫入的本機工作區。",
    });
  });
});
