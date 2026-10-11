# lucruri-utile.ro — PRD

_Ultima actualizare: 2026-10-11_

## 1. Problema

Când cumperi un accesoriu sau un consumabil online, magazinele îți dau o descriere și o listă de specificații. Nu-ți spun:

- **dacă se potrivește cu ce ai deja** (telefonul, încărcătorul, imprimanta, piulița);
- **cât de bine se potrivește**: un încărcător de 45 W poate încărca un Galaxy S24 Ultra doar la 15 W dacă îi lipsește PPS;
- **ce nu se potrivește, deși pare că da**: o husă de iPhone 15 pe un iPhone 15 Pro;
- **cum se folosește corect**.

Rezultatul: cumpărături greșite, retururi și clienți care pleacă să caute pe forumuri sau pe YouTube.

## 2. Propunerea de valoare

> Pentru fiecare produs îți spunem cu ce merge, cât de bine și cu ce nu merge, pe baza dispozitivelor tale.

Diferențiatori, în ordinea importanței:

1. **„Dispozitivele mele”**: îți salvezi telefonul o dată, iar tot magazinul se filtrează și se adnotează după el.
2. **Compatibilitate cu trei niveluri**: ✅ compatibil / ⚠️ parțial (funcționează, dar cu limitări explicate) / ❌ aproape (produse care par potrivite, dar nu sunt, cu motivul).
3. **Ghiduri de utilizare** pe categorie: „PD, PPS sau QC: ce încărcător îți trebuie”, „folie hidrogel vs. sticlă”.
4. **Pagini de dispozitiv**: `/dispozitive/iphone-15-pro` adună tot ce e compatibil. Sunt și pagini de intrare din Google („accesorii iphone 15 pro”).

## 3. Utilizatori

| Persona                                               | Nevoie                                                                    | Ce face pe site                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Cumpărătorul cu un dispozitiv anume** (majoritatea) | „Am un S24, vreau o husă și un încărcător rapid care chiar încarcă rapid” | Își alege dispozitivul, filtrează, compară, cumpără                    |
| **Cumpărătorul care nu știe ce-i trebuie**            | „Ce încărcător merge cu telefonul meu?”                                   | Citește un ghid, apoi cumpără ce i se recomandă                        |
| **Adminul** (proprietarul, singur)                    | Catalog corect din feed-uri, cu cât mai puțină muncă manuală              | Configurează furnizori, rezolvă coada de review, gestionează comenzile |

## 4. Modelul de business și constrângeri

- **Dropshipping**: fără stoc propriu. Catalogul vine din feed-uri XML/CSV ale furnizorilor (ADR-009).
- **Plată doar cu cardul** (Stripe). Fără ramburs.
- **Doar România**: RON, limba română, livrare în RO.
- **Firmă** (de înființat înainte de lansare): facturare prin e-Factura, printr-un serviciu de facturare (SmartBill / Oblio).
- **Proiect de învățare / portofoliu**, dar construit să poată vinde real.
- Dezvoltator unic.

## 5. Scopul Fazei 1 (MVP)

**Categorii** (vezi [catalog/categories.md](catalog/categories.md)):

- Huse telefon, folii și sticlă de protecție
- Încărcătoare de priză, cabluri, încărcătoare wireless, baterii externe
- Catalog de referință: ~100 de modele de telefon

**Un singur furnizor** la lansare. Comenzile cu mai mulți furnizori (transport împărțit, încasări parțiale) intră în Faza 2.

### 5.1 Catalog și navigare

**User stories**

- Ca vizitator, vreau să navighez pe categorii și să filtrez după atribute (conector, putere, tip husă), ca să găsesc repede ce caut.
- Ca vizitator, vreau o căutare care să ignore diacriticele și greșelile mici („incarcator samsng”).

**Acceptance criteria**

- [ ] Pagini de categorie cu filtre generate din `attribute_definitions`-ul categoriei
- [ ] Căutare full-text cu `unaccent` + `pg_trgm` (ADR-002)
- [ ] Produsele indisponibile apar marcate, fără buton de cumpărare, și sunt excluse implicit din listări
- [ ] Produsele fără categorie mapată sau cu atribute obligatorii nerezolvate **nu** se publică

### 5.2 Dispozitive și „Dispozitivele mele”

**User stories**

- Ca vizitator, vreau să-mi aleg telefonul (căutare după nume), ca site-ul să-mi arate doar ce se potrivește.
- Ca vizitator, vreau o pagină cu tot ce e compatibil cu telefonul meu.
- Ca utilizator logat, vreau ca dispozitivele mele să fie salvate în cont.

**Acceptance criteria**

- [ ] Selector de dispozitiv în header, cu autocomplete după nume și alias
- [ ] Vizitatori: dispozitivele salvate în cookie. La login, se mută în cont.
- [ ] Cu un dispozitiv activ: listările arată un badge de compatibilitate pe fiecare produs și au filtrul „doar compatibile”
- [ ] Pagina `/dispozitive/[slug]`: accesoriile compatibile grupate pe categorie, specificațiile relevante (conector, putere max, protocoale, wireless) și ghidurile legate
- [ ] Paginile de dispozitiv sunt randate pe server, indexabile, cu date structurate

### 5.3 Pagina de produs

**User stories**

- Ca vizitator, vreau să văd clar dacă produsul merge cu dispozitivul meu și, dacă nu merge perfect, de ce.
- Ca vizitator, vreau să știu cum se folosește produsul și la ce să fiu atent.

**Acceptance criteria**

- [ ] Secțiunea „Compatibilitate”:
  - cu dispozitiv activ: verdictul pentru el (✅ / ⚠️ / ❌ + motiv);
  - fără dispozitiv activ: lista de dispozitive compatibile și invitația „alege-ți dispozitivul”.
- [ ] Statusul `partial` afișează limitarea concretă („încarcă la max 15 W: telefonul cere PPS”)
- [ ] Secțiunea „Atenție, nu se potrivește” cu `near_miss`, cu motivul
- [ ] Badge pe sursă: „calculat din specificații” vs „verificat manual”
- [ ] Produs fără date de compatibilitate suficiente: textul „date de compatibilitate indisponibile”, **niciodată** o compatibilitate presupusă
- [ ] Ghidurile aplicabile (pe categorie sau pe atribut) apar pe pagină
- [ ] Prețul afișat cu TVA, în RON, formatat cu `Intl.NumberFormat('ro-RO')`

### 5.4 Coș și checkout

**User stories**

- Ca vizitator, vreau să cumpăr fără să-mi fac cont.
- Ca vizitator, vreau să fiu avertizat în coș dacă produsele nu se potrivesc între ele sau cu telefonul meu.

**Acceptance criteria**

- [ ] Coș persistent prin cookie, mutat în cont la login
- [ ] **Avertisment de compatibilitate în coș**: de exemplu, încărcător doar cu USB-A + cablu USB-C–USB-C → ❌ cu motivul. Avertismentul nu blochează comanda.
- [ ] Costul de transport calculat după regula furnizorului, cu prag de livrare gratuită configurabil
- [ ] Checkout prin Stripe Checkout, cu email, adresă și telefon
- [ ] Plata se **autorizează** la checkout și se **încasează** abia la confirmarea furnizorului (ADR-009)
- [ ] Bifă obligatorie de acceptare a termenilor, cu link spre politica de retur

### 5.5 Ciclul de viață al comenzii

```
pending_payment ──► authorized ──► sent_to_supplier ──► confirmed (captured) ──► shipped ──► delivered
       │                │                 │                                         │
       ▼                ▼                 ▼                                         ▼
    expired         cancelled        cancelled (autorizare anulată)        return_requested ──► refunded
```

**Acceptance criteria**

- [ ] Statusul se schimbă **doar** din webhook-ul Stripe (pentru plăți) sau din acțiunile adminului. Niciodată din redirect-ul de după plată.
- [ ] Webhook-ul e idempotent: același eveniment primit de două ori nu produce efecte duble
- [ ] Alertă în admin pentru comenzile `authorized` mai vechi de 4 zile (autorizarea expiră în ~7)
- [ ] Factura se emite automat prin SmartBill/Oblio la încasare; stornarea, la rambursare
- [ ] Emailuri către client: comandă primită, comandă confirmată (cu factura), expediată (cu AWB), anulată, rambursare
- [ ] Linia de comandă păstrează titlul, prețul și TVA-ul **de la momentul comenzii**

### 5.6 Conturi

**Acceptance criteria**

- [ ] Înregistrare cu email + parolă și cu Google, cu unificarea conturilor doar pe email verificat (ADR-003)
- [ ] Istoric comenzi, adrese salvate, dispozitive salvate
- [ ] La creare, comenzile făcute fără cont cu același email verificat se atașează contului
- [ ] Ștergerea contului (GDPR). Comenzile rămân, anonimizate, cât cere legea contabilă.

### 5.7 Admin (ADR-007)

În ordinea priorității:

- [ ] **Furnizori**: URL-ul feed-ului, configurarea de mapare, programul de import, istoricul importurilor, erori, pornire manuală
- [ ] **Maparea categoriilor** furnizorului la taxonomia noastră
- [ ] **Coada de review**: atribute nerecunoscute, titluri fără dispozitiv identificat sau ambigue
- [ ] **Dispozitive**: CRUD, aliasuri, atribute (conector, putere, protocoale, wireless, dimensiuni)
- [ ] **Reguli de compatibilitate și excepții**, cu previzualizare („această modificare schimbă 214 perechi”)
- [ ] **Comenzi**: listă pe status, trimitere la furnizor (email generat), confirmare/încasare, anulare, AWB
- [ ] **Ghiduri**: editor TipTap, legate de categorie sau atribut
- [ ] **Prețuri**: reguli de adaos și rotunjire, cota de TVA
- [ ] **Override-uri pe produs**: titlu, descriere, imagini, ascuns
- [ ] Audit log pentru reguli, excepții și prețuri

### 5.8 Legal și conformitate (blocante pentru lansare)

- [ ] Termeni și condiții, politica de retur (dreptul de retragere în 14 zile, formularul de retur), politica de confidențialitate, politica de cookies
- [ ] Banner de consimțământ pentru cookies. Analytics se încarcă **doar** după consimțământ.
- [ ] Datele firmei în footer (denumire, CUI, nr. Reg. Com., adresă, contact)
- [ ] Pictogramele / link-urile ANPC cerute. **De verificat cu un jurist ce e obligatoriu acum**: platforma europeană SOL (ODR) a fost închisă în iulie 2025.
- [ ] Prețuri afișate cu TVA inclus, iar la reduceri, prețul anterior conform regulii celor 30 de zile (Directiva Omnibus)

## 6. În afara Fazei 1

- Mai mulți furnizori pe aceeași comandă (transport împărțit, încasări parțiale)
- Categoriile din Faza 2 și 3: tablete, laptop (RAM, SSD, încărcătoare), imprimante, consumabile de electrocasnice, feronerie, becuri
- Vânzarea de telefoane și laptopuri (nerecomandată, vezi `catalog/categories.md`)
- Recenzii de la clienți
- Cupoane și promoții
- Plasarea comenzilor prin API-ul furnizorului
- Generare automată de AWB
- Aplicație mobilă, API public
- Alte limbi și piețe

## 7. Metrici de succes

| Metrică                                                                               | De ce                                  | Țintă inițială                   |
| ------------------------------------------------------------------------------------- | -------------------------------------- | -------------------------------- |
| **Acoperirea compatibilității**: % din produsele publicate cu date de compatibilitate | Măsoară direct diferențiatorul         | ≥ 90% în categoriile din Faza 1  |
| **Retururi din cauza incompatibilității**                                             | Dacă e > 0, motorul sau datele greșesc | ~0; fiecare caz se investighează |
| Mărimea cozii de review după un import                                                | Calitatea normalizării                 | Scade de la un import la altul   |
| % sesiuni cu dispozitiv selectat                                                      | Utilizatorii adoptă diferențiatorul?   | De stabilit după lansare         |
| Conversie (sesiune → comandă)                                                         | Business                               | De stabilit după lansare         |
| Comenzi anulate pentru stoc epuizat la furnizor                                       | Calitatea sincronizării stocului       | < 3%                             |

## 8. Cerințe nefuncționale

- **Performanță**: LCP < 2,5 s pe mobil (4G) pentru paginile de produs, categorie și dispozitiv. Pagina de produs nu calculează compatibilitatea la citire (ADR-006: tabelă materializată).
- **SEO**: pagini randate pe server; date structurate `Product` + `Offer` + `BreadcrumbList`; sitemap generat; URL-uri canonice cu filtrele excluse din indexare.
- **Accesibilitate**: WCAG 2.2 AA pe fluxul de cumpărare. Badge-urile de compatibilitate au și text, nu doar culoare.
- **Securitate**: checklist-ul OWASP din bootstrap; autorizare în fiecare server action; 2FA pentru admin.
- **Observabilitate**: Sentry pe web și worker; alerte pentru importuri oprite de siguranțe, comenzi `authorized` > 4 zile și webhook-uri eșuate.

## 9. Întrebări deschise

1. **„Garanția compatibilității”**: dacă noi spunem „compatibil” și nu e, plătim noi returul? E un argument de încredere puternic și un stimulent să ții datele curate. Costul apare doar când greșim.
2. **Prag de livrare gratuită și cost de transport**: depind de furnizor.
3. **Furnizorul**: neales. Se evaluează cu [catalog/supplier-evaluation.md](catalog/supplier-evaluation.md).
4. **Serviciul de facturare**: SmartBill sau Oblio (de comparat prețul și API-ul).
5. **Analytics**: Plausible / Umami (fără cookies, deci fără consimțământ) sau PostHog (mai puternic, dar cere consimțământ)?
