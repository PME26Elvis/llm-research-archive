from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from sync_readme_articles import discover_articles, render_catalog, update_readme


class ReadmeCatalogTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        (self.root / "docs/llm/example").mkdir(parents=True)
        (self.root / "docs/timeline/posts").mkdir(parents=True)
        (self.root / "README.md").write_text(
            "# Repo\n\n<!-- article-catalog:start -->\nold\n<!-- article-catalog:end -->\n\nEnd\n",
            encoding="utf-8",
        )
        (self.root / "docs/llm/example/index.md").write_text(
            "---\ndate: 2026-07-12\ntags:\n  - LLM\n  - Agent\n---\n\n# Example Article\n",
            encoding="utf-8",
        )
        (self.root / "docs/timeline/posts/hello.md").write_text(
            "---\ndate: 2026-01-01\ntags: [Notes, Archive]\n---\n\n# Hello\n",
            encoding="utf-8",
        )

    def tearDown(self) -> None:
        self.temp.cleanup()

    def test_discovers_article_shapes_and_metadata(self) -> None:
        articles = discover_articles(self.root)
        self.assertEqual([article.title for article in articles], ["Example Article", "Hello"])
        self.assertEqual(articles[0].tags, ("LLM", "Agent"))
        self.assertEqual(articles[1].category, "timeline")

    def test_renders_clickable_grouped_catalog(self) -> None:
        catalog = render_catalog(discover_articles(self.root))
        self.assertIn("[Example Article](docs/llm/example/index.md)", catalog)
        self.assertIn("### LLM / AI · 1", catalog)
        self.assertIn("### Timeline · 1", catalog)

    def test_updates_only_the_generated_region(self) -> None:
        self.assertTrue(update_readme(self.root))
        result = (self.root / "README.md").read_text(encoding="utf-8")
        self.assertTrue(result.startswith("# Repo"))
        self.assertTrue(result.endswith("End\n"))
        self.assertFalse(update_readme(self.root))

    def test_check_mode_detects_stale_catalog(self) -> None:
        with self.assertRaisesRegex(RuntimeError, "stale"):
            update_readme(self.root, check=True)


if __name__ == "__main__":
    unittest.main()
