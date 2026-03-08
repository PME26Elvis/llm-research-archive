# This script removes all citations from the markdown files in the docs directory. (It Worked for ChatGPT 5.4 Thinking Deep Reaserch)
from pathlib import Path
import re

pattern = re.compile(r'[ \t]*\uE200cite\uE202[^\uE201]*\uE201')

count_files = 0
count_matches = 0

for path in Path("docs").rglob("*.md"):
    text = path.read_text(encoding="utf-8")
    new_text, n = pattern.subn("", text)
    if n > 0:
        path.write_text(new_text, encoding="utf-8")
        count_files += 1
        count_matches += n
        print(f"cleaned {path} ({n} matches)")

print(f"Done. Cleaned {count_files} files, removed {count_matches} citations.")