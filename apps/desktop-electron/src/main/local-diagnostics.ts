import fs from 'node:fs';
import path from 'node:path';

export type DiagnosticLevel = 'info' | 'warning' | 'error';
export type DiagnosticArea =
  'main' | 'renderer' | 'preferences' | 'search-index' | 'workspace' | 'import';

export interface LocalDiagnosticEvent {
  timestamp: string;
  level: DiagnosticLevel;
  area: DiagnosticArea;
  code: string;
  message: string;
}

interface LocalDiagnosticFileV1 {
  schemaVersion: 1;
  events: LocalDiagnosticEvent[];
}

const SECRET_PATTERN =
  /(?:api[-_ ]?key|authorization|bearer|token|secret|password)\s*[:=]\s*[^\s,;]+/gi;
const ABSOLUTE_PATH_PATTERN =
  /(?:[A-Za-z]:\\[^\n\r"']+|\/(?:Users|home|var|tmp|private|opt|mnt)\/[^\n\r"']+)/g;

function truncate(value: string, max = 500): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

export function redactDiagnosticText(value: unknown, privateRoots: readonly string[] = []): string {
  let text =
    typeof value === 'string' ? value : value instanceof Error ? value.message : String(value);
  for (const root of privateRoots.filter(Boolean).sort((a, b) => b.length - a.length)) {
    text = text.split(root).join('[workspace]');
  }
  return truncate(
    text
      .replace(SECRET_PATTERN, '[secret-redacted]')
      .replace(ABSOLUTE_PATH_PATTERN, '[path-redacted]')
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim(),
  );
}

export class LocalDiagnostics {
  private privateRoots: string[] = [];

  constructor(
    private readonly filePath: string,
    private readonly maxEvents = 200,
    private readonly maxBytes = 256 * 1024,
  ) {}

  setPrivateRoots(roots: readonly string[]): void {
    this.privateRoots = roots.filter(Boolean).map((root) => path.resolve(root));
  }

  record(
    level: DiagnosticLevel,
    area: DiagnosticArea,
    code: string,
    message: unknown,
    timestamp = new Date().toISOString(),
  ): LocalDiagnosticEvent {
    const event: LocalDiagnosticEvent = {
      timestamp,
      level,
      area,
      code: code.replace(/[^a-z0-9-]/gi, '-').slice(0, 80) || 'unknown',
      message: redactDiagnosticText(message, this.privateRoots),
    };
    const current = this.readFile();
    current.events.push(event);
    current.events = current.events.slice(-this.maxEvents);
    while (
      Buffer.byteLength(JSON.stringify(current)) > this.maxBytes &&
      current.events.length > 1
    ) {
      current.events.shift();
    }
    this.writeFile(current);
    return event;
  }

  recent(limit = 50): LocalDiagnosticEvent[] {
    return this.readFile().events.slice(-Math.max(0, Math.min(limit, this.maxEvents)));
  }

  clear(): void {
    this.writeFile({ schemaVersion: 1, events: [] });
  }

  private readFile(): LocalDiagnosticFileV1 {
    try {
      const parsed = JSON.parse(
        fs.readFileSync(this.filePath, 'utf8'),
      ) as Partial<LocalDiagnosticFileV1>;
      if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.events)) throw new Error('invalid');
      return {
        schemaVersion: 1,
        events: parsed.events.filter((event): event is LocalDiagnosticEvent =>
          Boolean(
            event &&
            typeof event.timestamp === 'string' &&
            typeof event.level === 'string' &&
            typeof event.area === 'string' &&
            typeof event.code === 'string' &&
            typeof event.message === 'string',
          ),
        ),
      };
    } catch {
      return { schemaVersion: 1, events: [] };
    }
  }

  private writeFile(value: LocalDiagnosticFileV1): void {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const temporary = `${this.filePath}.tmp`;
    fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
    fs.renameSync(temporary, this.filePath);
  }
}
