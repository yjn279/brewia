import { sql } from 'drizzle-orm'
import { integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { v7 as uuidv7 } from 'uuid'

// --- Auth.js テーブル群（@auth/drizzle-adapter sqlite 最新仕様準拠）---

export const usersTable = sqliteTable('user', {
  id: text('id').notNull().primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: integer('emailVerified', { mode: 'timestamp_ms' }),
  image: text('image'),
})

export const accountsTable = sqliteTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (t) => ({ pk: primaryKey({ columns: [t.provider, t.providerAccountId] }) }),
)

export const sessionsTable = sqliteTable('session', {
  sessionToken: text('sessionToken').notNull().primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
})

export const verificationTokensTable = sqliteTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.identifier, t.token] }) }),
)

export const beansTable = sqliteTable('bean', {
  id: text('id').primaryKey().$defaultFn(() => uuidv7()),
  userId: text('user_id').references(() => usersTable.id),
  name: text('name').notNull(),
  country: text('country').notNull(),
  region: text('region'),
  farm: text('farm'),
  process: text('process'),
  variety: text('variety'),
  roast: text('roast').notNull(),
  roaster: text('roaster'),
  notes: text('notes'),
  created: text('created').notNull().default(sql`CURRENT_TIMESTAMP`),
  updated: text('updated').notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const brewsTable = sqliteTable('brew', {
  id: text('id').primaryKey().$defaultFn(() => uuidv7()),
  userId: text('user_id').references(() => usersTable.id),
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
