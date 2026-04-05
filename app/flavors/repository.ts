import 'server-only'

import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db/drizzle'
import { brewFlavorsTable, brewsTable, flavorsTable } from '@/lib/db/schema'
import type { Flavor } from '@/lib/types'

function isMissingFlavorTableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return message.includes('no such table') && message.includes('flavor')
}

function mapFlavorRow(row: typeof flavorsTable.$inferSelect): Flavor {
  return row
}

export class FlavorsRepository {
  async findAll(): Promise<Flavor[]> {
    try {
      const rows = await db
        .select()
        .from(flavorsTable)
        .orderBy(asc(flavorsTable.name))

      return rows.map(mapFlavorRow)
    } catch (error) {
      if (isMissingFlavorTableError(error)) {
        return []
      }

      throw error
    }
  }

  async findByBrewId(brewId: string): Promise<Flavor[]> {
    try {
      const rows = await db
        .select({ flavor: flavorsTable })
        .from(brewFlavorsTable)
        .innerJoin(flavorsTable, eq(flavorsTable.id, brewFlavorsTable.flavorId))
        .where(eq(brewFlavorsTable.brewId, brewId))
        .orderBy(asc(flavorsTable.name))

      return rows.map((row) => mapFlavorRow(row.flavor))
    } catch (error) {
      if (isMissingFlavorTableError(error)) {
        return []
      }

      throw error
    }
  }

  async findMapByBeanId(beanId: string): Promise<Map<string, Flavor[]>> {
    let rows: Array<{ brewId: string; flavor: typeof flavorsTable.$inferSelect }> = []

    try {
      rows = await db
        .select({ brewId: brewFlavorsTable.brewId, flavor: flavorsTable })
        .from(brewFlavorsTable)
        .innerJoin(flavorsTable, eq(flavorsTable.id, brewFlavorsTable.flavorId))
        .innerJoin(brewsTable, eq(brewsTable.id, brewFlavorsTable.brewId))
        .where(eq(brewsTable.beanId, beanId))
        .orderBy(asc(flavorsTable.name))
    } catch (error) {
      if (!isMissingFlavorTableError(error)) {
        throw error
      }
    }

    const flavorsByBrewId = new Map<string, Flavor[]>()

    for (const row of rows) {
      const list = flavorsByBrewId.get(row.brewId) ?? []
      list.push(mapFlavorRow(row.flavor))
      flavorsByBrewId.set(row.brewId, list)
    }

    return flavorsByBrewId
  }
}
