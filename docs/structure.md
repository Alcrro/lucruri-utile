# Structura codului

Monorepo pnpm + Turborepo (ADR-005). Scope-ul pachetelor: `@lu/*`.

```
lucruri-utile/
├─ apps/
│  ├─ web/                    Next.js (App Router), storefront + /admin
│  │  └─ src/
│  │     ├─ app/
│  │     │  ├─ (shop)/        storefront: categorii, produs, dispozitive, coș
│  │     │  ├─ (account)/     cont client
│  │     │  ├─ (admin)/admin/ panou admin
│  │     │  └─ api/           doar apelanți externi: auth, webhooks, health
│  │     ├─ components/       atomic design
│  │     │  ├─ ui/            primitive shadcn (generate, nu se editează de mână)
│  │     │  ├─ atoms/
│  │     │  ├─ molecules/
│  │     │  ├─ organisms/
│  │     │  └─ templates/
│  │     ├─ hooks/            hook-uri React (logică de UI, fără apeluri la servicii)
│  │     ├─ actions/          server actions: Zod → auth/rol → serviciu din @lu/*
│  │     ├─ lib/              config specifică web (auth, env, formatare)
│  │     └─ config/
│  └─ worker/                 Node, consumă pg-boss
│     └─ src/
│        ├─ jobs/             un fișier per tip de job; doar orchestrare, logica e în pachete
│        ├─ env.ts            variabile de mediu validate cu Zod
│        └─ index.ts          pornire, înregistrare joburi, health, oprire grațioasă
├─ packages/
│  ├─ db/                     schemă Drizzle, migrații, client, nume de cozi
│  ├─ catalog/                produse, categorii, atribute, dispozitive, căutare
│  ├─ compatibility/          motorul de reguli, excepții, recalcul
│  ├─ suppliers/              pipeline de import, adaptoare, fixture-uri de feed
│  ├─ orders/                 coș, comenzi, mașina de stări
│  ├─ payments/               Stripe: sesiuni, webhook-uri, capture, cancel, refund
│  ├─ invoicing/              SmartBill/Oblio
│  └─ config/                 tsconfig și ESLint partajate
├─ docs/
├─ docker-compose.yml         Postgres local pentru dev și teste
├─ turbo.json
└─ pnpm-workspace.yaml
```

## Convenții

**Pachetele de domeniu**

- Expun un API public doar prin `src/index.ts` (câmpul `exports` din `package.json`). Fără deep imports între pachete.
- Fără `next`, `react` sau `server-only` (regulă ESLint).
- Funcțiile de serviciu primesc dependențele explicit (`db`, clienți externi) ca prim argument sau prin factory, ca să fie testabile și apelabile din orice transport.
- `db: Db` (din `@lu/db`) acceptă atât pool-ul, cât și o tranzacție deschisă. Apelantul decide granița tranzacției; testele rulează serviciul într-o tranzacție anulată la final.
- Validarea la graniță (Zod) e în pachet: schemele de input se exportă, iar web-ul le refolosește în formulare.

**Baza de date**

- Tabele și coloane în `snake_case`, chei TS în `camelCase` (`casing: 'snake_case'` în Drizzle).
- Bani: `integer`, coloane `*_minor` (bani RON).
- ID-uri: `uuid` generat în aplicație (v7, ordonat în timp) pentru entitățile expuse în URL-uri sau către clienți; `slug` separat pentru URL-urile publice.
- Orice tabelă are `created_at`; tabelele editabile au și `updated_at`.

**Web**

- Componentele nu apelează servicii. Doar paginile și layout-urile (RSC) și server actions o fac.
- Hook-urile sunt separate de componente (`hooks/useX.ts`) și conțin doar logică de UI.
- Textele UI sunt în română, direct în componente (fără i18n: doar RO, conform PRD). Sumele se formatează cu `formatRon()` din `lib/format.ts`.

**Teste**

| Tip                      | Unde                         | Unealtă                      | Rulare          |
| ------------------------ | ---------------------------- | ---------------------------- | --------------- |
| Unit                     | lângă cod, `x.test.ts`       | Vitest (proiectul `unit`)    | `pnpm test`     |
| Integrare (Postgres)     | lângă cod, `x.int.test.ts`   | Vitest (`integration`)       | `pnpm test`     |
| Componente / hook-uri UI | `apps/web/src/**/x.test.tsx` | Vitest + Testing Library     | `pnpm test`     |
| E2E                      | `apps/web/e2e/*.spec.ts`     | Playwright (mobil + desktop) | `pnpm test:e2e` |

- **Integrare pe Postgres real**, fără mock-uri de DB. Fiecare pachet are baza lui (`<db>_test_<pachet>`), recreată și migrată la fiecare rulare de `@lu/db/testing/global-setup`. Rulează doar pe un Postgres local (`pnpm db:up` sau containerul din CI).
- Fixture-ul `db` din `@lu/db/testing` dă o tranzacție anulată după fiecare test: testele sunt izolate și rulează în paralel. Pentru commit-uri reale (concurență, pg-boss): `testDb` sau `testDatabaseUrl()`, iar testul își curăță singur datele.
- `@lu/<pachet>/testing` e singurul deep import permis, și doar din fișierele `*.test.ts` (ESLint).
- **Web**: componentele sincrone se testează cu Vitest; componentele async (RSC) și fluxurile întregi doar în E2E (Vitest nu randează async Server Components). Server actions și route handlers: Vitest cu `// @vitest-environment node` în antetul fișierului.
- **E2E** rulează pe build-ul de producție (`server.js` din `output: 'standalone'`), pe portul 3100, nu pe dev server.
- Obligatorii: motorul de compatibilitate, parsarea fitment-ului, normalizarea atributelor, circuit breaker-ul de import, mașina de stări a comenzii, handler-ele de webhook (idempotență).
