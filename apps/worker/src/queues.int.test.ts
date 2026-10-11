import { QUEUES } from '@lu/db';
import { testDatabaseUrl } from '@lu/db/testing';
import { PgBoss } from 'pg-boss';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { ensureQueues } from './queues';

const boss = new PgBoss({ connectionString: testDatabaseUrl(), schema: 'pgboss' });

beforeAll(() => boss.start());
afterAll(() => boss.stop({ graceful: false }));

test('ensureQueues creează toate cozile din QUEUES și e idempotent la repornire', async () => {
  await ensureQueues(boss);
  await ensureQueues(boss);

  // pg-boss își creează și cozi interne (`__pgboss__*`); verificăm exact cozile noastre.
  const names = (await boss.getQueues())
    .map((q) => q.name)
    .filter((name) => !name.startsWith('__pgboss__'));
  expect(names.sort()).toEqual(Object.values(QUEUES).sort());
});
