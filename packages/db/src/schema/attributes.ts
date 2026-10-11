import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  doublePrecision,
  index,
  pgEnum,
  pgTable,
  smallint,
  text,
  unique,
  uuid,
  type PgColumn,
} from 'drizzle-orm/pg-core';
import { createdAt, id } from './_shared';

export const attributeType = pgEnum('attribute_type', ['enum', 'number', 'boolean', 'text']);
export const attributeScope = pgEnum('attribute_scope', ['product', 'device', 'both']);

/** Atributele canonice (ADR-006). `key` e stabil și folosit în regulile de compatibilitate. */
export const attributeDefinitions = pgTable('attribute_definitions', {
  id: id(),
  key: text().notNull().unique(),
  label: text().notNull(),
  type: attributeType().notNull(),
  unit: text(),
  /** Doar pentru `enum`: mai multe valori per entitate (ex. protocoale de încărcare PD + PPS + QC). */
  isMulti: boolean().notNull().default(false),
  scope: attributeScope().notNull().default('both'),
  createdAt: createdAt(),
});

export const attributeOptions = pgTable(
  'attribute_options',
  {
    id: id(),
    attributeId: uuid()
      .notNull()
      .references(() => attributeDefinitions.id, { onDelete: 'cascade' }),
    key: text().notNull(),
    label: text().notNull(),
    position: smallint().notNull().default(0),
  },
  (t) => [unique().on(t.attributeId, t.key)],
);

/**
 * Dicționarul de normalizare: valoare brută din feed → valoare canonică.
 * Se populează la rezolvarea cozii de review, așa că următorul import o recunoaște automat.
 */
export const attributeValueAliases = pgTable(
  'attribute_value_aliases',
  {
    id: id(),
    attributeId: uuid()
      .notNull()
      .references(() => attributeDefinitions.id, { onDelete: 'cascade' }),
    /** Normalizat: lowercase, fără diacritice, spații comprimate. */
    rawValue: text().notNull(),
    optionId: uuid().references(() => attributeOptions.id, { onDelete: 'cascade' }),
    valueNumber: doublePrecision(),
    valueBool: boolean(),
    createdAt: createdAt(),
  },
  (t) => [
    unique().on(t.attributeId, t.rawValue),
    check(
      'attribute_value_aliases_one_value',
      sql`num_nonnulls(${t.optionId}, ${t.valueNumber}, ${t.valueBool}) = 1`,
    ),
  ],
);

/**
 * Coloanele de valoare tipizate, comune pentru product_attributes și device_attributes.
 * Exact una e populată (CHECK). Pentru atributele multi-enum există câte un rând per opțiune.
 */
export const attributeValueColumns = () => ({
  attributeId: uuid()
    .notNull()
    .references(() => attributeDefinitions.id, { onDelete: 'restrict' }),
  optionId: uuid().references(() => attributeOptions.id, { onDelete: 'restrict' }),
  valueNumber: doublePrecision(),
  valueBool: boolean(),
  valueText: text(),
});

type AttributeValueColumns = Record<
  'attributeId' | 'optionId' | 'valueNumber' | 'valueBool' | 'valueText',
  PgColumn
>;

export const attributeValueConstraints = (table: string, t: AttributeValueColumns) => [
  check(
    `${table}_one_value`,
    sql`num_nonnulls(${t.optionId}, ${t.valueNumber}, ${t.valueBool}, ${t.valueText}) = 1`,
  ),
  index(`${table}_attr_option_idx`).on(t.attributeId, t.optionId),
  index(`${table}_attr_number_idx`).on(t.attributeId, t.valueNumber),
];
