import { expect, it } from 'vitest';
import { SearchRequestSchema, ExternalUrlSchema } from './index';
it('validates ipc dtos', () => {
  expect(SearchRequestSchema.parse({ query: 'x' }).query).toBe('x');
  expect(() => ExternalUrlSchema.parse('file:///tmp/x')).toThrow();
});
