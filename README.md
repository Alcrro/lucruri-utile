# lucruri-utile.ro

Magazin de accesorii (dropshipping) cu informații de compatibilitate: ce merge cu dispozitivul tău, cât de bine și ce nu merge.

- Ce construim și de ce: [docs/prd.md](docs/prd.md)
- Cum arată sistemul: [docs/architecture.md](docs/architecture.md)
- Deciziile și motivele lor: [docs/decisions/](docs/decisions/)

## Setup local

Cerințe: Node 24 (`nvm use`), pnpm (`npm i -g pnpm`), Docker.

```bash
pnpm install
cp .env.example .env
pnpm db:up          # Postgres 17 local pe :5433
pnpm db:migrate
pnpm dev            # web pe :3000, worker cu health pe :8080
pnpm --filter @lu/web exec playwright install chromium   # o singură dată, pentru E2E
```

## Comenzi

| Comandă                     | Ce face                                 |
| --------------------------- | --------------------------------------- |
| `pnpm dev`                  | web + worker în watch mode              |
| `pnpm build`                | build pentru toate aplicațiile          |
| `pnpm lint` / `typecheck`   | verificări pe tot monorepo-ul           |
| `pnpm test`                 | unit + integrare (cere `pnpm db:up`)    |
| `pnpm test:e2e`             | Playwright pe build-ul de producție     |
| `pnpm db:generate --name x` | generează o migrație din schema Drizzle |
| `pnpm db:migrate`           | aplică migrațiile pe `DATABASE_URL`     |
| `pnpm db:studio`            | Drizzle Studio                          |

## Structură

`apps/web` (Next.js) · `apps/worker` (pg-boss) · `packages/*` (domeniu, independent de framework). Detalii în [docs/structure.md](docs/structure.md).
