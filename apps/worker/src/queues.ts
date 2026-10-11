import { QUEUES } from '@lu/db';
import type { PgBoss } from 'pg-boss';

/**
 * Cozile trebuie să existe înainte ca web-ul să publice în ele (docs/architecture.md).
 * Idempotent: rulează la fiecare pornire a worker-ului.
 */
export async function ensureQueues(boss: PgBoss) {
  for (const name of Object.values(QUEUES)) await boss.createQueue(name);
}
