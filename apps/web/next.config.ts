import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Portabil în afara Vercel (ADR-004): build-ul trebuie să ruleze și ca container.
  output: 'standalone',
  // Monorepo: tracing-ul include pachetele @lu/* din afara apps/web.
  outputFileTracingRoot: path.join(import.meta.dirname, '../../'),
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
