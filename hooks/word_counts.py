"""MkDocs hooks for article word-count badges and a sorted word-count index.

This intentionally uses MkDocs' built-in hook support instead of adding another
runtime plugin dependency. The repository is mostly long-form Chinese research
articles, so the primary metric is CJK character count plus Latin/number tokens.
"""

from __future__ import annotations

import html
import posixpath
import re
from dataclasses import dataclass
from pathlib import Path


ROOT_DOCS_DIR = Path("docs")
WORD_COUNTS_PAGE = ROOT_DOCS_DIR / "word-counts.md"
EXCLUDED_SOURCE_PATHS = {
    "index.md",
    "tags.md",
    "word-counts.md",
    "article-publishing-workflow.md",
    "timeline/index.md",
}
CJK_RE = re.compile(r"[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]")
LATIN_TOKEN_RE = re.compile(r"[A-Za-z0-9]+(?:[\-'’][A-Za-z0-9]+)*")
FRONT_MATTER_RE = re.compile(r"\A---\s*\n(.*?)\n---\s*\n?", re.S)
CODE_BLOCK_RE = re.compile(r"```.*?```|~~~.*?~~~", re.S)
CITATION_MARKER_RE = re.compile(r".*?")
HTML_TAG_RE = re.compile(r"<[^>]+>")
HEADING_RE = re.compile(r"^#\s+(.+?)\s*$", re.M)
TAG_LINE_RE = re.compile(r"^\s*-\s+(.+?)\s*$")
DATE_LINE_RE = re.compile(r"^date:\s*(.+?)\s*$", re.M)


@dataclass(frozen=True)
class ArticleStats:
    source_path: str
    title: str
    date: str
    tags: tuple[str, ...]
    category: str
    display_count: int
    cjk_characters: int
    latin_tokens: int
    reading_minutes: int


def _split_front_matter(markdown: str) -> tuple[str, str]:
    match = FRONT_MATTER_RE.match(markdown)
    if not match:
        return "", markdown
    return match.group(1), markdown[match.end() :]


def _extract_title(body: str, source_path: str) -> str:
    match = HEADING_RE.search(body)
    if match:
        return _clean_inline_markdown(match.group(1)).strip()
    stem = Path(source_path).parent.name if Path(source_path).name == "index.md" else Path(source_path).stem
    return stem.replace("-", " ").strip().title()


def _extract_date(front_matter: str) -> str:
    match = DATE_LINE_RE.search(front_matter)
    return match.group(1).strip() if match else ""


def _extract_tags(front_matter: str) -> tuple[str, ...]:
    tags: list[str] = []
    in_tags = False
    for line in front_matter.splitlines():
        if line.strip() == "tags:":
            in_tags = True
            continue
        if in_tags and line and not line.startswith((" ", "\t", "-")):
            break
        if in_tags:
            match = TAG_LINE_RE.match(line)
            if match:
                tags.append(match.group(1).strip().strip('"\''))
    return tuple(tags)


def _is_article(source_path: str, front_matter: str) -> bool:
    if source_path in EXCLUDED_SOURCE_PATHS:
        return False
    if not _extract_date(front_matter):
        return False
    return True


def _clean_inline_markdown(text: str) -> str:
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"[`*_~>#|]", " ", text)
    return html.unescape(text)


def _count_body(body: str) -> tuple[int, int, int, int]:
    text = CODE_BLOCK_RE.sub(" ", body)
    text = CITATION_MARKER_RE.sub(" ", text)
    text = HTML_TAG_RE.sub(" ", text)
    text = _clean_inline_markdown(text)
    cjk_characters = len(CJK_RE.findall(text))
    latin_tokens = len(LATIN_TOKEN_RE.findall(CJK_RE.sub(" ", text)))
    display_count = cjk_characters + latin_tokens
    reading_minutes = max(1, round(display_count / 500)) if display_count else 0
    return display_count, cjk_characters, latin_tokens, reading_minutes


def _category_from_path(source_path: str) -> str:
    parts = Path(source_path).parts
    if len(parts) <= 1:
        return "未分類"
    return parts[0]


def _stats_for_file(path: Path) -> ArticleStats | None:
    source_path = path.relative_to(ROOT_DOCS_DIR).as_posix()
    markdown = path.read_text(encoding="utf-8")
    front_matter, body = _split_front_matter(markdown)
    if not _is_article(source_path, front_matter):
        return None
    display_count, cjk_characters, latin_tokens, reading_minutes = _count_body(body)
    return ArticleStats(
        source_path=source_path,
        title=_extract_title(body, source_path),
        date=_extract_date(front_matter),
        tags=_extract_tags(front_matter),
        category=_category_from_path(source_path),
        display_count=display_count,
        cjk_characters=cjk_characters,
        latin_tokens=latin_tokens,
        reading_minutes=reading_minutes,
    )


def _collect_articles() -> list[ArticleStats]:
    articles: list[ArticleStats] = []
    if not ROOT_DOCS_DIR.exists():
        return articles
    for path in ROOT_DOCS_DIR.rglob("*.md"):
        stats = _stats_for_file(path)
        if stats:
            articles.append(stats)
    return sorted(articles, key=lambda item: (-item.display_count, item.title))


def _format_number(value: int) -> str:
    return f"{value:,}"


def _link_for_source_path(source_path: str) -> str:
    return source_path


def _relative_word_counts_link(source_path: str) -> str:
    source_dir = posixpath.dirname(source_path) or "."
    return posixpath.relpath("word-counts.md", source_dir)


def _render_word_counts_page(articles: list[ArticleStats]) -> str:
    total_count = sum(article.display_count for article in articles)
    total_cjk = sum(article.cjk_characters for article in articles)
    total_latin = sum(article.latin_tokens for article in articles)
    rows = []
    for article in articles:
        tags = "、".join(article.tags) if article.tags else "—"
        rows.append(
            "| "
            f"[{article.title}]({_link_for_source_path(article.source_path)}) | "
            f"{_format_number(article.display_count)} | "
            f"{_format_number(article.cjk_characters)} | "
            f"{_format_number(article.latin_tokens)} | "
            f"約 {article.reading_minutes} 分鐘 | "
            f"{article.date or '—'} | "
            f"{article.category} | "
            f"{tags} |"
        )

    return "\n".join(
        [
            "# 文章字數總表",
            "",
            "本頁由 MkDocs hooks 自動產生，依文章總字數由多至少排序。",
            "",
            "!!! note \"統計口徑\"",
            "    主要統計 CJK 字元數，並加上英文與數字 token；程式碼區塊、HTML 標籤、圖片與 citation marker 不列入主文字數。閱讀時間以每分鐘約 500 字估算。",
            "",
            f"- 文章數：{len(articles)}",
            f"- 總字數：{_format_number(total_count)}（CJK {_format_number(total_cjk)}；英文/數字 token {_format_number(total_latin)}）",
            "",
            "| 文章 | 總字數 | CJK 字元 | 英文/數字 token | 預估閱讀 | 日期 | 分類 | Tags |",
            "| --- | ---: | ---: | ---: | ---: | --- | --- | --- |",
            *rows,
            "",
        ]
    )


def on_pre_build(config):
    articles = _collect_articles()
    WORD_COUNTS_PAGE.write_text(_render_word_counts_page(articles), encoding="utf-8")


def on_page_markdown(markdown, page, config, files):
    source_path = page.file.src_path
    if source_path in EXCLUDED_SOURCE_PATHS or not page.meta.get("date"):
        return markdown

    front_matter, body = _split_front_matter(markdown)
    body_for_count = body if front_matter else markdown
    display_count, cjk_characters, latin_tokens, reading_minutes = _count_body(body_for_count)
    stats_block = "\n".join(
        [
            "!!! info \"文章字數\"",
            f"    總字數：**{_format_number(display_count)}**（CJK {_format_number(cjk_characters)}；英文/數字 token {_format_number(latin_tokens)}）  ",
            f"    預估閱讀時間：約 **{reading_minutes} 分鐘**  ",
            f"    [查看所有文章字數排序表]({_relative_word_counts_link(source_path)})",
            "",
        ]
    )

    title_match = HEADING_RE.search(body_for_count)
    if title_match:
        insert_at = title_match.end()
        updated_body = body_for_count[:insert_at] + "\n\n" + stats_block + body_for_count[insert_at:]
    else:
        updated_body = stats_block + body_for_count

    if front_matter:
        front_matter_match = FRONT_MATTER_RE.match(markdown)
        return markdown[: front_matter_match.end()] + updated_body
    return updated_body
