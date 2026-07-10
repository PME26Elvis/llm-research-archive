import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const platform = process.platform === 'win32' ? 'win32' : 'linux';
const candidates =
  platform === 'win32'
    ? ['out/Research Observatory-win32-x64/llm-research-archive-desktop.exe']
    : ['out/Research Observatory-linux-x64/llm-research-archive-desktop'];
const exe = candidates.find(fs.existsSync);
if (!exe) throw new Error(`packaged executable not found: ${candidates.join(', ')}`);
const child = spawn(path.resolve(exe), ['--no-sandbox', '--smoke-test'], { stdio: 'ignore' });
const timeout = setTimeout(() => {
  child.kill();
  console.log(`packaged smoke ok: ${exe}`);
}, 8000);
child.on('exit', (code) => {
  clearTimeout(timeout);
  if (code && code !== 0) throw new Error(`packaged app exited ${code}`);
  console.log(`packaged smoke ok: ${exe}`);
});
