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

  it('separates published collisions from reusable drafts', () => {
    const resolve = namedStep('Resolve a collision-free release version');
    expect(resolve).toContain("[.tag_name, .draft] | @tsv");
    expect(resolve).toContain('reusableDraftTags:');
    expect(resolve).toContain('release.draft');
    const validateDraft = namedStep('Validate reusable draft target');
    expect(validateDraft).toContain("version_source == 'requested-draft'");
    expect(validateDraft).toContain('resolved_target=$(gh api');
    expect(validateDraft).toContain('if [[ "$resolved_target" != "$TARGET_SHA" ]]');
  });

  it('does not use nested heredocs and resolves draft targets before comparison', () => {
    const refresh = namedStep('Create or refresh draft release assets');
    expect(refresh).not.toContain("<<'NODE'");
    expect(refresh).toContain('spawnSync("gh"');
    expect(refresh).toContain('if(!r.isDraft)');
    expect(refresh).toContain('resolved_target=$(gh api');
    expect(refresh).toContain('if [[ "$resolved_target" != "$TARGET_SHA" ]]');
  });


  it('accepts structured change items and renders them into the GitHub release body', () => {
    expect(workflow).toContain("release_notes: { type: string, required: false, default: '' }");
    expect(workflow.match(/node scripts\/release-notes\.mjs \/tmp\/release-notes\.md/g)).toHaveLength(2);
    const refresh = namedStep('Create or refresh draft release assets');
    expect(refresh).toContain('--notes-file /tmp/release-notes.md');
    expect(refresh).toContain('gh release edit "$TAG" --notes-file /tmp/release-notes.md');
  });

  it('verifies the release after upload and before optional publication', () => {
    const verifyIndex = workflow.indexOf('- name: Verify GitHub release assets');
    const publishIndex = workflow.indexOf('- if: inputs.publish');
    expect(verifyIndex).toBeGreaterThan(0);
    expect(publishIndex).toBeGreaterThan(verifyIndex);
  });
});
