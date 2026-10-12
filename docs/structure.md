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
│  │     ├─ components/       atomic design (regulile mai jos, la Web)
│  │     │  ├─ ui/            primitive shadcn (generate, nu se editează de mână)
│  │     │  ├─ atoms/         fără cunoștințe de domeniu
│  │     │  ├─ molecules/     fără cunoștințe de domeniu
│  │     │  ├─ organisms/     de domeniu, grupate pe domeniu: organisms/<domeniu>/
│  │     │  └─ templates/     layout-uri de pagină, fără date
│  │     ├─ hooks/            hook-uri React (logică de UI, fără apeluri la servicii)
│  │     ├─ actions/          server actions: Zod → auth/rol → serviciu din @lu/*
│  │     ├─ lib/              config specifică web (auth, env, formatare)
│  │     └─ config/
│  └─ worker/                 Node, consumă pg-boss
│     └─ src/
│        ├─ jobs/             un fișier per coadă (supplier-import.ts); doar orchestrare, logica e în pachete
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

Regulile marcate cu **(ESLint)** sunt impuse automat; restul se verifică la review.

### Pachetele de domeniu (ADR-011)

```
packages/compatibility/src/
├─ index.ts                     singurul API public: exportă serviciile, schemele, tipurile, erorile
├─ errors.ts                    erori de domeniu tipate
├─ rules/
│  ├─ evaluate-rule.ts          PUR: (atribute dispozitiv, atribute produs, regulă) → verdict
│  ├─ evaluate-rule.test.ts
│  └─ rules.schemas.ts          Zod: input pentru admin, refolosit în formularele din web
└─ recompute/
   ├─ recompute.service.ts      use case: tranzacție → citește → evaluează → scrie
   ├─ recompute.queries.ts      Drizzle: citiri și scrieri, fără decizii de business
   └─ recompute.int.test.ts
```

| Fișier                          | Conține                                                                | Poate importa la runtime                          |
| ------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------- |
| fără sufix (`evaluate-rule.ts`) | logică pură: reguli, calcule, tranziții de stare                       | **nu** `@lu/db`, `drizzle-orm`, `pg` **(ESLint)** |
| `*.queries.ts`                  | acces la date, returnează tipuri de domeniu                            | Drizzle, `@lu/db`                                 |
| `*.service.ts`                  | use case-uri `(deps, input) → rezultat`                                | tot ce e în pachet                                |
| `*.schemas.ts`                  | scheme Zod + tipurile de input deduse (`z.infer`)                      | `zod`                                             |
| `ports.ts` + `adapters/*.ts`    | doar pentru servicii externe (furnizori, facturare, Stripe, email, R2) | SDK-ul extern, doar în adapter                    |
| `errors.ts`                     | `class XError extends DomainError` cu `code` stabil                    | —                                                 |

- API public doar prin `src/index.ts` (câmpul `exports`). Fără deep imports între pachete și fără `next`, `react`, `server-only` **(ESLint)**.
- Organizare pe feature-uri, nu pe straturi. Fără repository interfaces, mapper-e sau entități-clasă peste Drizzle: datele sunt obiecte simple, comportamentul e în funcții pure.
- Serviciile primesc dependențele explicit, ca prim argument (`deps: { db: Db; … }`) sau prin factory. Fără singletoni importați.
- **Tranzacții**: serviciul își deschide tranzacția de care are nevoie. `db: Db` acceptă pool-ul sau o tranzacție; apelat cu o tranzacție deja deschisă, serviciul primește un savepoint, deci serviciile se compun. Testele rulează serviciul într-o tranzacție anulată la final.
- **Erori**: pachetele aruncă erori de domeniu. Server actions le prind și returnează `{ ok: false, code, message }`; erorile neprevăzute nu se prind și ajung în Sentry. Joburile lasă erorile la pg-boss (retry).
- Validarea la graniță (Zod) e în pachet; schemele se exportă, iar web-ul le refolosește în formulare.

### Denumiri

| Ce                    | Convenție                                                                      | Exemplu                                     |
| --------------------- | ------------------------------------------------------------------------------ | ------------------------------------------- |
| fișiere și foldere    | **kebab-case peste tot**, inclusiv componente și hook-uri **(ESLint)**         | `price-tag.tsx`, `use-active-device.ts`     |
| rute Next             | kebab-case + convențiile App Router: `(grup)`, `[param]`, `_privat`            | `app/(shop)/dispozitive/[slug]/`            |
| componente / hook-uri | export PascalCase / `useX`                                                     | `PriceTag`, `useActiveDevice`               |
| exporturi             | doar named exports **(ESLint)**; `default` doar unde îl cere Next sau un tool  | `page.tsx`, `layout.tsx`, `*.config.ts`     |
| barrel files          | interzise, cu excepția `src/index.ts` al pachetului                            |                                             |
| tipuri                | `interface` pentru obiecte, `type` pentru uniuni și alias-uri; fără prefix `I` | `interface PriceTagProps`                   |
| funcții de citire     | `find*` → `T \| undefined`; `get*` → aruncă `NotFoundError`; `list*` → array   | `getDeviceBySlug`, `listCompatibleProducts` |
| constante de modul    | `SCREAMING_SNAKE_CASE`                                                         | `QUEUES`, `FREE_SHIPPING_THRESHOLD_MINOR`   |
| boolean-uri           | `is*` / `has*` / `can*`                                                        | `isPublished`, `hasPps`                     |

**Limbă**: identificatorii și numele de fișiere sunt în engleză. Textele UI, comentariile și documentația sunt în română. URL-urile publice sunt în română (`/dispozitive`, `/produse`, `/cos`, `/cont`).

### Baza de date

- Tabele și coloane în `snake_case`, chei TS în `camelCase` (`casing: 'snake_case'` în Drizzle).
- Bani: `integer`, coloane `*_minor` (bani RON).
- ID-uri: `uuid` generat în aplicație (v7, ordonat în timp) pentru entitățile expuse în URL-uri sau către clienți; `slug` separat pentru URL-urile publice.
- Orice tabelă are `created_at`; tabelele editabile au și `updated_at`.

### Web

- Componentele nu apelează servicii. Doar paginile și layout-urile (RSC) și server actions o fac, prin `db` din `lib/db.ts` (cu `import 'server-only'`).
- **Atomic design, cu granițe obiective:**
  - `ui/`, `atoms/`, `molecules/` nu știu nimic de domeniu: primesc primitive (`label`, `priceMinor`, `status`), niciodată `Product` sau `Device`;
  - `organisms/` știu de domeniu și sunt grupate pe domeniu (`organisms/compatibility/compatibility-panel.tsx`);
  - `templates/` sunt layout-uri de pagină, fără date.
- O componentă folosită într-o singură rută stă lângă ea, în `app/…/_components/`. Se mută în `components/` la a doua folosire.
- Un fișier per componentă, cu testul alături (`price-tag.tsx`, `price-tag.test.tsx`). Folder doar când componenta are sub-componente proprii.
- Hook-urile sunt separate de componente (`hooks/use-x.ts`) și conțin doar logică de UI.
- Server actions: `actions/<domeniu>.ts`, ordinea fixă Zod → auth/rol → serviciu din `@lu/*` → `ActionResult`.
- Textele UI sunt în română, direct în componente (fără i18n: doar RO, conform PRD). Sumele se formatează cu `formatRon()` din `lib/format.ts`.

### Worker

- `jobs/<coada>.ts` exportă un handler `(deps) => (jobs) => …`. Handler-ul doar orchestrează: logica stă în pachetul de domeniu.
- Înregistrarea handler-elor, health check-ul și oprirea grațioasă sunt în `index.ts`.

### Teste

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
