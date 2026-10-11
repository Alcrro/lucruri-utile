import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.url(),
  WORKER_PORT: z.coerce.number().int().positive().default(8080),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Variabile de mediu invalide:', z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
