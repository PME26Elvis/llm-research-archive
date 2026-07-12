# Repository instructions

## Branch ownership

- `main` owns canonical research content, MkDocs, article-publishing tools, README automation and the Desktop release dispatcher.
- `app-main` owns the Electron/TypeScript desktop application.
- `main/docs` is the only content source of truth. Do not independently edit article content in `app-main/docs`; Content Maintenance synchronizes it after validation.

## Publishing articles

1. Follow `docs/article-publishing-workflow.md`.
2. Prefer `python tools/publish_article.py` for `_incoming/articles/` inputs when working interactively.
3. A merge to `main` containing exactly one top-level incoming item is auto-published by Content Maintenance. Zero items are skipped; multiple items fail safely and must be split or published one by one.
4. Formal articles use `docs/<category>/<english-kebab-case-slug>/index.md` and require YAML `date`, recommended `tags`, and an H1.
5. Do not overwrite an existing article path.
6. Preserve user-protected report or attachment text exactly when instructed.
7. Remove unsupported citation/entity/image wrappers unless the user explicitly requires the original text to remain unchanged.
8. If category or metadata inference is ambiguous, do not force publication. Leave the raw input in place and request an explicit override.

## Generated README catalog

- Never hand-edit content between `<!-- article-catalog:start -->` and `<!-- article-catalog:end -->`.
- After adding, removing or changing article metadata, run:

  ```bash
  python tools/sync_readme_articles.py
  python -m unittest discover -s tools -p "test_*.py"
  ```

- `tools/publish_article.py` refreshes the catalog automatically.
- Manual article additions are repaired after merge by `.github/workflows/content-maintenance.yml`.
- Incoming publication is transactional: a catalog failure removes the new target and retains the raw input.

## Validation

For content and README changes, run when available:

```bash
python -m unittest discover -s tools -p "test_*.py"
python tools/sync_readme_articles.py --check
mkdocs build --strict
```

The Desktop sync workflow runs `npm run verify` on the synchronized `app-main` tree, writes the verified content to the retained `automation/sync-main-content` branch, and then publishes it through a no-ff regular merge commit. A concurrent `app-main` update causes the final push to fail safely rather than overwrite newer work.
