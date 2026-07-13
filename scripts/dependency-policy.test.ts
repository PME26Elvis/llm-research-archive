import { describe, expect, it } from 'vitest';
import {
  advisoryIdentifiers,
  isVulnerabilityExcepted,
  validateExceptions,
} from './dependency-policy.mjs';

describe('dependency governance policy', () => {
  it('accepts bounded future exceptions and matches explicit advisories', () => {
    const now = new Date('2026-07-13T00:00:00.000Z');
    const exceptions = validateExceptions(
      {
        schemaVersion: 1,
        exceptions: [
          {
            package: 'example',
            advisory: 'https://example.test/advisory',
            rationale: 'Upgrade is blocked by an upstream API change.',
            owner: 'desktop-maintainers',
            expiresAt: '2026-08-01T00:00:00.000Z',
          },
        ],
      },
      now,
    );
    const vulnerability = {
      via: [{ url: 'https://example.test/advisory', source: 123, name: 'CVE-test' }],
    };
    expect(advisoryIdentifiers(vulnerability)).toContain('123');
    expect(isVulnerabilityExcepted('example', vulnerability, exceptions)).toBe(true);
  });

  it('rejects expired, overlong, and malformed exceptions', () => {
    const now = new Date('2026-07-13T00:00:00.000Z');
    expect(() =>
      validateExceptions(
        {
          schemaVersion: 1,
          exceptions: [
            {
              package: 'example',
              advisory: '*',
              rationale: 'expired',
              owner: 'desktop-maintainers',
              expiresAt: '2026-07-12T00:00:00.000Z',
            },
          ],
        },
        now,
      ),
    ).toThrow('expired');
    expect(() =>
      validateExceptions(
        {
          schemaVersion: 1,
          exceptions: [
            {
              package: 'example',
              advisory: '*',
              rationale: 'too long',
              owner: 'desktop-maintainers',
              expiresAt: '2027-01-01T00:00:00.000Z',
            },
          ],
        },
        now,
      ),
    ).toThrow('90 days');
    expect(() => validateExceptions({ schemaVersion: 1, exceptions: [{}] }, now)).toThrow();
  });
});
