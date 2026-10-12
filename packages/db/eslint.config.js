import domain from '@lu/config/eslint/domain';

export default [
  ...domain,
  {
    // @lu/db e chiar stratul de date: regula „acces la date doar în *.queries.ts” nu i se aplică (ADR-011).
    files: ['src/**/*.ts'],
    rules: { '@typescript-eslint/no-restricted-imports': 'off' },
  },
];
