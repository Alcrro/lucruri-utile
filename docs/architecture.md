# Arhitectura

Cum arată sistemul la runtime. Deciziile și motivele lor sunt în `decisions/`. Aici e doar imaginea de ansamblu.

## Scala

Țintă: < 10k utilizatori activi/lună în primul an. Vârf estimat: câteva request-uri/s. Asta înseamnă **monolit modular, o singură bază de date, fără cache distribuit, coadă în Postgres** (bootstrap §1).

## Componente

```
                        ┌──────────────────────── Vercel ─────────────────────────┐
  Client (browser) ───► │  apps/web (Next.js)                                     │
                        │   ├─ storefront (RSC)       citiri directe din pachete  │
                        │   ├─ /admin (RSC + actions) mutații validate + rol      │
                        │   ├─ /api/auth/*            Better Auth                 │
                        │   └─ /api/webhooks/stripe   verificare → stripe_events  │
                        └───────┬───────────────────────────────┬─────────────────┘
                                │ SQL (pg)                      │ publică joburi
                                ▼                               ▼
                        ┌──────────────── Neon Postgres (eu-central-1) ───────────┐
                        │  schema app   (Drizzle)                                 │
                        │  schema pgboss (coada)                                  │
                        └───────▲───────────────────────────────▲─────────────────┘
                                │ SQL                           │ consumă joburi
                        ┌───────┴──────── Railway ──────────────┴─────────────────┐
                        │  apps/worker (Node, long-running)                       │
                        │   ├─ supplier.import        feed XML → catalog          │
                        │   ├─ compatibility.recompute                            │
                        │   ├─ stripe.process-event / capture / cancel            │
                        │   ├─ order.forward-to-supplier                          │
                        │   ├─ invoice.issue / invoice.storno                     │
                        │   └─ db.backup (pg_dump → R2)                           │
                        └─────────────────────────────────────────────────────────┘

  Servicii externe:  Stripe · Furnizori (URL feed, email) · SmartBill/Oblio · Resend · Cloudflare R2 · Sentry · Google OAuth
```

**Regulă**: web și worker nu comunică direct. Totul trece prin Postgres: tabele + coada pg-boss. Web-ul doar publică joburi (o instanță pg-boss fără supervizare); worker-ul le consumă.

## Fluxurile principale

### Importul unui feed (ADR-009)

```
cron pg-boss ─► worker: GET feed (condiționat) ─► R2 (copie brută)
  ─► parsare SAX ─► mapare ─► validare per item ─► normalizare (categorie, atribute, fitment)
  ─► circuit breaker ─(OK)─► upsert după hash ─► joburi compatibility.recompute pentru produsele modificate
                     └(stop)─► alertă, catalogul rămâne neschimbat
```

### Afișarea unui produs (ADR-006, ADR-008)

```
RSC: product + attributes + fitments ─► product_compatibility (materializat)
     dispozitivul activ (cookie / user_devices) ─► verdict ✅/⚠️/❌ + motiv
```

Compatibilitatea nu se calculează niciodată la citire.

### Comanda (ADR-010)

```
coș ─► server action: order(pending_payment) ─► Stripe Checkout (manual capture)
 ─► webhook ─► authorized ─► email la furnizor ─► admin confirmă ─► capture ─► confirmed ─► factură
                                              └► admin respinge ─► cancel ─► cancelled
```

## Granițele dintre module

```
apps/web ─┐
          ├─► @lu/orders ──► @lu/payments
          │       │
apps/worker ──► @lu/suppliers ──► @lu/catalog ──► @lu/compatibility
          │       │                     │                │
          └───────┴─────────────────────┴────────────────┴─► @lu/db
```

- Săgețile sunt dependențe permise. Fără cicluri.
- `@lu/db` nu depinde de nimic intern.
- Niciun pachet `@lu/*` nu importă `next` sau `react` (ADR-001, ADR-005).

## Ce se schimbă la scală

| Prag                                    | Primul pas                                                                 |
| --------------------------------------- | -------------------------------------------------------------------------- |
| Neon > 1 GB sau CU-ore epuizate         | Neon Launch (ADR-002)                                                      |
| Lansare comercială                      | Vercel Pro sau mutare pe Railway (ADR-004)                                 |
| Importuri care încetinesc storefront-ul | Pool de conexiuni separat pentru worker; importuri în afara orelor de vârf |
| Pagini de produs lente                  | Cache RSC cu `revalidateTag` declanșat la import; abia apoi Redis          |
| Al doilea client (mobil)                | Un strat REST (Hono/Express) peste aceleași pachete (ADR-001)              |
