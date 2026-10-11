# ADR-007: Admin custom în `apps/web`, fără CMS

## Status

Accepted — 2026-10-10

## Context

- Produsele vin din feed-uri. Editarea lor într-un CMS ar fi suprascrisă la sincronizarea următoare.
- Ce se editează de mână: excepții și reguli de compatibilitate, coada de review pentru atribute, ghiduri de utilizare, reguli de adaos, configurarea furnizorilor, comenzi, pagini statice.
- Editorul de compatibilitate e diferențiatorul produsului și cere oricum UI dedicat.
- Cerință: module extractibile din Next.js (ADR-005). Scopul proiectului: învățare.

## Decizie

**Admin custom, ca route group `(admin)` în `apps/web`, sub `/admin`.** Nu e o aplicație separată: împarte auth-ul (ADR-003) și deploy-ul.

Stack:

- shadcn/ui + TanStack Table, cu paginare, sortare și filtrare pe server
- react-hook-form + **aceleași scheme Zod** pe care le folosesc server actions
- TipTap pentru ghiduri: se salvează ca JSON în Postgres și se randează pe server în storefront, cu un set restrâns de noduri permise (fără HTML arbitrar)
- Upload de imagini direct în R2, cu URL-uri presigned

Câmpurile editate manual pe produse stau în `product_overrides` (titlu, descriere, imagini, ascuns/vizibil), separat de datele din feed. Sincronizarea scrie doar în datele din feed; storefront-ul citește `override ?? feed`.

Ecranele din MVP, în ordinea priorității:

1. Furnizori și importuri: status, erori, pornire manuală
2. Coada de review pentru atribute
3. Reguli de compatibilitate și excepții, cu previzualizarea efectului înainte de salvare (câte perechi se schimbă)
4. Comenzi: status, trimitere la furnizor, AWB
5. Ghiduri de utilizare per categorie sau atribut
6. Reguli de adaos

Un `admin_audit_log` minimal (cine, ce, când, valoarea înainte și după) pentru reguli, excepții și prețuri: la o compatibilitate greșită trebuie să știi ce s-a schimbat.

## Alternativele considerate

- **Payload CMS** — legat de Next.js (v3) și își deține propriile tabele, deci două surse de schemă. Contrazice ADR-005.
- **Directus** — se pune peste schema noastră, deci fără lock-in. Dar e un serviciu în plus, iar editorul de compatibilitate tot ar trebui făcut custom.
- **Strapi** — serviciu separat cu tabele proprii și suport TS slab.
- **Sanity** — datele ar sta în afara Postgres, iar ghidurile și compatibilitatea trebuie unite prin join cu produsele.

## Consecințe

- (+) UI-ul diferențiatorului e exact cum trebuie, fără să ne luptăm cu limitele unui CMS.
- (+) O singură schemă, un singur sistem de auth, un singur deploy.
- (−) Estimat 2–3 săptămâni în plus față de un CMS: CRUD, tabele, formulare, upload.
- (−) Fiecare server action din admin trebuie să verifice explicit rolul `admin` (vezi ADR-003).
