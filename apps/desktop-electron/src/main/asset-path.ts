import fs from 'node:fs/promises';
import path from 'node:path';
const allowed = /\.(png|jpe?g|gif|webp|svg|avif)$/i;
export async function resolveSafeAssetPath(
  rootInput: string,
  requestUrl: string,
): Promise<string | undefined> {
  let decoded = '';
  try {
    decoded = decodeURIComponent(new URL(requestUrl).pathname.replace(/^\//, ''));
  } catch {
    return undefined;
  }
  const root = await fs.realpath(rootInput);
  const candidate = path.resolve(root, decoded);
  let real = '';
  try {
    real = await fs.realpath(candidate);
  } catch {
    return undefined;
  }
  const rel = path.relative(root, real);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return undefined;
  const stat = await fs.stat(real);
  if (!stat.isFile() || !allowed.test(real)) return undefined;
  return real;
}
