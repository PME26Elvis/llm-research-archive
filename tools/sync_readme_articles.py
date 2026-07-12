#!/usr/bin/env python3
"""Generate the README article catalog from canonical Markdown under docs/."""
from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

START_MARKER = "<!-- article-catalog:start -->"
END_MARKER = "<!-- article-catalog:end -->"
DATE_RE = re.compile(r"^date:\s*['\"]?([^'\"\s]+)", re.MULTILINE)
H1_RE = re.compile(r"^#\s+(.+?)\s*$", re.MULTILINE)
INLINE_TAGS_RE = re.compile(r"^tags:\s*\[(.*?)\]\s*$", re.MULTILINE)
BLOCK_TAGS_RE = re.compile(r"^tags:\s*$\n((?:\s+-\s+.*\n?)*)", re.MULTILINE)

CATEGORY_LABELS = {
    "llm": "LLM / AI",
    "carbon": "Carbon / Energy",
    "cs": "Computer Science",
    "health": "Health",
    "timeline": "Timeline",
}
CATEGORY_ORDER = ["llm", "carbon", "cs", "health", "timeline"]


@dataclass(frozen=True)
class Article:
    category: str
    date: str
    title: str
    tags: tuple[str, ...]
    relative_path: Path


def _front_matter(text: str) -> str:
    if not text.startswith("---\n"):
        return ""
    end = text.find("\n---", 4)
    return text[4:end] if end >= 0 else ""


def _parse_tags(front: str) -> tuple[str, ...]:
    inline = INLINE_TAGS_RE.search(front)
    if inline:
        return tuple(
            value.strip().strip("'\"")
            for value in inline.group(1).split(",")
            if value.strip().strip("'\"")
        )
    block = BLOCK_TAGS_RE.search(front)
    if not block:
        return ()
    return tuple(
        line.split("-", 1)[1].strip().strip("'\"")
        for line in block.group(1).splitlines()
        if line.strip().startswith("-")
    )


def _category_for(relative_path: Path) -> str | None:
    parts = relative_path.parts
    if len(parts) >= 3 and relative_path.name == "index.md":
        return parts[0]
    if len(parts) == 3 and parts[:2] == ("timeline", "posts") and relative_path.suffix == ".md":
        return "timeline"
    return None


def discover_articles(root: Path) -> list[Article]:
    docs = root / "docs"
    articles: list[Article] = []
    for path in sorted(docs.rglob("*.md")):
        relative = path.relative_to(root)
        docs_relative = path.relative_to(docs)
        category = _category_for(docs_relative)
        if category is None:
            continue
        text = path.read_text(encoding="utf-8")
        front = _front_matter(text)
        date_match = DATE_RE.search(front)
        title_match = H1_RE.search(text)
        if not date_match or not title_match:
            continue
        articles.append(
            Article(
                category=category,
                date=date_match.group(1),
                title=title_match.group(1).strip(),
                tags=_parse_tags(front),
                relative_path=relative,
            )
        )
    return articles


def _escape(value: str) -> str:
    return value.replace("|", "\\|").replace("\n", " ").strip()


def _category_sort_key(category: str) -> tuple[int, str]:
    try:
        return (CATEGORY_ORDER.index(category), category)
    except ValueError:
        return (len(CATEGORY_ORDER), category)


def render_catalog(articles: list[Article]) -> str:
    grouped: dict[str, list[Article]] = {}
    for article in articles:
        grouped.setdefault(article.category, []).append(article)

    lines = [
        START_MARKER,
        "> 此區塊由 [`tools/sync_readme_articles.py`](tools/sync_readme_articles.py) 從 `docs/` 自動產生；請勿手動維護清單。",
        "",
        f"**目前收錄 {len(articles)} 篇正式文章，分布於 {len(grouped)} 個分類。**",
        "",
    ]
    for category in sorted(grouped, key=_category_sort_key):
        category_articles = sorted(
            grouped[category], key=lambda item: (item.date, item.title), reverse=True
        )
        label = CATEGORY_LABELS.get(category, category.replace("-", " ").title())
        lines.extend(
            [
                f"### {label} · {len(category_articles)}",
                "",
                "| 日期 | 文章 | Tags |",
                "| --- | --- | --- |",
            ]
        )
        for article in category_articles:
            tags = " · ".join(f"`{_escape(tag)}`" for tag in article.tags) or "—"
            path = article.relative_path.as_posix()
            lines.append(
                f"| {article.date} | [{_escape(article.title)}]({path}) | {tags} |"
            )
        lines.append("")
    lines.extend([END_MARKER, ""])
    return "\n".join(lines)


def update_readme(root: Path, *, check: bool = False) -> bool:
    readme_path = root / "README.md"
    original = readme_path.read_text(encoding="utf-8")
    if START_MARKER not in original or END_MARKER not in original:
        raise RuntimeError("README.md is missing article catalog markers")
    before, remainder = original.split(START_MARKER, 1)
    _, after = remainder.split(END_MARKER, 1)
    generated = render_catalog(discover_articles(root))
    updated = before.rstrip() + "\n\n" + generated.rstrip() + "\n\n" + after.lstrip("\n")
    changed = updated != original
    if check and changed:
        raise RuntimeError("README article catalog is stale; run tools/sync_readme_articles.py")
    if changed and not check:
        readme_path.write_text(updated, encoding="utf-8")
    return changed


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.cwd(), help="Repository root")
    parser.add_argument("--check", action="store_true", help="Fail instead of writing when stale")
    parser.add_argument("--stdout", action="store_true", help="Print generated catalog only")
    args = parser.parse_args()
    root = args.root.resolve()
    try:
        articles = discover_articles(root)
        if args.stdout:
            print(render_catalog(articles), end="")
            return 0
        changed = update_readme(root, check=args.check)
    except (OSError, RuntimeError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    print("README article catalog is up to date." if not changed else "Updated README article catalog.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
