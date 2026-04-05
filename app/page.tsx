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
import { Coffee, Flame, Plus } from 'lucide-react'
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
              href="/new?type=bean"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        {/* Welcome + Stats */}
        <section className="mb-8 flex items-start justify-between gap-3">
          <div className="min-w-0 pt-1">
            <Greeting />
            <p className="mt-1 text-muted-foreground">
              Your coffee journey continues
            </p>
          </div>

          <div className="flex w-full max-w-[180px] flex-col gap-2">
            <StatsCard
              label="Total Brews"
              value={totalBrews}
              icon={<Flame className="h-3 w-3" />}
              className="gap-0.5 p-2.5 [&>span]:text-lg [&_span]:tracking-wide"
            />
            <StatsCard
              label="Bean Variety"
              value={totalBeans}
              icon={<Coffee className="h-3 w-3" />}
              className="gap-0.5 p-2.5 [&>span]:text-lg [&_span]:tracking-wide"
            />
          </div>
        </section>

        {/* Beans */}
        <section className="mb-6">
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
