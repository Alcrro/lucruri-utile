import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  unique,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { createdAt, id, updatedAt } from './columns';
import {
  attributeDefinitions,
  attributeValueColumns,
  attributeValueConstraints,
} from './attributes';
import { devices } from './devices';
import { supplierOffers } from './suppliers';

export const compatibilityMode = pgEnum('compatibility_mode', [
  'fitment',
  'attributes',
  'fitment_and_attributes',
  'none',
]);

/** Taxonomia noastră (docs/catalog/categories.md). Categoriile furnizorilor se mapează aici. */
export const categories = pgTable(
  'categories',
  {
    id: id(),
    parentId: uuid().references((): AnyPgColumn => categories.id, { onDelete: 'restrict' }),
    slug: text().notNull().unique(),
    name: text().notNull(),
    compatibilityMode: compatibilityMode().notNull().default('none'),
    position: smallint().notNull().default(0),
    isPublished: boolean().notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.parentId)],
);

/** Ce atribute are o categorie. `isRequired`: produsul nu se publică fără ele (PRD 5.1). */
export const categoryAttributes = pgTable(
  'category_attributes',
  {
    categoryId: uuid()
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    attributeId: uuid()
      .notNull()
      .references(() => attributeDefinitions.id, { onDelete: 'cascade' }),
    isRequired: boolean().notNull().default(false),
    isFilterable: boolean().notNull().default(true),
    position: smallint().notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.categoryId, t.attributeId] })],
);

export const productStatus = pgEnum('product_status', [
  'draft',
  'published',
  'unavailable',
  'hidden',
]);

/**
 * Produsul canonic, unul per EAN. Ofertele furnizorilor (supplier_offers) îl alimentează;
 * `primaryOfferId` e oferta aleasă (cea mai ieftină cu stoc). Editările manuale stau în product_overrides.
 */
export const products = pgTable(
  'products',
  {
    id: id(),
    slug: text().notNull().unique(),
    categoryId: uuid().references(() => categories.id, { onDelete: 'restrict' }),
    /** Setat doar dacă produsul vândut ESTE un dispozitiv din catalogul de referință (ADR-008). */
    deviceId: uuid().references(() => devices.id, { onDelete: 'restrict' }),
    ean: text(),
    brand: text(),
    title: text().notNull(),
    description: text(),
    status: productStatus().notNull().default('draft'),
    /** Preț de vânzare cu TVA, în bani. Calculat din oferta principală + reguli de adaos. */
    priceMinor: integer(),
    vatRateBps: integer(),
    primaryOfferId: uuid().references((): AnyPgColumn => supplierOffers.id, {
      onDelete: 'set null',
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('products_ean_unique')
      .on(t.ean)
      .where(sql`${t.ean} is not null`),
    index().on(t.categoryId, t.status),
    check('products_price_positive', sql`${t.priceMinor} is null or ${t.priceMinor} > 0`),
    check(
      'products_published_has_price',
      sql`${t.status} <> 'published' or (${t.priceMinor} is not null and ${t.categoryId} is not null)`,
    ),
  ],
);

/** Editări manuale din admin; sincronizarea din feed nu le atinge (ADR-007). */
export const productOverrides = pgTable('product_overrides', {
  productId: uuid()
    .primaryKey()
    .references(() => products.id, { onDelete: 'cascade' }),
  title: text(),
  description: text(),
  isHidden: boolean().notNull().default(false),
  updatedAt: updatedAt(),
});

export const productAttributes = pgTable(
  'product_attributes',
  {
    id: id(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    ...attributeValueColumns(),
  },
  (t) => [
    unique().on(t.productId, t.attributeId, t.optionId).nullsNotDistinct(),
    ...attributeValueConstraints('product_attributes', t),
  ],
);

export const imageStatus = pgEnum('image_status', ['pending', 'stored', 'failed']);

export const productImages = pgTable(
  'product_images',
  {
    id: id(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    position: smallint().notNull().default(0),
    sourceUrl: text().notNull(),
    /** Cheia în R2 după copiere; null cât timp e `pending`. */
    storageKey: text(),
    contentHash: text(),
    width: integer(),
    height: integer(),
    status: imageStatus().notNull().default('pending'),
    createdAt: createdAt(),
  },
  (t) => [unique().on(t.productId, t.sourceUrl), index().on(t.status)],
);
