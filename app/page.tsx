import { beansService } from '@/app/beans/service'
import { brewsService } from '@/app/brews/service'
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
import { BookMarked, Coffee, Flame, Plus } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [beans, brews] = await Promise.all([
    beansService.getBeans(),
    brewsService.getBrews(),
  ])

  // Calculate stats
  const totalBrews = brews.length
  const totalBeans = beans.length
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <div className="flex items-center">
            <span className="text-xl font-semibold tracking-tight text-foreground">Brewia</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/presets"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card hover:bg-secondary"
              aria-label="Presets"
            >
              <BookMarked className="h-4 w-4" />
            </Link>
            <Link
              href="/new?type=bean"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        {/* Welcome */}
        <section className="mb-6">
          <Greeting />
        </section>

        {/* Stats Grid */}
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Your Coffee Journey
          </h2>
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
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Bean Library
          </h2>
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
                <Link
                  href="/new?type=bean"
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Add your first bean
                </Link>
              </EmptyContent>
            </Empty>
          )}
        </section>
      </main>
    </div>
  )
}
