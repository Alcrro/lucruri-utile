import { describe, expect } from 'vitest';
import { test } from '../testing';
import { products } from './catalog';

/** Eroarea Postgres ajunge în `cause` (Drizzle o împachetează în DrizzleQueryError). */
const violates = (constraint: string) => ({ cause: expect.objectContaining({ constraint }) });

describe('products — integritate în DB (ADR-002)', () => {
  test('un produs publicat fără preț și categorie e respins', async ({ db }) => {
    await expect(
      db.insert(products).values({ slug: 'fara-pret', title: 'Fără preț', status: 'published' }),
    ).rejects.toMatchObject(violates('products_published_has_price'));
  });

  test('prețul trebuie să fie pozitiv', async ({ db }) => {
    await expect(
      db.insert(products).values({ slug: 'pret-zero', title: 'Preț zero', priceMinor: 0 }),
    ).rejects.toMatchObject(violates('products_price_positive'));
  });

  test('EAN-ul e unic, dar mai multe produse fără EAN sunt permise', async ({ db }) => {
    await db.insert(products).values([
      { slug: 'fara-ean-1', title: 'A' },
      { slug: 'fara-ean-2', title: 'B' },
      { slug: 'cu-ean', title: 'C', ean: '5901234123457' },
    ]);

    await expect(
      db.insert(products).values({ slug: 'cu-ean-dublat', title: 'D', ean: '5901234123457' }),
    ).rejects.toMatchObject(violates('products_ean_unique'));
  });
});

// Același slug în două teste: trec amândouă doar dacă fiecare test își anulează tranzacția.
describe('fixture-ul db — izolare între teste', () => {
  for (const n of [1, 2]) {
    test(`inserarea ${n} nu vede datele celeilalte`, async ({ db }) => {
      await db.insert(products).values({ slug: 'izolare', title: `Izolare ${n}` });
      expect(await db.$count(products)).toBe(1);
    });
  }
});
