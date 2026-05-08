import { Suspense } from 'react'
import { ArrowLeft } from 'lucide-react'
import { NewEntryTabs } from '@/components/new-entry-tabs'
import { PageHeader, HeaderAction } from '@/components/page-header'
import { UserMenu } from '@/components/user-menu'
import { beansService } from '@/app/beans/service'
import { flavorsService } from '@/app/flavors/service'
import { brewsService } from '@/app/brews/service'
import { requireUser } from '@/lib/auth/require-user'
import { signOutAction } from '@/lib/auth/actions'

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
      <PageHeader
        leading={
          <>
            <HeaderAction href="/" aria-label="Back to home">
              <ArrowLeft className="h-4 w-4" />
            </HeaderAction>
            <span className="font-medium">New Entry</span>
          </>
        }
        actions={<UserMenu email={user.email} name={user.name} signOutAction={signOutAction} />}
      />

      <main className="mx-auto max-w-md px-4 py-6">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-card" />}>
          <NewEntryTabs beans={beans} flavors={flavors} initialBean={initialBean ?? undefined} initialBrew={initialBrew ?? undefined} />
        </Suspense>
      </main>
    </div>
  )
}
