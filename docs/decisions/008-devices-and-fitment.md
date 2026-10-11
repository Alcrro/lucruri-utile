# ADR-008: Catalog de dispozitive (entitate separată de produse) și fitment

## Status

Accepted — 2026-10-11

## Context

- O bună parte din catalog sunt accesorii și consumabile care se potrivesc cu **un model anume de dispozitiv**: huse și folii pentru telefoane, cartușe pentru imprimante, saci pentru aspiratoare, filtre pentru căni de apă, capsule pentru espressoare.
- ADR-006 acoperă compatibilitatea **produs ↔ produs** prin atribute (șurub ↔ piuliță). Nu acoperă cazul „husa se potrivește pe iPhone 15 Pro”: potrivirea depinde de forma exactă a carcasei și de decupajul camerei, care nu se pot deduce din atribute.
- Clientul gândește în termenii „ce am eu”: „am un Galaxy S24, ce încărcător îmi trebuie?”, nu în termeni de produse.
- Feed-urile pun modelul în titlu, scris neuniform: „Husa Apple iPhone 15Pro”, „Husă iPh 15 Pro silicon”, „Case iPhone 15 Pro / 15 Pro Max”.
- Majoritatea dispozitivelor de referință **nu le vindem** (sau nu încă), dar accesoriile trebuie legate de ele.

## Decizie

Dispozitivele sunt **o entitate separată de produse**. Compatibilitatea are două mecanisme care se completează:

| Mecanism                                                    | Când                                                        | Exemplu                                                                                                   |
| ----------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Fitment explicit** (produs → listă de modele)             | Potrivirea depinde de forma fizică sau de un cod proprietar | Husă, folie, cartuș, sac de aspirator, filtru Brita                                                       |
| **Reguli pe atribute** (ADR-006), extinse și la dispozitive | Potrivirea decurge dintr-un standard                        | Încărcător ↔ telefon (conector, protocol, W), RAM ↔ laptop (DDR5 SO-DIMM), bec ↔ corp de iluminat (dulie) |

### Modelul de date

| Tabelă              | Rol                                                                                                                                                                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `devices`           | brand, serie, model, generație/platformă, an, categorie de dispozitiv (`phone`, `tablet`, `laptop`, `printer`, `vacuum`, `coffee_machine`, `water_filter_jug`, `power_tool_platform`), `slug`                                                 |
| `device_attributes` | Aceleași `attribute_definitions` ca la produse: dimensiuni (mm), conector de încărcare, putere maximă de încărcare (W), protocoale (PD/PPS/QC), Qi/Qi2/MagSafe, tip RAM, sloturi M.2, slot microSD + capacitate maximă, ieșire video pe USB-C |
| `device_aliases`    | Variante de scriere pentru parsare: „iPhone15 Pro”, „iPh 15 Pro”, codul de model „A3102”                                                                                                                                                      |
| `product_fitments`  | (produs, dispozitiv, `source` ∈ `feed_parse` / `manual`, `confidence`)                                                                                                                                                                        |
| `user_devices`      | „Dispozitivele mele”: pe cont sau, pentru vizitatori, în cookie                                                                                                                                                                               |

`compatibility_rules` (ADR-006) primește un țintă de tip `device_category` pe lângă `product_category`.

### Granularitatea modelului

- **Un dispozitiv = varianta care schimbă compatibilitatea.** iPhone 15, 15 Plus, 15 Pro și 15 Pro Max sunt 4 dispozitive. Capacitatea de stocare și culoarea **nu** se modelează: nu schimbă nimic la potrivire.
- Laptopurile au nevoie și de generație și platformă: ThinkPad T14 Gen 4 Intel ≠ T14 Gen 4 AMD, pentru că diferă RAM-ul lipit pe placă și sloturile.
- Dacă vreodată vindem chiar dispozitivul, produsul îl referă prin `products.device_id`. Se refolosește aceeași entitate, fără duplicare.

### Parsarea fitment-ului din feed

1. Normalizarea titlului: litere mici, fără diacritice, cu spațiu inserat între litere și cifre („15pro” → „15 pro”).
2. Potrivirea cu `device_aliases` pe **cel mai lung alias, la granița de cuvânt**. Altfel „iPhone 15” se potrivește în „iPhone 15 Pro Max”: bug clasic, cu test obligatoriu.
3. Liste din titlu („15 Pro / 15 Pro Max”) → mai multe fitment-uri.
4. Ce nu se potrivește, sau se potrivește ambiguu, ajunge în `attribute_review_queue`. **Nu se ghicește.**

### Statusuri de compatibilitate (extinde ADR-006)

`compatible` | `partial` | `near_miss`

`partial` = funcționează, dar nu la capacitate maximă. Exemple: „încarcă, dar la max 15 W în loc de 45 W: telefonul cere PPS, încărcătorul nu are”; „cablul transferă date doar la USB 2.0”. Pentru un magazin de accesorii, aici e informația cu cea mai mare valoare.

## Alternativele considerate

- **Dispozitivele ca produse în categoria „Telefoane”** — leagă compatibilitatea de ce vindem. Nu poți face referire la un model pe care nu-l ai pe stoc, deși exact pentru el se vând huse.
- **Fitment doar din atribute** (dimensiuni ecran etc.) — 6.1” nu înseamnă aceeași carcasă: iPhone 15 și 15 Pro au aceeași diagonală și huse diferite.
- **Etichete text libere pe produse** — fără normalizare, fără „Dispozitivele mele”, fără statusul `partial`.
- **Import de baze de date de specificații prin scraping** (GSMArena etc.) — încalcă termenii de utilizare și ridică probleme de drepturi pe date. Pentru auto, datele de fitment (TecDoc) se licențiază contra cost; e în afara scopului până la Faza 3.

## Consecințe

- (+) Feature-ul „Dispozitivele mele” filtrează tot catalogul pe ce are clientul: cel mai puternic argument de vânzare al proiectului.
- (+) Un singur model de date pentru telefoane, laptopuri, imprimante, aspiratoare etc.
- (−) **Catalogul de dispozitive e muncă continuă**: apar modele noi lunar. Faza 1 pornește cu ~100 de modele de telefon relevante pe piața din RO, adăugate manual. Un model lipsă = huse pentru el blocate în coada de review până la adăugarea lui.
- (−) Atributele dispozitivelor (putere de încărcare, protocoale) se introduc manual, din specificațiile producătorului. Sunt date de calitate scăzută dacă nu se verifică.
