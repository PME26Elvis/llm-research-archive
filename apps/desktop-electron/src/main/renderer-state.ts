import fs from 'node:fs';
import path from 'node:path';
import {
  RendererImplementationSchema,
  type RendererImplementation,
} from '@research-observatory/platform-contracts';

export const DEFAULT_RENDERER_IMPLEMENTATION: RendererImplementation = 'astro';

interface RendererStateDocument {
  schemaVersion: 1;
  implementation: RendererImplementation;
}

export function loadRendererImplementation(
  filePath: string,
  environmentValue = process.env.OBSERVATORY_RENDERER,
): RendererImplementation {
  const environment = RendererImplementationSchema.safeParse(environmentValue);
  if (environment.success) return environment.data;
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Partial<RendererStateDocument>;
    if (parsed.schemaVersion !== 1) return DEFAULT_RENDERER_IMPLEMENTATION;
    const implementation = RendererImplementationSchema.safeParse(parsed.implementation);
    return implementation.success ? implementation.data : DEFAULT_RENDERER_IMPLEMENTATION;
  } catch {
    return DEFAULT_RENDERER_IMPLEMENTATION;
  }
}

export function saveRendererImplementation(
  filePath: string,
  implementation: RendererImplementation,
): void {
  const value = RendererImplementationSchema.parse(implementation);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.tmp`;
  fs.writeFileSync(
    temporary,
    `${JSON.stringify({ schemaVersion: 1, implementation: value }, null, 2)}\n`,
  );
  fs.renameSync(temporary, filePath);
}
