import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

const workflowPath = '.github/workflows/desktop-release-reusable.yml';
const workflow = fs.readFileSync(workflowPath, 'utf8');

function namedStep(name: string): string {
  const marker = `      - name: ${name}`;
  const start = workflow.indexOf(marker);
  if (start < 0) throw new Error(`missing workflow step: ${name}`);
  const next = workflow.indexOf('\n      - ', start + marker.length);
  return workflow.slice(start, next < 0 ? workflow.length : next);
}

describe('desktop release workflow safety', () => {
  it('pins every external action to a full commit SHA', () => {
    const actionRefs = [...workflow.matchAll(/^\s*- uses:\s+([^\s]+)$/gm)].map((match) => match[1]);
    expect(actionRefs.length).toBeGreaterThan(0);
    for (const ref of actionRefs) expect(ref).toMatch(/^[^@]+@[0-9a-f]{40}$/);
  });

  it('keeps release writes in the single release job and publishes only on explicit input', () => {
    expect(workflow).toContain('permissions: { contents: write }');
    expect(workflow).toContain('- if: inputs.publish');
    expect(workflow).toContain('gh release edit "$TAG" --draft=false');
  });

  it('does not use nested heredocs and resolves draft targets before comparison', () => {
    const refresh = namedStep('Create or refresh draft release assets');
    expect(refresh).not.toContain("<<'NODE'");
    expect(refresh).toContain('spawnSync("gh"');
    expect(refresh).toContain('if(!r.isDraft)');
    expect(refresh).toContain('resolved_target=$(gh api');
    expect(refresh).toContain('if [[ "$resolved_target" != "$TARGET_SHA" ]]');
  });

  it('verifies the release after upload and before optional publication', () => {
    const verifyIndex = workflow.indexOf('- name: Verify GitHub release assets');
    const publishIndex = workflow.indexOf('- if: inputs.publish');
    expect(verifyIndex).toBeGreaterThan(0);
    expect(publishIndex).toBeGreaterThan(verifyIndex);
  });
});
