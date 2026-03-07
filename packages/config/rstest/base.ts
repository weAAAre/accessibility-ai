import { defineConfig } from '@rstest/core';

/**
 * Base Rstest configuration shared across all packages in the monorepo.
 * Extend this in each package's rstest.config.ts via `extends`.
 *
 * @example
 * ```ts
 * import { defineConfig } from '@rstest/core';
 * import base from '@weaaare/config/rstest';
 *
 * export default defineConfig({
 *   extends: base,
 * });
 * ```
 */
export default defineConfig({
  testEnvironment: 'node',
  include: ['tests/**/*.test.ts'],
  testTimeout: 10_000,
});
