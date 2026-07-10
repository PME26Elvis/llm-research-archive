import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('observatory', {
  listArticles: () => ipcRenderer.invoke('archive:list'),
  getArticle: (id: string) => ipcRenderer.invoke('article:get', { id }),
  search: (query: string) => ipcRenderer.invoke('search:query', { query }),
  diagnostics: () => ipcRenderer.invoke('diagnostics:get'),
  appInfo: () => ipcRenderer.invoke('app:info'),
  openExternal: (url: string) => ipcRenderer.invoke('external:open', url),
});
