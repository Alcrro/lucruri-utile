import { createServer } from 'node:http';
import { QUEUES } from '@lu/db';
import { PgBoss } from 'pg-boss';
import { env } from './env';
import { ensureQueues } from './queues';

const boss = new PgBoss({ connectionString: env.DATABASE_URL, schema: 'pgboss' });
boss.on('error', (err) => console.error('[pg-boss]', err));

await boss.start();
await ensureQueues(boss);

let shuttingDown = false;

// Health check pentru Railway și monitorul de uptime (docs/infrastructure.md).
const health = createServer((req, res) => {
  const ok = req.url === '/health' && !shuttingDown;
  res.writeHead(ok ? 200 : 503, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ ok }));
}).listen(env.WORKER_PORT);

console.log(`[worker] pornit — ${Object.keys(QUEUES).length} cozi, health pe :${env.WORKER_PORT}`);

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[worker] ${signal} — aștept joburile în curs`);
  await boss.stop({ graceful: true, timeout: 30_000 });
  health.close();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
