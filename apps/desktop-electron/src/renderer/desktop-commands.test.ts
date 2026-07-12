import { describe, expect, it } from "vitest";
import { DESKTOP_COMMANDS, filterDesktopCommands } from "./desktop-commands";

describe("desktop command catalog", () => {
  it("returns the full deterministic catalog for an empty query", () => {
    expect(filterDesktopCommands("")).toEqual(DESKTOP_COMMANDS);
  });

  it("matches Traditional Chinese labels and English aliases", () => {
    expect(filterDesktopCommands("搜尋").map((command) => command.id)).toEqual([
      "search.focus",
    ]);
    expect(
      filterDesktopCommands("previous").map((command) => command.id),
    ).toEqual(["navigation.back"]);
    expect(
      filterDesktopCommands("version").map((command) => command.id),
    ).toEqual(["about.open"]);
    expect(filterDesktopCommands("匯入").map((command) => command.id)).toEqual([
      "import.open",
    ]);
  });

  it("returns no arbitrary action for an unknown query", () => {
    expect(filterDesktopCommands("delete everything")).toEqual([]);
  });
});
