import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DataFieldProps {
  label: string
  children: ReactNode
  className?: string
  valueClassName?: string
}

export function DataField({ label, children, className, valueClassName }: DataFieldProps) {
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <p className="text-xs tracking-wide text-muted-foreground">{label}</p>
      <div className={cn('text-lg font-medium text-foreground', valueClassName)}>
        {children}
      </div>
    </div>
  )
}
