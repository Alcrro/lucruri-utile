---
name: lu-package
description: Creează un pachet de domeniu nou @lu/<nume> în packages/, cu configul standard (exports, tsconfig, ESLint de domeniu, Vitest). Folosește-l când un feature are nevoie de un pachet care nu există încă.
argument-hint: <nume>
---

# Pachet nou: @lu/$ARGUMENTS

## 1. Verificări înainte

- Pachetul e listat în `docs/structure.md`? Dacă nu: e un modul nou de domeniu și trebuie justificat (actualizezi `structure.md` și graful din `docs/architecture.md`, cu acordul utilizatorului).
- Dependențele lui respectă graful din `docs/architecture.md` (săgețile permise, fără cicluri)? O săgeată nouă = decizie de arhitectură → întreabă.
- Nu crea pachete goale „pentru mai târziu”. Pachetul apare când are primul cod real.

## 2. Fișiere

`packages/$ARGUMENTS/package.json`

```json
{
  "name": "@lu/$ARGUMENTS",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "lint": "eslint .",
    "typecheck": "tsc",
    "test": "vitest run"
  },
  "dependencies": {
    "@lu/db": "workspace:*"
  },
  "devDependencies": {
    "@lu/config": "workspace:*"
  }
}
```

Dev dependencies (`@types/node`, `eslint`, `typescript`, `vitest`) se adaugă cu `pnpm add -D --filter @lu/$ARGUMENTS`, la aceleași versiuni ca în `packages/db/package.json`. Nu copia versiuni din memorie.

`packages/$ARGUMENTS/tsconfig.json`

```json
{
  "extends": "@lu/config/tsconfig.base.json",
  "include": ["src", "vitest.config.ts"]
}
```

`packages/$ARGUMENTS/eslint.config.js`

```js
export { default } from '@lu/config/eslint/domain';
```

`packages/$ARGUMENTS/vitest.config.ts`: copiază varianta din `packages/db/vitest.config.ts`. Fără teste pe DB: doar `unit`. Cu teste pe DB: și proiectul `integration`, cu `globalSetup` din `@lu/db/testing/global-setup`.

`packages/$ARGUMENTS/src/index.ts`: singurul API public. Exportă explicit serviciile, schemele, tipurile și erorile (`export { recomputeCompatibility } from './recompute/recompute.service'`), fără `export *` și fără să expună `*.queries.ts`.

`packages/$ARGUMENTS/src/errors.ts`: erorile de domeniu ale pachetului, `class XError extends DomainError` cu `code` stabil.

## 3. Conectare

1. `pnpm install` din rădăcină.
2. Consumatorii (`apps/web`, `apps/worker`, alte pachete permise) primesc `"@lu/$ARGUMENTS": "workspace:*"`.
3. `apps/web` transpilează pachetele interne. Verifică în `next.config.ts` dacă e nevoie de `transpilePackages` (citește ghidul din `node_modules/next/dist/docs/`).
4. Verificare: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.

## 4. Structura internă (ADR-011, `docs/structure.md`)

- Foldere pe feature-uri (`rules/`, `recompute/`), nu pe straturi. Fișiere și foldere kebab-case, doar named exports (ESLint).
- Rolul fișierului e în sufix: fără sufix = logică pură; `*.queries.ts` = acces la date; `*.service.ts` = use case-uri; `*.schemas.ts` = Zod; `ports.ts` + `adapters/` doar pentru servicii externe.
- `@lu/db`, `drizzle-orm` și `pg` se importă la runtime doar în `*.queries.ts` (ESLint). În rest: `import type`, plus `QUEUES` pentru publicarea joburilor.
- Fără repository interfaces, mapper-e sau entități-clasă peste Drizzle.
- Serviciile primesc dependențele explicit (`(deps: { db: Db; … }, input)`) și își deschid singure tranzacția.
- Teste lângă cod: `x.test.ts` pentru logica pură, `x.int.test.ts` pentru queries și servicii, pe Postgres real.
