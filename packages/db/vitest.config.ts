import { defineConfig } from 'vitest/config';

// unit: logică pură, fără DB. integration: Postgres real, baza recreată la fiecare rulare.
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
          globalSetup: ['./src/testing/global-setup.ts'],
        },
      },
    ],
  },
});
