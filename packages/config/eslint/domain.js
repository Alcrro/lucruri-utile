// Pachetele de domeniu (@lu/*) trebuie să rămână independente de framework (ADR-001, ADR-005).
import node from './node.js';

const frameworkImports = {
  group: ['next', 'next/*', 'react', 'react/*', 'react-dom', 'server-only'],
  message: 'Pachetele @lu/* nu depind de Next/React — vezi ADR-001.',
};

const deepImportMessage =
  'Importă doar API-ul public al pachetului (@lu/<nume>), fără deep imports.';

const dataAccessMessage =
  'Accesul la date e doar în *.queries.ts (ADR-011). Aici sunt permise doar importuri de tipuri.';

export default [
  ...node,
  {
    // Logica pură și serviciile nu ating baza de date direct: o fac prin *.queries.ts (ADR-011).
    files: ['src/**/*.ts'],
    ignores: ['src/**/*.queries.ts', 'src/**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@lu/db',
              // Numele cozilor sunt constante, nu acces la date: serviciile publică joburi.
              allowImportNames: ['QUEUES'],
              allowTypeImports: true,
              message: dataAccessMessage,
            },
          ],
          patterns: [
            {
              group: ['drizzle-orm', 'drizzle-orm/*', 'pg'],
              allowTypeImports: true,
              message: dataAccessMessage,
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [frameworkImports, { group: ['@lu/*/*'], message: deepImportMessage }],
        },
      ],
    },
  },
  {
    // Testele pot folosi helper-ele de test exportate explicit (ex. @lu/db/testing).
    files: ['src/**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            frameworkImports,
            { group: ['@lu/*/*', '!@lu/*/testing'], message: deepImportMessage },
          ],
        },
      ],
    },
  },
];
