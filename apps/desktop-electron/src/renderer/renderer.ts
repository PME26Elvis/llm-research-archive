export {};
declare global {
  interface Window {
    observatory: {
      listArticles(): Promise<any[]>;
      search(q: string): Promise<any[]>;
      diagnostics(): Promise<any>;
      appInfo(): Promise<any>;
    };
  }
}
async function main() {
  const root = document.getElementById('root')!;
  const [articles, info] = await Promise.all([
    window.observatory.listArticles(),
    window.observatory.appInfo(),
  ]);
  root.innerHTML = `<h1>Research Observatory</h1><p>版本 ${info.version}</p><p>${articles.length} 篇文章可離線閱讀</p><input id="q" placeholder="搜尋"><ul>${articles.map((a: any) => `<li>${a.title} · ${a.readingStats.estimatedMinutes} 分鐘</li>`).join('')}</ul>`;
}
main();
