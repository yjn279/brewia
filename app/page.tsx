import { getBeans, getBrews } from '@/lib/db'
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
import { Coffee, Flame, Globe, Star, Plus } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [beans, brews] = await Promise.all([
    getBeans(),
    getBrews(),
  ])

  const totalBrews = brews.length
  const totalBeans = beans.length
  const uniqueCountries = new Set(beans.map((b) => b.country)).size
  const avgRating = totalBrews > 0
    ? (brews.reduce((sum, b) => sum + b.overall, 0) / totalBrews).toFixed(1)
    : '0.0'

  return (
    <div className="min-h-screen pb-10">
      <header className="sticky top-0 z-40 border-b border-black/5 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-end gap-2">
            <span className="font-display text-3xl font-semibold leading-none tracking-tight text-foreground">Brewia</span>
            <span className="mb-1 rounded-full bg-primary/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/80">Journal</span>
          </div>
          <Link
            href="/new?type=bean"
            className="group flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-primary text-primary-foreground shadow-[0_8px_20px_-12px_rgba(0,0,0,0.6)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_26px_-12px_rgba(0,0,0,0.6)]"
          >
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
          </Link>
        </div>
      </header>

      <main className="mx-auto mt-6 max-w-3xl px-4 sm:px-6">
        <section className="mb-7 rounded-3xl border border-black/5 bg-card/80 p-6 shadow-[0_28px_60px_-45px_rgba(80,60,20,0.6)] backdrop-blur">
          <Greeting />
          <p className="mt-2 text-sm text-muted-foreground">
            Your coffee journey continues with clarity and better notes.
          </p>
        </section>

        <section className="mb-9 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatsCard label="Total Brews" value={totalBrews} icon={<Flame className="h-3.5 w-3.5" />} />
          <StatsCard label="Bean Varieties" value={totalBeans} icon={<Coffee className="h-3.5 w-3.5" />} />
          <StatsCard label="Countries" value={uniqueCountries} icon={<Globe className="h-3.5 w-3.5" />} />
          <StatsCard label="Avg Rating" value={avgRating} icon={<Star className="h-3.5 w-3.5" />} />
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Bean Library</h2>
            <span className="rounded-full border border-black/10 bg-background/70 px-3 py-1 text-[11px] font-medium text-muted-foreground">
              {beans.length} items
            </span>
          </div>

          {beans.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {beans.map((bean) => {
                return <BeanCard key={bean.id} bean={bean} />
              })}
            </div>
          ) : (
            <Empty className="rounded-3xl border border-dashed border-black/10 bg-card/70 px-4 py-10 shadow-sm">
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
                  className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85"
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
