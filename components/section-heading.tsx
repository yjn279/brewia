import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  children: ReactNode
  className?: string
  level?: 'h2' | 'h3' | 'h4'
}

export function SectionHeading({ children, className, level: Tag = 'h2' }: SectionHeadingProps) {
  return (
    <Tag
      className={cn(
        'text-sm font-medium uppercase tracking-wider text-muted-foreground mb-3',
        className
      )}
    >
      {children}
    </Tag>
  )
}
