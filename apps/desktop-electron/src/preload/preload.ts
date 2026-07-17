import { contextBridge, ipcRenderer } from 'electron';
import {
  AppInfoResponseSchema,
  ArchiveDiagnosticsSchema,
  DesktopCommandSchema,
  ImportCommitRequestSchema,
  ImportCommitResultSchema,
  ImportPreviewRefreshRequestSchema,
  ImportPreviewResultSchema,
  ImportSourceSelectionRequestSchema,
  LocaleUpdateRequestSchema,
  RendererImplementationInfoSchema,
  RendererImplementationUpdateRequestSchema,
  RendererDiagnosticRequestSchema,
  StartupMilestoneSchema,
  StartupTelemetrySchema,
  WorkspaceInfoSchema,
  WorkspaceSelectionResultSchema,
  type AppInfoDto,
  type ArchiveDiagnosticsDto,
  type ArticleDto,
  type ArticleSummaryDto,
  type SearchResultDto,
  type DesktopCommand,
  type ImportCommitRequest,
  type ImportCommitResult,
  type ImportPreviewRefreshRequest,
  type ImportPreviewResult,
  type ImportSourceKind,
  type UiLocale,
  type RendererImplementation,
  type RendererImplementationInfoDto,
  type RendererDiagnosticRequest,
  type StartupMilestone,
  type StartupTelemetryDto,
  type WorkspaceInfoDto,
  type WorkspaceSelectionResult,
} from '@research-observatory/platform-contracts';
contextBridge.exposeInMainWorld('observatory', {
  listArticles: (): Promise<ArticleSummaryDto[]> => ipcRenderer.invoke('archive:list'),
  getArticle: (id: string): Promise<ArticleDto> => ipcRenderer.invoke('article:get', { id }),
  search: (query: string): Promise<SearchResultDto[]> =>
    ipcRenderer.invoke('search:query', { query }),
  diagnostics: async (): Promise<ArchiveDiagnosticsDto> =>
    ArchiveDiagnosticsSchema.parse(await ipcRenderer.invoke('diagnostics:get')),
  clearDiagnostics: async (): Promise<ArchiveDiagnosticsDto> =>
    ArchiveDiagnosticsSchema.parse(await ipcRenderer.invoke('diagnostics:clear')),
  reportDiagnostic: (request: RendererDiagnosticRequest): Promise<void> =>
    ipcRenderer.invoke('diagnostics:report', RendererDiagnosticRequestSchema.parse(request)),
  markStartup: async (milestone: StartupMilestone): Promise<StartupTelemetryDto> =>
    StartupTelemetrySchema.parse(
      await ipcRenderer.invoke('telemetry:mark', StartupMilestoneSchema.parse(milestone)),
    ),
  setLocale: (locale: UiLocale): Promise<void> =>
    ipcRenderer.invoke('preferences:set-locale', LocaleUpdateRequestSchema.parse({ locale })),
  rendererInfo: async (): Promise<RendererImplementationInfoDto> =>
    RendererImplementationInfoSchema.parse(await ipcRenderer.invoke('renderer:info')),
  setRenderer: (implementation: RendererImplementation): Promise<void> =>
    ipcRenderer.invoke(
      'renderer:set',
      RendererImplementationUpdateRequestSchema.parse({ implementation }),
    ),
  appInfo: async (): Promise<AppInfoDto> =>
    AppInfoResponseSchema.parse(await ipcRenderer.invoke('app:info')),
  openExternal: (url: string) => ipcRenderer.invoke('external:open', url),
  workspaceInfo: async (): Promise<WorkspaceInfoDto> =>
    WorkspaceInfoSchema.parse(await ipcRenderer.invoke('workspace:info')),
  selectWorkspace: async (): Promise<WorkspaceSelectionResult> =>
    WorkspaceSelectionResultSchema.parse(await ipcRenderer.invoke('workspace:select')),

  selectImportSource: async (kind: ImportSourceKind): Promise<ImportPreviewResult> =>
    ImportPreviewResultSchema.parse(
      await ipcRenderer.invoke(
        'import:select-source',
        ImportSourceSelectionRequestSchema.parse({ kind }),
      ),
    ),
  refreshImportPreview: async (
    request: ImportPreviewRefreshRequest,
  ): Promise<ImportPreviewResult> =>
    ImportPreviewResultSchema.parse(
      await ipcRenderer.invoke(
        'import:refresh-preview',
        ImportPreviewRefreshRequestSchema.parse(request),
      ),
    ),
  commitImport: async (request: ImportCommitRequest): Promise<ImportCommitResult> =>
    ImportCommitResultSchema.parse(
      await ipcRenderer.invoke('import:commit', ImportCommitRequestSchema.parse(request)),
    ),

  onCommand: (listener: (command: DesktopCommand) => void) => {
    ipcRenderer.removeAllListeners('app:command');
    ipcRenderer.on('app:command', (_event, value) => {
      const command = DesktopCommandSchema.safeParse(value);
      if (command.success) listener(command.data);
    });
  },
  clearCommandHandler: () => ipcRenderer.removeAllListeners('app:command'),
});
