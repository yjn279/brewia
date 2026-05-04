import 'server-only'

import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db/drizzle'
import { brewPresetsTable } from '@/lib/db/schema'
import type { BrewStep } from '@/lib/types'

export interface BrewPresetRecord {
  id: string
  name: string
  description: string | null
  defaultBeanWeight: number | null
  defaultWaterTemp: number | null
  steps: BrewStep[]
  created: string
  updated: string
}

export interface BrewPresetMutationInput {
  name: string
  description: string
  defaultBeanWeight: number | null
  defaultWaterTemp: number | null
  steps: BrewStep[]
}

function mapRow(row: typeof brewPresetsTable.$inferSelect): BrewPresetRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    defaultBeanWeight: row.defaultBeanWeight ?? null,
    defaultWaterTemp: row.defaultWaterTemp ?? null,
    steps: JSON.parse(row.steps) as BrewStep[],
    created: row.created,
    updated: row.updated,
  }
}

export class BrewPresetsRepository {
  async findAll(): Promise<BrewPresetRecord[]> {
    const rows = await db
      .select()
      .from(brewPresetsTable)
      .orderBy(desc(brewPresetsTable.updated))

    return rows.map(mapRow)
  }

  async findById(id: string): Promise<BrewPresetRecord | undefined> {
    const [row] = await db
      .select()
      .from(brewPresetsTable)
      .where(eq(brewPresetsTable.id, id))
      .limit(1)

    return row ? mapRow(row) : undefined
  }

  async create(input: BrewPresetMutationInput): Promise<BrewPresetRecord> {
    const [row] = await db
      .insert(brewPresetsTable)
      .values({
        name: input.name,
        description: input.description || null,
        defaultBeanWeight: input.defaultBeanWeight,
        defaultWaterTemp: input.defaultWaterTemp,
        steps: JSON.stringify(input.steps),
      })
      .returning()

    return mapRow(row)
  }

  async update(id: string, input: BrewPresetMutationInput): Promise<BrewPresetRecord | undefined> {
    const [row] = await db
      .update(brewPresetsTable)
      .set({
        name: input.name,
        description: input.description || null,
        defaultBeanWeight: input.defaultBeanWeight,
        defaultWaterTemp: input.defaultWaterTemp,
        steps: JSON.stringify(input.steps),
        updated: new Date().toISOString(),
      })
      .where(eq(brewPresetsTable.id, id))
      .returning()

    return row ? mapRow(row) : undefined
  }

  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(brewPresetsTable)
      .where(eq(brewPresetsTable.id, id))
      .returning({ id: brewPresetsTable.id })

    return result.length > 0
  }
}
