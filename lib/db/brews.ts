import 'server-only'

import { count, desc, eq } from 'drizzle-orm'
import { getBeanById } from '@/lib/db/beans'
import { db } from '@/lib/db/drizzle'
import { brewsTable } from '@/lib/db/schema'
import { getFlavorMapByBeanId, getFlavorsByBrewId } from '@/lib/db/flavors'
import { parseSteps } from '@/lib/db/row-utils'
import type { Brew, BrewWithBean } from '@/lib/types'

function mapBrewRow(row: typeof brewsTable.$inferSelect): Brew {
  return {
    ...row,
    steps: parseSteps(row.steps),
  }
}

export async function getBrews(): Promise<Brew[]> {
  const rows = await db
    .select()
    .from(brewsTable)
    .orderBy(desc(brewsTable.created))

  return rows.map(mapBrewRow)
}

export async function getBrewCountByBeanIdMap(): Promise<Map<string, number>> {
  const rows = await db
    .select({ beanId: brewsTable.beanId, brewCount: count(brewsTable.id) })
    .from(brewsTable)
    .groupBy(brewsTable.beanId)

  return new Map(rows.map((row) => [row.beanId, row.brewCount]))
}

export async function getBrewsByBeanId(beanId: string): Promise<BrewWithBean[]> {
  const [bean, brewRows, flavorByBrewId] = await Promise.all([
    getBeanById(beanId),
    db
      .select()
      .from(brewsTable)
      .where(eq(brewsTable.beanId, beanId))
      .orderBy(desc(brewsTable.created)),
    getFlavorMapByBeanId(beanId),
  ])

  if (!bean) {
    return []
  }

  return brewRows.map((row) => {
    const brew = mapBrewRow(row)
    return {
      ...brew,
      bean,
      flavors: flavorByBrewId.get(brew.id) ?? [],
    }
  })
}

export async function getBrewById(id: string): Promise<BrewWithBean | undefined> {
  const [brewRow] = await db
    .select()
    .from(brewsTable)
    .where(eq(brewsTable.id, id))
    .limit(1)

  if (!brewRow) {
    return undefined
  }

  const brew = mapBrewRow(brewRow)
  const [bean, flavors] = await Promise.all([
    getBeanById(brew.beanId),
    getFlavorsByBrewId(id),
  ])

  if (!bean) {
    return undefined
  }

  return {
    ...brew,
    bean,
    flavors,
  }
}
