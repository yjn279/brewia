import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MetricTileProps {
  icon: ReactNode
  value: string
  label: string
  className?: string
}

export function MetricTile({ icon, value, label, className }: MetricTileProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-mono text-lg font-medium text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
