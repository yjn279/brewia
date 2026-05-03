import { NextResponse } from 'next/server'
import { beansService } from '@/app/beans/service'
import { upsertBeanSchema } from '@/app/beans/schema'
import { requireUser } from '@/lib/auth/get-current-user'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const [user, err] = await requireUser()
  if (err) return err

  const json = await request.json()
  const parsed = upsertBeanSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const bean = await beansService.createBean(user.id, parsed.data)

  return NextResponse.json({ id: bean.id }, { status: 201 })
}

export async function GET() {
  const [user, err] = await requireUser()
  if (err) return err

  const beans = await beansService.getBeans(user.id)
  return NextResponse.json(beans)
}
