import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { NewEntryTabs } from '@/components/new-entry-tabs'
import { beansService } from '@/app/beans/service'
import { flavorsService } from '@/app/flavors/service'
import { brewsService } from '@/app/brews/service'
import { requireUser } from '@/lib/auth/require-user'

export const dynamic = 'force-dynamic'

interface NewPageProps {
  searchParams: Promise<{
    type?: 'bean' | 'brew'
    bean?: string
    copyBean?: string
    copyBrew?: string
  }>
}

export default async function NewPage({ searchParams }: NewPageProps) {
  const user = await requireUser()
  const params = await searchParams

  const [beans, flavors, initialBean, initialBrew] = await Promise.all([
    beansService.getBeans(user.id),
    flavorsService.getFlavors(),
    params.copyBean ? beansService.getBeanById(user.id, params.copyBean) : Promise.resolve(undefined),
    params.copyBrew ? brewsService.getBrewById(user.id, params.copyBrew) : Promise.resolve(undefined),
  ])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-md items-center px-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="font-medium">New Entry</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-card" />}>
          <NewEntryTabs beans={beans} flavors={flavors} initialBean={initialBean ?? undefined} initialBrew={initialBrew ?? undefined} />
        </Suspense>
      </main>
    </div>
  )
}
