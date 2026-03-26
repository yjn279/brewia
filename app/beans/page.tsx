import { beans } from '@/lib/data'
import { BottomNav } from '@/components/bottom-nav'
import { BeanCard } from '@/components/bean-card'
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'

export default function BeansPage() {
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
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link 
              href="/" 
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="font-medium">Bean Library</h1>
          </div>
          <Link
            href="/new?type=bean"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        {/* Summary */}
        <div className="mb-6 rounded-xl bg-card p-4 shadow-sm">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground text-sm">Your collection</span>
            <span className="font-mono text-2xl font-medium">{beans.length}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            beans from {countries.length} countries
          </p>
        </div>

        {/* Beans by Country */}
        {countries.map((country) => (
          <section key={country} className="mb-6">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {country}
            </h2>
            <div className="flex flex-col gap-3">
              {beansByCountry[country].map((bean) => (
                <BeanCard key={bean.id} bean={bean} />
              ))}
            </div>
          </section>
        ))}
      </main>

      <BottomNav />
    </div>
  )
}
