---
name: lu-adr
description: Scrie un ADR nou în docs/decisions/ sau înlocuiește unul existent (Superseded), în formatul proiectului lucruri-utile.
argument-hint: <subiectul deciziei> | supersede <nr> <subiect>
disable-model-invocation: true
---

# ADR: $ARGUMENTS

Un ADR e pentru decizii **greu de schimbat ulterior** (schemă, granițe între module, furnizori externi, fluxuri de bani, securitate). O decizie locală unui feature stă în „Decizii locale” din `tech-spec.md`, nu aici.

## 1. Context

- Citește titlurile tuturor ADR-urilor din `docs/decisions/` și integral pe cele atinse de decizie.
- Citește secțiunile relevante din `docs/prd.md` și `docs/architecture.md`.
- Decizia contrazice un ADR existent? Atunci e un **supersede**, nu un ADR paralel.

## 2. Discuția înainte de scriere

Prezintă în chat, pe scurt: problema, 2-3 opțiuni reale cu trade-off-urile lor și recomandarea ta, argumentată. Nu scrie fișierul până nu e aleasă o opțiune. Dacă îți lipsesc date (prețuri, limite, documentație externă), spune ce lipsește în loc să presupui.

## 3. Fișierul

Numărul = următorul liber, pe 3 cifre. Nume: `docs/decisions/<nnn>-<slug-scurt>.md`.

```markdown
# ADR-<nnn>: <Decizia, formulată ca afirmație>

## Status

Accepted — <YYYY-MM-DD>

## Context

- Constrângerile și faptele care forțează decizia (cu referințe la PRD / alte ADR-uri).

## Decizie

Ce s-a ales, concret: valori, limite, fluxuri. Suficient de precis ca să poată fi verificat în cod.

## Alternativele considerate

- **<Opțiunea A>** — de ce nu.
- **<Opțiunea B>** — de ce nu.

## Consecințe

- Ce câștigăm, ce pierdem, ce devine mai greu.
- Ce ar declanșa revizuirea deciziei (prag, eveniment).
```

## 4. Supersede

- ADR-ul vechi **nu se șterge și nu se rescrie**: statusul devine `Superseded by ADR-<nnn> — <data>`.
- ADR-ul nou explică în Context ce s-a schimbat față de cel vechi.

## 5. Propagare

Actualizează ce depinde de decizie și listează fișierele în răspuns: `CLAUDE.md` (dacă schimbă o regulă nenegociabilă), `docs/architecture.md`, `docs/structure.md`, `docs/infrastructure.md`, `docs/prd.md`, spec-urile din `docs/features/` afectate.
