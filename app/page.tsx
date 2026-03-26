import { beans, brews, getBrewsByBeanId, countryFlags } from '@/lib/data'
import { StatsCard } from '@/components/stats-card'
import { BeanCard } from '@/components/bean-card'
import { Greeting, CurrentDate } from '@/components/greeting'
import { Coffee, Flame, Globe, Star, Plus } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  // Calculate stats
  const totalBrews = brews.length
  const totalBeans = beans.length
  const uniqueCountries = new Set(beans.map((b) => b.country)).size
  const avgRating = (brews.reduce((sum, b) => sum + b.overall, 0) / totalBrews).toFixed(1)

  // Group beans by country
  const beansByCountry = beans.reduce((acc, bean) => {
    if (!acc[bean.country]) {
      acc[bean.country] = []
    }
    acc[bean.country].push(bean)
    return acc
  }, {} as Record<string, typeof beans>)

  const countries = Object.keys(beansByCountry).sort()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Coffee className="h-5 w-5 text-primary" />
            <span className="font-medium tracking-tight">Brew Log</span>
          </div>
          <div className="flex items-center gap-2">
            <CurrentDate />
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

        {/* Bean Library */}
        <section className="mb-6">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Bean Library
          </h2>
          
          {/* Beans by Country */}
          {countries.map((country) => (
            <div key={country} className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-lg">{countryFlags[country] || ''}</span>
                <span className="text-sm font-medium text-foreground">{country}</span>
                <span className="text-xs text-muted-foreground">
                  ({beansByCountry[country].length})
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {beansByCountry[country].map((bean) => {
                  const beanBrews = getBrewsByBeanId(bean.id)
                  return (
                    <BeanCard 
                      key={bean.id} 
                      bean={bean} 
                      brewCount={beanBrews.length}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
