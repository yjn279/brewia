import { notFound } from 'next/navigation'
import { beansService } from '@/app/beans/service'
import { brewsService } from '@/app/brews/service'
import { COUNTRY_FLAGS } from '@/lib/types'
import { ROAST_COLORS } from '@/lib/roast-colors'
import { BrewCard } from '@/components/brew-card'
import { DeleteResourceButton } from '@/components/delete-resource-button'
import { PageHeader, HeaderAction } from '@/components/page-header'
import { SectionHeading } from '@/components/section-heading'
import { Card } from '@/components/ui/card'
import { DataField } from '@/components/data-field'
import { ArrowLeft, Plus, CopyPlus, Pencil } from 'lucide-react'

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
        {/* Bean Info (one card, full width) */}
        <Card asChild className="mb-6">
          <section>
            {/* Hero row: flag + name + roaster */}
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-secondary text-3xl">
                {flag}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <h1 className="text-xl font-semibold text-foreground">{bean.name}</h1>
                <p className="text-sm text-muted-foreground">{bean.roaster}</p>
              </div>
            </div>

            {/* 2-column grid of DataFields */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <DataField label="Country" valueClassName="font-normal">{bean.country}</DataField>
              <DataField label="Region" valueClassName="font-normal">{bean.region || '—'}</DataField>
              <DataField label="Farm" valueClassName="font-normal">{bean.farm || '—'}</DataField>
              <DataField label="Variety" valueClassName="font-normal">{bean.variety || '—'}</DataField>
              <DataField label="Process" valueClassName="font-normal">{bean.process ?? '—'}</DataField>
            </div>

            {/* Roast row — full width below the grid */}
            <div className="mt-4">
              <DataField label="Roast" valueClassName="font-normal">
                <span className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 flex-shrink-0 rounded-full border border-border"
                    style={{ backgroundColor: ROAST_COLORS[bean.roast] }}
                    aria-hidden="true"
                  />
                  <span>{bean.roast}</span>
                </span>
              </DataField>
            </div>
          </section>
        </Card>

        {/* Notes */}
        {bean.notes && bean.notes.trim().length > 0 && (
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
