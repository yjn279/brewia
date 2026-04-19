import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  children: ReactNode
  className?: string
}

export function SectionHeading({ children, className }: SectionHeadingProps) {
  return (
    <h2
      className={cn(
        'text-sm font-medium uppercase tracking-wider text-muted-foreground mb-3',
        className
      )}
    >
      {children}
    </h2>
  )
}
