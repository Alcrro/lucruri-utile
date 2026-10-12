# ADR-011: Structura internă a modulelor — pe feature-uri, logică pură separată de I/O, ports doar la servicii externe

## Status

Accepted — 2026-10-12

## Context

- ADR-001 și ADR-005 au fixat granițele mari: pachete de domeniu `@lu/*` independente de framework, fără API HTTP separat, apelate din RSC, server actions și joburi.
- Nu era stabilit cum arată codul **în interiorul** unui pachet: ce tipuri de fișiere există, ce are voie să importe fiecare, unde stă tranzacția, cum circulă erorile.
- Testele rulează pe Postgres real (`docs/structure.md` → Teste), iar ADR-002 folosește intenționat funcții specifice Postgres (`pg_trgm`, `unaccent`, indexuri parțiale, compatibilitate materializată).
- Dezvoltator unic: fiecare strat de abstracție se plătește în cod scris și întreținut de o singură persoană.
- Logica cu cel mai mare risc (motorul de compatibilitate, mașina de stări a comenzii, parsarea fitment-ului, circuit breaker-ul) trebuie testată exhaustiv, deci rapid și fără I/O.

## Decizie

### Organizare pe feature-uri, cu rolul fișierului în sufix

Pachetul e deja granița de domeniu. În interiorul lui, codul se grupează pe feature-uri (`rules/`, `recompute/`), nu pe straturi (`domain/`, `application/`, `infrastructure/`).

| Fișier                          | Rol                                                                   | Importuri permise la runtime       |
| ------------------------------- | --------------------------------------------------------------------- | ---------------------------------- |
| fără sufix (`evaluate-rule.ts`) | **logică pură**: reguli, calcule, tranziții de stare                  | fără `@lu/db`, `drizzle-orm`, `pg` |
| `*.queries.ts`                  | acces la date; fără decizii de business; returnează tipuri de domeniu | Drizzle, `@lu/db`                  |
| `*.service.ts`                  | use case-uri publice `(deps, input) → rezultat`                       | tot ce e în pachet                 |
| `*.schemas.ts`                  | scheme Zod pentru input + tipurile deduse                             | `zod`                              |
| `ports.ts`, `adapters/*.ts`     | interfața unui serviciu extern și implementările ei                   | SDK-ul extern, doar în adapter     |
| `errors.ts`                     | erori de domeniu tipate                                               | —                                  |

Regula de puritate se impune cu ESLint (`@typescript-eslint/no-restricted-imports` cu `allowTypeImports`). Excepție: `@lu/db`, care e chiar stratul de date.

### Use case-uri și tranzacții

- Funcțiile `*.service.ts` exportate din `src/index.ts` sunt singurul punct de intrare în domeniu pentru web și worker.
- Serviciul validează inputul (Zod), deschide tranzacția de care are nevoie și combină queries cu logica pură.
- `db: Db` acceptă pool-ul sau o tranzacție. Un serviciu apelat cu o tranzacție deja deschisă primește un savepoint, deci serviciile se pot compune fără să știe unul de altul.

### Fără repository ports peste Drizzle

Query-urile se scriu direct cu Drizzle, în `*.queries.ts`. Fără interfețe de repository, mapper-e sau entități-clasă: datele sunt obiecte simple tipate, iar comportamentul stă în funcții pure.

### Ports & adapters doar pentru servicii externe

Interfețe (`ports.ts`) doar unde există implementări multiple sau un fake e necesar în teste: adaptoarele de furnizor (ADR-009), facturarea (SmartBill / Oblio), Stripe, email, stocarea în R2. Adaptorul primește clientul SDK prin dependențe, iar testele folosesc un fake care implementează portul.

### Erori

- Pachetele aruncă erori de domeniu: `class XError extends DomainError` cu un `code` stabil (`'device_not_found'`).
- Server actions le prind și returnează `{ ok: false, code, message }`, un obiect serializabil afișat în formular. Erorile neprevăzute nu se prind: ajung în Sentry.
- Joburile lasă erorile să ajungă la pg-boss, care aplică politica de retry a cozii.

## Alternativele considerate

- **Clean architecture clasică** (entități, use cases, repository ports, DI container) — repository interfaces aduc două beneficii: schimbarea bazei de date și mock-uri în teste. Niciunul nu se aplică: ADR-002 ne leagă intenționat de Postgres, iar testele rulează pe Postgres real. Fiecare query s-ar scrie de două ori, iar entitățile-clasă ar cere mapper-e în ambele sensuri.
- **Straturi ca foldere** (`domain/`, `application/`, `infrastructure/`) — un use case ajunge împrăștiat în trei foldere. Pachetul e deja bounded context-ul; încă un nivel nu adaugă izolare.
- **Fără nicio regulă internă** — logica de business ajunge amestecată cu query-urile și nu mai poate fi testată fără bază de date, exact acolo unde testele contează cel mai mult.

## Consecințe

- Logica pură se testează unitar, în milisecunde. Query-urile și serviciile se testează pe Postgres real.
- Schimbarea Postgres cu altă bază ar cere rescrierea tuturor fișierelor `*.queries.ts`. E un cost acceptat (ADR-002).
- Un serviciu extern nou înseamnă un port + un adapter + un fake pentru teste.
- Se revizuiește dacă apare un al doilea client care nu poate apela pachetele direct (mobil, API public, ADR-001), sau dacă un pachet ajunge atât de mare încât un feature nu mai încape într-un folder.
