import { beans, brews, getBrewsWithBeans } from '@/lib/data'
import { BottomNav } from '@/components/bottom-nav'
import { StatsCard } from '@/components/stats-card'
import { BrewCard } from '@/components/brew-card'
import { Coffee, Flame, Globe, Star } from 'lucide-react'

export default function HomePage() {
  const brewsWithBeans = getBrewsWithBeans()
  const recentBrews = brewsWithBeans.slice(0, 4)
  
  // Calculate stats
  const totalBrews = brews.length
  const totalBeans = beans.length
  const uniqueCountries = new Set(beans.map((b) => b.country)).size
  const avgRating = (brews.reduce((sum, b) => sum + b.overall, 0) / totalBrews).toFixed(1)

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Coffee className="h-5 w-5 text-primary" />
            <span className="font-medium tracking-tight">Brew Log</span>
          </div>
          <time className="font-mono text-xs text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'short',
              month: 'short', 
              day: 'numeric' 
            })}
          </time>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        {/* Welcome */}
        <section className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Good morning
          </h1>
          <p className="mt-1 text-muted-foreground">
            Your coffee journey continues
          </p>
        </section>

        {/* Stats Grid */}
        <section className="mb-8 grid grid-cols-2 gap-3">
          <StatsCard 
            label="Total Brews" 
            value={totalBrews}
            icon={<Flame className="h-3.5 w-3.5" />}
          />
          <StatsCard 
            label="Bean Varieties" 
            value={totalBeans}
            icon={<Coffee className="h-3.5 w-3.5" />}
          />
          <StatsCard 
            label="Countries" 
            value={uniqueCountries}
            icon={<Globe className="h-3.5 w-3.5" />}
          />
          <StatsCard 
            label="Avg Rating" 
            value={avgRating}
            icon={<Star className="h-3.5 w-3.5" />}
          />
        </section>

        {/* Recent Brews */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Recent Brews
            </h2>
            <a 
              href="/brews" 
              className="text-xs font-medium text-primary hover:underline"
            >
              View all
            </a>
          </div>
          <div className="flex flex-col gap-3">
            {recentBrews.map((brew) => (
              <BrewCard key={brew.id} brew={brew} />
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
