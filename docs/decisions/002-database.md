# ADR-002: PostgreSQL (Neon) + Drizzle; logica de business în Node, integritatea în DB

## Status

Accepted — 2026-10-10

## Context

- Date puternic relaționale: produse, atribute, reguli de compatibilitate, furnizori, comenzi, plăți, facturi.
- Comenzile și plățile au nevoie de tranzacții.
- Cerință: logica de business stă în Node, nu în baza de date (fără proceduri stocate, fără triggere de business).
- Avem nevoie de o coadă de joburi pentru worker; regula din bootstrap e să nu adăugăm o a doua bază de date fără motiv.
- Căutarea în catalog trebuie să ignore diacriticele („surub” → „șurub”).

## Decizie

**PostgreSQL pe Neon, regiune UE, cu Drizzle ORM.**

Granița dintre aplicație și DB:

| În Node (pachete)                                                                           | În DB                                                                                                         |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Reguli de business, calcul compatibilitate, calcul de preț (adaos), orchestrarea comenzilor | `FOREIGN KEY`, `UNIQUE`, `NOT NULL`, `CHECK (price_minor > 0)`                                                |
| Normalizarea atributelor din feed-uri                                                       | Tranzacții (crearea comenzii e atomică)                                                                       |
| Validare (Zod)                                                                              | Update-uri atomice condiționate (`UPDATE ... WHERE status = 'pending'`) în locul pattern-ului read-then-write |
|                                                                                             | Indexuri                                                                                                      |

Asta nu e „logică în DB”: sunt garanții de integritate pe care aplicația nu le poate oferi corect sub concurență.

Convenții:

- **Bani în unități minore** (`integer`, bani RON), niciodată `float`/`numeric` în cod. Coloane `*_minor`.
- **Migrații versionate**: `drizzle-kit generate` → fișiere SQL comise în git → `drizzle-kit migrate` în CI/deploy. `drizzle-kit push` doar local, niciodată în producție.
- **Căutare**: Postgres FTS cu extensia `unaccent` și configurație `simple` (nu există stemmer românesc built-in). Index `GIN` pe `tsvector`. Fallback cu `pg_trgm` pentru typo-uri.
- **Coadă**: `pg-boss`, în același Postgres. Fără Redis.
- **Un singur proiect Neon pentru aplicație, cu medii ca branch-uri** (`main` = producție, `dev`, preview-uri), nu câte un proiect per mediu. Branch-urile pornesc din producție și se folosesc pentru teste pe date reale anonimizate.
- **Limitele Neon Free** (verificate pe 2026-10-11): 100 de proiecte/organizație, 10 branch-uri/proiect, 1 GB stocare/proiect (20 GB total pe cont), 100 CU-ore/proiect/lună, PITR de **6 ore**, scale-to-zero după 5 minute (obligatoriu).
- **Backup**:
  - Până la lansare: Neon Free + `pg_dump` zilnic în R2, făcut de un job programat în worker.
  - La go-live: trecere pe Neon Launch (plătești doar cât folosești, fără minim lunar), pentru PITR mai lung. Un istoric de 6 ore e prea scurt pentru comenzi și plăți reale.
  - Dump-ul în R2 rămâne și după upgrade, ca backup independent de furnizor. Restaurarea se testează o dată înainte de go-live.

## Alternativele considerate

- **Prisma** — schemă într-un DSL separat și pas de generare a clientului; mai puțin control pe SQL complex. Interogările de compatibilitate (join-uri pe atribute) sunt mai naturale în Drizzle, care e aproape de SQL și TS-nativ.
- **Supabase** — aduce auth, RLS, storage și acces la DB direct din client, adică exact modelul pe care nu-l vrem (logica în Node). Am plăti complexitate pentru funcții nefolosite.
- **MongoDB** — datele sunt relaționale; compatibilitatea e literalmente un join.
- **Redis/BullMQ pentru coadă** — a doua bază de date de operat. pg-boss acoperă volumul nostru (mii de joburi/zi, nu milioane).

## Consecințe

- (+) O singură bază de date de operat, backup-uit și migrat.
- (+) Drizzle dă tipuri TS direct din schemă, partajate de `apps/web` și `apps/worker` prin `packages/db`.
- (−) 1 GB pe Free se poate umple din `product_compatibility` (ambele direcții, la mii de produse) plus catalogul din feed-uri. Monitorizăm dimensiunea după primul import complet; depășirea limitei înseamnă trecerea pe Launch, nu o schimbare de design.
- (−) Neon free tier are scale-to-zero, deci cold start de ~sute de ms la prima cerere după inactivitate. Acceptabil la început; la trafic real trecem pe plan plătit.
- (−) pg-boss pune încărcare pe aceeași DB. Dacă importurile devin grele, primul pas e un pool de conexiuni separat pentru worker, nu Redis.
- (−) FTS fără stemming românesc: „șurub” nu găsește automat „șuruburi”. Compensăm cu `pg_trgm` și, la nevoie, cu sinonime manuale.
