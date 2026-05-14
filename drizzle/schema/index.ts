/**
 * Drizzle ORM schema for Brewia (Supabase / Postgres)
 *
 * NOTE: Auth tables (user, session, account) are managed by Supabase Auth
 * and are NOT declared here.  Row-level foreign references to auth.users(id)
 * are expressed in the raw SQL migrations (drizzle/0000_init.sql), NOT here.
 * This file is the source of truth for table structure review.
 */

import {
  integer,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { v7 as uuidv7 } from 'uuid'

// ---------------------------------------------------------------------------
// Bean
// ---------------------------------------------------------------------------

export const beansTable = pgTable('bean', {
  id: text('id').primaryKey().$defaultFn(() => uuidv7()),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  country: text('country').notNull(),
  region: text('region').notNull().default(''),
  farm: text('farm').notNull().default(''),
  process: text('process').notNull().default(''),
  variety: text('variety').notNull().default(''),
  roast: text('roast').notNull(),
  roaster: text('roaster').notNull().default(''),
  priceJpy: integer('price_jpy').notNull().default(0),
  notes: text('notes').notNull().default(''),
  created: timestamp('created', { withTimezone: true }).notNull().defaultNow(),
  updated: timestamp('updated', { withTimezone: true }).notNull().defaultNow(),
})

// ---------------------------------------------------------------------------
// Brew
// ---------------------------------------------------------------------------

export const brewsTable = pgTable('brew', {
  id: text('id').primaryKey().$defaultFn(() => uuidv7()),
  userId: uuid('user_id').notNull(),
  beanId: text('bean_id').notNull(),
  beanWeight: real('bean_weight').notNull(),
  beanGrind: real('bean_grind').notNull().default(0),
  waterWeight: real('water_weight').notNull(),
  waterTemp: real('water_temp').notNull().default(0),
  /** JSON-stringified BrewStep[] */
  steps: text('steps').notNull(),
  aroma: integer('aroma').notNull(),
  acidity: integer('acidity').notNull(),
  sweetness: integer('sweetness').notNull(),
  body: integer('body').notNull(),
  overall: integer('overall').notNull(),
  notes: text('notes').notNull().default(''),
  created: timestamp('created', { withTimezone: true }).notNull().defaultNow(),
  updated: timestamp('updated', { withTimezone: true }).notNull().defaultNow(),
})

// ---------------------------------------------------------------------------
// Flavor (master – read-only for app users)
// ---------------------------------------------------------------------------

export const flavorsTable = pgTable('flavor', {
  id: text('id').primaryKey().$defaultFn(() => uuidv7()),
  name: text('name').notNull(),
  category: text('category').notNull(),
  subcategory: text('subcategory').notNull(),
  created: timestamp('created', { withTimezone: true }).notNull().defaultNow(),
  updated: timestamp('updated', { withTimezone: true }).notNull().defaultNow(),
})

// ---------------------------------------------------------------------------
// BrewFlavor (join)
// ---------------------------------------------------------------------------

export const brewFlavorsTable = pgTable('brew_flavor', {
  id: text('id').primaryKey().$defaultFn(() => uuidv7()),
  brewId: text('brew_id').notNull(),
  flavorId: text('flavor_id').notNull(),
  created: timestamp('created', { withTimezone: true }).notNull().defaultNow(),
  updated: timestamp('updated', { withTimezone: true }).notNull().defaultNow(),
})

// ---------------------------------------------------------------------------
// Preset (renamed from brew_preset via 0001 migration)
// ---------------------------------------------------------------------------

export const presetTable = pgTable('preset', {
  id: text('id').primaryKey().$defaultFn(() => uuidv7()),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  brewRatio: real('brew_ratio').notNull().default(0),
  /** JSON-stringified BrewStep[] */
  steps: text('steps').notNull(),
  created: timestamp('created', { withTimezone: true }).notNull().defaultNow(),
  updated: timestamp('updated', { withTimezone: true }).notNull().defaultNow(),
})
