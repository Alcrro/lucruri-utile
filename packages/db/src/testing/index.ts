import { TransactionRollbackError } from 'drizzle-orm';
import { test as base } from 'vitest';
import { createDb, type Db } from '../client';
import { testDatabaseUrl } from './database-url';

export { testDatabaseUrl } from './database-url';

/**
 * `test` cu acces la baza de test (docs/structure.md → Teste).
 *
 * - `db`: o tranzacție anulată la finalul testului. Testele sunt izolate și pot rula în paralel.
 *   Serviciile care deschid tranzacții proprii primesc savepoint-uri, deci funcționează normal.
 * - `testDb`: pool-ul real, partajat de testele unui worker Vitest. Doar pentru testele care au
 *   nevoie de commit-uri reale (concurență, mai multe conexiuni). Ele își curăță singure datele.
 */
export const test = base.extend<{
  $worker: { testDb: Db };
  $test: { db: Db };
}>({
  testDb: [
    async ({}, use) => {
      const { db, close } = createDb(testDatabaseUrl(), { max: 4 });
      await use(db);
      await close();
    },
    { scope: 'worker' },
  ],
  db: async ({ testDb }, use) => {
    try {
      await testDb.transaction(async (tx) => {
        await use(tx);
        tx.rollback();
      });
    } catch (err) {
      if (!(err instanceof TransactionRollbackError)) throw err;
    }
  },
});
