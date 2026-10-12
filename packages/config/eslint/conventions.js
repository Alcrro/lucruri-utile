// Convenții de cod impuse automat, comune web, worker și pachete (docs/structure.md → Denumiri, ADR-011).
import checkFile from 'eslint-plugin-check-file';

// Fișierele în care Next cere `export default`.
const NEXT_DEFAULT_EXPORT_FILES = [
  'page',
  'layout',
  'loading',
  'error',
  'not-found',
  'global-error',
  'template',
  'default',
  'sitemap',
  'robots',
  'manifest',
  'icon',
  'apple-icon',
  'opengraph-image',
  'twitter-image',
];

export default [
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'check-file': checkFile },
    rules: {
      // kebab-case peste tot; sufixele de rol (.service, .queries, .test) nu contează.
      'check-file/filename-naming-convention': [
        'error',
        { 'src/**/*.{ts,tsx}': 'KEBAB_CASE' },
        { ignoreMiddleExtensions: true },
      ],
      'check-file/folder-naming-convention': [
        'error',
        { 'src/app/**/': 'NEXT_JS_APP_ROUTER_CASE', 'src/!(app)/**/': 'KEBAB_CASE' },
      ],
      'no-restricted-exports': [
        'error',
        {
          restrictDefaultExports: {
            direct: true,
            named: true,
            defaultFrom: true,
            namedFrom: true,
            namespaceFrom: true,
          },
        },
      ],
    },
  },
  {
    files: [`src/app/**/{${NEXT_DEFAULT_EXPORT_FILES.join(',')}}.{ts,tsx}`],
    rules: { 'no-restricted-exports': 'off' },
  },
];
