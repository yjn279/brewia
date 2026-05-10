import 'server-only'

import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db/drizzle'
import { brewPresetsTable } from '@/lib/db/schema'
import type { BrewStep } from '@/lib/types'

export interface BrewPresetRecord {
  id: string
  userId: string
  name: string
  description: string
  defaultBeanWeight: number
  defaultWaterTemp: number
  defaultWaterWeight: number
  steps: BrewStep[]
  created: string
  updated: string
}

export interface BrewPresetMutationInput {
  name: string
  description: string
  defaultBeanWeight: number
  defaultWaterTemp: number
  defaultWaterWeight: number
  steps: BrewStep[]
}

function mapRow(row: typeof brewPresetsTable.$inferSelect): BrewPresetRecord {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    description: row.description,
    defaultBeanWeight: row.defaultBeanWeight,
    defaultWaterTemp: row.defaultWaterTemp,
    defaultWaterWeight: row.defaultWaterWeight,
    steps: JSON.parse(row.steps) as BrewStep[],
    created: row.created,
    updated: row.updated,
  }
}

export class BrewPresetsRepository {
  async findAll(userId: string): Promise<BrewPresetRecord[]> {
    const rows = await db
      .select()
      .from(brewPresetsTable)
      .where(eq(brewPresetsTable.userId, userId))
      .orderBy(desc(brewPresetsTable.updated))

    return rows.map(mapRow)
  }

  async findById(userId: string, id: string): Promise<BrewPresetRecord | undefined> {
    const [row] = await db
      .select()
      .from(brewPresetsTable)
      .where(and(eq(brewPresetsTable.userId, userId), eq(brewPresetsTable.id, id)))
      .limit(1)

    return row ? mapRow(row) : undefined
  }

  async create(userId: string, input: BrewPresetMutationInput): Promise<BrewPresetRecord> {
    const [row] = await db
      .insert(brewPresetsTable)
      .values({
        userId,
        name: input.name,
        description: input.description ?? '',
        defaultBeanWeight: input.defaultBeanWeight,
        defaultWaterTemp: input.defaultWaterTemp,
        defaultWaterWeight: input.defaultWaterWeight,
        steps: JSON.stringify(input.steps),
      })
      .returning()

    return mapRow(row)
  }

  async update(userId: string, id: string, input: BrewPresetMutationInput): Promise<BrewPresetRecord | undefined> {
    const [row] = await db
      .update(brewPresetsTable)
      .set({
        name: input.name,
        description: input.description ?? '',
        defaultBeanWeight: input.defaultBeanWeight,
        defaultWaterTemp: input.defaultWaterTemp,
        defaultWaterWeight: input.defaultWaterWeight,
        steps: JSON.stringify(input.steps),
        updated: new Date().toISOString(),
      })
      .where(and(eq(brewPresetsTable.userId, userId), eq(brewPresetsTable.id, id)))
      .returning()

    return row ? mapRow(row) : undefined
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const result = await db
      .delete(brewPresetsTable)
      .where(and(eq(brewPresetsTable.userId, userId), eq(brewPresetsTable.id, id)))
      .returning({ id: brewPresetsTable.id })

    return result.length > 0
  }
}
