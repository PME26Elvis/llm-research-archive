#!/usr/bin/env python3
"""Publish raw Markdown articles from _incoming/articles/ into docs/<category>/<slug>/index.md."""
from __future__ import annotations

import argparse
import re
import shutil
from dataclasses import dataclass
from datetime import date
from pathlib import Path

from sync_readme_articles import update_readme

INCOMING = Path("_incoming/articles")
DOCS = Path("docs")
CITATION_RE = re.compile(r"[ \t]*\uE200cite\uE202[^\uE201]*\uE201")
ENTITY_RE = re.compile(r"\uE200entity\uE202([^\uE201]*)\uE201")
IMAGE_GROUP_RE = re.compile(r"[ \t]*\uE200image_group\uE202[^\uE201]*\uE201")

CATEGORY_RULES = {
    "llm": ("LLM", ("llm", "ai", "agent", "model", "inference", "compute", "gpu", "benchmark", "人工智慧", "模型", "算力")),
    "cs": ("CS", ("computer science", "programming", "software", "algorithm", "data structure", "taxonomy", "演算法", "資料結構", "軟體")),
    "health": ("Health", ("health", "medical", "medicine", "nutrition", "fitness", "sleep", "健康", "醫療", "營養", "睡眠")),
    "carbon": ("Carbon", ("carbon", "energy", "renewable", "emission", "climate", "碳", "能源", "再生能源", "排放", "氣候")),
}


@dataclass
class Source:
    root: Path
    article: Path
    research: Path | None = None
    assets: Path | None = None


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^0-9a-z]+", "-", value)
    value = re.sub(r"-+", "-", value).strip("-")
    return value[:80].strip("-") or "untitled-article"


def title_from_markdown(text: str) -> str | None:
    match = re.search(r"^#\s+(.+?)\s*$", text, re.MULTILINE)
    return match.group(1).strip() if match else None


def infer_category(text: str) -> str | None:
    lower = text.lower()
    scores = {
        category: sum(1 for keyword in keywords if keyword.lower() in lower)
        for category, (_, keywords) in CATEGORY_RULES.items()
    }
    best, score = max(scores.items(), key=lambda item: item[1])
    return best if score > 0 else None


def clean_text(text: str) -> str:
    text = CITATION_RE.sub("", text)
    text = ENTITY_RE.sub(lambda match: match.group(1), text)
    text = IMAGE_GROUP_RE.sub("", text)
    return text


def discover_sources() -> list[Source]:
    sources: list[Source] = []
    for path in sorted(INCOMING.iterdir() if INCOMING.exists() else []):
        if path.name == "README.md" or path.name.startswith("."):
            continue
        if path.is_file() and path.suffix.lower() == ".md":
            sources.append(Source(root=path, article=path))
        elif path.is_dir():
            article = path / "article.md"
            if article.exists():
                sources.append(
                    Source(
                        root=path,
                        article=article,
                        research=(path / "research-activity.md" if (path / "research-activity.md").exists() else None),
                        assets=(path / "assets" if (path / "assets").exists() else None),
                    )
                )
    return sources


def parse_tags(raw: str | None, category_tag: str) -> list[str]:
    tags = [tag.strip() for tag in (raw or "").split(",") if tag.strip()]
    if category_tag not in tags:
        tags.insert(0, category_tag)
    return tags[:4]


def publish(source: Source, args: argparse.Namespace) -> Path:
    raw = source.article.read_text(encoding="utf-8")
    title = args.title or title_from_markdown(raw) or source.article.stem.replace("-", " ").title()
    category = args.category or infer_category(raw)
    if not category:
        raise SystemExit("Cannot infer category. Re-run with --category llm|cs|health|carbon|...")
    category_tag = CATEGORY_RULES.get(category, (category.title(), ()))[0]
    slug = args.slug or slugify(args.slug_source or title)
    target_dir = DOCS / category / slug
    target = target_dir / "index.md"
    if target.exists():
        raise SystemExit(f"Refusing to overwrite existing article: {target}")

    target_dir.mkdir(parents=True, exist_ok=False)
    try:
        if source.assets:
            shutil.copytree(source.assets, target_dir / "assets")
        else:
            (target_dir / "assets").mkdir(exist_ok=True)

        body = clean_text(raw).strip()
        if not re.search(r"^#\s+", body, re.MULTILINE):
            body = f"# {title}\n\n{body}"
        tags = parse_tags(args.tags, category_tag)
        front = ["---", f"date: {args.date}", "tags:", *[f"  - {tag}" for tag in tags], "---", ""]
        output = "\n".join(front) + body + "\n"
        if source.research:
            research = clean_text(source.research.read_text(encoding="utf-8")).strip()
            output += "\n<details>\n<summary>附件（展開）</summary>\n\n" + research + "\n\n</details>\n"
        target.write_text(output, encoding="utf-8")
        update_readme(Path.cwd())
    except Exception:
        shutil.rmtree(target_dir, ignore_errors=True)
        try:
            target_dir.parent.rmdir()
        except OSError:
            pass
        raise

    if not args.keep_raw:
        if source.root.is_dir():
            shutil.rmtree(source.root)
        else:
            source.root.unlink()
    return target


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", nargs="?", help="Raw markdown file or incoming folder. Defaults to the only item in _incoming/articles/.")
    parser.add_argument("--category", help="Target category under docs/, e.g. llm, cs, health, carbon.")
    parser.add_argument("--title", help="Override article title when no H1 or when you want a different H1-derived metadata title.")
    parser.add_argument("--slug", help="Override target slug. Must be English kebab-case.")
    parser.add_argument("--slug-source", help="Text to slugify when --slug is not provided.")
    parser.add_argument("--tags", help="Comma-separated topic tags. Category tag is added automatically when missing.")
    parser.add_argument("--date", default=date.today().isoformat(), help="Publication date, default: today.")
    parser.add_argument("--keep-raw", action="store_true", help="Do not delete the processed raw input.")
    args = parser.parse_args()

    if args.source:
        path = Path(args.source)
        if path.is_dir():
            source = Source(
                root=path,
                article=path / "article.md",
                research=(path / "research-activity.md" if (path / "research-activity.md").exists() else None),
                assets=(path / "assets" if (path / "assets").exists() else None),
            )
        else:
            source = Source(root=path, article=path)
        if not source.article.exists():
            raise SystemExit(f"Article markdown not found: {source.article}")
    else:
        sources = discover_sources()
        if len(sources) != 1:
            names = "\n".join(f"- {candidate.root}" for candidate in sources) or "(none)"
            raise SystemExit(f"Expected exactly one incoming article. Found:\n{names}")
        source = sources[0]

    target = publish(source, args)
    print(f"Published: {target}")
    print("Updated: README.md article catalog")


if __name__ == "__main__":
    main()
