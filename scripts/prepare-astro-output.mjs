import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function walk(directory) {
  const files = [];
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, item.name);
    if (item.isDirectory()) files.push(...walk(absolute));
    else if (item.isFile()) files.push(absolute);
  }
  return files;
}

export function rewriteVitePreloadBase(source) {
  return source.replace(
    /return([`'\"])\/\1\+([A-Za-z_$][\w$]*)/g,
    (_match, quote, variable) => `return${quote}../${quote}+${variable}`,
  );
}

export function prepareAstroOutput(outputRoot = 'apps/desktop-astro/dist') {
  const root = path.resolve(outputRoot);
  const entry = path.join(root, 'index.html');
  if (!fs.existsSync(entry)) throw new Error(`Astro output missing: ${entry}`);
  const changed = [];
  for (const file of walk(root).filter((value) => /\.(?:html|css|js|mjs)$/i.test(value))) {
    const original = fs.readFileSync(file, 'utf8');
    const relativePrefix = path.relative(path.dirname(file), root).replaceAll(path.sep, '/') || '.';
    const assetPrefix = `${relativePrefix}/_astro/`;
    let updated = original
      .replaceAll('"/_astro/', `"${assetPrefix}`)
      .replaceAll("'/_astro/", `'${assetPrefix}`)
      .replaceAll('url(/_astro/', `url(${assetPrefix}`);
    if (/^preload-helper\..+\.(?:js|mjs)$/i.test(path.basename(file))) {
      updated = rewriteVitePreloadBase(updated);
    }
    if (updated !== original) {
      fs.writeFileSync(file, updated);
      changed.push(path.relative(root, file).replaceAll(path.sep, '/'));
    }
  }
  return changed;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const changed = prepareAstroOutput();
  console.log(`Prepared Astro file output: ${changed.length} file(s) rewritten`);
}
