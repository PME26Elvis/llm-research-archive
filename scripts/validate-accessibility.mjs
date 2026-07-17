import fs from 'node:fs';

const css = fs.readFileSync('apps/desktop-electron/src/renderer/style.css', 'utf8');
const renderer = fs.readFileSync('apps/desktop-electron/src/renderer/observatory-app.tsx', 'utf8');
const observatory = fs.readFileSync(
  'apps/desktop-electron/src/renderer/observatory-modal.tsx',
  'utf8',
);
const commandPalette = fs.readFileSync(
  'apps/desktop-electron/src/renderer/command-palette.tsx',
  'utf8',
);

function parseVariables(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`, 'm').exec(css);
  if (!match) throw new Error(`theme variables missing for ${selector}`);
  return Object.fromEntries(
    [...match[1].matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((entry) => [
      entry[1],
      entry[2],
    ]),
  );
}

function rgb(hex) {
  return [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
}
function luminance(hex) {
  const values = rgb(hex).map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
}
function contrast(foreground, background) {
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

const themes = {
  dark: parseVariables(':root'),
  light: parseVariables(":root[data-theme='light']"),
};
const pairs = [
  ['text-primary', 'surface-body', 4.5],
  ['text-muted', 'surface-body', 4.5],
  ['text-primary', 'surface-control', 4.5],
  ['accent', 'surface-body', 3],
  ['accent', 'surface-control', 3],
];
const contrasts = [];
for (const [themeName, variables] of Object.entries(themes)) {
  for (const [foregroundName, backgroundName, minimum] of pairs) {
    const foreground = variables[foregroundName];
    const background = variables[backgroundName];
    if (!foreground || !background) {
      throw new Error(`${themeName} theme missing ${foregroundName} or ${backgroundName}`);
    }
    const ratio = contrast(foreground, background);
    contrasts.push({ theme: themeName, foregroundName, backgroundName, ratio, minimum });
    if (ratio + 1e-9 < minimum) {
      throw new Error(
        `${themeName} ${foregroundName}/${backgroundName} contrast ${ratio.toFixed(2)} < ${minimum}`,
      );
    }
  }
}

const sourceChecks = [
  [
    'skip link',
    renderer.includes('className="skip-link"') && renderer.includes('href="#main-reader"'),
  ],
  [
    'main reader focus target',
    renderer.includes('id="main-reader"') && renderer.includes('tabIndex={-1}'),
  ],
  ['polite live region', renderer.includes('aria-live="polite"')],
  ['reduced motion policy', css.includes('@media (prefers-reduced-motion: reduce)')],
  ['visible focus policy', css.includes(':focus-visible')],
  ['200 percent responsive layout', css.includes('@media (max-width: 760px)')],
  [
    'Observatory modal semantics',
    observatory.includes('role="dialog"') && observatory.includes('aria-modal="true"'),
  ],
  ['Observatory nonvisual tables', (observatory.match(/<table>/g) ?? []).length >= 2],
  ['Observatory focus trap', observatory.includes("event.key !== 'Tab'")],
  ['Command Palette focus trap', commandPalette.includes("event.key === 'Tab'")],
];
const failedChecks = sourceChecks.filter(([, passed]) => !passed).map(([name]) => name);
if (failedChecks.length)
  throw new Error(`accessibility source checks failed: ${failedChecks.join(', ')}`);

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  standard: 'WCAG 2.2 AA',
  contrasts,
  sourceChecks: sourceChecks.map(([name, passed]) => ({ name, passed })),
};
fs.mkdirSync('dist/quality', { recursive: true });
fs.writeFileSync('dist/quality/accessibility.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
