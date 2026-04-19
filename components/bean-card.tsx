import Link from 'next/link'
import { COUNTRY_FLAGS } from '@/lib/types'
import type { Bean } from '@/lib/types'
import { Surface } from '@/components/ui/surface'

interface BeanCardProps {
  bean: Bean
  className?: string
}

export function BeanCard({ bean, className }: BeanCardProps) {
  const flag = COUNTRY_FLAGS[bean.country]

  return (
    <Surface asChild interactive className={className}>
      <Link href={`/beans/${bean.id}`} className="block">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-2xl">
            {flag}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-medium text-foreground">{bean.name}</h3>
            <p className="text-sm text-muted-foreground">
              {bean.region}, {bean.country}
            </p>
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span>{bean.variety}</span>
              </span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1">
                <span>{bean.process ?? '—'}</span>
              </span>
              <span className="text-border">|</span>
              <span>{bean.roast}</span>
            </div>
          </div>
        </div>
      </Link>
    </Surface>
  )
}
