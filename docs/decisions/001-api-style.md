# ADR-001: Fără API HTTP separat — RSC + server actions peste pachete framework-agnostic

## Status

Accepted — 2026-10-10

## Context

- Magazin public: SEO-ul e critic → randare server-side pentru catalog și paginile de produs.
- Un singur client (web). Nu există aplicație mobilă și nici consumatori terți în plan.
- Solo dev, proiect de învățare/portofoliu.
- Cerință explicită: modulele de business trebuie să poată fi extrase din Next.js (de ex. montate într-un server Express) fără rescriere.
- Apelanți externi care au nevoie de HTTP: Stripe (webhook) și health check-ul platformei de hosting.
- Importurile din feed-uri și sincronizarea stocului rulează în worker (vezi ADR-004 și ADR-005).

## Decizie

Nu există un API HTTP intern. Transportul e un strat subțire peste pachetele de domeniu (`packages/*`):

| Operație                                                  | Transport                                                           |
| --------------------------------------------------------- | ------------------------------------------------------------------- |
| Citiri (catalog, produs, compatibilitate, coș)            | React Server Components care apelează direct serviciile din pachete |
| Mutații (coș, checkout, toate acțiunile din admin)        | Server actions, cu input validat prin Zod                           |
| Apelanți externi (webhook Stripe, health)                 | Route handlers (`app/api/...`)                                      |
| Joburi asincrone (import, sync stoc, comenzi la furnizor) | Coadă pg-boss consumată de `apps/worker`                            |

Reguli:

- Pachetele din `packages/*` **nu importă nimic din `next/*`** sau `react`. Regula e impusă prin ESLint `no-restricted-imports`.
- Fiecare server action: validare Zod → verificare auth/rol → apel serviciu. Fără logică de business în action.
- Express/Hono/Fastify se adaugă **doar** când apare un apelant extern pentru worker (de ex. un trigger HTTP de la terți). Până atunci worker-ul nu expune HTTP, în afară de health check.

## Alternativele considerate

- **tRPC** — redundant cu RSC și server actions: duce type-safety prin încă un strat, deși RSC apelează oricum serviciile direct. Ar mai adăuga un router de întreținut.
- **REST cu Express de la început** — două servere de rulat, CORS, auth între Next și API, două deploy-uri. Overhead fără un al doilea client care să-l justifice.
- **GraphQL** — se justifică la mai mulți clienți cu nevoi de date diferite. Aici e unul singur.

## Consecințe

- (+) Un singur deploy pentru web, zero boilerplate de API, type-safety directă de la serviciu la componentă.
- (+) Extragerea unui modul înseamnă doar un nou adaptor de transport; pachetul rămâne neschimbat.
- (−) Server actions sunt endpoint-uri POST accesibile public. **Fiecare** trebuie să-și facă singur validarea și verificarea de auth; nu ne bazăm pe middleware sau pe faptul că butonul e ascuns în UI.
- (−) Nu există API public. Un client mobil ar cere un strat REST nou (ieftin datorită pachetelor, dar e muncă).
