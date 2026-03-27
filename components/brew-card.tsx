import Link from 'next/link'
import { COUNTRY_FLAGS } from '@/lib/types'
import type { BrewWithBean } from '@/lib/types'
import { cn } from '@/lib/utils'

interface BrewCardProps {
  brew: BrewWithBean
  showBeanInfo?: boolean
  className?: string
}

export function BrewCard({ brew, showBeanInfo = true, className }: BrewCardProps) {
  const date = new Date(brew.created)
  const flag = COUNTRY_FLAGS[brew.bean.country]
  const historyDateLabel = date
    .toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })
    .replace('(', '（')
    .replace(')', '）')
  
  return (
    <Link
      href={`/brews/${brew.id}`}
      className={cn(
        'block rounded-xl bg-card p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98]',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {showBeanInfo ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-lg" aria-label={brew.bean.country}>{flag}</span>
                <h3 className="truncate font-medium text-foreground">{brew.bean.name}</h3>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {brew.bean.roaster}
              </p>
            </>
          ) : (
            <time className="text-sm font-medium text-foreground">
              {historyDateLabel}
              {' '}
              {date.getHours()}:{date.getMinutes()}
            </time>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {brew.flavors.slice(0, 3).map((flavor) => (
              <span 
                key={flavor.id}
                className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
              >
                {flavor.name}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-right">
          <span className="font-mono text-lg font-medium text-primary">
            {brew.overall}/5
          </span>
          <time className="text-xs text-muted-foreground">
            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </time>
        </div>
      </div>
    </Link>
  )
}
