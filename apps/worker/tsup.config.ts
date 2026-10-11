import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  target: 'node24',
  platform: 'node',
  // Pachetele interne sunt sursă TS (ADR-005) → intră în bundle; dependențele npm rămân externe.
  noExternal: [/^@lu\//],
  // Dependențele CJS ajunse în bundle (pg) au nevoie de `require` pentru modulele built-in Node.
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
  sourcemap: true,
  clean: true,
});
