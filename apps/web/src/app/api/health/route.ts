import { connection } from 'next/server';

// Monitor de uptime (docs/infrastructure.md). `connection()` forțează execuția la request, nu la build.
export async function GET() {
  await connection();
  return Response.json({ ok: true });
}
