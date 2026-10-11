# ADR-004: Hosting — Vercel Hobby până la lansare, worker pe Railway, Neon, R2

## Status

Accepted — 2026-10-11 (platforma pentru `apps/web` după lansare rămâne deschisă)

## Context

- Două procese: `apps/web` (Next.js) și `apps/worker` (Node, rulează mult: importuri de feed-uri cu mii de produse).
- Worker-ul nu poate rula pe serverless: importurile depășesc timeout-urile funcțiilor.
- Magazinul va fi **comercial** (vinde prin firmă). Planul Hobby de la Vercel e doar pentru uz personal, necomercial.
- `lucruri-utile.ro` e deja configurat în Vercel.
- Doar România: latență mică spre RO și date în UE (GDPR).
- Buget de proiect personal: costuri minime până la primele vânzări.

## Decizie

| Componentă          | Până la lansare                                               | La lansare                                           |
| ------------------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| `apps/web`          | **Vercel Hobby**                                              | Vercel Pro (~$20/lună) **sau** Railway, decis atunci |
| `apps/worker`       | Railway, regiune UE, proces long-running                      | la fel                                               |
| Postgres            | Neon, `aws-eu-central-1` (Frankfurt), Free                    | Neon Launch (vezi ADR-002)                           |
| Imagini             | Cloudflare R2, upload direct din admin prin URL-uri presigned | la fel                                               |
| Email tranzacțional | Resend                                                        | la fel                                               |
| Erori               | Sentry (web + worker), cu source maps                         | la fel                                               |
| CI/CD               | GitHub Actions: lint + typecheck + test + migrate             | la fel                                               |

**Regulă de portabilitate**, ca mutarea de pe Vercel să fie o oră de lucru, nu o rescriere:

- `output: 'standalone'` în `next.config`. Build-ul trebuie să ruleze și ca imagine Docker, verificat în CI.
- **Fără funcții specifice Vercel**: Vercel Cron, KV, Blob, Edge Config, `@vercel/*`. Cron-ul rulează prin pg-boss în worker, fișierele în R2, configurarea în variabile de mediu.
- Runtime-ul Node pentru toate rutele. Edge doar dacă e măsurat că e nevoie.

**Linie roșie**: prima vânzare reală nu se face pe Hobby. Trecerea pe Pro sau Railway e în checklist-ul de lansare.

## Alternativele considerate

- **Railway pentru web de la început** — o singură platformă, ~$5–10/lună, fără problema de uz comercial. Dar domeniul e deja în Vercel, iar în dezvoltare preview-urile și optimizarea de imagini de la Vercel sunt mai comode. Rămâne una dintre cele două opțiuni pentru lansare.
- **Vercel Pro de acum** — $20/lună plătiți înainte de orice vânzare.
- **VPS (Hetzner) + Docker/Coolify** — cel mai ieftin și instructiv, dar administrezi tu OS-ul, TLS-ul și backup-urile.
- **Postgres pe Railway în loc de Neon** — pierdem branching-ul și PITR-ul gestionat.

## Consecințe

- (+) Zero cost pentru web până la lansare, cu cea mai bună experiență Next.js.
- (+) Worker-ul și web-ul comunică doar prin Postgres (coada pg-boss): ce platformă găzduiește web-ul nu contează pentru worker.
- (−) Două platforme (Vercel + Railway) de configurat: variabile de mediu duplicate. Sursa de adevăr e `.env.example`, validat la pornire cu Zod.
- (−) Pe Hobby, funcțiile serverless au timeout scurt. Orice operație lungă din admin (import, recalcul de compatibilitate) **trebuie** pusă în coadă, niciodată rulată în server action. Oricum e designul corect.
- (−) Login-ul cu Google pe preview-urile Vercel (URL-uri dinamice) cere `oAuthProxy` (vezi ADR-003).

## Domeniu

`lucruri-utile.ro`, configurat în Vercel. DNS-ul rămâne acolo cât suntem pe Vercel, **fără** proxy Cloudflare în față: Vercel îl descurajează, pentru că dublează CDN-ul și complică TLS-ul. Dacă web-ul se mută pe Railway, DNS-ul trece în Cloudflare.
