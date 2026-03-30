import Link from 'next/link'
import { COUNTRY_FLAGS } from '@/lib/types'
import type { Bean } from '@/lib/types'
import { cn } from '@/lib/utils'

interface BeanCardProps {
  bean: Bean
  className?: string
}

export function BeanCard({ bean, className }: BeanCardProps) {
  const flag = COUNTRY_FLAGS[bean.country]

  return (
    <Link
      href={`/beans/${bean.id}`}
      className={cn(
        'group block rounded-2xl border border-black/5 bg-card/80 p-4 shadow-[0_18px_36px_-30px_rgba(38,28,8,0.9)] backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-black/15',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-black/5 bg-secondary text-2xl transition-transform group-hover:scale-105">
          {flag}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-foreground">{bean.name}</h3>
          <p className="text-sm text-muted-foreground">
            {bean.region}, {bean.country}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            <span>{bean.variety}</span>
            <span className="text-border">•</span>
            <span>{bean.process}</span>
            <span className="text-border">•</span>
            <span>{bean.roast}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
