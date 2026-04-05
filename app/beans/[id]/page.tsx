import { notFound } from 'next/navigation'
import Link from 'next/link'
import { beansService } from '@/app/beans/service'
import { brewsService } from '@/app/brews/service'
import { COUNTRY_FLAGS } from '@/lib/types'
import { BrewCard } from '@/components/brew-card'
import { RoastLevel } from '@/components/roast-level'
import { DeleteResourceButton } from '@/components/delete-resource-button'
import { ArrowLeft, Plus, MapPin, Factory, Leaf, Pencil } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface BeanDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function BeanDetailPage({ params }: BeanDetailPageProps) {
  const { id } = await params
  const bean = await beansService.getBeanById(id)

  if (!bean) {
    notFound()
  }

  const brews = await brewsService.getBrewsByBeanId(id)
  const flag = COUNTRY_FLAGS[bean.country]

  return (
    <div className="min-h-screen bg-background">
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
            <span className="font-medium">Bean Details</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/beans/${id}/edit`}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card hover:bg-secondary"
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <DeleteResourceButton
              endpoint={`/api/beans/${id}`}
              redirectTo="/"
              confirmMessage="この豆を削除しますか？紐づく抽出も削除されます。"
              showLabel={false}
              className="h-8 w-8 px-0"
            />
            <Link
              href={`/new?type=brew&bean=${id}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        {/* Bean Hero */}
        <section className="mb-6 rounded-xl bg-card p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-secondary text-3xl">
              {flag}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-foreground">{bean.name}</h1>
              <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">Roastery</p>
              <p className="text-sm text-foreground">{bean.roaster}</p>
              <div className="mt-2">
                <RoastLevel level={bean.roast} size="sm" />
              </div>
            </div>
          </div>
        </section>

        {/* Origin Info */}
        <section className="mb-6 rounded-xl bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Origin
          </h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Region</p>
                <p className="text-sm font-medium text-foreground">{bean.region}</p>
                <p className="text-xs text-muted-foreground">Country: {bean.country}</p>
              </div>
            </div>
            {bean.farm && (
              <div className="flex items-center gap-3">
                <Factory className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Producer</p>
                  <p className="text-sm text-foreground">{bean.farm}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Leaf className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col gap-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Variety</p>
                <span className="text-sm text-foreground">{bean.variety}</span>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Process</p>
                <span className="text-sm text-foreground">{bean.process ?? '—'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Notes */}
        {bean.notes && (
          <section className="mb-6 rounded-xl bg-card p-4 shadow-sm">
            <h2 className="mb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Notes
            </h2>
            <p className="text-sm leading-relaxed text-foreground">{bean.notes}</p>
          </section>
        )}


        

        {/* Brew History */}
        {brews.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Brew History
            </h2>
            <div className="flex flex-col gap-3">
              {brews.map((brew) => (
                <BrewCard key={brew.id} brew={brew} showBeanInfo={false} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
