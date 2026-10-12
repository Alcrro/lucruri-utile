---
name: lu-schema
description: Fluxul obligatoriu pentru orice modificare a schemei DB în lucruri-utile (Drizzle + migrații generate). Folosește-l de fiecare dată când atingi packages/db/src/schema/ sau packages/db/migrations/.
argument-hint: <descrierea schimbării>
---

# Schimbare de schemă: $ARGUMENTS

Schema se schimbă **doar** prin `packages/db/src/schema/*.ts` + migrație generată. Niciodată SQL scris de mână pe o bază, niciodată `drizzle-kit push`.

## 1. Convenții — verifică fiecare punct

- [ ] ID: `id()` din `columns.ts` (UUID v7 generat în aplicație). Pentru entitățile din URL-uri publice: și un `slug` unic.
- [ ] `createdAt()` pe orice tabelă; `updatedAt()` pe tabelele editabile.
- [ ] Bani: `integer`, coloană `*_minor` (bani RON). Cote: `*_bps`. **Niciodată** `numeric`/`real` pentru bani.
- [ ] Chei TS în `camelCase`; numele SQL sunt generate în `snake_case` (`casing: 'snake_case'`).
- [ ] FK cu `onDelete` explicit (`restrict` implicit pentru date de business, `cascade` doar pentru copii fără sens propriu).
- [ ] Invarianții de integritate în DB (ADR-002): `check`, `unique`, FK. Regulile de business rămân în Node.
- [ ] Unicitate pe coloane nullable → index parțial cu `.where(...)` (ex. `products_ean_unique` din `catalog.ts`) sau `.nullsNotDistinct()`, după caz.
- [ ] Index pe FK-urile folosite în filtre/join-uri. Fără indexuri „just in case”.
- [ ] Enum-uri: `pgEnum`. Adăugarea unei valori e ok; ștergerea/redenumirea cere migrare în mai mulți pași.
- [ ] Tabela e exportată din `src/schema/index.ts`.
- [ ] Comentariu JSDoc de un rând pe tabelă/coloană când motivul nu e evident (cu ADR-ul relevant).

## 2. Pași

```bash
pnpm db:up                                   # Postgres local pe :5433
pnpm db:generate --name <descriere_snake>    # ex. add_orders
```

Citește SQL-ul generat din `packages/db/migrations/`. **Oprește-te și raportează** dacă apare:

- `DROP TABLE` / `DROP COLUMN` / schimbare de tip pe o coloană cu date;
- `SET NOT NULL` fără default pe o tabelă care poate avea rânduri;
- un rename interpretat ca drop + add (pierdere de date).

Astea cer migrare în mai mulți pași (adaugi → copiezi datele → elimini) sau o decizie explicită.

```bash
pnpm db:migrate                              # aplică pe baza locală
pnpm db:generate --name check                # trebuie să raporteze „No schema changes”
pnpm --filter @lu/db test                    # baza de test se migrează automat în globalSetup
pnpm typecheck
```

## 3. Reguli pentru migrații

- Migrațiile generate se comit împreună cu schimbarea de schemă, în același commit.
- O migrație ajunsă pe `main` **nu se mai editează și nu se șterge**. Corecturile vin într-o migrație nouă.
- O migrație care nu a ajuns pe `main` se poate regenera: `pnpm --filter @lu/db exec drizzle-kit drop`, apoi `db:generate` din nou.
- CI verifică că schema și migrațiile sunt sincronizate și că migrațiile se aplică pe o bază goală.
