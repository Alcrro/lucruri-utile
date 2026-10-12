import {
  boolean,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { createdAt, id, updatedAt } from './columns';
import { attributeValueColumns, attributeValueConstraints } from './attributes';
import { products } from './catalog';

export const deviceKind = pgEnum('device_kind', [
  'phone',
  'tablet',
  'laptop',
  'printer',
  'vacuum',
  'coffee_machine',
  'water_filter_jug',
  'power_tool_platform',
]);

/**
 * Catalogul de referință (ADR-008). Un rând = varianta care schimbă compatibilitatea
 * (iPhone 15 ≠ 15 Pro; ThinkPad T14 Gen 4 Intel ≠ AMD). Stocarea și culoarea nu se modelează.
 */
export const devices = pgTable('devices', {
  id: id(),
  slug: text().notNull().unique(),
  kind: deviceKind().notNull(),
  brand: text().notNull(),
  series: text(),
  model: text().notNull(),
  /** Generație / platformă, unde contează (laptopuri). */
  variant: text(),
  releaseYear: smallint(),
  isPublished: boolean().notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** Variante de scriere pentru parsarea titlurilor din feed. Un alias ambiguu nu e permis (unique). */
export const deviceAliases = pgTable('device_aliases', {
  id: id(),
  deviceId: uuid()
    .notNull()
    .references(() => devices.id, { onDelete: 'cascade' }),
  /** Normalizat: lowercase, fără diacritice, spațiu între litere și cifre. */
  alias: text().notNull().unique(),
  createdAt: createdAt(),
});

export const deviceAttributes = pgTable(
  'device_attributes',
  {
    id: id(),
    deviceId: uuid()
      .notNull()
      .references(() => devices.id, { onDelete: 'cascade' }),
    ...attributeValueColumns(),
  },
  (t) => [
    unique().on(t.deviceId, t.attributeId, t.optionId).nullsNotDistinct(),
    ...attributeValueConstraints('device_attributes', t),
  ],
);

export const fitmentSource = pgEnum('fitment_source', ['feed_parse', 'manual']);

/** Fitment explicit: produsul se potrivește fizic pe acest model (husă, folie, cartuș). */
export const productFitments = pgTable(
  'product_fitments',
  {
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    deviceId: uuid()
      .notNull()
      .references(() => devices.id, { onDelete: 'cascade' }),
    source: fitmentSource().notNull(),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.productId, t.deviceId] }), index().on(t.deviceId)],
);
