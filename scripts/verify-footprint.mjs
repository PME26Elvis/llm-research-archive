import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { listPackage } from '@electron/asar';

const mode = process.argv[2];
const RENDERER_GZIP_BUDGET = 2 * 1024 * 1024;
const PACKAGE_BUDGET = 250 * 1024 * 1024;

function walk(root) {
  const output = [];
  if (!fs.existsSync(root)) return output;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) output.push(...walk(absolute));
    else if (entry.isFile()) output.push(absolute);
  }
  return output;
}
function writeReport(name, value) {
  fs.mkdirSync('dist/quality', { recursive: true });
  fs.writeFileSync(`dist/quality/${name}.json`, `${JSON.stringify(value, null, 2)}\n`);
  console.log(JSON.stringify(value, null, 2));
}

if (mode === 'renderer') {
  const root = path.resolve('.vite/renderer/main_window');
  const htmlPath = path.join(root, 'index.html');
  if (!fs.existsSync(htmlPath)) throw new Error(`renderer entry missing: ${htmlPath}`);
  const html = fs.readFileSync(htmlPath, 'utf8');
  const initialAssets = new Set();
  for (const match of html.matchAll(
    /<(?:script|link)\b[^>]+(?:src|href)=["']([^"']+\.js)["'][^>]*>/gi,
  )) {
    initialAssets.add(match[1].replace(/^\.\//, ''));
  }
  if (!initialAssets.size) throw new Error('renderer entry references no initial JavaScript');
  const files = [...initialAssets].map((relative) => {
    const absolute = path.resolve(root, relative);
    if (!absolute.startsWith(`${root}${path.sep}`) || !fs.existsSync(absolute)) {
      throw new Error(`renderer initial asset missing: ${relative}`);
    }
    const content = fs.readFileSync(absolute);
    return {
      relative,
      bytes: content.length,
      gzipBytes: zlib.gzipSync(content, { level: 9 }).length,
    };
  });
  const totalGzipBytes = files.reduce((sum, file) => sum + file.gzipBytes, 0);
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    mode,
    budgetBytes: RENDERER_GZIP_BUDGET,
    totalGzipBytes,
    files,
  };
  writeReport('footprint-renderer', report);
  if (totalGzipBytes > RENDERER_GZIP_BUDGET) {
    throw new Error(`initial renderer JavaScript gzip ${totalGzipBytes} > ${RENDERER_GZIP_BUDGET}`);
  }
} else if (mode === 'package') {
  const outRoot = path.resolve('out');
  const asars = walk(outRoot).filter((file) => path.basename(file) === 'app.asar');
  if (!asars.length) throw new Error('no packaged app.asar found under out/');
  const forbidden = [];
  const packages = asars.map((asarPath) => {
    const relativeAsar = path.relative(outRoot, asarPath);
    const packageRootName = relativeAsar.split(path.sep)[0];
    const packageRoot = path.join(outRoot, packageRootName);
    const files = walk(packageRoot);
    const totalBytes = files.reduce((sum, file) => sum + fs.statSync(file).size, 0);
    const entries = listPackage(asarPath).map((entry) => entry.replaceAll('\\', '/'));
    const blocked = entries.filter((entry) =>
      /(?:^|\/)(?:project-docs|scripts|packages|apps|tests?|e2e|coverage|playwright-report|test-results|\.github|\.vscode|\.devcontainer)(?:\/|$)|\.(?:map|py|pyc)$|(?:^|\/)(?:mkdocs\.yml|requirements\.txt|AGENTS\.md)$/i.test(
        entry,
      ),
    );
    forbidden.push(...blocked.map((entry) => `${packageRootName}:${entry}`));
    return {
      packageRoot: packageRootName,
      totalBytes,
      asarPath: relativeAsar,
      asarEntries: entries.length,
    };
  });
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    mode,
    budgetBytes: PACKAGE_BUDGET,
    packages,
    forbidden,
  };
  writeReport(`footprint-package-${process.platform}-${process.arch}`, report);
  for (const item of packages) {
    if (item.totalBytes > PACKAGE_BUDGET) {
      throw new Error(
        `${item.packageRoot} installed footprint ${item.totalBytes} > ${PACKAGE_BUDGET}`,
      );
    }
  }
  if (forbidden.length) throw new Error(`forbidden packaged files:\n- ${forbidden.join('\n- ')}`);
} else {
  throw new Error('usage: node scripts/verify-footprint.mjs <renderer|package>');
}
