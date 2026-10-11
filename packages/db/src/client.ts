import { drizzle, type NodePgQueryResultHKT } from 'drizzle-orm/node-postgres';
import type { PgDatabase } from 'drizzle-orm/pg-core';
import { Pool, type PoolConfig } from 'pg';
import * as schema from './schema';

export function createDb(
  connectionString: string,
  pool: Omit<PoolConfig, 'connectionString'> = {},
) {
  const client = new Pool({ connectionString, ...pool });
  const db = drizzle({ client, schema, casing: 'snake_case' });
  return { db, close: () => client.end() };
}

/**
 * Ce primesc funcțiile de serviciu: pool-ul sau o tranzacție deschisă.
 * Tipul de bază comun permite apelantului (sau testului) să ruleze serviciul într-o tranzacție.
 */
export type Db = PgDatabase<NodePgQueryResultHKT, typeof schema>;
