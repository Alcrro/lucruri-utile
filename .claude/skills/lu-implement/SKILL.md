---
name: lu-implement
description: Implementează un feature lucruri-utile checkpoint cu checkpoint, după docs/features/<feature>/todos.md. Reia automat de unde a rămas.
argument-hint: <feature-slug>
disable-model-invocation: true
---

# Implement: $ARGUMENTS

## 1. Precondiții

- `docs/features/$ARGUMENTS/tech-spec.md` și `todos.md` trebuie să existe. Dacă lipsesc → oprește-te și propune `/lu-spec $ARGUMENTS`.
- Spec-ul are statusul `draft` → întreabă dacă e aprobat înainte de a începe.
- Găsește primul CP nebifat (`- [ ]`). Dacă există CP-uri bifate, spune de unde reiei și verifică cu `git status` / `git diff` că starea codului corespunde.

## 2. Citește înainte de primul rând de cod

- `CLAUDE.md` — regulile nenegociabile; le aplici fără să le rediscuți.
- `docs/structure.md` și ADR-011 — structura pachetelor (logică pură / `*.queries.ts` / `*.service.ts`), denumiri, atomic design, testare. ESLint impune o parte din ele; restul le respecți tu.
- ADR-urile din antetul spec-ului.
- Toate fișierele pe care le vei modifica. Nu scrii în fișiere necitite.
- Cod Next.js: ghidul relevant din `apps/web/node_modules/next/dist/docs/` (versiunea 16.4 diferă de ce știi). Turborepo: `docs/` din pachetul `turbo` instalat.
- Schimbare de schemă: urmezi skill-ul `lu-schema`.
- Pachet nou: urmezi skill-ul `lu-package`.

## 3. Execuția unui CP

1. Anunță: `→ CP<N>: <titlu>`.
2. **Testele întâi** pentru logica pură (reguli de compatibilitate, parsare, mașini de stări) și pentru idempotență: scrie testul, vezi-l picând, apoi implementează. Logica de business care ajunge într-un `*.queries.ts` sau `*.service.ts` se mută într-un fișier pur.
3. Implementează **doar** ce e în scope-ul CP-ului.
4. Verifică:
   - `pnpm --filter <pachet-afectat> test`
   - `pnpm typecheck && pnpm lint`
5. Bifează CP-ul în `todos.md`, cu o notă de un rând dacă ai deviat de la spec.
6. Raportează și **oprește-te**:

```
✓ CP<N> — <titlu>
Modificat:
  - <fișier>: <ce s-a schimbat concret>
Teste: <ce teste noi, rezultat>
Deviere de la spec: <niciuna | ce și de ce — spec actualizat>

Urmează CP<N+1>: <titlu>. Continuăm?
```

Nu treci la CP-ul următor fără „ok” explicit.

## 4. Reguli stricte

- Fără modificări în afara fișierelor din CP. Dacă îți trebuie altceva, oprește-te și spune.
- Ceva neașteptat (bug, cod care contrazice docs, ADR care nu se potrivește) → oprește-te și raportează. Nu „repari în treacăt”.
- Un CP care nu trece verificarea nu e gata. Se repară în același CP.
- Nu slăbești și nu ștergi un test ca să treacă. Dacă testul e greșit, spui de ce și ceri confirmare.
- Spec-ul se dovedește greșit → actualizezi `tech-spec.md` în același CP și spui explicit asta în raport.
- Nu faci commit fără cerere explicită.

## 5. Finalul feature-ului

După ultimul CP:

1. `pnpm typecheck && pnpm lint && pnpm test && pnpm build`. Dacă feature-ul are UI: `pnpm test:e2e`.
2. Bifează acceptance criteria din `docs/prd.md` acoperite de feature și spune care nu sunt.
3. Propune un mesaj de commit (`feat(<scope>): …`) și `/code-review`. Pentru auth, plăți sau webhook-uri: și `/security-review`.
