# Infrastructură

Decizia de hosting: ADR-004. Baza de date: ADR-002. Plăți: ADR-010.

## Medii

| Mediu     | Web                                     | Worker         | Postgres                     | Stripe                      |
| --------- | --------------------------------------- | -------------- | ---------------------------- | --------------------------- |
| Local     | `pnpm dev`                              | `pnpm dev`     | docker-compose (Postgres 17) | test mode + `stripe listen` |
| Preview   | Vercel preview (per PR)                 | — (nu rulează) | Neon branch `preview`        | test mode                   |
| Producție | Vercel (Hobby → Pro/Railway la lansare) | Railway        | Neon `main`                  | live mode                   |

Preview-urile nu au worker, deci importurile și plățile se testează local. Asta e suficient pentru Faza 1.

## Variabile de mediu

Sursa de adevăr: `.env.example` din rădăcină. Fiecare aplicație le validează cu Zod la pornire și refuză să pornească dacă lipsește ceva.

| Variabilă                                                                   | web | worker | Descriere                                                                                            |
| --------------------------------------------------------------------------- | --- | ------ | ---------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                              | ✓   | ✓      | Postgres. Pe Neon: varianta **pooled** (`-pooler`) pentru web; cea directă pentru worker și migrații |
| `APP_URL`                                                                   | ✓   | ✓      | URL public (link-uri în emailuri, redirect-uri Stripe și OAuth)                                      |
| `BETTER_AUTH_SECRET`                                                        | ✓   |        | Secretul pentru semnarea sesiunilor                                                                  |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`                                 | ✓   |        | OAuth                                                                                                |
| `STRIPE_API_KEY`                                                            | ✓   | ✓      | **Restricted key** (`rk_`), diferită per proces (ADR-010)                                            |
| `STRIPE_WEBHOOK_SECRET`                                                     | ✓   |        | Semnătura webhook-ului                                                                               |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` | ✓   | ✓      | Imagini, feed-uri brute, backup-uri                                                                  |
| `R2_PUBLIC_URL`                                                             | ✓   |        | Domeniul public al imaginilor                                                                        |
| `RESEND_API_KEY` / `EMAIL_FROM`                                             |     | ✓      | Emailurile pleacă doar din worker                                                                    |
| `INVOICING_PROVIDER` / `INVOICING_API_KEY`                                  |     | ✓      | SmartBill sau Oblio                                                                                  |
| `SENTRY_DSN`                                                                | ✓   | ✓      |                                                                                                      |

## Secrete

- Niciodată în git: `.env*` e în `.gitignore`, cu excepția `.env.example`.
- Producție: variabile de mediu pe Vercel și Railway. Cheile de test și cele live sunt doar în mediile corespunzătoare.
- Rotire: cheile Stripe și secretul de auth se rotesc la orice suspiciune de scurgere.

## CI (GitHub Actions)

La fiecare PR:

1. `pnpm install --frozen-lockfile`
2. `pnpm lint` · `pnpm typecheck`
3. Verificarea că migrațiile generate sunt comise (`drizzle-kit generate` nu produce diferențe) și că se aplică pe o bază goală
4. `pnpm test` (unit + integrare, cu un container de Postgres)
5. `pnpm build`
6. `pnpm test:e2e` (Playwright, Chromium, pe build-ul standalone). La eșec, raportul se urcă ca artefact.

La merge în `main`:

1. `pnpm db:migrate` pe producție (conexiune directă Neon)
2. Vercel și Railway fac deploy automat din `main`

## Backup (ADR-002)

- Neon PITR: 6 ore pe Free, mai mult pe Launch.
- Job `db.backup` zilnic în worker: `pg_dump` comprimat → R2 (`backups/YYYY-MM-DD.sql.gz`), retenție 30 de zile.
- Restaurarea se testează înainte de lansare și după fiecare schimbare majoră de schemă.

## Monitorizare

- Sentry pe web și worker, cu source maps.
- Alerte (email către admin, din worker):
  - import oprit de circuit breaker;
  - comenzi `authorized` mai vechi de 4 zile;
  - joburi eșuate de 3 ori;
  - backup eșuat.
- Uptime: un monitor extern pe `/api/health` (web) și pe health check-ul worker-ului.
