# ADR-010: Plăți — Stripe Checkout cu autorizare la checkout și încasare după confirmarea furnizorului

## Status

Accepted — 2026-10-11

## Context

- Dropshipping fără API de stoc (ADR-009): în momentul plății nu știm sigur că furnizorul are produsul.
- Doar plată cu cardul, în RON, doar clienți din România.
- La o rambursare, Stripe nu returnează comisionul. Încasarea urmată de rambursare la stoc epuizat înseamnă pierdere pe fiecare caz.
- Statusul comenzii trebuie să depindă de evenimente sigure, nu de redirect-ul clientului după plată.
- Facturarea e obligatorie (e-Factura), prin SmartBill/Oblio.

## Decizie

### Suprafața de plată

- **Stripe Checkout găzduit** (`checkout.sessions.create`, `mode: 'payment'`). SCA/3DS, Apple Pay și Google Pay sunt incluse, iar datele cardului nu ating serverele noastre (PCI SAQ A).
- **Fără `payment_method_types` în cod.** Metodele de plată se restrâng din Dashboard, printr-o `payment_method_configuration` dedicată: card + Apple Pay + Google Pay. Motiv: doar metodele care suportă manual capture au sens pentru fluxul nostru.
- `payment_intent_data.capture_method: 'manual'`.
- `client_reference_id` = `order.id`, plus `metadata.order_id`, pe sesiune **și** pe `payment_intent_data`.
- `expires_at` = 30 de minute (minimul permis). Comanda nefinalizată expiră.
- **Sumele se calculează exclusiv pe server**, din `order_items` (prețuri fixate la momentul comenzii, în bani, ca întregi). Clientul trimite doar ID-uri de produs și cantități.
- Versiunea de API fixată explicit în SDK (`2026-06-24.dahlia` la momentul deciziei) și actualizată deliberat, nu implicit.

### Fluxul

```
1. Checkout     web: creează order(pending_payment) + order_items în tranzacție
                web: creează Checkout Session (idempotency key: checkout:{order_id})
2. Autorizare   webhook payment_intent.amount_capturable_updated → order: authorized
                job: trimite comanda la furnizor (ADR-009) → sent_to_supplier
3a. Confirmat   admin „Furnizor a confirmat” → job capture (idempotency key: capture:{order_id})
                webhook payment_intent.succeeded → order: confirmed → job: emite factura
3b. Respins     admin „Fără stoc” → job cancel PaymentIntent
                webhook payment_intent.canceled → order: cancelled → email client
4. Expirare     webhook checkout.session.expired → order: expired
5. Rambursare   admin → refunds.create (idempotency key: refund:{order_id}:{n})
                webhook refund.updated (status succeeded) → order: refunded → job: storno factură
```

- Statusul autorizării **nu** se citește din `checkout.session.completed.payment_status`. Se citește din PaymentIntent (`status = 'requires_capture'`). `checkout.session.completed` doar leagă sesiunea de PaymentIntent.
- **Fereastra de autorizare (~7 zile pentru plăți online cu cardul)**:
  - alertă în admin la 4 zile;
  - anulare automată la 6 zile dacă furnizorul n-a confirmat. Mai bine anulăm noi controlat decât să expire autorizarea.

### Webhook-uri

- Route handler `apps/web/src/app/api/webhooks/stripe/route.ts`:
  1. citește body-ul **brut**;
  2. verifică semnătura cu `stripe.webhooks.constructEvent` și `STRIPE_WEBHOOK_SECRET`;
  3. `INSERT INTO stripe_events (id, type, payload) ON CONFLICT (id) DO NOTHING`;
  4. dacă rândul e nou, publică un job pg-boss `stripe.process-event`;
  5. răspunde `200` imediat. Fără procesare grea în request.
- Procesarea are loc în **worker**. Fiecare tranziție de status e un update condiționat (`UPDATE orders SET status='confirmed' WHERE id=$1 AND status IN ('authorized','sent_to_supplier')`). Evenimentele duplicate sau venite în altă ordine nu pot muta comanda înapoi.
- Dacă un eveniment pare inconsistent cu starea din DB, worker-ul citește PaymentIntent-ul curent din API-ul Stripe și reconciliază.
- Evenimentele abonate se limitează la cele de mai sus.

### Chei

- **Restricted API keys** (`rk_`), nu cheia secretă, cu permisiuni minime și **o cheie per proces**:
  - `apps/web`: Checkout Sessions write, PaymentIntents read;
  - `apps/worker`: PaymentIntents write, Refunds write.
- Doar în variabile de mediu pe Vercel și Railway; niciodată în repo. Cheile de test și cele live sunt în medii separate.

### Facturare

- Factura se emite **la încasare** (`payment_intent.succeeded`), nu la autorizare. Până la încasare nu există vânzare.
- Jobul de facturare e idempotent: salvează `invoices.external_id` și verifică existența facturii înainte de a crea una nouă.
- Serviciul de facturare (SmartBill/Oblio) trimite e-Factura la ANAF.

## Alternativele considerate

- **Încasare imediată** — la stoc epuizat, rambursăm și pierdem comisionul. Clientul vede o tranzacție și o rambursare pe extras.
- **Payment Element integrat în pagină** (Checkout Sessions cu `ui_mode: 'custom'`) — control complet asupra UI-ului, dar mai mult cod și testare. Se poate migra ulterior fără să se schimbe fluxul de pe server.
- **Procesatori locali (Netopia, EuPlătesc)** — familiari pentru clienții din RO, dar documentație și unelte de dezvoltare mai slabe, mai puține unelte de test. Ramburs nu oferim oricum.
- **Procesarea webhook-ului direct în route handler** — timeout-uri pe Vercel Hobby, iar un eșec după răspunsul 200 ar însemna eveniment pierdut. Tabela `stripe_events` + coada rezolvă asta.

## Consecințe

- (+) Clientul nu e taxat niciodată pentru un produs pe care nu-l putem livra.
- (+) Statusul comenzii e corect chiar dacă clientul închide pagina după plată.
- (−) **Fereastra de ~7 zile e o limită fixă.** Furnizorul trebuie să confirme repede (în checklist-ul de evaluare a furnizorului).
- (−) Faza 1 are un singur furnizor. Încasarea parțială (Faza 2, mai mulți furnizori) permite o singură capturare per PaymentIntent: comenzile cu mai mulți furnizori vor cere fie așteptarea tuturor confirmărilor, fie capturarea parțială cu eliberarea restului.
- (−) Câteva metode de plată (unele portofele, transfer bancar) nu suportă manual capture. Sunt excluse prin configurarea din Dashboard.
