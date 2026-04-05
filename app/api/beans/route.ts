import { NextResponse } from 'next/server'
import { beansService } from '@/lib/server/beans/beans.service'
import { upsertBeanSchema } from '@/lib/server/beans/beans.schema'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const json = await request.json()
  const parsed = upsertBeanSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const bean = await beansService.createBean(parsed.data)

  return NextResponse.json({ id: bean.id }, { status: 201 })
}

export async function GET() {
  const beans = await beansService.getBeans()
  return NextResponse.json(beans)
}
