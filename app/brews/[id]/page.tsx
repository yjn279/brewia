import { notFound } from 'next/navigation'
import Link from 'next/link'
import { brewsService } from '@/app/brews/service'
import { COUNTRY_FLAGS } from '@/lib/types'
import { TasteRadar } from '@/components/taste-radar'
import { PourChart } from '@/components/pour-chart'
import { ArrowLeft, Thermometer, Scale, Coffee, Cog } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface BrewDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function BrewDetailPage({ params }: BrewDetailPageProps) {
  const { id } = await params
  const brew = await brewsService.getBrewById(id)

  if (!brew) {
    notFound()
  }

  const flag = COUNTRY_FLAGS[brew.bean.country]
  const date = new Date(brew.created)
  const ratio = (brew.waterWeight / brew.beanWeight).toFixed(1)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link 
              href={`/beans/${brew.bean.id}`} 
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="font-medium">Brew Details</span>
          </div>
          <time className="font-mono text-xs text-muted-foreground">
            {date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </time>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        {/* Bean Reference */}
        <Link 
          href={`/beans/${brew.bean.id}`}
          className="mb-6 flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm transition-all hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-2xl">
            {flag}
          </div>
          <div className="flex-1">
            <h1 className="font-medium text-foreground">{brew.bean.name}</h1>
            <p className="text-sm text-muted-foreground">{brew.bean.roaster}</p>
          </div>
          <div className="text-right">
            <span className="font-mono text-2xl font-semibold text-primary">{brew.overall}</span>
            <span className="text-sm text-muted-foreground">/5</span>
          </div>
        </Link>

        {/* Brew Parameters */}
        <section className="mb-6 rounded-xl bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Parameters
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <Coffee className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-mono text-lg font-medium">{brew.beanWeight}g</p>
                <p className="text-xs text-muted-foreground">Coffee</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <Scale className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-mono text-lg font-medium">{brew.waterWeight}g</p>
                <p className="text-xs text-muted-foreground">Water</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <Thermometer className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-mono text-lg font-medium">{brew.waterTemp}°C</p>
                <p className="text-xs text-muted-foreground">Temperature</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <Cog className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-mono text-lg font-medium">{brew.beanGrind}</p>
                <p className="text-xs text-muted-foreground">Grind (clicks)</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center rounded-lg bg-secondary p-3">
            <span className="text-sm text-muted-foreground">Brew Ratio</span>
            <span className="ml-2 font-mono text-lg font-medium">1:{ratio}</span>
          </div>
        </section>

        {/* Pour Profile */}
        <section className="mb-6">
          <PourChart steps={brew.steps} totalWater={brew.waterWeight} />
        </section>

        {/* Taste Profile */}
        <section className="mb-6 rounded-xl bg-card p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Taste Profile
          </h2>
          <TasteRadar
            aroma={brew.aroma}
            acidity={brew.acidity}
            sweetness={brew.sweetness}
            body={brew.body}
            overall={brew.overall}
          />
        </section>

        {/* Flavors */}
        {brew.flavors.length > 0 && (
          <section className="mb-6 rounded-xl bg-card p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Flavor Notes
            </h2>
            <div className="flex flex-wrap gap-2">
              {brew.flavors.map((flavor) => (
                <span 
                  key={flavor.id}
                  className="rounded-full bg-secondary px-3 py-1.5 text-sm text-secondary-foreground"
                >
                  {flavor.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Notes */}
        {brew.notes && (
          <section className="rounded-xl bg-card p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Tasting Notes
            </h2>
            <p className="text-sm leading-relaxed text-foreground">{brew.notes}</p>
          </section>
        )}
      </main>
    </div>
  )
}
