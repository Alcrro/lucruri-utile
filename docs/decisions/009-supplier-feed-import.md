# ADR-009: Import din feed-uri XML/CSV ale furnizorilor, fără să presupunem un API

## Status

Accepted — 2026-10-11

## Context

- Nu există încă un furnizor ales.
- La dropshipping-ul din România, modelul uzual e: furnizorul dă un **URL de feed** (XML, uneori CSV sau JSON), regenerat periodic (orar sau zilnic), cu produse, prețuri, stoc și imagini. **API pentru stoc în timp real sau pentru plasarea comenzilor e excepția, nu regula.**
- Feed-urile pot avea zeci sau sute de MB, codificări vechi (Windows-1250, ISO-8859-2) și diacritice amestecate („ş” cu sedilă și „ș” cu virgulă).
- Feed-urile se strică: fișier trunchiat, export gol, prețuri 0, categorii redenumite.

## Decizie

**Un pipeline de import în `apps/worker`, cu adaptoare pe furnizor bazate pe configurare și cod doar ca excepție.** Proiectăm pentru cazul fără API; API-ul, dacă există, e un bonus pentru stoc și comenzi.

### Pipeline-ul (un job pg-boss per furnizor, programat)

1. **Descărcare**: GET condiționat (`ETag` / `If-Modified-Since`); dacă nu s-a schimbat nimic, oprire. Fișierul brut se salvează în R2 (`feeds/{supplier}/{timestamp}.xml.gz`), pentru debugging și reimport.
2. **Parsare în streaming**: `saxes` (SAX). **Niciodată** tot fișierul în memorie ca DOM. Codificarea se detectează din prolog sau header și se convertește la UTF-8 (`iconv-lite`). Diacriticele cu sedilă se normalizează la cele cu virgulă.
3. **Mapare**: o configurare pe furnizor (`suppliers.mapping`, JSON validat cu Zod) traduce elementele din feed în formatul canonic: `supplier_sku, ean, title, description, price, vat_included, stock, images[], category_path, raw_attributes{}`. Un adaptor în cod (`packages/suppliers/adapters/<nume>.ts`) se scrie doar când configurarea nu ajunge.
4. **Validare per item** (Zod): itemii invalizi intră în `import_errors`, iar importul continuă. Un produs stricat nu oprește tot catalogul.
5. **Normalizare**:
   - categoria furnizorului → taxonomia noastră, prin tabela `supplier_category_map`. Categoriile nemapate ajung în review, iar produsele din ele **nu** se publică;
   - atributele (ADR-006);
   - fitment-ul din titlu (ADR-008).
6. **Upsert după cheia `(supplier_id, supplier_sku)`** + un hash al înregistrării normalizate. Doar produsele cu hash schimbat declanșează recalcularea compatibilității.
7. **Produse dispărute din feed** → `unavailable`, **nu** se șterg: comenzile le referă, iar paginile indexate rămân, cu mesajul „indisponibil”.
8. **Imagini**: copiate în R2 asincron, deduplicate după hash. Nu folosim direct imaginile de pe serverul furnizorului (hotlinking): le poate muta sau șterge oricând, iar viteza nu e sub controlul nostru.
9. **Preț de vânzare**: preț furnizor (de obicei fără TVA) → reguli de adaos (ADR-007) → TVA. **Cota de TVA e configurare, nu constantă în cod**: s-a schimbat deja (19% → 21% în 2025). Rotunjirea finală (de ex. la ,99) e tot o regulă configurabilă.

### Siguranțe (circuit breaker)

Importul se **oprește înainte de scriere** și trimite o alertă dacă:

- numărul de itemi scade cu peste 30% față de importul anterior (feed trunchiat sau gol);
- peste 20% dintre produse își schimbă prețul cu mai mult de 30%;
- există prețuri ≤ 0 sau prețuri de vânzare sub prețul de achiziție.

Pragurile sunt configurabile pe furnizor. Fără siguranțele astea, un feed stricat poate scoate tot catalogul de la vânzare sau îl poate pune la vânzare în pierdere, peste noapte, fără ca tu să știi.

### Stoc și comenzi fără API

- **Stoc tampon**: produsul apare „în stoc” doar dacă stocul furnizorului e ≥ N (configurabil, implicit 3). Feed-ul are oricum câteva ore întârziere.
- **Plata se autorizează la checkout și se încasează (capture) doar după confirmarea furnizorului.** Stripe permite asta prin manual capture: autorizarea pe card ține ~7 zile. Dacă furnizorul nu are stoc, autorizarea se anulează: clientul nu e taxat, iar noi nu plătim comisionul unei rambursări. Detaliat în ADR-ul de plăți.
- **Trimiterea comenzii la furnizor**, în ordinea preferinței: API (dacă există) → email generat automat, cu CSV sau PDF atașat → manual în portalul B2B, cu butonul „Marchează trimisă” în admin. Faza 1 pornește cu varianta email + confirmare manuală.
- AWB-ul și statusul livrării: introduse manual în Faza 1, automat dacă furnizorul le pune în feed sau API.

## Alternativele considerate

- **Adaptor scris în cod pentru fiecare furnizor** — mai flexibil, dar fiecare furnizor nou înseamnă un deploy. Majoritatea feed-urilor diferă doar prin numele câmpurilor, deci configurarea acoperă ~80% din cazuri.
- **Parsare DOM** (`fast-xml-parser` pe tot fișierul) — simplu, dar memoria crește cu dimensiunea feed-ului. Un feed de 300 MB poate depăși memoria containerului worker-ului.
- **Ștergerea produselor care dispar din feed** — rupe comenzile istorice și paginile indexate de Google.
- **Încasarea plății imediat la checkout** — la un stoc epuizat, rambursezi și pierzi comisionul Stripe.

## Consecințe

- (+) Un furnizor nou = o configurare de mapare și o mapare de categorii, din admin, fără deploy.
- (+) Feed-urile brute păstrate în R2 permit reimportul după un bug de normalizare.
- (−) Fără API de stoc, riscul de a vinde ce s-a epuizat nu dispare, doar scade (stocul tampon, încasarea după confirmare).
- (−) Maparea categoriilor și coada de review sunt muncă manuală la fiecare furnizor nou.
- Până alegem furnizorul, dezvoltăm pe un **feed fixture** (`packages/suppliers/fixtures/sample-gsm.xml`) cu cazurile dificile: Windows-1250, sedile, titluri de fitment ambigue, prețuri lipsă, produse duplicate după EAN.
