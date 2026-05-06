import { beansService } from '@/app/beans/service'
import { brewsService } from '@/app/brews/service'
import { requireUser } from '@/lib/auth/require-user'
import { signOutAction } from '@/lib/auth/actions'
import { StatsCard } from '@/components/stats-card'
import { BeanCard } from '@/components/bean-card'
import { Greeting } from '@/components/greeting'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { PageHeader, HeaderAction } from '@/components/page-header'
import { SectionHeading } from '@/components/section-heading'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/user-menu'
import { BookMarked, Coffee, Flame, Plus } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const user = await requireUser()

  const [beans, brews] = await Promise.all([
    beansService.getBeans(user.id),
    brewsService.getBrews(user.id),
  ])

  // Calculate stats
  const totalBrews = brews.length
  const totalBeans = beans.length
  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        leading={
          <span className="text-xl font-semibold tracking-tight text-foreground">Brewia</span>
        }
        actions={
          <>
            <HeaderAction href="/presets" variant="secondary" aria-label="Presets">
              <BookMarked className="h-4 w-4" />
            </HeaderAction>
            <HeaderAction href="/new?type=bean" variant="primary" aria-label="Add bean">
              <Plus className="h-4 w-4" />
            </HeaderAction>
            <UserMenu email={user.email} name={user.name} signOutAction={signOutAction} />
          </>
        }
      />

      <main className="mx-auto max-w-md px-4 py-6">
        {/* Welcome */}
        <section className="mb-6">
          <Greeting />
        </section>

        {/* Stats Grid */}
        <section className="mb-8">
          <SectionHeading>Your Coffee Journey</SectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <StatsCard
                label="Total Brews"
                value={totalBrews}
                icon={<Flame className="h-3.5 w-3.5" />}
              />
            </div>
            <div>
              <StatsCard
                label="Bean Variety"
                value={totalBeans}
                icon={<Coffee className="h-3.5 w-3.5" />}
              />
            </div>
          </div>
        </section>

        {/* Bean Library */}
        <section className="mb-6">
          <SectionHeading>Bean Library</SectionHeading>
          {beans.length > 0 ? (
            <div className="flex flex-col gap-3">
              {beans.map((bean) => {
                return (
                  <BeanCard
                    key={bean.id}
                    bean={bean}
                  />
                )
              })}
            </div>
          ) : (
            <Empty className="rounded-xl border border-dashed bg-card px-4 py-10 shadow-sm">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Coffee className="h-5 w-5" />
                </EmptyMedia>
                <EmptyTitle>No beans yet</EmptyTitle>
                <EmptyDescription>
                  Your Turso database is connected, but there is no coffee data yet.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild>
                  <Link href="/new?type=bean">Add your first bean</Link>
                </Button>
              </EmptyContent>
            </Empty>
          )}
        </section>
      </main>
    </div>
  )
}
