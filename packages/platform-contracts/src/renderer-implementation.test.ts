import { describe, expect, it } from 'vitest';
import {
  RendererImplementationInfoSchema,
  RendererImplementationSchema,
  RendererImplementationUpdateRequestSchema,
} from './index';

describe('renderer implementation contracts', () => {
  it('models the finite Astro and Classic implementation set', () => {
    expect(RendererImplementationSchema.parse('astro')).toBe('astro');
    expect(RendererImplementationSchema.parse('classic')).toBe('classic');
    expect(RendererImplementationSchema.safeParse('web').success).toBe(false);
  });

  it('requires both packaged implementations in implementation info', () => {
    expect(
      RendererImplementationInfoSchema.parse({
        active: 'astro',
        default: 'astro',
        available: ['astro', 'classic'],
      }),
    ).toEqual({ active: 'astro', default: 'astro', available: ['astro', 'classic'] });
    expect(
      RendererImplementationInfoSchema.safeParse({
        active: 'astro',
        default: 'astro',
        available: ['astro'],
      }).success,
    ).toBe(false);
  });

  it('accepts only a typed implementation switch request', () => {
    expect(RendererImplementationUpdateRequestSchema.parse({ implementation: 'classic' })).toEqual({
      implementation: 'classic',
    });
    expect(
      RendererImplementationUpdateRequestSchema.safeParse({ implementation: '../../classic' })
        .success,
    ).toBe(false);
  });
});
