# ADR-005: Monorepo pnpm + Turborepo, pachete de domeniu independente de framework

## Status

Accepted — 2026-10-10

## Context

- Două aplicații (`web`, `worker`) care folosesc aceeași logică de business și aceeași schemă de DB.
- Cerință: modulele trebuie să poată fi extrase din Next.js (de ex. montate în Express) fără rescriere.
- Problema npm workspaces: hoisting-ul permite importul de dependențe nedeclarate (phantom dependencies), iar bug-urile apar abia la extragerea modulului.

## Decizie

**pnpm workspaces + Turborepo.** Scope-ul pachetelor: `@lu/*`.

```
apps/
  web/            # Next.js: storefront + /admin + route handlers (Stripe, health)
  worker/         # Node: consumă pg-boss — importuri, sync stoc, comenzi la furnizor
packages/
  db/             # schemă Drizzle + migrații + client (singura sursă de schemă)
  catalog/        # produse, categorii, atribute, normalizare
  compatibility/  # motorul de reguli + excepții (ADR-006)
  suppliers/      # un adaptor per furnizor → format canonic
  orders/         # coș, checkout, comenzi, împărțire pe furnizori
  payments/       # Stripe Checkout + webhook idempotent
  invoicing/      # SmartBill/Oblio → e-Factura
  config/         # tsconfig, eslint, prettier partajate
```

Reguli de dependență:

- Direcția e `apps → pachete de domeniu → db`. Niciodată invers.
- Pachetele de domeniu nu importă `next`, `react` sau orice cod din `apps/*`.
- Un pachet poate depinde de alt pachet de domeniu doar prin API-ul lui public (câmpul `exports` din `package.json`), fără deep imports. Dependențele circulare sunt interzise.
- Pachetele interne sunt consumate ca **sursă TS**, fără pas de build: `transpilePackages` în Next și `tsx` în worker la dev. Worker-ul se bundle-uiește cu `tsup` pentru producție.
- Fiecare pachet își declară explicit dependențele; pnpm blochează restul.

## Alternativele considerate

- **npm workspaces** — merge, dar hoisting-ul ascunde dependențele nedeclarate. Asta subminează direct cerința de module extractibile.
- **Nx** — mai puternic (generatoare, reguli de boundaries built-in), dar mult mai greu de configurat și de înțeles pentru un solo dev. Turborepo face doar caching și orchestrarea task-urilor, ceea ce ne ajunge.
- **O singură aplicație Next.js cu foldere** — granițele dintre module nu sunt impuse de nimic, iar worker-ul ar trebui să importe din aplicația Next.
- **Polyrepo** — versionare și publicare de pachete între repo-uri. Overhead absurd pentru un singur dezvoltator.

## Consecințe

- (+) Extragerea unui modul e reală, nu teoretică: dependențele lui sunt deja explicite.
- (+) `pnpm --filter @lu/worker...` rulează sau testează doar ce e afectat.
- (−) Setup inițial mai lung (tsconfig-uri partajate, configurare ESLint per pachet).
- (−) Pachetele consumate ca sursă TS nu se pot publica pe npm așa cum sunt. Irelevant pentru noi.
- pnpm se instalează cu `npm i -g pnpm`; versiunea e fixată în câmpul `packageManager` din `package.json`-ul rădăcină.
