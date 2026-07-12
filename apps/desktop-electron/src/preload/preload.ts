import { contextBridge, ipcRenderer } from "electron";
import {
  AppInfoResponseSchema,
  DesktopCommandSchema,
  ImportCommitRequestSchema,
  ImportCommitResultSchema,
  ImportPreviewRefreshRequestSchema,
  ImportPreviewResultSchema,
  ImportSourceSelectionRequestSchema,
  WorkspaceInfoSchema,
  WorkspaceSelectionResultSchema,
  type AppInfoDto,
  type ArticleDto,
  type ArticleSummaryDto,
  type SearchResultDto,
  type DesktopCommand,
  type ImportCommitRequest,
  type ImportCommitResult,
  type ImportPreviewRefreshRequest,
  type ImportPreviewResult,
  type ImportSourceKind,
  type WorkspaceInfoDto,
  type WorkspaceSelectionResult,
} from "@research-observatory/platform-contracts";
contextBridge.exposeInMainWorld("observatory", {
  listArticles: (): Promise<ArticleSummaryDto[]> =>
    ipcRenderer.invoke("archive:list"),
  getArticle: (id: string): Promise<ArticleDto> =>
    ipcRenderer.invoke("article:get", { id }),
  search: (query: string): Promise<SearchResultDto[]> =>
    ipcRenderer.invoke("search:query", { query }),
  diagnostics: () => ipcRenderer.invoke("diagnostics:get"),
  appInfo: async (): Promise<AppInfoDto> =>
    AppInfoResponseSchema.parse(await ipcRenderer.invoke("app:info")),
  openExternal: (url: string) => ipcRenderer.invoke("external:open", url),
  workspaceInfo: async (): Promise<WorkspaceInfoDto> =>
    WorkspaceInfoSchema.parse(await ipcRenderer.invoke("workspace:info")),
  selectWorkspace: async (): Promise<WorkspaceSelectionResult> =>
    WorkspaceSelectionResultSchema.parse(
      await ipcRenderer.invoke("workspace:select"),
    ),

  selectImportSource: async (
    kind: ImportSourceKind,
  ): Promise<ImportPreviewResult> =>
    ImportPreviewResultSchema.parse(
      await ipcRenderer.invoke(
        "import:select-source",
        ImportSourceSelectionRequestSchema.parse({ kind }),
      ),
    ),
  refreshImportPreview: async (
    request: ImportPreviewRefreshRequest,
  ): Promise<ImportPreviewResult> =>
    ImportPreviewResultSchema.parse(
      await ipcRenderer.invoke(
        "import:refresh-preview",
        ImportPreviewRefreshRequestSchema.parse(request),
      ),
    ),
  commitImport: async (
    request: ImportCommitRequest,
  ): Promise<ImportCommitResult> =>
    ImportCommitResultSchema.parse(
      await ipcRenderer.invoke(
        "import:commit",
        ImportCommitRequestSchema.parse(request),
      ),
    ),

  onCommand: (listener: (command: DesktopCommand) => void) => {
    ipcRenderer.removeAllListeners("app:command");
    ipcRenderer.on("app:command", (_event, value) => {
      const command = DesktopCommandSchema.safeParse(value);
      if (command.success) listener(command.data);
    });
  },
  clearCommandHandler: () => ipcRenderer.removeAllListeners("app:command"),
});
