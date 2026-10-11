import path from 'node:path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { createDb } from '../client';
import { testDatabaseUrl } from './database-url';

/**
 * globalSetup pentru proiectul `integration` din Vitest: recreează baza de test a pachetului
 * și aplică migrațiile. Fiecare rulare pornește de la o bază goală, deci verifică și că
 * migrațiile se aplică de la zero.
 */
export default async function setup() {
  const url = testDatabaseUrl();
  const name = new URL(url).pathname.slice(1);

  // Conexiune la baza principală, doar pentru CREATE/DROP DATABASE.
  const admin = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await admin.connect();
  try {
    await admin.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
    await admin.query(`CREATE DATABASE "${name}"`);
  } finally {
    await admin.end();
  }

  const { db, close } = createDb(url, { max: 1 });
  try {
    await migrate(db, { migrationsFolder: path.resolve(import.meta.dirname, '../../migrations') });
  } finally {
    await close();
  }
}
