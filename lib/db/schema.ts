import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const beansTable = sqliteTable('bean', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  country: text('country').notNull(),
  region: text('region').notNull(),
  farm: text('farm').notNull(),
  process: text('process').notNull(),
  variety: text('variety').notNull(),
  roast: text('roast').notNull(),
  roaster: text('roaster').notNull(),
  notes: text('notes').notNull(),
  created: text('created').notNull(),
  updated: text('updated').notNull(),
})

export const brewsTable = sqliteTable('brew', {
  id: text('id').primaryKey(),
  beanId: text('bean_id').notNull().references(() => beansTable.id),
  beanWeight: real('bean_weight').notNull(),
  beanGrind: real('bean_grind').notNull(),
  waterWeight: real('water_weight').notNull(),
  waterTemp: real('water_temp').notNull(),
  steps: text('steps').notNull(),
  aroma: integer('aroma').notNull(),
  acidity: integer('acidity').notNull(),
  sweetness: integer('sweetness').notNull(),
  body: integer('body').notNull(),
  overall: integer('overall').notNull(),
  notes: text('notes').notNull(),
  created: text('created').notNull(),
  updated: text('updated').notNull(),
})

export const flavorsTable = sqliteTable('flavor', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  subcategory: text('subcategory').notNull(),
  created: text('created').notNull(),
  updated: text('updated').notNull(),
})

export const brewFlavorsTable = sqliteTable('brew_flavor', {
  id: text('id').primaryKey(),
  brewId: text('brew_id').notNull().references(() => brewsTable.id),
  flavorId: text('flavor_id').notNull().references(() => flavorsTable.id),
  created: text('created').notNull(),
  updated: text('updated').notNull(),
})
