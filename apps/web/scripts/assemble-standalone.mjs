// `output: 'standalone'` nu copiază asset-urile statice (node_modules/next/dist/docs → next.config.js/output).
// Le copiem lângă server.js, ca build-ul să poată rula singur (ADR-004, E2E).
import { cpSync, existsSync } from 'node:fs';

const target = '.next/standalone/apps/web';

cpSync('.next/static', `${target}/.next/static`, { recursive: true });
if (existsSync('public')) cpSync('public', `${target}/public`, { recursive: true });
