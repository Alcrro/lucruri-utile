// Bază pentru orice cod Node din monorepo (worker + pachete).
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import conventions from './conventions.js';

export default defineConfig(
  globalIgnores(['dist/**', 'migrations/**']),
  tseslint.configs.recommended,
  conventions,
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
);
