// Pachetele de domeniu (@lu/*) trebuie să rămână independente de framework (ADR-001, ADR-005).
import node from './node.js';

const frameworkImports = {
  group: ['next', 'next/*', 'react', 'react/*', 'react-dom', 'server-only'],
  message: 'Pachetele @lu/* nu depind de Next/React — vezi ADR-001.',
};

const deepImportMessage =
  'Importă doar API-ul public al pachetului (@lu/<nume>), fără deep imports.';

export default [
  ...node,
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
