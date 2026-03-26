import Link from 'next/link'
import { countryFlags, brews } from '@/lib/data'
import type { Bean } from '@/lib/types'
import { cn } from '@/lib/utils'

interface BeanCardProps {
  bean: Bean
  className?: string
}

const roastLabels = ['', 'Light', 'Light-Medium', 'Medium', 'Medium-Dark', 'Dark']

export function BeanCard({ bean, className }: BeanCardProps) {
  const flag = countryFlags[bean.country] || ''
  const brewCount = brews.filter((b) => b.beanId === bean.id).length
  
  return (
    <Link
      href={`/beans/${bean.id}`}
      className={cn(
        'block rounded-xl bg-card p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98]',
        className
      )}
    >
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
              <span className="font-medium text-foreground">{bean.process}</span>
            </span>
            <span className="text-border">|</span>
            <span>{roastLabels[bean.roast]}</span>
            <span className="text-border">|</span>
            <span className="font-mono">{brewCount} brews</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
