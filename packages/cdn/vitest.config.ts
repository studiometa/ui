import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts'],
    // Several suites (build.test.ts, worker/index.test.ts) shell out to the full
    // esbuild distribution build in hooks and tests. Running those files in parallel
    // makes the esbuild processes contend for CPU, and a cold run — exactly what CI
    // does on every fresh checkout — then overruns the default hook/test timeouts.
    // Serialize the files so builds never overlap, and give the build-driven hooks
    // and tests enough head-room to complete on a cold machine.
    fileParallelism: false,
    hookTimeout: 120_000,
    testTimeout: 60_000,
  },
});
