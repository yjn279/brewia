import { sql } from 'drizzle-orm'
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { v7 as uuidv7 } from 'uuid'

export const usersTable = sqliteTable('user', {
  id: text('id').primaryKey().$defaultFn(() => uuidv7()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  passwordSalt: text('password_salt').notNull(),
  created: text('created').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated: text('updated').notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const sessionsTable = sqliteTable('session', {
  id: text('id').primaryKey().$defaultFn(() => uuidv7()),
  userId: text('user_id').notNull().references(() => usersTable.id),
  expiresAt: text('expires_at').notNull(),
  created: text('created').notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const beansTable = sqliteTable('bean', {
  id: text('id').primaryKey().$defaultFn(() => uuidv7()),
  userId: text('user_id').notNull().references(() => usersTable.id),
  name: text('name').notNull(),
  country: text('country').notNull(),
  region: text('region'),
  farm: text('farm'),
  process: text('process'),
  variety: text('variety'),
  roast: text('roast').notNull(),
  roaster: text('roaster'),
  priceJpy: integer('price_jpy'),
  notes: text('notes'),
  created: text('created').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated: text('updated').notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const brewsTable = sqliteTable('brew', {
  id: text('id').primaryKey().$defaultFn(() => uuidv7()),
  userId: text('user_id').notNull().references(() => usersTable.id),
  beanId: text('bean_id').notNull().references(() => beansTable.id),
  beanWeight: real('bean_weight').notNull(),
  beanGrind: real('bean_grind'),
  waterWeight: real('water_weight').notNull(),
  waterTemp: real('water_temp'),
  steps: text('steps').notNull(),
  aroma: integer('aroma').notNull(),
  acidity: integer('acidity').notNull(),
  sweetness: integer('sweetness').notNull(),
  body: integer('body').notNull(),
  overall: integer('overall').notNull(),
  notes: text('notes'),
  created: text('created').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated: text('updated').notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const flavorsTable = sqliteTable('flavor', {
  id: text('id').primaryKey().$defaultFn(() => uuidv7()),
  name: text('name').notNull(),
  category: text('category').notNull(),
  subcategory: text('subcategory').notNull(),
  created: text('created').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated: text('updated').notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const brewFlavorsTable = sqliteTable('brew_flavor', {
  id: text('id').primaryKey().$defaultFn(() => uuidv7()),
  brewId: text('brew_id').notNull().references(() => brewsTable.id),
  flavorId: text('flavor_id').notNull().references(() => flavorsTable.id),
  created: text('created').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated: text('updated').notNull().default(sql`CURRENT_TIMESTAMP`),
})
