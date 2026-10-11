import { defineConfig } from 'drizzle-kit';

// .env din rădăcina monorepo-ului; în CI variabilele vin din mediu.
try {
  process.loadEnvFile('../../.env');
} catch {
  // lipsă .env — ok în CI
}

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL lipsește');

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './migrations',
  casing: 'snake_case',
  dbCredentials: { url: process.env.DATABASE_URL },
  strict: true,
  verbose: true,
});
