import 'server-only'

import { and, count, desc, eq } from 'drizzle-orm'
import type { Brew, BrewStep, BrewWithBean } from '@/lib/types'
import { db } from '@/lib/db/drizzle'
import { brewFlavorsTable, brewsTable } from '@/lib/db/schema'
import { parseSteps } from '@/lib/db/row-utils'
import { BeansRepository } from '@/app/beans/repository'
import { FlavorsRepository } from '@/app/flavors/repository'

export interface BrewMutationInput {
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
  notes: string
  flavorIds: string[]
}

function mapBrewRow(row: typeof brewsTable.$inferSelect): Brew {
  return {
    ...row,
    steps: parseSteps(row.steps),
  }
}

const beansRepository = new BeansRepository()
const flavorsRepository = new FlavorsRepository()

export class BrewsRepository {
  async findAll(userId: string): Promise<Brew[]> {
    const rows = await db
      .select()
      .from(brewsTable)
      .where(eq(brewsTable.userId, userId))
      .orderBy(desc(brewsTable.created))

    return rows.map(mapBrewRow)
  }

  async findCountByBeanIdMap(userId: string): Promise<Map<string, number>> {
    const rows = await db
      .select({ beanId: brewsTable.beanId, brewCount: count(brewsTable.id) })
      .from(brewsTable)
      .where(eq(brewsTable.userId, userId))
      .groupBy(brewsTable.beanId)

    return new Map(rows.map((row) => [row.beanId, row.brewCount]))
  }

  async findByBeanId(beanId: string, userId: string): Promise<BrewWithBean[]> {
    const [bean, brewRows, flavorByBrewId] = await Promise.all([
      beansRepository.findById(beanId, userId),
      db
        .select()
        .from(brewsTable)
        .where(and(eq(brewsTable.beanId, beanId), eq(brewsTable.userId, userId)))
        .orderBy(desc(brewsTable.created)),
      flavorsRepository.findMapByBeanId(beanId),
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

  async findById(id: string, userId: string): Promise<BrewWithBean | undefined> {
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
      beansRepository.findById(brew.beanId, userId),
      flavorsRepository.findByBrewId(id),
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

  async create(userId: string, input: BrewMutationInput): Promise<Brew> {
    return db.transaction(async (tx) => {
      const [brewRow] = await tx
        .insert(brewsTable)
        .values({
          userId,
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

  async update(id: string, userId: string, input: BrewMutationInput): Promise<Brew | undefined> {
    return db.transaction(async (tx) => {
      const [brewRow] = await tx
        .update(brewsTable)
        .set({
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
          updated: new Date().toISOString(),
        })
        .where(and(eq(brewsTable.id, id), eq(brewsTable.userId, userId)))
        .returning()

      if (!brewRow) {
        return undefined
      }

      await tx
        .delete(brewFlavorsTable)
        .where(eq(brewFlavorsTable.brewId, id))

      if (input.flavorIds.length > 0) {
        await tx.insert(brewFlavorsTable).values(
          input.flavorIds.map((flavorId) => ({
            brewId: id,
            flavorId,
          }))
        )
      }

      return mapBrewRow(brewRow)
    })
  }

  async delete(id: string, userId: string): Promise<boolean> {
    return db.transaction(async (tx) => {
      await tx
        .delete(brewFlavorsTable)
        .where(eq(brewFlavorsTable.brewId, id))

      const result = await tx
        .delete(brewsTable)
        .where(and(eq(brewsTable.id, id), eq(brewsTable.userId, userId)))
        .returning({ id: brewsTable.id })

      return result.length > 0
    })
  }
}
