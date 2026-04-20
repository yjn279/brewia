import { notFound } from 'next/navigation'
import { beansService } from '@/app/beans/service'
import { brewsService } from '@/app/brews/service'
import { COUNTRY_FLAGS } from '@/lib/types'
import { BrewCard } from '@/components/brew-card'
import { RoastLevel } from '@/components/roast-level'
import { DeleteResourceButton } from '@/components/delete-resource-button'
import { PageHeader, HeaderAction } from '@/components/page-header'
import { SectionHeading } from '@/components/section-heading'
import { Card } from '@/components/ui/card'
import { DataField } from '@/components/data-field'
import { InfoRow } from '@/components/info-row'
import { ArrowLeft, Plus, CopyPlus, MapPin, Factory, Leaf, Pencil } from 'lucide-react'

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
      <PageHeader
        leading={
          <>
            <HeaderAction href="/" aria-label="Back to home">
              <ArrowLeft className="h-4 w-4" />
            </HeaderAction>
            <span className="font-medium">Bean Details</span>
          </>
        }
        actions={
          <>
            <HeaderAction
              href={`/new?type=bean&copyBean=${id}`}
              variant="secondary"
              aria-label="Copy bean"
            >
              <CopyPlus className="h-4 w-4" />
            </HeaderAction>
            <HeaderAction
              href={`/beans/${id}/edit`}
              variant="secondary"
              aria-label="Edit bean"
            >
              <Pencil className="h-4 w-4" />
            </HeaderAction>
            <DeleteResourceButton
              endpoint={`/api/beans/${id}`}
              redirectTo="/"
              confirmMessage="この豆を削除しますか？紐づく抽出も削除されます。"
              showLabel={false}
              className="h-8 w-8 px-0"
            />
            <HeaderAction
              href={`/new?type=brew&bean=${id}`}
              variant="primary"
              aria-label="Add brew"
            >
              <Plus className="h-4 w-4" />
            </HeaderAction>
          </>
        }
      />

      <main className="mx-auto max-w-md px-4 py-6">
        {/* Bean Hero */}
        <Card asChild className="mb-6">
          <section>
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-secondary text-3xl">
                {flag}
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <h1 className="text-xl font-semibold text-foreground">{bean.name}</h1>
                <DataField label="Roastery" valueClassName="font-normal">{bean.roaster}</DataField>
                <RoastLevel level={bean.roast} size="sm" />
              </div>
            </div>
          </section>
        </Card>

        {/* Origin Info */}
        <Card asChild className="mb-6">
          <section>
            <SectionHeading>Origin</SectionHeading>
            <div className="flex flex-col gap-3">
              <InfoRow icon={<MapPin className="h-4 w-4" />}>
                <DataField label="Region">
                  {bean.region}
                  <p className="text-xs font-normal text-muted-foreground">Country: {bean.country}</p>
                </DataField>
              </InfoRow>
              {bean.farm && (
                <InfoRow icon={<Factory className="h-4 w-4" />}>
                  <DataField label="Producer" valueClassName="font-normal">{bean.farm}</DataField>
                </InfoRow>
              )}
              <InfoRow icon={<Leaf className="h-4 w-4" />}>
                <DataField label="Variety" valueClassName="font-normal">{bean.variety}</DataField>
                <DataField label="Process" valueClassName="font-normal">{bean.process ?? '—'}</DataField>
              </InfoRow>
            </div>
          </section>
        </Card>

        {/* Notes */}
        {bean.notes && (
          <Card asChild className="mb-6">
            <section>
              <SectionHeading>Notes</SectionHeading>
              <p className="text-sm leading-relaxed text-foreground">{bean.notes}</p>
            </section>
          </Card>
        )}


        

        {/* Brew History */}
        {brews.length > 0 && (
          <section>
            <SectionHeading>Brew History</SectionHeading>
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
