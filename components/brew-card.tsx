import Link from 'next/link'
import { COUNTRY_FLAGS } from '@/lib/types'
import type { BrewWithBean } from '@/lib/types'
import { HISTORY_DATE_FORMAT_OPTIONS } from '@/lib/constants'
import { Card } from '@/components/ui/card'
import { FlavorBadge } from '@/components/flavor-badge'

interface BrewCardProps {
  brew: BrewWithBean
  showBeanInfo?: boolean
  className?: string
}

export function BrewCard({ brew, showBeanInfo = true, className }: BrewCardProps) {
  const date = new Date(brew.created)
  const flag = COUNTRY_FLAGS[brew.bean.country]
  const historyDateLabel = date.toLocaleDateString('en-US', HISTORY_DATE_FORMAT_OPTIONS)

  if (!showBeanInfo) {
    return (
      <Card asChild interactive className={className}>
        <Link href={`/brews/${brew.id}`} className="block">
          <div className="flex items-stretch gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <time className="text-base font-semibold text-foreground">
                {historyDateLabel} {date.getHours()}:{String(date.getMinutes()).padStart(2, '0')}
              </time>
              <p className="font-mono text-xs text-muted-foreground">
                {[
                  `${brew.beanWeight} g`,
                  `${brew.waterWeight} g`,
                  brew.waterTemp > 0 && `${brew.waterTemp}°C`,
                  brew.beanGrind > 0 && `${brew.beanGrind} clicks`,
                ].filter(Boolean).join(', ')}
              </p>
              {brew.flavors.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {brew.flavors.slice(0, 3).map((flavor) => (
                    <FlavorBadge key={flavor.id} name={flavor.name} />
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center border-l border-border pl-4">
              <span className="font-mono text-2xl font-semibold text-primary">
                {brew.overall === 0 ? '-' : brew.overall}
              </span>
              <span className="text-sm text-muted-foreground">/5</span>
            </div>
          </div>
        </Link>
      </Card>
    )
  }

  return (
    <Card asChild interactive className={className}>
      <Link href={`/brews/${brew.id}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg" aria-label={brew.bean.country}>{flag}</span>
              <h3 className="truncate font-medium text-foreground">{brew.bean.name}</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {brew.bean.roaster}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {brew.flavors.slice(0, 3).map((flavor) => (
                <FlavorBadge key={flavor.id} name={flavor.name} />
              ))}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <span className="font-mono text-lg font-medium text-primary">
              {brew.overall === 0 ? '-' : brew.overall}/5
            </span>
          </div>
        </div>
      </Link>
    </Card>
  )
}
