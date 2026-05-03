import 'server-only'

import { and, desc, eq } from 'drizzle-orm'
import type { Bean } from '@/lib/types'
import { db } from '@/lib/db/drizzle'
import { beansTable } from '@/lib/db/schema'

function mapBeanRow(row: typeof beansTable.$inferSelect): Bean {
  return {
    ...row,
    country: row.country as Bean['country'],
    roast: row.roast as Bean['roast'],
  }
}

export async function getBeans(userId: string): Promise<Bean[]> {
  const rows = await db
    .select()
    .from(beansTable)
    .where(eq(beansTable.userId, userId))
    .orderBy(desc(beansTable.updated))

  return rows.map(mapBeanRow)
}

export async function getBeanById(id: string, userId: string): Promise<Bean | undefined> {
  const [row] = await db
    .select()
    .from(beansTable)
    .where(and(eq(beansTable.id, id), eq(beansTable.userId, userId)))
    .limit(1)

  return row ? mapBeanRow(row) : undefined
}

interface CreateBeanInput {
  userId: string
  name: string
  country: Bean['country']
  roast: Bean['roast']
  roaster: string | null
  region: string | null
  farm: string | null
  process: string | null
  variety: string | null
  notes: string | null
}

export async function createBean(input: CreateBeanInput): Promise<Bean> {
  const [row] = await db
    .insert(beansTable)
    .values(input)
    .returning()

  return mapBeanRow(row)
}
