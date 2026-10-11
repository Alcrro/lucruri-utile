# Checklist pentru evaluarea unui furnizor de dropshipping

De întrebat **înainte** de semnare. Răspunsurile intră în configurarea furnizorului (ADR-009).

## Feed

- [ ] Format (XML / CSV / JSON) și un **exemplu real** de feed, nu doar documentația
- [ ] Cât de des se regenerează (orar / zilnic)
- [ ] Stocul e **numeric** sau doar „în stoc / epuizat”?
- [ ] EAN prezent pe produse? (necesar pentru deduplicare între furnizori)
- [ ] Prețurile sunt cu sau fără TVA? În ce monedă?
- [ ] Categorii și atribute structurate, sau totul în titlu și descriere?
- [ ] Imagini: rezoluție și **dreptul de a le folosi** pe site-ul tău
- [ ] Codificare (UTF-8 sau Windows-1250) și dimensiunea fișierului

## Comenzi și livrare

- [ ] Cum se plasează comanda: API / email / portal B2B?
- [ ] În cât timp confirmă stocul după comandă? (trebuie să fie sub ~5 zile, ca autorizarea pe card să nu expire)
- [ ] **Livrare fără marca furnizorului**: coletul nu conține factura sau prețurile furnizorului
- [ ] Ce curier folosesc, cine generează AWB-ul și cum primești numărul de urmărire
- [ ] Termen de livrare (zile lucrătoare)
- [ ] Cost de transport: pe colet, pe greutate, livrare gratuită peste un prag?

## Retururi și garanție

- [ ] Acceptă retururi în 14 zile (dreptul legal de retragere al clientului)? Cine plătește transportul?
- [ ] Cum se tratează produsele defecte la livrare și garanția
- [ ] Adresa de retur: la ei sau la tine?

## Comercial

- [ ] Comandă minimă, abonament lunar, garanție financiară cerută?
- [ ] Termen de plată (avans per comandă sau decont lunar)
- [ ] Factură B2B către firma ta (e-Factura)
