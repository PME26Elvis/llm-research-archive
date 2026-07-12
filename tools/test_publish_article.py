from __future__ import annotations

import argparse
import os
import tempfile
import unittest
from contextlib import contextmanager
from pathlib import Path

from publish_article import Source, publish


@contextmanager
def working_directory(path: Path):
    previous = Path.cwd()
    os.chdir(path)
    try:
        yield
    finally:
        os.chdir(previous)


def arguments(**overrides: object) -> argparse.Namespace:
    values: dict[str, object] = {
        "title": None,
        "category": "llm",
        "slug": "incoming-report",
        "slug_source": None,
        "tags": "LLM,Automation",
        "date": "2026-07-12",
        "keep_raw": False,
    }
    values.update(overrides)
    return argparse.Namespace(**values)


class PublishArticleTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        incoming = self.root / "_incoming/articles"
        incoming.mkdir(parents=True)
        self.source_path = incoming / "report.md"
        self.source_path.write_text(
            "# Incoming Report\n\nA deterministic LLM publication fixture.\n",
            encoding="utf-8",
        )
        (self.root / "README.md").write_text(
            "# Archive\n\n<!-- article-catalog:start -->\nold\n<!-- article-catalog:end -->\n",
            encoding="utf-8",
        )

    def tearDown(self) -> None:
        self.temp.cleanup()

    def test_publishes_article_updates_catalog_and_removes_raw_input(self) -> None:
        source = Source(root=self.source_path, article=self.source_path)
        with working_directory(self.root):
            target = publish(source, arguments())

        self.assertEqual(target, Path("docs/llm/incoming-report/index.md"))
        output = self.root / target
        self.assertTrue(output.exists())
        self.assertFalse(self.source_path.exists())
        self.assertIn("date: 2026-07-12", output.read_text(encoding="utf-8"))
        readme = (self.root / "README.md").read_text(encoding="utf-8")
        self.assertIn(
            "[Incoming Report](docs/llm/incoming-report/index.md)",
            readme,
        )

    def test_catalog_failure_rolls_back_target_and_retains_raw_input(self) -> None:
        (self.root / "README.md").write_text("# Missing markers\n", encoding="utf-8")
        source = Source(root=self.source_path, article=self.source_path)

        with working_directory(self.root):
            with self.assertRaisesRegex(RuntimeError, "missing article catalog markers"):
                publish(source, arguments())

        self.assertTrue(self.source_path.exists())
        self.assertFalse((self.root / "docs/llm/incoming-report").exists())


if __name__ == "__main__":
    unittest.main()
