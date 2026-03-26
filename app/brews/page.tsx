import { getBrewsWithBeans } from '@/lib/data'
import { BottomNav } from '@/components/bottom-nav'
import { BrewCard } from '@/components/brew-card'
import { ArrowLeft, Plus, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function BrewsPage() {
  const brews = getBrewsWithBeans()
  
  // Group brews by date
  const brewsByDate = brews.reduce((acc, brew) => {
    const date = new Date(brew.created).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(brew)
    return acc
  }, {} as Record<string, typeof brews>)

  const dates = Object.keys(brewsByDate)

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
            <h1 className="font-medium">Brew Log</h1>
          </div>
          <Link
            href="/new?type=brew"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        {/* Summary */}
        <div className="mb-6 rounded-xl bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">Your brew journal</span>
          </div>
          <p className="mt-2 font-mono text-2xl font-medium">
            {brews.length} <span className="text-sm font-normal text-muted-foreground">brews logged</span>
          </p>
        </div>

        {/* Brews by Date */}
        {dates.map((date) => (
          <section key={date} className="mb-6">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {date}
            </h2>
            <div className="flex flex-col gap-3">
              {brewsByDate[date].map((brew) => (
                <BrewCard key={brew.id} brew={brew} />
              ))}
            </div>
          </section>
        ))}

        {brews.length === 0 && (
          <div className="rounded-xl bg-card p-8 text-center shadow-sm">
            <p className="text-muted-foreground">No brews logged yet</p>
            <Link
              href="/new?type=brew"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Log your first brew
            </Link>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
