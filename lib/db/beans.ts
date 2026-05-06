import 'server-only'

import { desc, eq } from 'drizzle-orm'
import type { Bean } from '@/lib/types'
import { db } from '@/lib/db/drizzle'
import { beansTable } from '@/lib/db/schema'

function mapBeanRow(row: typeof beansTable.$inferSelect): Bean {
  return {
    ...row,
    userId: row.userId ?? null,
    priceJpy: row.priceJpy ?? null,
    country: row.country as Bean['country'],
    roast: row.roast as Bean['roast'],
  }
}

export async function getBeans(): Promise<Bean[]> {
  const rows = await db
    .select()
    .from(beansTable)
    .orderBy(desc(beansTable.updated))

  return rows.map(mapBeanRow)
}

export async function getBeanById(id: string): Promise<Bean | undefined> {
  const [row] = await db
    .select()
    .from(beansTable)
    .where(eq(beansTable.id, id))
    .limit(1)

  return row ? mapBeanRow(row) : undefined
}

interface CreateBeanInput {
  name: string
  country: Bean['country']
  roast: Bean['roast']
  roaster: string | null
  region: string | null
  farm: string | null
  process: string | null
  variety: string | null
  priceJpy: number | null
  notes: string | null
  userId?: string | null
}

export async function createBean(input: CreateBeanInput): Promise<Bean> {
  const [row] = await db
    .insert(beansTable)
    .values(input)
    .returning()

  return mapBeanRow(row)
}
