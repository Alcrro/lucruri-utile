---
name: lu-spec
description: Scrie tech-spec-ul și checkpoint-urile pentru un feature lucruri-utile în docs/features/<feature>/, pornind de la PRD, ADR-uri și codul existent. Se rulează înainte de /lu-implement.
argument-hint: <feature-slug> [secțiune PRD, ex. 5.2]
disable-model-invocation: true
---

# Spec: $ARGUMENTS

Produci două fișiere: `docs/features/<feature>/tech-spec.md` și `docs/features/<feature>/todos.md`. Nu scrii cod.

## 1. Context — citește tot înainte de orice întrebare

1. `CLAUDE.md` (regulile nenegociabile) și `docs/structure.md` (convenții).
2. `docs/prd.md` — secțiunea feature-ului. Acceptance criteria de acolo sunt sursa de adevăr: **le referi** (`PRD §5.2`), nu le copiezi.
3. `docs/architecture.md` — fluxurile și graful de dependențe între pachete.
4. `docs/decisions/` — titlurile tuturor ADR-urilor, apoi integral pe cele care ating feature-ul.
5. `packages/db/src/schema/` — ce tabele există deja.
6. `src/index.ts` al fiecărui pachet `@lu/*` implicat — API-ul public existent.
7. `docs/features/<feature>/` dacă există — **actualizezi**, nu rescrii de la zero.

## 2. Întrebări — un singur mesaj, înainte să scrii

- Ce nu se poate deduce din docs: reguli de business, praguri, edge cases, texte vizibile clientului.
- Contradicții sau goluri în PRD/ADR: spune-le explicit și propune rezolvarea (modificare de PRD sau `/lu-adr`). Nu le ocoli în spec.
- Nu inventa răspunsuri și nu prezenta exemple ca decizii luate. Fără răspuns → rămâne în „Întrebări deschise” și blochează CP-urile care depind de el.

## 3. `tech-spec.md`

```markdown
# <Feature> — Tech spec

> PRD: §x.y · ADR: 00a, 00b · Status: draft | aprobat — <data>

## Scop

Ce livrează feature-ul, în 2-3 propoziții. **Nu intră:** <listă explicită>.

## Model de date

Tabele/coloane noi sau modificate, descrise în termeni Drizzle (nu SQL): tipuri, FK + `onDelete`,
constrângeri `check`, indexuri și motivul lor. Migrare de date, dacă există rânduri afectate.

## Pachete (structura din ADR-011)

Pentru fiecare `@lu/<pachet>`, pe feature-uri:

- **Logică pură** (fișiere fără sufix): funcțiile și tipurile lor; aici stau regulile de business.
- **`*.queries.ts`**: ce citește și ce scrie, cu indexurile pe care se bazează.
- **`*.service.ts`**: use case-urile exportate, cu semnătura completă (`deps` explicite), granița tranzacției și ce erori aruncă.
- **`*.schemas.ts`**: schemele Zod de input, refolosite în web.
- **`ports.ts` / `adapters/`**: doar dacă feature-ul atinge un serviciu extern.
- **`errors.ts`**: erorile noi, cu `code`.

Fișierele noi se listează cu calea completă, kebab-case.

## Puncte de intrare

- **Pagini RSC**: ruta, ce citesc, ce e static vs. la request (cacheComponents).
- **Server actions**: schema de input → rolul cerut → funcția din `@lu/*` apelată.
- **Joburi pg-boss**: coada (`QUEUES`), payload-ul, cheia de idempotență, politica de retry.
- **Webhook-uri / API routes**: doar pentru apelanți externi.

## Flux

Pas cu pas, cu granițele tranzacțiilor și ce se întâmplă la eșec după fiecare pas.

## Edge cases

| Caz | Comportament |
| --- | ------------ |

## Teste

- **Unit**: logica pură (reguli, parsare, mașini de stări).
- **Integrare (Postgres real)**: interogări, constrângeri, idempotență.
- **E2E (Playwright)**: doar fluxurile de cumpărare și paginile async RSC.
  Numește cazurile obligatorii, nu doar categoriile.

## Decizii locale

Decizii mici, valabile doar în feature. Dacă una e greu de schimbat ulterior → ADR (`/lu-adr`).

## Întrebări deschise
```

## 4. `todos.md`

Ordinea checkpoint-urilor: **schemă → logică pură + teste unit → queries + service + teste de integrare → punctul de intrare (job / action) → UI → E2E**. Fiecare CP e o unitate logică ce poate fi verificată singură.

```markdown
# <Feature> — Checkpoints

- [ ] **CP1 — <titlu>**
  - Fișiere: `packages/db/src/schema/x.ts`, …
  - Gata când: `pnpm --filter @lu/db test` trece; `pnpm db:generate` → „No schema changes”
- [ ] **CP2 — …**
```

„Gata când” trebuie să fie verificabil cu o comandă sau cu teste numite, nu „funcționează”.

## 5. Final

Prezintă un rezumat de 5-10 rânduri: ce tabele, ce pachete, câte CP-uri, ce întrebări au rămas deschise. Spec-ul rămâne `draft` până când utilizatorul îl aprobă explicit. Abia atunci schimbi statusul în `aprobat`.
