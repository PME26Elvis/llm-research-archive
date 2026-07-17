import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { prepareAstroOutput } from './prepare-astro-output.mjs';
import { validateAstroOutput } from './validate-astro-output.mjs';

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

function fixture(html: string) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'observatory-astro-output-'));
  roots.push(root);
  fs.mkdirSync(path.join(root, '_astro'), { recursive: true });
  fs.writeFileSync(path.join(root, '_astro', 'entry.js'), 'console.log("local")');
  fs.writeFileSync(
    path.join(root, '_astro', 'preload-helper.fixture.js'),
    'const resolveAsset=function(asset){return`/`+asset}; export { resolveAsset };',
  );
  fs.writeFileSync(path.join(root, 'index.html'), html);
  return root;
}

const inlineBootstrap = 'console.log("astro bootstrap")';
const inlineHash = crypto.createHash('sha256').update(inlineBootstrap).digest('base64');
const markers =
  `<meta http-equiv="content-security-policy" content="default-src 'self'; script-src 'self' 'sha256-${inlineHash}'; style-src 'self'; style-src-attr 'unsafe-inline'">` +
  '<html data-renderer-shell="astro"><body data-astro-entry="research-observatory">' +
  `<i data-astro-shell-marker></i><section data-astro-boot-shell></section><script>${inlineBootstrap}</script>`;

describe('Astro static Electron output', () => {
  it('rewrites root-absolute Astro assets for file loading and validates the entry', () => {
    const root = fixture(`${markers}<script src="/_astro/entry.js"></script></body></html>`);
    expect(prepareAstroOutput(root)).toEqual([
      '_astro/preload-helper.fixture.js',
      'index.html',
    ]);
    expect(fs.readFileSync(path.join(root, 'index.html'), 'utf8')).toContain(
      'src="./_astro/entry.js"',
    );
    expect(fs.readFileSync(path.join(root, '_astro', 'preload-helper.fixture.js'), 'utf8')).toContain(
      'return`../`+asset',
    );
    expect(validateAstroOutput(root).scripts).toEqual(['./_astro/entry.js']);
  });


  it('rejects a root-relative Vite preload helper', () => {
    const root = fixture(`${markers}<script src="./_astro/entry.js"></script></body></html>`);
    expect(() => validateAstroOutput(root)).toThrow(/root-relative Vite preload helper/);
  });

  it('requires narrowly scoped inline style attributes for Mermaid', () => {
    const root = fixture(
      `${markers.replace(
        "style-src 'self'; style-src-attr 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
      )}<script src="./_astro/entry.js"></script></body></html>`,
    );
    prepareAstroOutput(root);
    expect(() => validateAstroOutput(root)).toThrow(/must not broadly authorize inline style elements/);
  });

  it('rejects a mismatched inline-script CSP hash', () => {
    const root = fixture(
      `${markers.replace(inlineBootstrap, 'console.log("tampered")')}<script src="./_astro/entry.js"></script></body></html>`,
    );
    expect(() => validateAstroOutput(root)).toThrow(/CSP hash does not match/);
  });

  it('rejects remote and missing runtime assets', () => {
    const remote = fixture(
      `${markers}<script src="https://cdn.example/entry.js"></script></body></html>`,
    );
    expect(() => validateAstroOutput(remote)).toThrow(/remote runtime URL/);

    const missing = fixture(`${markers}<script src="./_astro/missing.js"></script></body></html>`);
    prepareAstroOutput(missing);
    expect(() => validateAstroOutput(missing)).toThrow(/missing script/);
  });
});
