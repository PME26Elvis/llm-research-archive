import os
import re
from datetime import date

def slugify(s: str) -> str:
    s = s.strip().lower()
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"[^0-9a-zA-Z\u4e00-\u9fff\-]+", "", s)
    return s[:80] if len(s) > 80 else s

title = input("Title: ").strip()
category = input("Category (e.g. carbon/llm/guitar): ").strip().strip("/")
tags_raw = input("Tags (comma separated): ").strip()
tags = [t.strip() for t in tags_raw.split(",") if t.strip()]

slug = slugify(title)
base = os.path.join("docs", category, slug)
assets = os.path.join(base, "assets")
os.makedirs(assets, exist_ok=True)

today = date.today().isoformat()

md_path = os.path.join(base, "index.md")
if os.path.exists(md_path):
    raise SystemExit(f"Already exists: {md_path}")

front = ["---", f"date: {today}", "tags:"]
front += [f"  - {t}" for t in tags] if tags else ["  - Notes"]
front += ["---", "", f"# {title}", "", "<details>", "<summary>附件（展開）</summary>", "", "</details>", ""]

with open(md_path, "w", encoding="utf-8") as f:
    f.write("\n".join(front))

print(f"Created: {md_path}")
print(f"Assets: {assets}")