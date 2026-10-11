import { defineConfig } from 'vitest/config';

// unit: logica joburilor, fără DB. integration: Postgres real + pg-boss, baza recreată la fiecare rulare.
export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts'],
          exclude: ['src/**/*.int.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['src/**/*.int.test.ts'],
          globalSetup: ['@lu/db/testing/global-setup'],
        },
      },
    ],
  },
});
