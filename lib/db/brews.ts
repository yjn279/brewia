import 'server-only'

import { and, count, desc, eq } from 'drizzle-orm'
import { getBeanById } from '@/lib/db/beans'
import { db } from '@/lib/db/drizzle'
import { brewFlavorsTable, brewsTable } from '@/lib/db/schema'
import { getFlavorMapByBeanId, getFlavorsByBrewId } from '@/lib/db/flavors'
import { parseSteps } from '@/lib/db/row-utils'
import type { Brew, BrewStep, BrewWithBean } from '@/lib/types'

function mapBrewRow(row: typeof brewsTable.$inferSelect): Brew {
  return {
    ...row,
    steps: parseSteps(row.steps),
  }
}

export async function getBrews(userId: string): Promise<Brew[]> {
  const rows = await db
    .select()
    .from(brewsTable)
    .where(eq(brewsTable.userId, userId))
    .orderBy(desc(brewsTable.created))

  return rows.map(mapBrewRow)
}

export async function getBrewCountByBeanIdMap(userId: string): Promise<Map<string, number>> {
  const rows = await db
    .select({ beanId: brewsTable.beanId, brewCount: count(brewsTable.id) })
    .from(brewsTable)
    .where(eq(brewsTable.userId, userId))
    .groupBy(brewsTable.beanId)

  return new Map(rows.map((row) => [row.beanId, row.brewCount]))
}

export async function getBrewsByBeanId(beanId: string, userId: string): Promise<BrewWithBean[]> {
  const [bean, brewRows, flavorByBrewId] = await Promise.all([
    getBeanById(beanId, userId),
    db
      .select()
      .from(brewsTable)
      .where(and(eq(brewsTable.beanId, beanId), eq(brewsTable.userId, userId)))
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

export async function getBrewById(id: string, userId: string): Promise<BrewWithBean | undefined> {
  const [brewRow] = await db
    .select()
    .from(brewsTable)
    .where(and(eq(brewsTable.id, id), eq(brewsTable.userId, userId)))
    .limit(1)

  if (!brewRow) {
    return undefined
  }

  const brew = mapBrewRow(brewRow)
  const [bean, flavors] = await Promise.all([
    getBeanById(brew.beanId, userId),
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

interface CreateBrewInput {
  userId: string
  beanId: string
  beanWeight: number
  beanGrind: number | null
  waterWeight: number
  waterTemp: number | null
  steps: BrewStep[]
  aroma: number
  acidity: number
  sweetness: number
  body: number
  overall: number
  notes: string | null
  flavorIds: string[]
}

export async function createBrew(input: CreateBrewInput): Promise<Brew> {
  return db.transaction(async (tx) => {
    const [brewRow] = await tx
      .insert(brewsTable)
      .values({
        userId: input.userId,
        beanId: input.beanId,
        beanWeight: input.beanWeight,
        beanGrind: input.beanGrind,
        waterWeight: input.waterWeight,
        waterTemp: input.waterTemp,
        steps: JSON.stringify(input.steps),
        aroma: input.aroma,
        acidity: input.acidity,
        sweetness: input.sweetness,
        body: input.body,
        overall: input.overall,
        notes: input.notes,
      })
      .returning()

    if (input.flavorIds.length > 0) {
      await tx.insert(brewFlavorsTable).values(
        input.flavorIds.map((flavorId) => ({
          brewId: brewRow.id,
          flavorId,
        }))
      )
    }

    return mapBrewRow(brewRow)
  })
}
