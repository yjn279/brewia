import 'server-only'

import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db/drizzle'
import { brewFlavorsTable, brewsTable, flavorsTable } from '@/lib/db/schema'
import type { Flavor } from '@/lib/types'

function mapFlavorRow(row: typeof flavorsTable.$inferSelect): Flavor {
  return row
}

export async function getFlavors(): Promise<Flavor[]> {
  const rows = await db
    .select()
    .from(flavorsTable)
    .orderBy(asc(flavorsTable.name))

  return rows.map(mapFlavorRow)
}

export async function getFlavorsByBrewId(brewId: string): Promise<Flavor[]> {
  const rows = await db
    .select({ flavor: flavorsTable })
    .from(brewFlavorsTable)
    .innerJoin(flavorsTable, eq(flavorsTable.id, brewFlavorsTable.flavorId))
    .where(eq(brewFlavorsTable.brewId, brewId))
    .orderBy(asc(flavorsTable.name))

  return rows.map((row) => mapFlavorRow(row.flavor))
}

export async function getFlavorMapByBeanId(beanId: string): Promise<Map<string, Flavor[]>> {
  const rows = await db
    .select({ brewId: brewFlavorsTable.brewId, flavor: flavorsTable })
    .from(brewFlavorsTable)
    .innerJoin(flavorsTable, eq(flavorsTable.id, brewFlavorsTable.flavorId))
    .innerJoin(brewsTable, eq(brewsTable.id, brewFlavorsTable.brewId))
    .where(eq(brewsTable.beanId, beanId))
    .orderBy(asc(flavorsTable.name))

  const flavorsByBrewId = new Map<string, Flavor[]>()

  for (const row of rows) {
    const list = flavorsByBrewId.get(row.brewId) ?? []
    list.push(mapFlavorRow(row.flavor))
    flavorsByBrewId.set(row.brewId, list)
  }

  return flavorsByBrewId
}
