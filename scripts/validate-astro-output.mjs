import crypto from 'node:crypto';
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

function cspDirective(csp, name) {
  return csp
    .split(';')
    .map((directive) => directive.trim())
    .find((directive) => directive.toLocaleLowerCase().startsWith(`${name} `));
}

export function validateAstroOutput(outputRoot = 'apps/desktop-astro/dist') {
  const root = path.resolve(outputRoot);
  const entry = path.join(root, 'index.html');
  if (!fs.existsSync(entry)) throw new Error(`Astro renderer entry missing: ${entry}`);
  const html = fs.readFileSync(entry, 'utf8');
  const required = [
    'content-security-policy',
    'data-renderer-shell="astro"',
    'data-astro-entry="research-observatory"',
    'data-astro-shell-marker',
    'data-astro-boot-shell',
  ];
  for (const marker of required) {
    if (!html.toLowerCase().includes(marker.toLowerCase())) {
      throw new Error(`Astro output missing marker: ${marker}`);
    }
  }
  if (!/script-src[^;]+['"]?sha(?:256|384|512)-/i.test(html)) {
    throw new Error('Astro CSP does not authorize generated inline scripts by hash');
  }

  const cspTag = html.match(/<meta\s+[^>]*http-equiv=["']content-security-policy["'][^>]*>/i)?.[0];
  const cspMatch = cspTag?.match(/\bcontent=(?:"([^"]*)"|'([^']*)')/i);
  const csp = cspMatch?.[1] ?? cspMatch?.[2];
  if (!csp) throw new Error('Astro CSP metadata is missing');
  const styleSource = cspDirective(csp, 'style-src') ?? '';
  const styleAttributes = cspDirective(csp, 'style-src-attr') ?? '';
  if (styleSource.includes("'unsafe-inline'")) {
    throw new Error('Astro CSP must not broadly authorize inline style elements');
  }
  if (!styleAttributes.includes("'unsafe-inline'")) {
    throw new Error('Astro CSP must authorize Mermaid style attributes through style-src-attr');
  }
  const inlineScripts = [
    ...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi),
  ].map((match) => match[1]);
  for (const source of inlineScripts) {
    const digest = crypto.createHash('sha256').update(source).digest('base64');
    if (!csp.includes(`'sha256-${digest}'`)) {
      throw new Error('Astro CSP hash does not match an emitted inline script');
    }
  }
  if (/\b(?:src|href|component-url|renderer-url)=["']\/(?!\/)/i.test(html)) {
    throw new Error('Astro output contains root-absolute assets that cannot load from file:');
  }
  if (/https?:\/\//i.test(html)) throw new Error('Astro output contains a remote runtime URL');

  const emittedJavaScript = walk(root).filter((file) => /\.(?:js|mjs)$/i.test(file));
  const preloadHelpers = emittedJavaScript.filter((file) =>
    /^preload-helper\..+\.(?:js|mjs)$/i.test(path.basename(file)),
  );
  if (!preloadHelpers.length) throw new Error('Astro output has no Vite preload helper');
  for (const file of preloadHelpers) {
    const source = fs.readFileSync(file, 'utf8');
    if (/return([`'"])\/\1\+[A-Za-z_$][\w$]*/.test(source)) {
      throw new Error('Astro output contains a root-relative Vite preload helper');
    }
    if (!/return([`'"])\.\.\/\1\+[A-Za-z_$][\w$]*/.test(source)) {
      throw new Error('Astro Vite preload helper is not file-relative');
    }
  }

  const runtimeAssets = [
    ...html.matchAll(/\b(?:src|component-url|renderer-url)=["']([^"']+\.(?:js|mjs))["']/gi),
  ].map((match) => match[1]);
  const scripts = [...new Set(runtimeAssets)];
  if (!scripts.length) throw new Error('Astro output has no client island script');
  for (const source of scripts) {
    const absolute = path.resolve(root, source);
    if (!absolute.startsWith(`${root}${path.sep}`) || !fs.existsSync(absolute)) {
      throw new Error(`Astro output references missing script: ${source}`);
    }
  }
  return { entry, scripts };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const result = validateAstroOutput();
  console.log(`Astro output valid: ${result.scripts.length} client script(s)`);
}
