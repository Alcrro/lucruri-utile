import path from 'node:path';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

/**
 * Baza de test a pachetului curent: `<db>_test_<pachet>`, pe același server ca `DATABASE_URL`.
 * O bază per pachet, pentru că Turbo rulează testele pachetelor în paralel.
 * Deterministă, ca globalSetup și fixture-urile să ajungă la aceeași bază fără să și-o transmită.
 */
export function testDatabaseUrl(): string {
  try {
    process.loadEnvFile(path.resolve(import.meta.dirname, '../../../../.env'));
  } catch {
    // lipsă .env — ok în CI, unde variabilele vin din mediu
  }

  const base = process.env.DATABASE_URL;
  if (!base) throw new Error('DATABASE_URL lipsește (vezi .env.example)');

  const url = new URL(base);
  // Testele șterg și recreează baza: doar pe un Postgres local (docker-compose sau containerul din CI).
  if (!LOCAL_HOSTS.has(url.hostname)) {
    throw new Error(`Testele rulează doar pe un Postgres local, nu pe ${url.hostname}`);
  }

  const pkg = path.basename(process.cwd()).replace(/\W/g, '_');
  url.pathname = `/${url.pathname.slice(1)}_test_${pkg}`;
  return url.toString();
}
