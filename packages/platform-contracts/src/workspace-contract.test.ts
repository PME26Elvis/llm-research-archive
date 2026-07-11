import { describe, expect, it } from 'vitest';
import {
  DesktopCommandSchema,
  WorkspaceInfoSchema,
  WorkspaceSelectionResultSchema,
} from './index';

describe('workspace contracts', () => {
  it('accepts bounded workspace information and the open command', () => {
    expect(DesktopCommandSchema.parse('workspace.open')).toBe('workspace.open');
    expect(
      WorkspaceInfoSchema.parse({
        kind: 'local',
        rootPath: '/tmp/archive',
        displayName: 'archive',
        articleCount: 2,
        warnings: ['linked.md: symlink skipped'],
        invalidFiles: ['broken/index.md'],
      }).articleCount,
    ).toBe(2);
  });

  it('models cancellation, selection, and recoverable rejection without arbitrary payloads', () => {
    expect(WorkspaceSelectionResultSchema.parse({ status: 'cancelled' })).toEqual({
      status: 'cancelled',
    });
    expect(
      WorkspaceSelectionResultSchema.safeParse({ status: 'selected', workspace: { rootPath: 7 } })
        .success,
    ).toBe(false);
    expect(
      WorkspaceSelectionResultSchema.parse({ status: 'rejected', message: 'invalid workspace' }),
    ).toEqual({ status: 'rejected', message: 'invalid workspace' });
  });
});
