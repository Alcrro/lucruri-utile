# ADR-003: Better Auth, sesiuni în DB, checkout fără cont, RBAC customer/admin

## Status

Accepted — 2026-10-11 (duratele de sesiune sunt valori implicite propuse, nu încă confirmate)

## Context

- Clienții finali sunt B2C: obligativitatea contului la checkout scade conversia.
- Un singur admin (proprietarul), cu acces la comenzi, prețuri, furnizori și reguli de compatibilitate. Un cont de admin compromis înseamnă control complet asupra magazinului.
- Monolit (ADR-001): nu există servicii care să valideze tokenuri independent.
- Userii trebuie să stea în Postgres-ul nostru, nu la un vendor.

## Decizie

**Better Auth, cu sesiuni stocate în DB și cookie HttpOnly. Fără JWT.**

- **Checkout fără cont**: clientul dă doar email-ul. Comanda se poate urmări printr-un link semnat trimis pe email.
- **Cont opțional**, cu email + parolă și **Google OAuth de la lansare**: istoric comenzi, adrese salvate. La creare, comenzile guest făcute cu același email verificat se atașează contului.
- **Google OAuth**:
  - Doar scope-urile `openid email profile`. Fără scope-uri sensibile, deci fără procesul de verificare al aplicației la Google.
  - **Account linking automat** între Google și email + parolă, doar când emailul e verificat de Google (Google e furnizor de încredere în Better Auth). Altfel oricine ar putea prelua contul altcuiva prin emailul lui.
  - Redirect URI-uri înregistrate: producție (`https://<domeniu>/api/auth/callback/google`) și `http://localhost:3000/...`. Google nu acceptă wildcard-uri, deci pe preview deployments login-ul cu Google merge doar prin pluginul `oAuthProxy` din Better Auth. Altfel îl testezi doar local și în producție.
  - Contul de admin **nu** se loghează cu Google: doar email + parolă + TOTP, ca să nu depindă de securitatea unui cont Google personal.
- **Roluri**: `customer`, `admin`. RBAC simplu, fără ABAC.
- **Admin**: 2FA TOTP obligatoriu (plugin Better Auth), rate limiting la login, sesiune scurtă.
- **Verificarea rolului se face în fiecare server action și în layout-ul `/admin`**, nu doar în `middleware.ts`. Middleware-ul e doar un filtru de confort: CVE-2025-29927 a arătat că poate fi ocolit.
- Schema de tabele a Better Auth (`user`, `session`, `account`, `verification`) se generează în `packages/db` prin CLI-ul lor, ca Drizzle să rămână singura sursă de schemă.

## Alternativele considerate

- **Auth.js** — din 2025 e întreținut de echipa Better Auth, iar recomandarea lor pentru proiecte noi e Better Auth. Nu are sens să pornim pe calea în mentenanță.
- **Clerk** — userii ar sta la un vendor, ar exista cost per MAU și s-ar învăța puțin. Pentru un magazin cu admin unic nu se justifică.
- **Auth custom** — valoros ca exercițiu, dar riscant tocmai pe partea cu impact mare (hashing, sesiuni, reset parolă, 2FA). Better Auth e suficient de transparent ca să înveți din el.
- **JWT stateless** — fără revocare imediată; avantajele lui (fără lookup în DB) contează doar în microservicii.

## Consecințe

- (+) Revocare imediată a sesiunilor (logout din toate dispozitivele, ban).
- (+) Userii și sesiunile sunt în propria DB, cu tranzacții împreună cu comenzile.
- (−) Un lookup în DB per request autentificat. Neglijabil la scala noastră.
- (−) Better Auth își impune structura de tabele; upgrade-urile majore pot cere migrații.

## De confirmat

- Durata sesiunii pentru clienți (propunere: 30 de zile, cu sliding expiration) și pentru admin (propunere: 12 ore).
