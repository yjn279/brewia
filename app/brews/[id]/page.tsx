import { notFound } from 'next/navigation'
import Link from 'next/link'
import { brewsService } from '@/app/brews/service'
import { COUNTRY_FLAGS } from '@/lib/types'
import { TasteBars } from '@/components/taste-bars'
import { PourChart } from '@/components/pour-chart'
import { DeleteResourceButton } from '@/components/delete-resource-button'
import { PageHeader, HeaderAction } from '@/components/page-header'
import { SectionHeading } from '@/components/section-heading'
import { Card } from '@/components/ui/card'
import { FlavorBadge } from '@/components/flavor-badge'
import { ArrowLeft, Pencil, CopyPlus } from 'lucide-react'
import { DataField } from '@/components/data-field'

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
  const ratio = (brew.waterWeight / brew.beanWeight).toFixed(1)

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        leading={
          <>
            <HeaderAction href={`/beans/${brew.bean.id}`} aria-label="Back to bean">
              <ArrowLeft className="h-4 w-4" />
            </HeaderAction>
            <span className="font-medium">Brew Details</span>
          </>
        }
        actions={
          <>
            <HeaderAction
              href={`/new?type=brew&copyBrew=${brew.id}`}
              variant="secondary"
              aria-label="Copy brew"
            >
              <CopyPlus className="h-4 w-4" />
            </HeaderAction>
            <HeaderAction
              href={`/brews/${brew.id}/edit`}
              variant="secondary"
              aria-label="Edit brew"
            >
              <Pencil className="h-4 w-4" />
            </HeaderAction>
            <DeleteResourceButton
              endpoint={`/api/brews/${brew.id}`}
              redirectTo={`/beans/${brew.bean.id}`}
              confirmMessage="この抽出ログを削除しますか？"
              showLabel={false}
              className="h-8 w-8 px-0"
            />
          </>
        }
      />

      <main className="mx-auto max-w-md px-4 py-6">
        {/* Bean Reference */}
        <Card asChild interactive className="mb-6">
          <Link href={`/beans/${brew.bean.id}`} className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-2xl">
              {flag}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <h1 className="text-xl font-semibold text-foreground">{brew.bean.name}</h1>
              <p className="text-sm text-muted-foreground">{brew.bean.roaster}</p>
            </div>
          </Link>
        </Card>

        {/* Brew Parameters */}
        <Card asChild className="mb-6">
          <section>
          <SectionHeading>Parameters</SectionHeading>
          <DataField label="Parameters" valueClassName="font-normal text-base">
            {[
              `Coffee ${brew.beanWeight} g`,
              `Water ${brew.waterWeight} g`,
              brew.waterTemp != null ? `Temperature ${brew.waterTemp}°C` : null,
              brew.beanGrind != null ? `Grind ${brew.beanGrind} clicks` : null,
            ].filter(Boolean).join(', ')}
          </DataField>
          <div className="mt-4 flex items-center justify-center rounded-lg bg-secondary p-3">
            <span className="text-sm text-muted-foreground">Brew Ratio</span>
            <span className="ml-2 font-mono text-lg font-medium">1:{ratio}</span>
          </div>
          </section>
        </Card>


        

        {/* Pour Profile */}
        <section className="mb-6">
          <PourChart steps={brew.steps} totalWater={brew.waterWeight} />
        </section>

        {/* Taste Profile */}
        {brew.overall > 0 && (
          <Card asChild className="mb-6">
            <section>
              <SectionHeading>Taste Profile</SectionHeading>
              <TasteBars
                aroma={brew.aroma}
                acidity={brew.acidity}
                sweetness={brew.sweetness}
                body={brew.body}
                overall={brew.overall}
              />
            </section>
          </Card>
        )}

        {/* Flavors */}
        {brew.flavors.length > 0 && (
          <Card asChild className="mb-6">
            <section>
              <SectionHeading>Flavor Notes</SectionHeading>
              <div className="flex flex-wrap gap-2">
                {brew.flavors.map((flavor) => (
                  <FlavorBadge key={flavor.id} name={flavor.name} />
                ))}
              </div>
            </section>
          </Card>
        )}

        {/* Notes */}
        {brew.notes && (
          <Card asChild>
            <section>
              <SectionHeading>Tasting Notes</SectionHeading>
              <p className="text-sm leading-relaxed text-foreground">{brew.notes}</p>
            </section>
          </Card>
        )}
      </main>
    </div>
  )
}
