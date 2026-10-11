# ADR-006: Compatibilitate calculată din reguli pe atribute normalizate, nu perechi manuale

## Status

Accepted — 2026-10-10

## Context

- Diferențiatorul produsului: pentru fiecare articol arătăm cu ce e compatibil, cu ce **nu** e și de ce.
- Catalogul vine din feed-uri de dropshipping (mii de produse). Feed-urile **nu conțin date de compatibilitate**, iar atributele sunt scrise neuniform („M8”, „M 8”, „8mm”, „filet 8”).
- Perechile introduse manual cresc cu N²: nu scalează peste câteva zeci de produse.
- Logica stă în Node (ADR-002).
- O afirmație de compatibilitate greșită înseamnă retur, cost de transport și pierderea încrederii, adică exact în punctul diferențiator.

## Decizie

Compatibilitatea se **derivă** din atribute normalizate și reguli pe categorii, se **corectează** prin excepții manuale și se **materializează** într-o tabelă interogabilă.

### Modelul de date

| Tabelă                    | Rol                                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `attribute_definitions`   | Atributele canonice: cheie, tip (`enum` / `number` / `text`), unitate, valori permise                      |
| `product_attributes`      | Valori normalizate per produs (`thread_diameter_mm = 8`, `thread_pitch_mm = 1.25`)                         |
| `attribute_review_queue`  | Valori din feed pe care normalizatorul nu le-a recunoscut; se rezolvă manual în admin                      |
| `compatibility_rules`     | Regula între două categorii, cu condițiile într-un DSL JSON (`eq`, `in`, `range`, `contains`, `lte`/`gte`) |
| `compatibility_overrides` | Excepții manuale: (produs A, produs B, compatibil da/nu, notă)                                             |
| `product_compatibility`   | Rezultatul materializat: (A, B, `status`, `reason`, `rule_id`, `source`)                                   |

`status` ∈ `compatible` | `partial` | `near_miss`. `source` ∈ `rule` | `override`. (`partial` și compatibilitatea cu dispozitive sunt introduse în ADR-008.)

### Algoritmul

1. **Normalizare** (în `packages/suppliers`, la import): valoarea brută din feed → valoarea canonică. Valorile nerecunoscute nu se ghicesc; ajung în `attribute_review_queue`.
2. **Selecția candidaților** (SQL): pentru un produs, doar produsele din categoriile țintă ale regulilor aplicabile, filtrate pe atributul cel mai selectiv (indexat). Fără produs cartezian.
3. **Evaluarea regulii** (Node, `packages/compatibility`): toate condițiile trec → `compatible`. **Exact o condiție pică** → `near_miss`, cu motivul generat („pas filet diferit: 1.0 vs 1.25 mm”).
4. **Excepțiile** se aplică peste rezultat și au prioritate.
5. **Recalcularea** se face prin joburi pg-boss: incremental pentru produsele modificate la import și complet pe categoriile afectate când se schimbă o regulă.

### Afișarea

- „Compatibil cu”: `compatible`, cu un badge care arată sursa (calculat / verificat manual).
- „Atenție, nu se potrivește”: doar `near_miss`. Nu listăm toate produsele incompatibile; nu ajută pe nimeni.
- Un produs cu atribute obligatorii lipsă nu primește secțiunea de compatibilitate, ci textul „date de compatibilitate indisponibile”. Niciodată nu afișăm o compatibilitate presupusă.

## Alternativele considerate

- **Perechi introduse manual** — N², imposibil de întreținut cu un catalog din feed-uri.
- **Bază de date de tip graf (Neo4j)** — a doua bază de date pentru o relație care e derivabilă și se exprimă bine ca join în SQL.
- **Calcul la citire (fără materializare)** — lent pe paginile de produs și fără o listă de near-miss ordonată ieftin.
- **Un LLM decide compatibilitatea** — nedeterminist și fără garanții, într-un domeniu unde o greșeală costă un retur. Un LLM e acceptabil doar ca **ajutor la normalizare** (propune valoarea canonică pentru o intrare din coada de review), cu aprobare umană.

## Consecințe

- (+) Scalează cu numărul de reguli (zeci), nu cu perechile de produse (milioane).
- (+) Fiecare afirmație are un motiv explicabil (`reason`, `rule_id`), ceea ce o face trasabilă și ușor de depanat.
- (−) **Calitatea compatibilității = calitatea normalizării atributelor.** Coada de review din admin e obligatorie de la prima zi, nu un nice-to-have.
- (−) Fiecare categorie nouă cere muncă de domeniu: definirea atributelor și a regulilor. De aici vine scopul limitat la 1–2 categorii în MVP.
- (−) `product_compatibility` poate crește mult. Stocăm ambele direcții (A→B și B→A) pentru interogări simple; reevaluăm dacă tabela trece de ordinul zecilor de milioane de rânduri.
