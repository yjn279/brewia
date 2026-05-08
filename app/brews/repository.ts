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
  beanGrind: number
  waterWeight: number
  waterTemp: number
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
    id: row.id,
    userId: row.userId,
    beanId: row.beanId,
    beanWeight: row.beanWeight,
    beanGrind: row.beanGrind,
    waterWeight: row.waterWeight,
    waterTemp: row.waterTemp,
    steps: parseSteps(row.steps),
    aroma: row.aroma,
    acidity: row.acidity,
    sweetness: row.sweetness,
    body: row.body,
    overall: row.overall,
    notes: row.notes,
    created: row.created,
    updated: row.updated,
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

  async findByBeanId(userId: string, beanId: string): Promise<BrewWithBean[]> {
    const [bean, brewRows, flavorByBrewId] = await Promise.all([
      beansRepository.findById(userId, beanId),
      db
        .select()
        .from(brewsTable)
        .where(and(eq(brewsTable.userId, userId), eq(brewsTable.beanId, beanId)))
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

  async findById(userId: string, id: string): Promise<BrewWithBean | undefined> {
    const [brewRow] = await db
      .select()
      .from(brewsTable)
      .where(and(eq(brewsTable.userId, userId), eq(brewsTable.id, id)))
      .limit(1)

    if (!brewRow) {
      return undefined
    }

    const brew = mapBrewRow(brewRow)
    const [bean, flavors] = await Promise.all([
      beansRepository.findById(userId, brew.beanId),
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

  async update(userId: string, id: string, input: BrewMutationInput): Promise<Brew | undefined> {
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
        .where(and(eq(brewsTable.userId, userId), eq(brewsTable.id, id)))
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

  async delete(userId: string, id: string): Promise<boolean> {
    return db.transaction(async (tx) => {
      // 先に所有権確認を兼ねた brew 削除（userId フィルタで他ユーザーの brew は 0 件になる）
      const result = await tx
        .delete(brewsTable)
        .where(and(eq(brewsTable.userId, userId), eq(brewsTable.id, id)))
        .returning({ id: brewsTable.id })

      if (result.length === 0) return false

      // 所有権確認後に brew_flavor を削除
      await tx
        .delete(brewFlavorsTable)
        .where(eq(brewFlavorsTable.brewId, id))

      return true
    })
  }
}
