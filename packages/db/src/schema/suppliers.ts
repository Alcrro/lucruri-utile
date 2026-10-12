import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { createdAt, id, updatedAt } from './columns';
import { attributeDefinitions } from './attributes';
import { categories, products } from './catalog';

export const feedFormat = pgEnum('feed_format', ['xml', 'csv', 'json']);

/**
 * Configurația unui furnizor (ADR-009). `mapping` și `breakerConfig` sunt validate cu Zod
 * în @lu/suppliers. Aici sunt doar stocate.
 */
export const suppliers = pgTable('suppliers', {
  id: id(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  feedUrl: text().notNull(),
  feedFormat: feedFormat().notNull(),
  mapping: jsonb().notNull(),
  breakerConfig: jsonb().notNull().default({}),
  /** Expresie cron pentru pg-boss. */
  importSchedule: text().notNull().default('0 */6 * * *'),
  /** Produsul apare „în stoc” doar de la acest prag (ADR-009). */
  stockBuffer: smallint().notNull().default(3),
  orderEmail: text(),
  isActive: boolean().notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const offerStatus = pgEnum('offer_status', ['active', 'missing']);

/** Ce oferă un furnizor pentru un SKU, exact cum vine din feed (normalizat). */
export const supplierOffers = pgTable(
  'supplier_offers',
  {
    id: id(),
    supplierId: uuid()
      .notNull()
      .references(() => suppliers.id, { onDelete: 'restrict' }),
    supplierSku: text().notNull(),
    /** Null până când oferta e legată de un produs canonic (după EAN sau manual). */
    productId: uuid().references(() => products.id, { onDelete: 'set null' }),
    ean: text(),
    costPriceMinor: integer().notNull(),
    costIncludesVat: boolean().notNull(),
    stock: integer(),
    supplierCategoryPath: text(),
    raw: jsonb().notNull(),
    /** Hash al înregistrării normalizate. Doar o schimbare de hash declanșează recalculări. */
    contentHash: text().notNull(),
    status: offerStatus().notNull().default('active'),
    lastSeenAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique().on(t.supplierId, t.supplierSku),
    index().on(t.productId),
    index().on(t.ean),
    check('supplier_offers_cost_positive', sql`${t.costPriceMinor} > 0`),
  ],
);

/** Categoria furnizorului → taxonomia noastră. `categoryId` null + !isIgnored = nemapată → în review. */
export const supplierCategoryMap = pgTable(
  'supplier_category_map',
  {
    supplierId: uuid()
      .notNull()
      .references(() => suppliers.id, { onDelete: 'cascade' }),
    supplierCategoryPath: text().notNull(),
    categoryId: uuid().references(() => categories.id, { onDelete: 'set null' }),
    isIgnored: boolean().notNull().default(false),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.supplierId, t.supplierCategoryPath] })],
);

export const importRunStatus = pgEnum('import_run_status', [
  'running',
  'succeeded',
  'not_modified',
  'failed',
  'aborted_by_breaker',
]);

export const importRuns = pgTable(
  'import_runs',
  {
    id: id(),
    supplierId: uuid()
      .notNull()
      .references(() => suppliers.id, { onDelete: 'cascade' }),
    status: importRunStatus().notNull().default('running'),
    startedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp({ withTimezone: true }),
    itemsTotal: integer().notNull().default(0),
    itemsInvalid: integer().notNull().default(0),
    itemsChanged: integer().notNull().default(0),
    itemsMissing: integer().notNull().default(0),
    breakerReason: text(),
    /** Copia brută a feed-ului în R2, pentru debugging și reimport. */
    rawStorageKey: text(),
    etag: text(),
    lastModified: text(),
  },
  (t) => [index().on(t.supplierId, t.startedAt)],
);

export const importErrors = pgTable(
  'import_errors',
  {
    id: id(),
    importRunId: uuid()
      .notNull()
      .references(() => importRuns.id, { onDelete: 'cascade' }),
    supplierSku: text(),
    message: text().notNull(),
    raw: jsonb(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.importRunId)],
);

export const reviewKind = pgEnum('review_kind', ['attribute_value', 'fitment', 'category']);
export const reviewStatus = pgEnum('review_status', ['open', 'resolved', 'ignored']);

/**
 * Coada de review din admin: tot ce normalizarea n-a putut rezolva singură.
 * `dedupeKey` împiedică aceeași problemă să apară de N ori cât timp e deschisă.
 */
export const reviewQueue = pgTable(
  'review_queue',
  {
    id: id(),
    kind: reviewKind().notNull(),
    status: reviewStatus().notNull().default('open'),
    dedupeKey: text().notNull(),
    supplierId: uuid().references(() => suppliers.id, { onDelete: 'cascade' }),
    productId: uuid().references(() => products.id, { onDelete: 'cascade' }),
    attributeId: uuid().references(() => attributeDefinitions.id, { onDelete: 'cascade' }),
    rawValue: text().notNull(),
    context: jsonb(),
    occurrences: integer().notNull().default(1),
    resolvedAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('review_queue_open_dedupe')
      .on(t.dedupeKey)
      .where(sql`${t.status} = 'open'`),
    index().on(t.kind, t.status),
  ],
);
