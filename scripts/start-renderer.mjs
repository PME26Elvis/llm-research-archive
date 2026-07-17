import { spawn } from 'node:child_process';

const implementation = process.argv[2] || 'astro';
if (!['astro', 'classic'].includes(implementation)) {
  throw new Error('usage: node scripts/start-renderer.mjs <astro|classic>');
}
const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(command, ['electron-forge', 'start', '--', '--no-sandbox'], {
  stdio: 'inherit',
  env: { ...process.env, OBSERVATORY_RENDERER: implementation },
});
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
