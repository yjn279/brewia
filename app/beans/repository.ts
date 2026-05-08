import 'server-only'

import { and, desc, eq } from 'drizzle-orm'
import type { Bean } from '@/lib/types'
import { db } from '@/lib/db/drizzle'
import { beansTable, brewFlavorsTable, brewsTable } from '@/lib/db/schema'

export interface BeanMutationInput {
  name: string
  country: Bean['country']
  roast: Bean['roast']
  roaster: string
  region: string
  farm: string
  process: string
  variety: string
  priceJpy: number
  notes: string
}

function mapBeanRow(row: typeof beansTable.$inferSelect): Bean {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    country: row.country as Bean['country'],
    region: row.region,
    farm: row.farm,
    process: row.process,
    variety: row.variety,
    roast: row.roast as Bean['roast'],
    roaster: row.roaster,
    priceJpy: row.priceJpy,
    notes: row.notes,
    created: row.created,
    updated: row.updated,
  }
}

export class BeansRepository {
  async findAll(userId: string): Promise<Bean[]> {
    const rows = await db
      .select()
      .from(beansTable)
      .where(eq(beansTable.userId, userId))
      .orderBy(desc(beansTable.updated))

    return rows.map(mapBeanRow)
  }

  async findById(userId: string, id: string): Promise<Bean | undefined> {
    const [row] = await db
      .select()
      .from(beansTable)
      .where(and(eq(beansTable.userId, userId), eq(beansTable.id, id)))
      .limit(1)

    return row ? mapBeanRow(row) : undefined
  }

  async create(userId: string, input: BeanMutationInput): Promise<Bean> {
    const [row] = await db
      .insert(beansTable)
      .values({ ...input, userId })
      .returning()

    return mapBeanRow(row)
  }

  async update(userId: string, id: string, input: BeanMutationInput): Promise<Bean | undefined> {
    const [row] = await db
      .update(beansTable)
      .set({
        ...input,
        updated: new Date().toISOString(),
      })
      .where(and(eq(beansTable.userId, userId), eq(beansTable.id, id)))
      .returning()

    return row ? mapBeanRow(row) : undefined
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const deleted = await db.transaction(async (tx) => {
      // userId スコープで brew を取得（他ユーザーの brew を誤って消さないための防御的二重条件）
      const brewRows = await tx
        .select({ id: brewsTable.id })
        .from(brewsTable)
        .where(and(eq(brewsTable.beanId, id), eq(brewsTable.userId, userId)))

      if (brewRows.length > 0) {
        const brewIds = brewRows.map((row) => row.id)

        for (const brewId of brewIds) {
          await tx
            .delete(brewFlavorsTable)
            .where(eq(brewFlavorsTable.brewId, brewId))
        }

        for (const brewId of brewIds) {
          await tx
            .delete(brewsTable)
            .where(eq(brewsTable.id, brewId))
        }
      }

      const result = await tx
        .delete(beansTable)
        .where(and(eq(beansTable.userId, userId), eq(beansTable.id, id)))
        .returning({ id: beansTable.id })

      return result.length > 0
    })

    return deleted
  }
}
