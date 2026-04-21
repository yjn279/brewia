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
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className={cn('text-base font-medium text-foreground', valueClassName)}>
        {children}
      </div>
    </div>
  )
}
