import type { DesktopCommand } from "@research-observatory/platform-contracts";

export interface DesktopCommandDescriptor {
  id: DesktopCommand;
  label: string;
  keywords: string[];
  shortcut?: string;
}

export const DESKTOP_COMMANDS: DesktopCommandDescriptor[] = [
  {
    id: "search.focus",
    label: "聚焦搜尋",
    keywords: ["search", "find", "搜尋", "查找"],
    shortcut: "Ctrl+F",
  },
  {
    id: "navigation.back",
    label: "上一個閱讀位置",
    keywords: ["back", "previous", "返回", "上一頁"],
    shortcut: "Alt+←",
  },
  {
    id: "navigation.forward",
    label: "下一個閱讀位置",
    keywords: ["forward", "next", "前進", "下一頁"],
    shortcut: "Alt+→",
  },
  {
    id: "workspace.open",
    label: "開啟本機工作區",
    keywords: ["workspace", "folder", "archive", "工作區", "資料夾", "封存"],
    shortcut: "Ctrl+O",
  },
  {
    id: "import.open",
    label: "匯入文章",
    keywords: ["import", "markdown", "publish", "匯入", "文章", "發布"],
    shortcut: "Ctrl+Shift+I",
  },
  {
    id: "about.open",
    label: "開啟關於資訊",
    keywords: ["about", "version", "build", "關於", "版本"],
  },
];

export function filterDesktopCommands(
  query: string,
): DesktopCommandDescriptor[] {
  const normalized = query.trim().toLocaleLowerCase("zh-TW");
  if (!normalized) return DESKTOP_COMMANDS;
  return DESKTOP_COMMANDS.filter((command) =>
    [command.label, command.id, ...command.keywords]
      .join(" ")
      .toLocaleLowerCase("zh-TW")
      .includes(normalized),
  );
}
