import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    // Auth/ownership tests share fixture rows in the real dev database and
    // aren't safe to run concurrently against each other.
    fileParallelism: false,
    hookTimeout: 20_000,
    testTimeout: 20_000,
  },
});
