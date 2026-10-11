import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { createdAt, id, updatedAt } from './_shared';
import { categories, products } from './catalog';
import { deviceKind, devices } from './devices';

export const ruleTargetKind = pgEnum('rule_target_kind', ['product_category', 'device_kind']);

/**
 * Regulă între o categorie de produse și o categorie țintă sau un tip de dispozitiv (ADR-006, ADR-008).
 * `conditions` e DSL-ul JSON validat în @lu/compatibility. Fiecare condiție are o severitate:
 * `required` (pică → near_miss) sau `degrades` (pică → partial, cu mesaj).
 */
export const compatibilityRules = pgTable(
  'compatibility_rules',
  {
    id: id(),
    name: text().notNull(),
    subjectCategoryId: uuid()
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    targetKind: ruleTargetKind().notNull(),
    targetCategoryId: uuid().references(() => categories.id, { onDelete: 'cascade' }),
    targetDeviceKind: deviceKind(),
    conditions: jsonb().notNull(),
    isActive: boolean().notNull().default(false),
    /** Crește la fiecare modificare; product_compatibility reține versiunea care l-a produs. */
    version: integer().notNull().default(1),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index().on(t.subjectCategoryId),
    check(
      'compatibility_rules_one_target',
      sql`(${t.targetKind} = 'product_category' and ${t.targetCategoryId} is not null and ${t.targetDeviceKind} is null)
       or (${t.targetKind} = 'device_kind' and ${t.targetDeviceKind} is not null and ${t.targetCategoryId} is null)`,
    ),
  ],
);

export const overrideVerdict = pgEnum('override_verdict', [
  'compatible',
  'partial',
  'incompatible',
]);

/** Excepții manuale; au prioritate peste reguli și fitment. */
export const compatibilityOverrides = pgTable(
  'compatibility_overrides',
  {
    id: id(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    targetProductId: uuid().references(() => products.id, { onDelete: 'cascade' }),
    targetDeviceId: uuid().references(() => devices.id, { onDelete: 'cascade' }),
    verdict: overrideVerdict().notNull(),
    note: text().notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    unique().on(t.productId, t.targetProductId, t.targetDeviceId).nullsNotDistinct(),
    check(
      'compatibility_overrides_one_target',
      sql`num_nonnulls(${t.targetProductId}, ${t.targetDeviceId}) = 1`,
    ),
  ],
);

export const compatibilityStatus = pgEnum('compatibility_status', [
  'compatible',
  'partial',
  'near_miss',
]);
export const compatibilitySource = pgEnum('compatibility_source', ['rule', 'fitment', 'override']);

/**
 * Rezultatul materializat: singura tabelă citită de storefront.
 * Perechile produs↔produs se stochează în ambele direcții (ADR-006).
 */
export const productCompatibility = pgTable(
  'product_compatibility',
  {
    id: id(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    targetProductId: uuid().references(() => products.id, { onDelete: 'cascade' }),
    targetDeviceId: uuid().references(() => devices.id, { onDelete: 'cascade' }),
    status: compatibilityStatus().notNull(),
    source: compatibilitySource().notNull(),
    /** Textul afișat clientului: „încarcă la max 15 W: telefonul cere PPS”. Obligatoriu pentru partial / near_miss. */
    reason: text(),
    ruleId: uuid().references(() => compatibilityRules.id, { onDelete: 'cascade' }),
    ruleVersion: integer(),
    computedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique().on(t.productId, t.targetProductId, t.targetDeviceId).nullsNotDistinct(),
    index().on(t.targetDeviceId, t.status),
    index().on(t.targetProductId, t.status),
    check(
      'product_compatibility_one_target',
      sql`num_nonnulls(${t.targetProductId}, ${t.targetDeviceId}) = 1`,
    ),
    check(
      'product_compatibility_reason_when_not_compatible',
      sql`${t.status} = 'compatible' or ${t.reason} is not null`,
    ),
  ],
);
