import { contextBridge, ipcRenderer } from 'electron';
import {
  AppInfoResponseSchema,
  type AppInfoDto,
  type ArticleDto,
  type ArticleSummaryDto,
  type SearchResultDto,
} from '@research-observatory/platform-contracts';
contextBridge.exposeInMainWorld('observatory', {
  listArticles: (): Promise<ArticleSummaryDto[]> => ipcRenderer.invoke('archive:list'),
  getArticle: (id: string): Promise<ArticleDto> => ipcRenderer.invoke('article:get', { id }),
  search: (query: string): Promise<SearchResultDto[]> =>
    ipcRenderer.invoke('search:query', { query }),
  diagnostics: () => ipcRenderer.invoke('diagnostics:get'),
  appInfo: async (): Promise<AppInfoDto> =>
    AppInfoResponseSchema.parse(await ipcRenderer.invoke('app:info')),
  openExternal: (url: string) => ipcRenderer.invoke('external:open', url),
});
