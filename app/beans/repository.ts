import 'server-only'

import { desc, eq } from 'drizzle-orm'
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
  priceJpy?: number | null
  notes: string
}

function mapBeanRow(row: typeof beansTable.$inferSelect): Bean {
  return {
    ...row,
    country: row.country as Bean['country'],
    roast: row.roast as Bean['roast'],
  }
}

export class BeansRepository {
  async findAll(): Promise<Bean[]> {
    const rows = await db
      .select()
      .from(beansTable)
      .orderBy(desc(beansTable.updated))

    return rows.map(mapBeanRow)
  }

  async findById(id: string): Promise<Bean | undefined> {
    const [row] = await db
      .select()
      .from(beansTable)
      .where(eq(beansTable.id, id))
      .limit(1)

    return row ? mapBeanRow(row) : undefined
  }

  async create(input: BeanMutationInput): Promise<Bean> {
    const [row] = await db
      .insert(beansTable)
      .values(input)
      .returning()

    return mapBeanRow(row)
  }

  async update(id: string, input: BeanMutationInput): Promise<Bean | undefined> {
    const [row] = await db
      .update(beansTable)
      .set({
        ...input,
        updated: new Date().toISOString(),
      })
      .where(eq(beansTable.id, id))
      .returning()

    return row ? mapBeanRow(row) : undefined
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await db.transaction(async (tx) => {
      const brewRows = await tx
        .select({ id: brewsTable.id })
        .from(brewsTable)
        .where(eq(brewsTable.beanId, id))

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
        .where(eq(beansTable.id, id))
        .returning({ id: beansTable.id })

      return result.length > 0
    })

    return deleted
  }
}
